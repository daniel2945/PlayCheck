const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, default: "General" },
    taggedGame: {
      _id: { type: String },
      gameId: { type: String },
      title: { type: String },
      image: { type: String },
    },
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    hardwareSnapshot: {
      cpuName: { type: String },
      gpuName: { type: String },
      ramGb: { type: Number },
    },
    isEdited: { type: Boolean, default: false },
    replies: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        // ✨ הוספת תמונה לתגובות באשכול ✨
        image: {
          url: { type: String, default: "" },
          publicId: { type: String, default: "" },
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
        hardwareSnapshot: {
          cpuName: { type: String },
          gpuName: { type: String },
          ramGb: { type: Number },
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Thread", threadSchema);
