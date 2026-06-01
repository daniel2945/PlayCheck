const Notification = require("../models/Notification");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = { recipient: userId };
    if (role === "admin" || role === "owner") {
      query = { $or: [{ recipient: userId }, { isAdminNotification: true }] };
    }

    const notifications = await Notification.find(query)
      .populate("sender", "userName avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });

    if (notification.isAdminNotification) {
      if (!notification.readBy.some((id) => id.toString() === req.user.id))
        notification.readBy.push(req.user.id);
    } else {
      notification.isRead = true;
    }
    await notification.save();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } },
    );
    if (req.user.role === "admin" || req.user.role === "owner") {
      const adminNotifs = await Notification.find({
        isAdminNotification: true,
      });
      for (const notif of adminNotifs) {
        if (!notif.readBy.some((id) => id.toString() === req.user.id)) {
          notif.readBy.push(req.user.id);
          await notif.save();
        }
      }
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
