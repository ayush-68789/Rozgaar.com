const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected'],
        default:'pending'
    }
},{timestamps:true});

// One application per candidate per job, enforced by the database (prevents double-click duplicates).
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

module.exports = { Application };
