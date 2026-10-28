const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    q: { type: String, required: true },
    options: [{ type: String }],
    answerIndex: { type: Number, required: true },
    explanation: { type: String, default: '' }
}, { _id: false });

const weekSchema = new mongoose.Schema({
    week: { type: Number, required: true },
    skill: { type: String, required: true },
    title: { type: String, required: true },
    topics: [{ type: String }],
    resources: [{ type: String }],
    project: { type: String, default: '' },
    unlocked: { type: Boolean, default: false },
    quizPassed: { type: Boolean, default: false },
    bestScore: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    quizSource: { type: String, enum: ['ai', 'self', ''], default: '' },
    questions: [questionSchema]
}, { _id: false });

const planSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    title: { type: String, required: true },
    goal: { type: String, default: '' },
    targetRole: { type: String, default: '' },
    summary: { type: String, default: '' },
    requiredSkills: [{ type: String }],
    gapSkills: [{ type: String }],
    source: { type: String, enum: ['ai', 'template'], default: 'template' },
    weeks: [weekSchema],
    projectIdeas: [{
        title: String,
        description: String,
        skills: [String]
    }]
}, { timestamps: true });

const Plan = mongoose.model("Plan", planSchema);

module.exports = { Plan };
