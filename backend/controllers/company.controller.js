const { Company } = require("../models/company.model.js");
const { getDataUri } = require("../utils/datauri.js");
const { cloudinary } = require("../utils/cloudinary.js");

const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }
        let company = await Company.findOne({ name: companyName });
        if (company) {
            return res.status(400).json({
                message: "You can't register same company.",
                success: false
            })
        };
        company = await Company.create({
            name: companyName,
            userId: req.id
        });

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

const getCompany = async (req, res) => {
    try {
        const userId = req.id; // logged in user id
        const companies = await Company.find({ userId });
        if (!companies) {
            return res.status(404).json({
                message: "Companies not found.",
                success: false
            })
        }
        return res.status(200).json({
            companies,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}

// get company by id
const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findOne({ _id: companyId, userId: req.id });
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        return res.status(200).json({
            company,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
 
        const file = req.file;
        const updateData = { name, description, website, location };

        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            updateData.logo = cloudResponse.secure_url;
        }

        const company = await Company.findOneAndUpdate({ _id: req.params.id, userId: req.id }, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        return res.status(200).json({
            message:"Company information updated.",
            success:true
        })

    } catch (error) {
        console.log(error);
    }
}

const deleteCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        const userId = req.id;
        const company = await Company.findOne({ _id: companyId, userId });
        if (!company) {
            return res.status(404).json({ message: "Company not found.", success: false });
        }
        // cascade delete: all jobs and their applications
        const { Job } = require("../models/job.model.js");
        const { Application } = require("../models/application.model.js");
        const jobs = await Job.find({ company: companyId });
        const jobIds = jobs.map(j => j._id);
        await Application.deleteMany({ job: { $in: jobIds } });
        await Job.deleteMany({ company: companyId });
        await company.deleteOne();
        return res.status(200).json({ message: "Company deleted successfully.", success: true });
    } catch (error) {
        console.log(error);
    }
};

module.exports = { registerCompany, getCompany, getCompanyById, updateCompany, deleteCompany };
