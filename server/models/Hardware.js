const mongoose = require("mongoose");

const hardWareSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["CPU", "GPU"],
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    benchmarkScore: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Hardware", hardWareSchema);
