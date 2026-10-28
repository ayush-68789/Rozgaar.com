// Runs the real coach controller against in-memory stand-ins for the Mongoose models,
// so the plan → quiz → unlock → verified-skill flow is tested without a database.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

delete process.env.ANTHROPIC_API_KEY; // exercise the no-AI fallback paths

const stub = (relativePath, exports) => {
    const resolved = require.resolve(path.join(__dirname, '..', relativePath));
    require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

const state = { plan: null };
const user = {
    _id: 'u1', role: 'student', fullname: 'Test Student',
    profile: { skills: ['HTML'], verifiedSkills: [], projects: [], resumeUrl: '' },
    save: async () => {}
};
const makePlan = data => ({
    _id: 'p1', ...data,
    weeks: data.weeks.map(week => ({ questions: [], attempts: 0, bestScore: 0, quizPassed: false, quizSource: '', ...week })),
    save: async () => {},
    toObject() { return JSON.parse(JSON.stringify(this)); }
});
stub('models/user.model.js', { User: { findById: async () => user } });
stub('models/Job.js', { Job: {} });
stub('models/application.model.js', { Application: {} });
stub('models/notification.model.js', { Notification: { create: async () => {} } });
stub('models/plan.model.js', { Plan: { create: async data => (state.plan = makePlan(data)), findOne: async () => state.plan } });

const coach = require('../controllers/coach.controller.js');
const makeRes = () => ({ code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('goal analysis builds a plan for the missing skills only', async () => {
    const res = makeRes();
    await coach.analyzeGoal({ id: 'u1', body: { goal: 'I want to become a full stack developer' } }, res);
    assert.equal(res.code, 201);
    const { plan } = res.body;
    assert.equal(plan.source, 'template');
    assert.ok(plan.weeks.length >= 5);
    assert.ok(!plan.gapSkills.includes('HTML'), 'skills the student already has are not re-taught');
    assert.equal(plan.weeks[0].unlocked, true);
    assert.equal(plan.weeks[1].unlocked, false);
    assert.equal(plan.weeks[0].hasQuiz, false);
    assert.equal(plan.weeks[0].questions, undefined, 'no quiz answers are sent with the plan');
});

test('a locked week cannot be started', async () => {
    const res = makeRes();
    await coach.startQuiz({ id: 'u1', params: { id: 'p1', week: '3' } }, res);
    assert.equal(res.code, 403);
});

test('quiz never leaks answers, failing resets questions, passing unlocks the next week', async () => {
    let res = makeRes();
    await coach.startQuiz({ id: 'u1', params: { id: 'p1', week: '1' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.quiz.questions.length, 5);
    assert.equal(res.body.quiz.questions[0].answerIndex, undefined);

    // wrong answers: below the pass mark
    res = makeRes();
    await coach.submitQuiz({ id: 'u1', params: { id: 'p1', week: '1' }, body: { answers: [2, 2, 2, 2, 2] } }, res);
    assert.equal(res.body.result.passed, false);
    assert.equal(state.plan.weeks[1].unlocked, false);
    assert.equal(state.plan.weeks[0].questions.length, 0, 'questions are regenerated for the next attempt');

    // wrong shape is rejected
    res = makeRes();
    await coach.startQuiz({ id: 'u1', params: { id: 'p1', week: '1' } }, res);
    const bad = makeRes();
    await coach.submitQuiz({ id: 'u1', params: { id: 'p1', week: '1' }, body: { answers: [0] } }, bad);
    assert.equal(bad.code, 400);

    // pass
    res = makeRes();
    await coach.submitQuiz({ id: 'u1', params: { id: 'p1', week: '1' }, body: { answers: [0, 0, 0, 0, 0] } }, res);
    assert.equal(res.body.result.passed, true);
    assert.equal(res.body.result.score, 100);
    assert.equal(state.plan.weeks[1].unlocked, true);
    assert.equal(user.profile.verifiedSkills.length, 1);
    assert.equal(user.profile.verifiedSkills[0].source, 'self', 'self-assessments are never marked as quiz-verified');
});

test('goal text that is too short is rejected', async () => {
    const res = makeRes();
    await coach.analyzeGoal({ id: 'u1', body: { goal: 'hi' } }, res);
    assert.equal(res.code, 400);
});
