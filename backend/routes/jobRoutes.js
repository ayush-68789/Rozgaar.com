const express = require("express");
const { isAuthenticated, isRecruiter, optionalAuth } = require("../middlewares/isAuthenticated.js");
const {
    postJob,
    getAllJobs,
    getJobById,
    getAdminJobs,
    updateJob,
    toggleJobStatus,
    deleteJob
} = require("../controllers/jobController.js");

const router = express.Router();

router.route("/post").post(isAuthenticated, isRecruiter, postJob);
router.route("/get").get(getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, isRecruiter, getAdminJobs);
router.route("/get/:id").get(optionalAuth, getJobById);
router.route("/update/:id").patch(isAuthenticated, isRecruiter, updateJob);
router.route("/toggle/:id").patch(isAuthenticated, isRecruiter, toggleJobStatus);
router.route("/delete/:id").delete(isAuthenticated, isRecruiter, deleteJob);

module.exports = router;
