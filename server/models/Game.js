const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
    default:
      "https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image+Available",
  },
  description: {
    type: String,
    required: true,
    default: "there is no description for this game",
  },
  requirements: {
    minimum: {
      cpuScore: {
        type: Number,
        required: true,
      },
      gpuScore: {
        type: Number,
        required: true,
      },
      ramGb: {
        type: Number,
        required: true,
      },
      cpuText: { type: String, required: true },
      gpuText: { type: String, required: true },
    },
    recommended: {
      cpuScore: {
        type: Number,
        required: true,
      },
      gpuScore: {
        type: Number,
        required: true,
      },
      ramGb: {
        type: Number,
        required: true,
      },
      cpuText: { type: String, required: true },
      gpuText: { type: String, required: true },
    },
  },
});

const Game = mongoose.model("Game", gameSchema);
module.exports = Game;
