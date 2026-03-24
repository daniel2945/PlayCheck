const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    myPc: {
      cpuId: { type: mongoose.Schema.Types.ObjectId, ref: "Hardware" },
      gpuId: { type: mongoose.Schema.Types.ObjectId, ref: "Hardware" },
      ramGb: { type: Number },
    },
    // היסטוריית חיפושים
    searchHistory: [
      {
        gameId: { type: Number, ref: "Game", required: true },
        searchedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ✨ התיקון: הפונקציה כבר לא מקבלת next, ובמקום return next() יש רק return ✨
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return; // יוצאים מהפונקציה בהצלחה
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);
module.exports = User;