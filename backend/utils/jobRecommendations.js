const { Job } = require('../models/Job.js');
const { Application } = require('../models/application.model.js');
const { computeFit, extractKnownSkills, skillMatches } = require('./skills.js');
const { getResumeText } = require('./resumeText.js');
const { isAIEnabled, callAIJSON } = require('./ai.js');

const generateAndStoreJobRecommendations = async (user, extractedSkills = []) => {
    if (!user || user.role !== 'student') return { recommendations: [], mode: 'skills' };

    let resumeText = '';
    if (user.profile?.resumeUrl) {
        try { resumeText = await getResumeText(user.profile); }
        catch (error) { console.warn('Could not read resume while refreshing job suggestions:', error.message); }
    }

    const skills = [...(user.profile?.skills || []), ...(user.profile?.verifiedSkills || []).map(item => item.skill), ...extractKnownSkills(resumeText), ...extractedSkills]
        .filter(Boolean)
        .reduce((unique, skill) => unique.some(item => skillMatches(item, skill) && skillMatches(skill, item)) ? unique : [...unique, String(skill)], []);
    const now = new Date();
    const [applied, jobs] = await Promise.all([
        Application.find({ applicant: user._id }).select('job'),
        Job.find({ isOpen: { $ne: false }, $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: now } }] })
            .select('title description requirements experienceLevel location jobType createdAt')
            .populate('company', 'name logo').sort({ createdAt: -1 }).limit(60)
    ]);
    const appliedIds = new Set(applied.map(item => String(item.job)));
    const candidates = jobs.filter(job => !appliedIds.has(String(job._id)));
    const fallback = candidates.map(job => {
        const fit = computeFit(job.requirements, skills, user.profile?.verifiedSkills);
        return {
            job,
            matchScore: fit.score,
            reason: fit.matched.length ? `Your skills match ${fit.matched.slice(0, 3).join(', ')}.` : ''
        };
    }).filter(item => item.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore || new Date(b.job.createdAt) - new Date(a.job.createdAt));

    const ai = isAIEnabled() && candidates.length ? await callAIJSON({
        system: 'Recommend open jobs using the candidate resume and listed skills. Do not invent qualifications. Return valid JSON only.',
        prompt: `Choose the 3 best jobs for this candidate. Only use supplied job IDs. Sort by fit and give a match score and concise reason.\n\nRESUME:\n${resumeText.slice(0, 7000) || 'No resume text available; use the candidate skills below.'}\n\nCANDIDATE SKILLS: ${skills.join(', ') || 'None listed'}\n\nOPEN JOBS:\n${JSON.stringify(candidates.slice(0, 40).map(job => ({ id: String(job._id), title: job.title, company: job.company?.name || '', requirements: job.requirements || [], experienceYears: job.experienceLevel, description: String(job.description || '').slice(0, 220) })))}\n\nReturn: {"recommendations":[{"jobId":"existing id","matchScore":0,"reason":"one concise sentence"}]}`,
        maxTokens: 900,
        timeoutMs: 12000
    }) : null;

    const byId = new Map(candidates.map(job => [String(job._id), job]));
    const aiPicks = Array.isArray(ai?.recommendations) ? ai.recommendations.map(item => {
        const job = byId.get(String(item?.jobId || ''));
        if (!job || !String(item.reason || '').trim()) return null;
        return { job, matchScore: Math.max(0, Math.min(100, Math.round(Number(item.matchScore) || 0))), reason: String(item.reason).trim().slice(0, 240) };
    }).filter(Boolean) : [];
    const picks = (aiPicks.length ? aiPicks : fallback)
        .sort((a, b) => b.matchScore - a.matchScore || new Date(b.job.createdAt) - new Date(a.job.createdAt))
        .slice(0, 3);

    user.profile.jobRecommendations = picks.map(item => ({ job: item.job._id, matchScore: item.matchScore, reason: item.reason }));
    user.profile.jobRecommendationsUpdatedAt = new Date();
    user.profile.jobRecommendationsSource = aiPicks.length ? 'ai' : 'skills';
    await user.save();
    return { recommendations: picks, mode: user.profile.jobRecommendationsSource };
};

module.exports = { generateAndStoreJobRecommendations };
