const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: [{
        type: String
    }],
    salary: {
        type: Number,
        required: true
    },
    salaryUnit: {
        type: String,
        enum: ['INR', 'LPA'],
        default: 'LPA'
    },
    salaryPeriod: {
        type: String,
        enum: ['month', 'year'],
        default: 'year'
    },
    experienceLevel: {
        type: Number,
        required: true,
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        required: true
    },
    position: {
        type: Number,
        required: true
    },
    applicationDeadline: {
        type: Date,
        default: null
    },
    originalApplicationDeadline: {
        type: Date,
        default: null
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
        }
    ]
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);

module.exports = { Job };
