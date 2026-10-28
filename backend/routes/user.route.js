const express = require("express");
const { login, logout, register, updateProfile, updateProfileRecords, getCurrentUser, downloadResume } = require("../controllers/user.controller.js");
const { isAuthenticated } = require("../middlewares/isAuthenticated.js");
const { profileUpload } = require("../middlewares/mutler.js");

const router = express.Router();

router.route("/register").post(profileUpload, register);
router.route("/login").post(login);
router.route("/me").get(isAuthenticated, getCurrentUser);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated, profileUpload, updateProfile);
router.route("/profile/sections/:section").put(isAuthenticated, updateProfileRecords);
router.route("/resume/download").get(isAuthenticated, downloadResume);

module.exports = router;
