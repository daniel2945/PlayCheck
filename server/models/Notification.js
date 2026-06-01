const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isAdminNotification: { type: Boolean, default: false },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "post_comment",
        "thread_reply",
        "post_like",
        "review_report",
        "post_report",
        "thread_report",
      ],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
