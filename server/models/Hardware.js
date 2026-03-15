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
    },
    model: {
      type: String,
      required: true,
      unique: true,
    },
    benchmarkScore: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Hardware", hardWareSchema);
