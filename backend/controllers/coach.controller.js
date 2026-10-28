const { User } = require("../models/user.model.js");
const { Job } = require("../models/Job.js");
const { Plan } = require("../models/plan.model.js");
const { Application } = require("../models/application.model.js");
const { computeFit, splitRequirements, extractKnownSkills, skillMatches } = require("../utils/skills.js");
const { isAIEnabled, callAIJSON } = require("../utils/ai.js");
const { getResumeText } = require("../utils/resumeText.js");
const { generateAndStoreJobRecommendations } = require("../utils/jobRecommendations.js");
const { notify } = require("../utils/notify.js");
const { randomUUID } = require('crypto');

const PASS_MARK = 70;
const MAX_WEEKS = 8;
const quizSessions = new Map();

const fail = (res, status, message) => res.status(status).json({ message, success: false });
const serverError = (res, error, message = 'Something went wrong. Please try again.') => {
    console.error(error);
    return fail(res, 500, message);
};

const getStudent = async (req, res) => {
    const user = await User.findById(req.id);
    if (!user || user.role !== 'student') {
        fail(res, 403, 'The career coach is available for candidate accounts.');
        return null;
    }
    return user;
};

const userSkillList = (user) => [
    ...(user.profile?.skills || []),
    ...(user.profile?.verifiedSkills || []).map(item => item.skill)
];

