const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // התאמה למבנה שחוזר מקלאודינרי
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
