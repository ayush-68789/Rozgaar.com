const { Job } = require('../models/Job.js');

const getUtcStartOfToday = (now = new Date()) => {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    return start;
};

const hasDeadlinePassed = (deadline, now = new Date()) => {
    if (!deadline) return false;
    const deadlineEnd = new Date(deadline);
    deadlineEnd.setUTCHours(23, 59, 59, 999);
    return now.getTime() > deadlineEnd.getTime();
};

const getCandidateVisibilityCutoff = (now = new Date()) => new Date(now.getTime() - 72 * 60 * 60 * 1000);

const closeExpiredJobs = async () => {
    const todayStart = getUtcStartOfToday();
    return Job.updateMany(
        { applicationDeadline: { $lt: todayStart }, isOpen: { $ne: false } },
        { $set: { isOpen: false } }
    );
};

module.exports = {
    closeExpiredJobs,
    getCandidateVisibilityCutoff,
    hasDeadlinePassed
};
