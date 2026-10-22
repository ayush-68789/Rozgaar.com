const { Job } = require("../models/Job.js");
const { Company } = require("../models/company.model.js");
const { Application } = require("../models/application.model.js");
const { closeExpiredJobs, getCandidateVisibilityCutoff, hasDeadlinePassed } = require('../utils/jobDeadline.js');

const parseApplicationDeadline = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

const deadlineIsBeforeToday = date => {
    const today = new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10) < today;
};

// recruiter creates job
const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, salaryUnit = 'LPA', salaryPeriod = 'year', location, jobType, experience, position, companyId, applicationDeadline } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || salary === undefined || salary === '' || !location || !jobType || !experience || !position || !companyId || !applicationDeadline) {
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            });
        }

        const salaryAmount = Number(salary);
        if (!Number.isFinite(salaryAmount) || salaryAmount <= 0 || !['INR', 'LPA'].includes(salaryUnit) || !['month', 'year'].includes(salaryPeriod)) {
            return res.status(400).json({ message: 'Enter a valid salary amount and pay period.', success: false });
        }

        const deadline = parseApplicationDeadline(applicationDeadline);
        if (!deadline || deadlineIsBeforeToday(deadline)) {
            return res.status(400).json({ message: 'Choose a valid application deadline that is today or later.', success: false });
        }

        // The form accepts useful labels such as "2 - 4 years". Store the
        // lower bound as the numeric experience level used by the model.
        const experienceMatch = String(experience).match(/\d+(?:\.\d+)?/);
        const experienceLevel = experienceMatch ? Number(experienceMatch[0]) : NaN;
        if (!Number.isFinite(experienceLevel)) {
            return res.status(400).json({ message: 'Enter experience as years, for example "2 - 4 years" or "0" for entry level.', success: false });
        }

        const company = await Company.findOne({ _id: companyId, userId });
        if (!company) {
            return res.status(400).json({ message: 'Select one of your registered companies.', success: false });
        }

        const job = await Job.create({
            title,
            description,
            requirements: Array.isArray(requirements) ? requirements : requirements.split(",").map(r => r.trim()),
            salary: salaryAmount,
            salaryUnit,
            salaryPeriod,
            location,
            jobType,
            experienceLevel,
            position: Number(position),
            applicationDeadline: deadline,
            originalApplicationDeadline: deadline,
            company: companyId,
            created_by: userId
        });

        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

