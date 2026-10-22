const express = require("express");
const { isAuthenticated, isRecruiter } = require("../middlewares/isAuthenticated.js");
const { getCompany, getCompanyById, registerCompany, updateCompany, deleteCompany } = require("../controllers/company.controller.js");
const { singleUpload } = require("../middlewares/mutler.js");

const router = express.Router();

router.route("/register").post(isAuthenticated, isRecruiter, registerCompany);
router.route("/get").get(isAuthenticated, isRecruiter, getCompany);
router.route("/get/:id").get(isAuthenticated, isRecruiter, getCompanyById);
router.route("/update/:id").put(isAuthenticated, isRecruiter, singleUpload, updateCompany);
router.route("/delete/:id").delete(isAuthenticated, isRecruiter, deleteCompany);

module.exports = router;

