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
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
