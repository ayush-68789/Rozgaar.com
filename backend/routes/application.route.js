const express = require("express");
const { isAuthenticated, isRecruiter } = require("../middlewares/isAuthenticated.js");
const { applyJob, getApplicants, getAppliedJobs, updateStatus, aiShortlistApplicants, deleteApplication } = require("../controllers/application.controller.js");
 
const router = express.Router();

// POST (not GET): applying changes data, and GETs can be triggered cross-site with the session cookie.
router.route("/apply/:id").post(isAuthenticated, applyJob);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, isRecruiter, getApplicants);
router.route("/shortlist/:id").post(isAuthenticated, isRecruiter, aiShortlistApplicants);
router.route("/status/:id/update").post(isAuthenticated, isRecruiter, updateStatus);
router.route("/delete/:id").delete(isAuthenticated, deleteApplication);

module.exports = router;