// student / candidate gets all jobs (with optional search keyword)
const getAllJobs = async (req, res) => {
    try {
        await closeExpiredJobs();
        const keyword = req.query.keyword || "";
        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matchingCompanies = keyword
            ? await Company.find({ name: { $regex: safeKeyword, $options: 'i' } }).distinct('_id')
            : [];
        const query = keyword ? {
            $or: [
                { title: { $regex: safeKeyword, $options: "i" } },
                { description: { $regex: safeKeyword, $options: "i" } },
                { location: { $regex: safeKeyword, $options: "i" } },
                { jobType: { $regex: safeKeyword, $options: "i" } },
                { requirements: { $regex: safeKeyword, $options: "i" } },
                { company: { $in: matchingCompanies } },
            ]
        } : {};
        query.$and = [
            ...(query.$and || []),
            {
                $or: [
                    { applicationDeadline: null },
                    { applicationDeadline: { $gt: getCandidateVisibilityCutoff() } }
                ]
            }
        ];
        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            jobs,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

// candidate gets job details by id
const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        await closeExpiredJobs();
        const visibilityCutoff = getCandidateVisibilityCutoff();
        const job = await Job.findById(jobId).populate({
            path: "applications"
        }).populate({
            path: "company"
        });

        if (!job || (job.applicationDeadline && job.applicationDeadline <= visibilityCutoff)) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }
        return res.status(200).json({
            job,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

// recruiter gets all jobs posted by them
const getAdminJobs = async (req, res) => {
    try {
        await closeExpiredJobs();
        const adminId = req.id;
        const jobs = await Job.find({ created_by: adminId }).populate({
            path: 'company',
            options: { sort: { createdAt: -1 } }
        }).sort({ createdAt: -1 });

        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                jobs: [],
                success: false
            });
        }
        return res.status(200).json({
            jobs,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

// recruiter updates an existing job they own
const updateJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, salaryUnit, salaryPeriod, location, jobType, experience, position, companyId, applicationDeadline } = req.body;
        if (!title || !description || !requirements || salary === undefined || salary === '' || !location || !jobType || !experience || position === undefined || !companyId || !applicationDeadline) {
            return res.status(400).json({ message: 'Complete all job fields before saving.', success: false });
        }

        const salaryAmount = Number(salary);
        const experienceMatch = String(experience).match(/\d+(?:\.\d+)?/);
        const experienceLevel = experienceMatch ? Number(experienceMatch[0]) : NaN;
        const positionCount = Number(position);
        if (!Number.isFinite(salaryAmount) || salaryAmount <= 0 || !['INR', 'LPA'].includes(salaryUnit) || !['month', 'year'].includes(salaryPeriod)) {
            return res.status(400).json({ message: 'Enter a valid salary amount and pay period.', success: false });
        }
        if (!Number.isFinite(experienceLevel) || !Number.isInteger(positionCount) || positionCount < 1) {
            return res.status(400).json({ message: 'Enter a valid experience and number of positions.', success: false });
        }
        const deadline = parseApplicationDeadline(applicationDeadline);
        if (!deadline || deadlineIsBeforeToday(deadline)) {
            return res.status(400).json({ message: 'Choose a valid application deadline that is today or later.', success: false });
        }

        const [job, company] = await Promise.all([
            Job.findOne({ _id: req.params.id, created_by: req.id }),
            Company.findOne({ _id: companyId, userId: req.id })
        ]);
        if (!job) return res.status(404).json({ message: 'Job not found.', success: false });
        if (!company) return res.status(400).json({ message: 'Select one of your registered companies.', success: false });

        job.title = title.trim();
        job.description = description.trim();
        job.requirements = Array.isArray(requirements) ? requirements : String(requirements).split(',').map(item => item.trim()).filter(Boolean);
        job.salary = salaryAmount;
        job.salaryUnit = salaryUnit;
        job.salaryPeriod = salaryPeriod;
        job.location = location.trim();
        job.jobType = jobType.trim();
        job.experienceLevel = experienceLevel;
        job.position = positionCount;
        job.originalApplicationDeadline = job.originalApplicationDeadline || job.applicationDeadline || deadline;
        job.applicationDeadline = deadline;
        job.company = company._id;
        await job.save();
        await job.populate('company');

        return res.status(200).json({ message: 'Job updated successfully.', job, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to update job.', success: false });
    }
};

// recruiter opens or closes one of their own job listings
const toggleJobStatus = async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, created_by: req.id });
        if (!job) {
            return res.status(404).json({ message: 'Job not found.', success: false });
        }

        // Older jobs without isOpen are considered open by the UI.
        const shouldOpen = job.isOpen === false;
        if (shouldOpen && hasDeadlinePassed(job.applicationDeadline)) {
            job.isOpen = false;
            await job.save();
            return res.status(400).json({ message: 'Extend the application deadline before reopening this job.', success: false });
        }
        job.isOpen = shouldOpen;
        await job.save();

        return res.status(200).json({
            message: `Job ${job.isOpen ? 'reopened' : 'closed'} successfully.`,
            isOpen: job.isOpen,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to update job status.', success: false });
    }
};

// recruiter deletes a job
const deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findOneAndDelete({ _id: jobId, created_by: req.id });
        if (!job) {
            return res.status(404).json({
                message: "Job not found or you do not have permission to delete it.",
                success: false
            });
        }
        await Application.deleteMany({ job: job._id });
        return res.status(200).json({
            message: "Job deleted successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

module.exports = {
    postJob,
    getAllJobs,
    getJobById,
    getAdminJobs,
    updateJob,
    toggleJobStatus,
    deleteJob
};
