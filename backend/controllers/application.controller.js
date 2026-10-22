const { Application } = require("../models/application.model.js");
const { Job } = require("../models/job.model.js");
const { User } = require("../models/user.model.js");
const { hasDeadlinePassed } = require('../utils/jobDeadline.js');

const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }
        if (hasDeadlinePassed(job.applicationDeadline)) {
            job.isOpen = false;
            await job.save();
            return res.status(400).json({ message: 'The application deadline has passed. This job is no longer accepting applications.', success: false });
        }
        if (job.isOpen === false) {
            return res.status(400).json({ message: 'This job is no longer accepting applications.', success: false });
        }
        const applicant = await User.findById(userId);
        if (!applicant || applicant.role !== 'student') {
            return res.status(403).json({ message: 'Only candidate accounts can apply for jobs.', success: false });
        }
        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();
        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
    }
};

const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}

// admin dekhega kitna user ne apply kiya hai
const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findOne({ _id: jobId, created_by: req.id }).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant',
                select: 'fullname email phoneNumber profile role'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            success:true
        });
    } catch (error) {
        console.log(error);
    }
}

const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        const allowedStatuses = ['pending', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected'];
        const normalizedStatus = String(status || '').toLowerCase();
        if(!allowedStatuses.includes(normalizedStatus)){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findById(applicationId).populate('job');
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        if (!application.job || String(application.job.created_by) !== String(req.id)) {
            return res.status(403).json({ message: 'You can only review applicants for your own jobs.', success: false });
        }

        application.status = normalizedStatus;
        await application.save();

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
    }
}

const deleteApplication = async (req, res) => {
    try {
        const userId = req.id;
        const applicationId = req.params.id;
        const application = await Application.findOne({ _id: applicationId, applicant: userId });
        if (!application) {
            return res.status(404).json({ message: "Application not found.", success: false });
        }
        // remove from job's applications array
        await Job.findByIdAndUpdate(application.job, { $pull: { applications: applicationId } });
        await application.deleteOne();
        return res.status(200).json({ message: "Application withdrawn successfully.", success: true });
    } catch (error) {
        console.log(error);
    }
};

module.exports = { applyJob, getAppliedJobs, getApplicants, updateStatus, deleteApplication };
