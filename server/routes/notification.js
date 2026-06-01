const express = require("express");
const notificationRouter = express.Router();
const { verifyToken } = require("../middlewares/auth");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notification");

notificationRouter.get("/", verifyToken, getNotifications);
notificationRouter.put("/read-all", verifyToken, markAllAsRead);
notificationRouter.put("/:id/read", verifyToken, markAsRead);

module.exports = notificationRouter;
