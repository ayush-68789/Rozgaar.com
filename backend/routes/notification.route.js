const express = require("express");
const { isAuthenticated } = require("../middlewares/isAuthenticated.js");
const { listNotifications, markRead, markAllRead } = require("../controllers/notification.controller.js");

const router = express.Router();

router.get("/", isAuthenticated, listNotifications);
router.post("/read-all", isAuthenticated, markAllRead);
router.post("/:id/read", isAuthenticated, markRead);

module.exports = router;
