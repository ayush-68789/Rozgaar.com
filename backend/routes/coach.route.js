const express = require("express");
const rateLimit = require("express-rate-limit");
const { isAuthenticated } = require("../middlewares/isAuthenticated.js");
const coach = require("../controllers/coach.controller.js");

const router = express.Router();

// AI-backed endpoints cost money, so cap them per user/IP.
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'You have reached the hourly limit for AI features. Please try again later.', success: false }
});

router.use(isAuthenticated);

router.get("/overview", coach.getOverview);
router.get("/fit/:jobId", coach.getFit);
router.post("/goal", aiLimiter, coach.analyzeGoal);
router.post("/plan/job/:jobId", aiLimiter, coach.createPlanForJob);
router.get("/plans", coach.listPlans);
router.get("/plan/:id", coach.getPlan);
router.delete("/plan/:id", coach.deletePlan);
router.post("/plan/:id/week/:week/quiz", aiLimiter, coach.startQuiz);
router.post("/plan/:id/week/:week/submit", coach.submitQuiz);
router.post("/resume/analyze", aiLimiter, coach.analyzeResume);
router.post("/skills/add", coach.addSkills);
router.post("/projects", coach.addProject);
router.delete("/projects/:projectId", coach.deleteProject);
router.get("/news", coach.getNews);

module.exports = router;
