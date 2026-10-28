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
        jobRecommendations:[{
            _id:false,
            job:{ type:mongoose.Schema.Types.ObjectId, ref:'Job', required:true },
            matchScore:{ type:Number, min:0, max:100 },
            reason:{ type:String, default:"" }
        }],
        jobRecommendationsUpdatedAt:{ type:Date, default:null },
        jobRecommendationsSource:{ type:String, enum:['ai','skills'], default:null },
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
        }],
        education:[{
            institution:{ type:String, required:true },
            degree:{ type:String, default:"" },
            fieldOfStudy:{ type:String, default:"" },
            location:{ type:String, default:"" },
            startDate:{ type:String, default:"" },
            endDate:{ type:String, default:"" },
            current:{ type:Boolean, default:false },
            description:{ type:String, default:"" }
        }],
        experience:[{
            title:{ type:String, required:true },
            company:{ type:String, default:"" },
            location:{ type:String, default:"" },
            employmentType:{ type:String, default:"" },
            startDate:{ type:String, default:"" },
            endDate:{ type:String, default:"" },
            current:{ type:Boolean, default:false },
            description:{ type:String, default:"" }
        }],
        achievements:[{
            title:{ type:String, required:true },
            organization:{ type:String, default:"" },
            date:{ type:String, default:"" },
            description:{ type:String, default:"" },
            link:{ type:String, default:"" }
        }],
        certificates:[{
            title:{ type:String, required:true },
            organization:{ type:String, default:"" },
            date:{ type:String, default:"" },
            description:{ type:String, default:"" },
            link:{ type:String, default:"" }
        }]
    },
},{timestamps:true});

const User = mongoose.model('User', userSchema);

module.exports = { User };
