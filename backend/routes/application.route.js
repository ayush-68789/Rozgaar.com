const express = require("express");
const { isAuthenticated, isRecruiter } = require("../middlewares/isAuthenticated.js");
const { applyJob, getApplicants, getAppliedJobs, updateStatus, deleteApplication } = require("../controllers/application.controller.js");
 
const router = express.Router();

router.route("/apply/:id").get(isAuthenticated, applyJob);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, isRecruiter, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, isRecruiter, updateStatus);
router.route("/delete/:id").delete(isAuthenticated, deleteApplication);

module.exports = router;

