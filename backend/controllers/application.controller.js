const { Application } = require("../models/application.model.js");
const { Job } = require("../models/Job.js");
const { User } = require("../models/user.model.js");
const { hasDeadlinePassed } = require('../utils/jobDeadline.js');
const { computeFit } = require('../utils/skills.js');
const { notify } = require('../utils/notify.js');

const STATUS_LABELS = {
    pending: 'received', shortlisted: 'shortlisted', interview: 'moved to the interview stage',
    offered: 'given an offer', accepted: 'accepted — congratulations!', rejected: 'closed'
};

const fail = (res, status, message) => res.status(status).json({ message, success: false });
const serverError = (res, error, message = 'Something went wrong. Please try again.') => {
    console.error(error);
    return fail(res, 500, message);
};

const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) return fail(res, 400, "Job id is required.");

        const applicant = await User.findById(userId);
        if (!applicant || applicant.role !== 'student') {
            return fail(res, 403, 'Only candidate accounts can apply for jobs.');
        }

        const job = await Job.findById(jobId);
        if (!job) return fail(res, 404, "Job not found");
        if (hasDeadlinePassed(job.applicationDeadline)) {
            job.isOpen = false;
            await job.save();
            return fail(res, 400, 'The application deadline has passed. This job is no longer accepting applications.');
        }
        if (job.isOpen === false) return fail(res, 400, 'This job is no longer accepting applications.');

        const existingApplication = await Application.exists({ job: jobId, applicant: userId });
        if (existingApplication) return fail(res, 400, "You have already applied for this job");

        let newApplication;
        try {
            newApplication = await Application.create({ job: jobId, applicant: userId });
        } catch (error) {
            // The unique (job, applicant) index catches double clicks / parallel requests.
            if (error.code === 11000) return fail(res, 400, "You have already applied for this job");
            throw error;
        }

        await Job.updateOne({ _id: jobId }, { $addToSet: { applications: newApplication._id } });
        await notify(job.created_by, {
            type: 'application',
            title: 'New application',
            message: `${applicant.fullname} applied for ${job.title}.`,
            link: `/admin/jobs/${job._id}/applicants`
        });
        return res.status(201).json({ message: "Job applied successfully.", success: true });
    } catch (error) {
        return serverError(res, error, 'Unable to submit your application. Please try again.');
    }
};

const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;
        const application = await Application.find({ applicant: userId }).sort({ createdAt: -1 }).populate({
            path: 'job',
            populate: { path: 'company' }
        });
        return res.status(200).json({ application, success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

// recruiter: applicants for one of their jobs, each with a skill-fit score
const getApplicants = async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, created_by: req.id }).populate({
            path: 'applications',
            options: { sort: { createdAt: -1 } },
            populate: { path: 'applicant', select: 'fullname email phoneNumber profile role' }
        });
        if (!job) return fail(res, 404, 'Job not found.');

        const jobObject = job.toObject();
        jobObject.applications = jobObject.applications.map(application => {
            const profile = application.applicant?.profile || {};
            const verified = profile.verifiedSkills || [];
            const fit = computeFit(job.requirements, [...(profile.skills || []), ...verified.map(item => item.skill)], verified);
            return { ...application, fit };
        });
        return res.status(200).json({ job: jobObject, success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['pending', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected'];
        const normalizedStatus = String(status || '').toLowerCase();
        if (!allowedStatuses.includes(normalizedStatus)) return fail(res, 400, 'A valid status is required.');

        const application = await Application.findById(req.params.id).populate('job');
        if (!application) return fail(res, 404, "Application not found.");
        if (!application.job || String(application.job.created_by) !== String(req.id)) {
            return fail(res, 403, 'You can only review applicants for your own jobs.');
        }

        const job = application.job;
        let jobFilled = false;
        if (normalizedStatus === 'accepted' && application.status !== 'accepted') {
            // "position" is the number of openings: never hire more people than that.
            const alreadyHired = await Application.countDocuments({ job: job._id, status: 'accepted', _id: { $ne: application._id } });
            if (alreadyHired >= job.position) {
                return fail(res, 400, `All ${job.position} position${job.position === 1 ? ' is' : 's are'} already filled for this job.`);
            }
            jobFilled = alreadyHired + 1 >= job.position;
        }

        application.status = normalizedStatus;
        await application.save();
        if (jobFilled && job.isOpen !== false) {
            job.isOpen = false;
            await job.save();
        }

        await notify(application.applicant, {
            type: 'status',
            title: 'Application update',
            message: `Your application for ${job.title} was ${STATUS_LABELS[normalizedStatus]}.`,
            link: normalizedStatus === 'interview' ? '/coach' : '/applications'
        });

        return res.status(200).json({
            message: jobFilled ? "Status updated. All positions are filled, so the job was closed." : "Status updated successfully.",
            jobClosed: jobFilled,
            success: true
        });
    } catch (error) {
        return serverError(res, error);
    }
};

const deleteApplication = async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, applicant: req.id });
        if (!application) return fail(res, 404, "Application not found.");
        await Job.findByIdAndUpdate(application.job, { $pull: { applications: application._id } });
        await application.deleteOne();
        return res.status(200).json({ message: "Application withdrawn successfully.", success: true });
    } catch (error) {
        return serverError(res, error);
    }
};

module.exports = { applyJob, getAppliedJobs, getApplicants, updateStatus, deleteApplication };
