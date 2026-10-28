const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        // Keep phone numbers as text so +country codes and leading zeroes are preserved.
        type: String,
        required: true
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:['student','recruiter'],
        required:true
    },
    profile:{
        bio:{type:String},
        skills:[{type:String}],

        company:{type:mongoose.Schema.Types.ObjectId, ref:'Company'}, 
        profilePhoto:{
            type:String,
            default:""
        },
        resumeUrl:{ type:String, default:"" },
        resumeName:{ type:String, default:"" },
        targetRole:{ type:String, default:"" },
        // Skills proven through Solvi coach quizzes (source "quiz") or self-assessed.
        verifiedSkills:[{
            _id:false,
            skill:{ type:String, required:true },
            score:{ type:Number, default:0 },
            source:{ type:String, enum:['quiz','self'], default:'quiz' },
            verifiedAt:{ type:Date, default:Date.now }
        }],
        projects:[{
            title:{ type:String, required:true },
            link:{ type:String, default:"" },
            description:{ type:String, default:"" },
            skills:[{ type:String }]
        }]
    },
},{timestamps:true});

const User = mongoose.model('User', userSchema);

module.exports = { User };
