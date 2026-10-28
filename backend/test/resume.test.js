const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

delete process.env.ANTHROPIC_API_KEY;
const stub = (relativePath, exports) => {
    const resolved = require.resolve(path.join(__dirname, '..', relativePath));
    require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

let resumeText = '';
let resumeError = null;
stub('models/user.model.js', { User: { findById: async () => ({ _id: 'u1', role: 'student', profile: { skills: [], verifiedSkills: [], resumeUrl: 'x' } }) } });
stub('models/Job.js', { Job: { findById: () => ({ populate: () => ({ select: async () => ({ _id: 'j1', title: 'Backend Developer', requirements: ['Node', 'MongoDB', 'Docker', 'Kubernetes'] }) }) }) } });
stub('models/plan.model.js', { Plan: {} });
stub('models/application.model.js', { Application: {} });
stub('models/notification.model.js', { Notification: {} });
stub('utils/resumeText.js', { getResumeText: async () => { if (resumeError) throw new Error(resumeError); return resumeText; } });

const { analyzeResume } = require('../controllers/coach.controller.js');
const makeRes = () => ({ code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('basic analyzer scores a good resume higher than a thin one and flags missing job keywords', async () => {
    resumeText = `Anushka Tiwari anushka@example.com +91 9876543210
Summary: Full-stack student. Education: B.Tech Computer Science, CGPA 8.6.
Projects: Built a MERN job portal with React, Node.js, Express and MongoDB serving 500+ users, cut load time by 35%.
Skills: JavaScript, React, Node.js, Express, MongoDB, Git, Docker. Experience: Web development intern.`;
    let res = makeRes();
    await analyzeResume({ id: 'u1', body: { jobId: 'j1' } }, res);
    assert.equal(res.code, 200);
    const good = res.body.analysis;
    assert.equal(good.mode, 'basic');
    assert.ok(good.detectedSkills.includes('react'));
    assert.deepEqual(good.missingKeywords, ['Kubernetes']);

    resumeText = 'I am a student who likes computers and wants a job in technology someday soon please.';
    res = makeRes();
    await analyzeResume({ id: 'u1', body: {} }, res);
    assert.ok(res.body.analysis.score < good.score);
    assert.ok(res.body.analysis.weaknesses.length > 0);
});

test('resume errors map to friendly messages', async () => {
    resumeError = 'UNSUPPORTED_RESUME_TYPE';
    const res = makeRes();
    await analyzeResume({ id: 'u1', body: {} }, res);
    assert.equal(res.code, 400);
    assert.match(res.body.message, /PDF and DOCX/);
});