// ---------- role fallback (used when no AI key is configured) ----------
const ROLE_TEMPLATES = [
    { match: /full\s?-?stack|mern|mean/, role: 'Full-Stack Developer', skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB', 'REST API', 'Git'] },
    { match: /front\s?-?end|react|ui developer|web developer/, role: 'Frontend Developer', skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Tailwind', 'Git', 'Testing'] },
    { match: /back\s?-?end|node|api developer|server/, role: 'Backend Developer', skills: ['Node', 'Express', 'SQL', 'MongoDB', 'REST API', 'JWT', 'Docker', 'System Design'] },
    { match: /data analyst|analytics|business intelligence|\bbi\b/, role: 'Data Analyst', skills: ['SQL', 'Excel', 'Python', 'Pandas', 'Data Analysis', 'Power BI', 'Tableau'] },
    { match: /machine learning|data scien|\bml\b|\bai\b|deep learning/, role: 'ML / Data Science Engineer', skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning', 'SQL', 'TensorFlow'] },
    { match: /devops|cloud|sre/, role: 'DevOps Engineer', skills: ['Linux', 'Git', 'Docker', 'Kubernetes', 'AWS', 'CI CD', 'Python'] },
    { match: /android|ios|mobile|flutter|react native/, role: 'Mobile Developer', skills: ['JavaScript', 'React', 'REST API', 'Git', 'Firebase', 'UI UX'] },
    { match: /software engineer|sde|developer|programmer|placement|product based/, role: 'Software Engineer', skills: ['Data Structures Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'System Design', 'Git'] },
];

const roleFromGoal = (goal) => {
    const lower = String(goal || '').toLowerCase();
    return ROLE_TEMPLATES.find(template => template.match.test(lower)) || ROLE_TEMPLATES[ROLE_TEMPLATES.length - 1];
};

// ---------- plan generation ----------
const templateContent = (gapSkills, role) => ({
    summary: `A ${gapSkills.length}-week path that closes the gaps for ${role || 'your goal'}, one skill at a time.`,
    weeks: gapSkills.map(skill => ({
        skill,
        title: `Get job-ready with ${skill}`,
        topics: [
            `Core concepts and vocabulary of ${skill}`,
            `Follow the official documentation and take notes on 5 key ideas`,
            `Complete 3 hands-on exercises using ${skill}`,
            `Review common interview questions on ${skill}`
        ],
        resources: [`Official ${skill} documentation`, `"${skill} crash course" on YouTube`, `${skill} practice problems`],
        project: `Build a small project that clearly demonstrates ${skill}.`
    })),
    projects: gapSkills.slice(0, 3).map(skill => ({
        title: `${skill} showcase project`,
        description: `A small but complete project that uses ${skill}, with a README and a live demo.`,
        skills: [skill]
    }))
});

const generatePlanContent = async ({ goal, role, gapSkills, haveSkills, jobContext }) => {
    const skillsForPlan = gapSkills.slice(0, MAX_WEEKS);
    const ai = await callAIJSON({
        system: 'You are a practical career coach for engineering students. Reply with valid JSON only, no prose and no markdown.',
        prompt: `Create a weekly learning plan.
Goal: ${goal || role}
Target role: ${role}
${jobContext ? `Job context: ${jobContext}\n` : ''}Skills the learner already has: ${haveSkills.slice(0, 25).join(', ') || 'none listed'}
Skills to learn, in this exact order (exactly ONE week per skill): ${skillsForPlan.join(', ')}

Return JSON of this shape:
{"summary":"2 sentences","weeks":[{"skill":"<exact skill from the list>","title":"short week title","topics":["3-4 concrete topics"],"resources":["2-3 doc/book/course names or search phrases, NO urls"],"project":"one mini-project for that week"}],"projects":[{"title":"","description":"","skills":[""]}]}
Give 3 portfolio project ideas in "projects" that combine several of the skills.`,
        maxTokens: 3000
    });
    const valid = ai && Array.isArray(ai.weeks) && ai.weeks.length && ai.weeks.every(week => week && typeof week.skill === 'string' && Array.isArray(week.topics));
    if (!valid) return { ...templateContent(skillsForPlan, role), source: 'template' };
    return {
        source: 'ai',
        summary: String(ai.summary || '').slice(0, 600),
        weeks: ai.weeks.slice(0, MAX_WEEKS).map(week => ({
            skill: String(week.skill).slice(0, 80),
            title: String(week.title || `Learn ${week.skill}`).slice(0, 120),
            topics: week.topics.map(String).slice(0, 5),
            resources: (Array.isArray(week.resources) ? week.resources : []).map(String).slice(0, 4),
            project: String(week.project || '').slice(0, 300)
        })),
        projects: (Array.isArray(ai.projects) ? ai.projects : []).slice(0, 4).map(project => ({
            title: String(project.title || '').slice(0, 120),
            description: String(project.description || '').slice(0, 400),
            skills: (Array.isArray(project.skills) ? project.skills : []).map(String).slice(0, 6)
        })).filter(project => project.title)
    };
};

const buildPlan = async ({ user, job = null, goal, role, requiredSkills, gapSkills }) => {
    const jobContext = job ? `${job.title} at ${job.company?.name || 'a company'}; requirements: ${(job.requirements || []).join(', ')}` : '';
    const content = await generatePlanContent({ goal, role, gapSkills, haveSkills: userSkillList(user), jobContext });
    return Plan.create({
        user: user._id,
        job: job?._id || null,
        title: job ? `Get ready for ${job.title}` : `Road to ${role}`,
        goal,
        targetRole: role,
        summary: content.summary,
        requiredSkills,
        gapSkills,
        source: content.source,
        weeks: content.weeks.map((week, index) => ({ ...week, week: index + 1, unlocked: index === 0 })),
        projectIdeas: content.projects
    });
};

const planProgress = (plan) => {
    const total = plan.weeks.length || 1;
    const passed = plan.weeks.filter(week => week.quizPassed).length;
    return { passed, total: plan.weeks.length, percent: Math.round((passed / total) * 100) };
};

// Keep quiz answers out of the browser and database; only scores are persisted.
const publicPlan = (plan) => {
    const object = plan.toObject ? plan.toObject() : plan;
    object.weeks = object.weeks.map(week => ({ ...week, hasQuiz: Boolean(week.attempts || week.quizPassed) }));
    object.progress = planProgress(object);
    return object;
};

// ---------- fit ----------
const getFit = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const job = await Job.findById(req.params.jobId).select('title requirements company');
        if (!job) return fail(res, 404, 'Job not found.');
        const fit = computeFit(job.requirements, userSkillList(user), user.profile?.verifiedSkills);
        const plan = await Plan.findOne({ user: user._id, job: job._id }).select('_id');
        return res.status(200).json({ fit, planId: plan?._id || null, aiEnabled: isAIEnabled(), success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

const createPlanForJob = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const job = await Job.findById(req.params.jobId).populate('company', 'name');
        if (!job) return fail(res, 404, 'Job not found.');
        const existing = await Plan.findOne({ user: user._id, job: job._id });
        if (existing && !req.body?.refresh) return res.status(200).json({ plan: publicPlan(existing), existing: true, success: true });
        const fit = computeFit(job.requirements, userSkillList(user), user.profile?.verifiedSkills);
        if (!fit.missing.length) return fail(res, 400, 'You already match every listed requirement for this job. Apply now!');
        if (existing) await existing.deleteOne();
        const plan = await buildPlan({
            user, job,
            goal: `Become a strong candidate for ${job.title}`,
            role: job.title,
            requiredSkills: splitRequirements(job.requirements),
            gapSkills: fit.missing
        });
        return res.status(201).json({ plan: publicPlan(plan), success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

// ---------- goal analysis ----------
const analyzeGoal = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const goal = String(req.body?.goal || '').trim();
        if (goal.length < 5) return fail(res, 400, 'Describe your career goal in a few words, e.g. "Full-stack developer at a product company".');
        if (goal.length > 400) return fail(res, 400, 'Please keep your goal under 400 characters.');

        let role; let required; let summary = '';
        const ai = await callAIJSON({
            system: 'You are a practical career coach for engineering students. Reply with valid JSON only.',
            prompt: `A student wrote this career goal: "${goal}".
Their current skills: ${userSkillList(user).join(', ') || 'none listed'}.
Return JSON: {"targetRole":"clear job title","summary":"2 sentence assessment of the goal and how realistic it is","requiredSkills":["6-10 concrete, searchable skills/technologies/CS fundamentals for this role"]}`,
            maxTokens: 800
        });
        if (ai && Array.isArray(ai.requiredSkills) && ai.requiredSkills.length && ai.targetRole) {
            role = String(ai.targetRole).slice(0, 80);
            required = ai.requiredSkills.map(String).slice(0, 10);
            summary = String(ai.summary || '');
        } else {
            const template = roleFromGoal(goal);
            role = template.role;
            required = template.skills;
            summary = `Based on your goal, ${role} is the closest path. These are the core skills employers look for.`;
        }
        const fit = computeFit(required, userSkillList(user), user.profile?.verifiedSkills);
        if (!fit.missing.length) {
            return res.status(200).json({ analysis: { role, summary, required, fit }, plan: null, message: 'You already cover every core skill for this goal. Focus on projects and interviews.', success: true });
        }
        user.profile.targetRole = role;
        await user.save();
        const plan = await buildPlan({ user, goal, role, requiredSkills: required, gapSkills: fit.missing });
        return res.status(201).json({ analysis: { role, summary, required, fit }, plan: publicPlan(plan), success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

// ---------- plans ----------
const listPlans = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const plans = await Plan.find({ user: user._id }).sort({ updatedAt: -1 });
        return res.status(200).json({ plans: plans.map(publicPlan), success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

const getPlan = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const plan = await Plan.findOne({ _id: req.params.id, user: user._id }).populate({ path: 'job', select: 'title company isOpen', populate: { path: 'company', select: 'name' } });
        if (!plan) return fail(res, 404, 'Plan not found.');
        return res.status(200).json({ plan: publicPlan(plan), success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

const deletePlan = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const plan = await Plan.findOneAndDelete({ _id: req.params.id, user: user._id });
        if (!plan) return fail(res, 404, 'Plan not found.');
        return res.status(200).json({ message: 'Plan deleted.', success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

// ---------- quizzes ----------
const generateQuiz = async (skill, week) => {
    if (!isAIEnabled()) return null;
    const ai = await callAIJSON({
        system: 'You write fair multiple-choice technical quizzes. Reply with valid JSON only.',
        prompt: `Write exactly 5 multiple-choice questions testing practical understanding of "${skill}" for a student preparing for jobs.
Week topics: ${(week.topics || []).join('; ')}.
Rules: return exactly 5 questions; each has exactly 4 distinct options, exactly one correct answer, vary the answer position, no trick questions. Use a numeric answerIndex from 0 to 3 and include a concise explanation.
Return: {"questions":[{"q":"","options":["","","",""],"answerIndex":0,"explanation":"one sentence"}]}`,
        maxTokens: 2200,
        timeoutMs: 20000
    });
    const questions = (ai?.questions || []).filter(item => item && typeof item.q === 'string' && Array.isArray(item.options) && item.options.length === 4 && Number.isInteger(item.answerIndex) && item.answerIndex >= 0 && item.answerIndex < 4)
        .slice(0, 5).map(item => ({ q: item.q, options: item.options.map(String), answerIndex: item.answerIndex, explanation: String(item.explanation || '') }));
    return questions.length === 5 ? questions : null;
};

const findWeek = (plan, weekNumber) => plan.weeks.find(week => week.week === Number(weekNumber));

const startQuiz = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const plan = await Plan.findOne({ _id: req.params.id, user: user._id });
        if (!plan) return fail(res, 404, 'Plan not found.');
        const week = findWeek(plan, req.params.week);
        if (!week) return fail(res, 404, 'Week not found.');
        if (!week.unlocked) return fail(res, 403, 'Pass the previous week’s quiz to unlock this one.');
        const questions = await generateQuiz(week.skill, week);
        if (!questions) return fail(res, 503, 'Could not generate an AI quiz. Check that GROQ_API_KEY and GROQ_MODEL are set correctly, then try again.');
        const now = Date.now();
        for (const [token, session] of quizSessions) if (session.expiresAt <= now) quizSessions.delete(token);
        const quizToken = randomUUID();
        quizSessions.set(quizToken, { userId: String(user._id), planId: String(plan._id), week: week.week, questions, expiresAt: now + 20 * 60 * 1000 });
        return res.status(200).json({
            quiz: {
                week: week.week, skill: week.skill, source: 'ai', passMark: PASS_MARK, quizToken,
                questions: questions.map(({ q, options }) => ({ q, options }))
            },
            success: true
        });
    } catch (error) {
        return serverError(res, error);
    }
};

const submitQuiz = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const quizToken = String(req.body?.quizToken || '');
        const session = quizSessions.get(quizToken);
        if (!session || session.expiresAt <= Date.now() || session.userId !== String(user._id) || session.planId !== String(req.params.id) || session.week !== Number(req.params.week)) {
            if (session && session.expiresAt <= Date.now()) quizSessions.delete(quizToken);
            return fail(res, 410, 'This quiz session expired. Start a new quiz to try again.');
        }
        const plan = await Plan.findOne({ _id: req.params.id, user: user._id });
        if (!plan) return fail(res, 404, 'Plan not found.');
        const week = findWeek(plan, req.params.week);
        if (!week) return fail(res, 404, 'Week not found.');
        if (!week.unlocked) return fail(res, 403, 'This week is still locked.');
        const answers = req.body?.answers;
        if (!Array.isArray(answers) || answers.length !== session.questions.length || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 3)) return fail(res, 400, 'Answer every question before submitting.');

        const results = session.questions.map((question, index) => ({
            correct: Number(answers[index]) === question.answerIndex,
            correctIndex: question.answerIndex,
            explanation: question.explanation
        }));
        const score = Math.round((results.filter(item => item.correct).length / results.length) * 100);
        const passed = score >= PASS_MARK;
        const source = 'quiz';

        const update = {
            $inc: { 'weeks.$.attempts': 1 },
            $max: { 'weeks.$.bestScore': score }
        };
        if (passed) update.$set = { 'weeks.$.quizPassed': true };
        let updatedPlan = await Plan.findOneAndUpdate(
            { _id: plan._id, user: user._id, weeks: { $elemMatch: { week: week.week, unlocked: true } } },
            update,
            { new: true }
        );
        if (!updatedPlan) return fail(res, 409, 'Your plan changed before this score could be saved. Start the quiz again.');
        quizSessions.delete(quizToken);

        if (passed) {
            updatedPlan = await Plan.findOneAndUpdate(
                { _id: plan._id, user: user._id, weeks: { $elemMatch: { week: week.week + 1 } } },
                { $set: { 'weeks.$.unlocked': true } },
                { new: true }
            ) || updatedPlan;
            const verified = user.profile.verifiedSkills || [];
            const existing = verified.find(item => skillMatches(item.skill, week.skill));
            if (existing) {
                if (source === 'quiz' || existing.source === 'self') { existing.score = Math.max(existing.score, score); existing.source = source === 'quiz' ? 'quiz' : existing.source; existing.verifiedAt = new Date(); }
            } else {
                verified.push({ skill: week.skill, score, source, verifiedAt: new Date() });
            }
            user.profile.verifiedSkills = verified;
            if (!(user.profile.skills || []).some(skill => skillMatches(skill, week.skill))) user.profile.skills.push(week.skill);
            await user.save();
            try { await generateAndStoreJobRecommendations(user); }
            catch (error) { console.error('Could not refresh saved job suggestions:', error.message); }
            if (updatedPlan.weeks.every(item => item.quizPassed)) {
                await notify(user._id, { type: 'coach', title: 'Learning plan completed', message: `You finished “${updatedPlan.title}”. Time to apply!`, link: updatedPlan.job ? `/description/${updatedPlan.job}` : '/coach' });
            }
        }
        return res.status(200).json({
            result: { score, passed, passMark: PASS_MARK, source, questions: results },
            plan: publicPlan(updatedPlan),
            success: true
        });
    } catch (error) {
        return serverError(res, error);
    }
};

// ---------- overview / dashboard ----------
const getOverview = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const [plans, applied] = await Promise.all([
            Plan.find({ user: user._id }).sort({ updatedAt: -1 }),
            Application.find({ applicant: user._id }).select('job status')
        ]);
        const appliedIds = new Set(applied.map(item => String(item.job)));
        const now = new Date();
        const openJobs = await Job.find({
            isOpen: { $ne: false },
            $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: now } }]
        }).select('-applications').populate('company', 'name logo').sort({ createdAt: -1 }).limit(100);

        const skills = userSkillList(user);
        const recommended = openJobs
            .filter(job => !appliedIds.has(String(job._id)))
            .map(job => ({ job, fit: computeFit(job.requirements, skills, user.profile?.verifiedSkills) }))
            .filter(item => item.fit.total > 0)
            .sort((a, b) => b.fit.score - a.fit.score)
            .slice(0, 6)
            .map(({ job, fit }) => ({
                _id: job._id, title: job.title, location: job.location, jobType: job.jobType,
                company: job.company ? { name: job.company.name, logo: job.company.logo } : null, fit
            }));

        const progressList = plans.map(planProgress);
        const totalWeeks = progressList.reduce((sum, item) => sum + item.total, 0);
        const passedWeeks = progressList.reduce((sum, item) => sum + item.passed, 0);
        return res.status(200).json({
            overview: {
                name: user.fullname,
                targetRole: user.profile?.targetRole || '',
                skills: user.profile?.skills || [],
                verifiedSkills: user.profile?.verifiedSkills || [],
                projects: user.profile?.projects || [],
                hasResume: Boolean(user.profile?.resumeUrl),
                plans: plans.map(publicPlan),
                learningProgress: totalWeeks ? Math.round((passedWeeks / totalWeeks) * 100) : 0,
                applications: applied.length,
                recommended,
                aiEnabled: isAIEnabled()
            },
            success: true
        });
    } catch (error) {
        return serverError(res, error);
    }
};

// ---------- read saved resume-based job recommendations ----------
const getRecommendations = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        await user.populate({
            path: 'profile.jobRecommendations.job',
            select: 'title location jobType salary salaryUnit salaryPeriod isOpen applicationDeadline company',
            populate: { path: 'company', select: 'name logo' }
        });
        const now = new Date();
        const recommendations = (user.profile.jobRecommendations || []).filter(item => {
            const job = item.job;
            return job && job.isOpen !== false && (!job.applicationDeadline || new Date(job.applicationDeadline) >= now);
        }).map(item => ({
            _id: item.job._id, title: item.job.title, location: item.job.location, jobType: item.job.jobType,
            salary: item.job.salary, salaryUnit: item.job.salaryUnit, salaryPeriod: item.job.salaryPeriod,
            company: item.job.company ? { name: item.job.company.name, logo: item.job.company.logo } : null,
            matchScore: item.matchScore, reason: item.reason
        }));
        return res.status(200).json({
            recommendations,
            mode: user.profile.jobRecommendationsSource || 'skills',
            updatedAt: user.profile.jobRecommendationsUpdatedAt,
            hasRecommendations: Boolean(user.profile.jobRecommendationsUpdatedAt),
            hasResume: Boolean(user.profile.resumeUrl),
            success: true
        });
    } catch (error) {
        return serverError(res, error, 'Unable to suggest jobs right now.');
    }
};

// ---------- resume analyzer ----------
const RESUME_ERRORS = {
    NO_RESUME: [400, 'Upload your resume on your profile first.'],
    INVALID_RESUME_URL: [400, 'Your stored resume link is not valid. Please upload it again.'],
    RESUME_FETCH_FAILED: [502, 'We could not read your stored resume. Please try again.'],
    RESUME_TOO_LARGE: [413, 'Your resume file is too large to analyze.'],
    UNSUPPORTED_RESUME_TYPE: [400, 'Resume analysis supports PDF and DOCX files. Please upload one of those on your profile.'],
    RESUME_UNREADABLE: [422, 'We could not find readable text in your resume. If it is a scanned image, upload a text-based PDF.']
};

const basicResumeAnalysis = (text, job) => {
    const lower = text.toLowerCase();
    const sections = {
        contact: /[\w.+-]+@[\w-]+\.[\w.]+/.test(text) || /\+?\d[\d\s-]{8,}/.test(text),
        summary: /summary|objective|about me|profile/.test(lower),
        education: /education|b\.?tech|bachelor|university|college|cgpa|gpa/.test(lower),
        experience: /experience|intern|work history|employment/.test(lower),
        projects: /projects?/.test(lower),
        skills: /skills|technologies|tech stack/.test(lower)
    };
    const detectedSkills = extractKnownSkills(text);
    const fit = job ? computeFit(job.requirements, detectedSkills) : null;
    const hasMetrics = /\d+\s?%|\d+\+|\b\d{2,}\b\s+(users|students|requests|records)/i.test(text);
    const present = Object.values(sections).filter(Boolean).length;

    let score = present * 10 + Math.min(detectedSkills.length, 10) * 2 + (hasMetrics ? 5 : 0) + (fit ? Math.round(fit.score * 0.15) : 10);
    score = Math.max(15, Math.min(96, score));

    const strengths = []; const weaknesses = []; const suggestions = [];
    if (sections.projects) strengths.push('Includes a projects section, which recruiters look for in fresher resumes.');
    if (detectedSkills.length >= 8) strengths.push(`Lists a broad set of skills (${detectedSkills.length} detected).`);
    if (hasMetrics) strengths.push('Uses numbers to show impact.');
    if (sections.education) strengths.push('Education details are present.');
    Object.entries(sections).forEach(([name, ok]) => {
        if (!ok) { weaknesses.push(`No clear “${name}” section found.`); suggestions.push(`Add a short “${name}” section with a clear heading.`); }
    });
    if (!hasMetrics) { weaknesses.push('No measurable results (numbers, percentages, scale).'); suggestions.push('Rewrite project bullets with impact, e.g. “reduced load time by 35%” or “served 500+ users”.'); }
    if (text.length < 900) { weaknesses.push('The resume is very short.'); suggestions.push('Add detail to each project: your role, the stack, and the outcome.'); }
    if (text.length > 6500) { weaknesses.push('The resume is long for an early-career profile.'); suggestions.push('Trim it to one page and keep only your strongest projects.'); }
    if (fit?.missing.length) suggestions.push(`If you genuinely have them, mention: ${fit.missing.slice(0, 6).join(', ')}. Otherwise build a plan for them in the coach.`);

    return {
        mode: 'basic', score,
        summary: `Rule-based scan: ${present} of 6 core sections found and ${detectedSkills.length} known skills detected. Add a GROQ_API_KEY for deeper AI feedback.`,
        strengths, weaknesses, suggestions,
        missingKeywords: fit?.missing || [],
        detectedSkills, sections
    };
};

const analyzeResume = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        let text;
        try {
            text = await getResumeText(user.profile);
        } catch (error) {
            const mapped = RESUME_ERRORS[error.message];
            if (mapped) return fail(res, mapped[0], mapped[1]);
            throw error;
        }
        let job = null;
        if (req.body?.jobId) {
            job = await Job.findById(req.body.jobId).populate('company', 'name').select('title requirements description company');
            if (!job) return fail(res, 404, 'Job not found.');
        }

        const ai = await callAIJSON({
            system: 'You are a strict but encouraging resume reviewer for engineering students and freshers. Reply with valid JSON only. Never invent facts that are not in the resume.',
            prompt: `Review this resume${job ? ` for the role "${job.title}" (requirements: ${(job.requirements || []).join(', ')})` : ''}.

RESUME TEXT:
"""
${text}
"""

Return JSON: {"score":0-100,"summary":"2-3 sentences","strengths":["max 5"],"weaknesses":["max 5"],"suggestions":["max 6 specific, actionable rewrites or additions"],"missingKeywords":["skills/keywords important${job ? ' for this job' : ' for the candidate\'s apparent target'} but absent from the resume"],"detectedSkills":["technical skills actually present in the resume"],"sections":{"contact":true,"summary":true,"education":true,"experience":true,"projects":true,"skills":true}}`,
            maxTokens: 1800
        });
        const aiValid = ai && Number.isFinite(Number(ai.score)) && Array.isArray(ai.suggestions);
        const analysis = aiValid ? {
            mode: 'ai',
            score: Math.max(0, Math.min(100, Math.round(Number(ai.score)))),
            summary: String(ai.summary || ''),
            strengths: (ai.strengths || []).map(String).slice(0, 6),
            weaknesses: (ai.weaknesses || []).map(String).slice(0, 6),
            suggestions: (ai.suggestions || []).map(String).slice(0, 8),
            missingKeywords: (ai.missingKeywords || []).map(String).slice(0, 12),
            detectedSkills: (ai.detectedSkills || []).map(String).slice(0, 40),
            sections: ai.sections || null
        } : basicResumeAnalysis(text, job);

        try { await generateAndStoreJobRecommendations(user, analysis.detectedSkills || []); }
        catch (error) { console.error('Could not refresh saved job suggestions:', error.message); }

        return res.status(200).json({ analysis, job: job ? { _id: job._id, title: job.title } : null, success: true });
    } catch (error) {
        return serverError(res, error, 'Unable to analyze your resume right now.');
    }
};

const addSkills = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const incoming = (Array.isArray(req.body?.skills) ? req.body.skills : []).map(skill => String(skill).trim()).filter(Boolean).slice(0, 30);
        if (!incoming.length) return fail(res, 400, 'No skills provided.');
        const current = user.profile.skills || [];
        incoming.forEach(skill => { if (!current.some(existing => skillMatches(existing, skill) && skillMatches(skill, existing))) current.push(skill); });
        user.profile.skills = current.slice(0, 80);
        await user.save();
        return res.status(200).json({ skills: user.profile.skills, message: 'Skills added to your profile.', success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

// ---------- projects ----------
const addProject = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        const title = String(req.body?.title || '').trim();
        const link = String(req.body?.link || '').trim();
        if (title.length < 2 || title.length > 120) return fail(res, 400, 'Give your project a title (2–120 characters).');
        if (link && !/^https?:\/\/\S+$/i.test(link)) return fail(res, 400, 'The project link must start with http:// or https://');
        if ((user.profile.projects || []).length >= 20) return fail(res, 400, 'You can list up to 20 projects.');
        const skills = (Array.isArray(req.body?.skills) ? req.body.skills : String(req.body?.skills || '').split(',')).map(skill => String(skill).trim()).filter(Boolean).slice(0, 10);
        user.profile.projects.push({ title, link, description: String(req.body?.description || '').trim().slice(0, 400), skills });
        await user.save();
        return res.status(201).json({ projects: user.profile.projects, message: 'Project added.', success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

const deleteProject = async (req, res) => {
    try {
        const user = await getStudent(req, res); if (!user) return;
        user.profile.projects = (user.profile.projects || []).filter(project => String(project._id) !== req.params.projectId);
        await user.save();
        return res.status(200).json({ projects: user.profile.projects, message: 'Project removed.', success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

// ---------- tech news (Hacker News via Algolia, no API key needed) ----------
const newsCache = new Map();
const NEWS_TTL = 20 * 60 * 1000;
const DEFAULT_TOPICS = ['javascript', 'ai', 'web development'];

const fetchTopic = async (topic) => {
    const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=8&numericFilters=${encodeURIComponent(`created_at_i>${since},points>15`)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return [];
        const data = await response.json();
        return (data.hits || []).filter(hit => hit.title).map(hit => ({
            id: hit.objectID,
            title: hit.title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: hit.url ? new URL(hit.url).hostname.replace(/^www\./, '') : 'news.ycombinator.com',
            points: hit.points || 0,
            comments: hit.num_comments || 0,
            publishedAt: hit.created_at,
            topic
        }));
    } catch {
        return [];
    } finally {
        clearTimeout(timer);
    }
};

const getNews = async (req, res) => {
    try {
        let topics = String(req.query.topics || '').split(',').map(topic => topic.trim().toLowerCase()).filter(Boolean);
        if (!topics.length) {
            const user = await User.findById(req.id).select('profile.skills profile.targetRole');
            topics = [...(user?.profile?.skills || []).slice(0, 3), ...(user?.profile?.targetRole ? [user.profile.targetRole] : [])].map(topic => topic.toLowerCase());
        }
        topics = [...new Set(topics.length ? topics : DEFAULT_TOPICS)].slice(0, 4);
        const key = topics.join('|');
        const cached = newsCache.get(key);
        if (cached && Date.now() - cached.at < NEWS_TTL) return res.status(200).json({ news: cached.items, topics, cached: true, success: true });

        const results = await Promise.all(topics.map(fetchTopic));
        const seen = new Set();
        const items = results.flat().filter(item => (seen.has(item.id) ? false : seen.add(item.id)))
            .sort((a, b) => (b.points + b.comments) - (a.points + a.comments)).slice(0, 15);
        if (items.length) newsCache.set(key, { at: Date.now(), items });
        return res.status(200).json({
            news: items, topics,
            message: items.length ? undefined : 'No stories found right now. Try different topics or check back later.',
            success: true
        });
    } catch (error) {
        return serverError(res, error, 'Unable to load tech news right now.');
    }
};

module.exports = {
    getFit, createPlanForJob, analyzeGoal, listPlans, getPlan, deletePlan,
    startQuiz, submitQuiz, getOverview, getRecommendations, analyzeResume, addSkills, addProject, deleteProject, getNews
};
