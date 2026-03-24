const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res, next) => {
  try {
    const { email, password, userName, myPc } = req.body;
    if (
      !email ||
      !password ||
      !userName ||
      !myPc.cpuId ||
      !myPc.gpuId ||
      !myPc.ramGb
    ) {
      return res.status(400).json({ success: false, data: "fields missing" });
    }
    const isExist = await User.findOne({ email });
    if (isExist) {
      return res
        .status(400)
        .json({ success: false, data: "user already exsits" });
    }
    const newUser = new User({
      userName,
      password,
      email,
      myPc: {
        cpuId: myPc.cpuId,
        gpuId: myPc.gpuId,
        ramGb: Number(myPc.ramGb),
      },
    });
    await newUser.save();
    res.status(201).json({
      success: true,
      data: "user created successfully",
      user: { id: newUser._id, userName: newUser.userName },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { password, email } = req.body;
    console.log(`[LOGIN DEBUG] Attempting login for email: ${email}`);

    const user = await User.findOne({ email })
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    console.log(`[LOGIN DEBUG] User found in DB:`, !!user);

    if (!user) {
      return res.status(400).json({ success: false, data: "user not found" });
    }
    const isVerified = await bcrypt.compare(password, user.password);
    console.log(`[LOGIN DEBUG] Password match:`, isVerified);

    if (!isVerified) {
      return res
        .status(400)
        .json({ success: false, data: "password is invalid" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(`[LOGIN DEBUG] Successful login! Sending user data back.`);

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("[LOGIN ERROR DEBUG]", err);
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, data: "Google credential missing" });
    }

    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await User.findOne({ email })
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    // If the user doesn't exist, create an account automatically
    if (!user) {
      const randomPassword = await bcrypt.hash(sub + process.env.JWT_SECRET, 10);
      const newUser = new User({
        userName: name,
        email,
        password: randomPassword,
        myPc: {
          cpuId: "000000000000000000000000",
          gpuId: "000000000000000000000000",
          ramGb: 16,
        },
      });
      await newUser.save();
      user = newUser;
    }

    // Generate our app's standard JWT token
    const token = jwt.sign(
      { id: user._id, userName: user.userName, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, token, user: userResponse });
  } catch (err) {
    console.error("[GOOGLE LOGIN SERVER ERROR]", err);
    next(err);
  }
};

const changeMyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ success: false, data: "user not found" });
    }
    user.password = password;
    await user.save();
    res.status(200).json({ success: true, data: "password updated" });
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
    if (!user) {
      return res.status(404).json({ success: false, data: "user not found" });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    if (!users) {
      return res.status(404).json({ success: false, data: "users not found" });
    }
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, data: "user not found" });
    }
    res.status(200).json({
      success: true,
      data: `the user: ${user.userName} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, data: "user not found" });
    }
    user.password = password;
    await user.save();
    res.status(200).json({ success: true, data: "password updated" });
  } catch (err) {
    next(err);
  }
};

const changeName = async (req, res, next) => {
  try {
    const { userName } = req.body;
    if (!userName) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a new username" });
    }
    const isExist = await User.findOne({
      userName,
      _id: { $ne: req.params.id },
    });
    if (isExist) {
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { userName: userName },
      { new: true, runValidators: true },
    );
    res
      .status(200)
      .json({ success: true, data: `name updated to ${updatedUser.userName}` });
  } catch (err) {
    next(err);
  }
};

const changeMyName = async (req, res, next) => {
  try {
    const { userName } = req.body;
    if (!userName) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a new username" });
    }
    const isExist = await User.findOne({ userName, _id: { $ne: req.user.id } });
    if (isExist) {
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { userName: userName },
      { new: true, runValidators: true },
    );
    res
      .status(200)
      .json({ success: true, data: `name updated to ${updatedUser.userName}` });
  } catch (err) {
    next(err);
  }
};

const changeEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a new email" });
    }
    const isExist = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (isExist) {
      return res
        .status(400)
        .json({ success: false, error: "email already exists" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { email: email },
      { new: true, runValidators: true },
    );
    res
      .status(200)
      .json({ success: true, data: `email updated to ${updatedUser.email}` });
  } catch (err) {
    next(err);
  }
};

const changeMyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a new email" });
    }
    const isExist = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (isExist) {
      return res
        .status(400)
        .json({ success: false, error: "email already exists" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { email: email },
      { new: true, runValidators: true },
    );
    res
      .status(200)
      .json({ success: true, data: `email updated to ${updatedUser.email}` });
  } catch (err) {
    next(err);
  }
};

const changeRole = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: req.body.isAdmin }, // מעדכן רק את שדה הניהול
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
};


<<<<<<< HEAD
=======


>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
module.exports = {
  register,
  login,
  googleLogin,
  deleteUser,
  getAllUsers,
  getUser,
  changeEmail,
  changeMyEmail,
  changeMyName,
  changeName,
  changePassword,
  changeMyPassword,
<<<<<<< HEAD
  changeRole
=======
  changeRole,
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542
};
