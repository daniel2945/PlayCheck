const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Hardware = require("../models/Hardware");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res, next) => {
  try {
    const { email, password, userName, myPc } = req.body;
    const isExist = await User.findOne({ email });
    if (isExist) {
      return res
        .status(400)
        .json({ success: false, data: "User already exists" });
    }

    const defaultCpu = await Hardware.findOne({ type: "CPU" });
    const defaultGpu = await Hardware.findOne({ type: "GPU" });
    if (!defaultCpu || !defaultGpu) {
      return res
        .status(500)
        .json({ success: false, data: "Default hardware not found" });
    }

    const newUser = new User({
      userName,
      password,
      email,
      role: "user",
      myPc: {
        cpuId: defaultCpu._id,
        gpuId: defaultGpu._id,
        ramGb: Number(myPc.ramGb),
      },
    });

    await newUser.save();
    res.status(201).json({
      success: true,
      data: "User created successfully",
      user: { id: newUser._id, userName: newUser.userName },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { password, email } = req.body;
    const user = await User.findOne({ email })
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    if (!user)
      return res.status(400).json({ success: false, data: "User not found" });

    const isVerified = await bcrypt.compare(password, user.password);
    if (!isVerified)
      return res.status(400).json({ success: false, data: "Invalid password" });

    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({ success: true, token, user: userResponse });
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res
        .status(400)
        .json({ success: false, data: "Google credential missing" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub } = ticket.getPayload();

    let user = await User.findOne({ email })
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    if (!user) {
      const randomPassword = await bcrypt.hash(
        sub + process.env.JWT_SECRET,
        10,
      );
      user = new User({
        userName: name,
        email,
        password: randomPassword,
        role: "user",
        myPc: {
          cpuId: "000000000000000000000000",
          gpuId: "000000000000000000000000",
          ramGb: 16,
        },
      });
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({ success: true, token, user: userResponse });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");
    if (!user)
      return res.status(404).json({ success: false, data: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// --- פונקציות שהמשתמש מעדכן לעצמו (Me) ---

const updateOwnPassword = async (req, res, next) => {
  try {
    const { currentPassword, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: false, data: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, error: "Invalid current password" });

    user.password = password;
    await user.save();
    res
      .status(200)
      .json({ success: true, data: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

const updateOwnName = async (req, res, next) => {
  try {
    const { userName } = req.body;
    const isExist = await User.findOne({ userName, _id: { $ne: req.user.id } });
    if (isExist)
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { userName },
      { new: true, runValidators: true },
    );
    res
      .status(200)
      .json({ success: true, data: `Name updated to ${updatedUser.userName}` });
  } catch (err) {
    next(err);
  }
};

const updateOwnEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!password)
      return res
        .status(400)
        .json({
          success: false,
          error: "Password is required to change email",
        });

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, error: "Invalid password" });

    const isExist = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (isExist)
      return res
        .status(400)
        .json({ success: false, error: "Email already exists" });

    user.email = email;
    await user.save();
    res
      .status(200)
      .json({ success: true, data: `Email updated to ${user.email}` });
  } catch (err) {
    next(err);
  }
};

const deleteOwnAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, data: "User not found" });
    }
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ success: true, data: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getUser,
  updateOwnName,
  updateOwnEmail,
  updateOwnPassword,
  deleteOwnAccount,
};
