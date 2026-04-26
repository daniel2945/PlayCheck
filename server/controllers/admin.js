const User = require("../models/User");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    if (!users)
      return res.status(404).json({ success: false, data: "Users not found" });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.targetUser._id);
    res
      .status(200)
      .json({
        success: true,
        data: `The user ${req.targetUser.userName} was deleted successfully`,
      });
  } catch (err) {
    next(err);
  }
};

const adminUpdateUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const targetUser = req.targetUser;

    targetUser.password = password;
    await targetUser.save();
    res
      .status(200)
      .json({ success: true, data: "User password updated successfully" });
  } catch (err) {
    next(err);
  }
};

const adminUpdateUserName = async (req, res, next) => {
  try {
    const { userName } = req.body;
    const targetUser = req.targetUser;

    const isExist = await User.findOne({
      userName,
      _id: { $ne: targetUser._id },
    });
    if (isExist)
      return res
        .status(400)
        .json({
          success: false,
          error: "Username already taken by another user",
        });

    targetUser.userName = userName;
    await targetUser.save();
    res
      .status(200)
      .json({
        success: true,
        data: `User name updated to ${targetUser.userName}`,
      });
  } catch (err) {
    next(err);
  }
};

const adminUpdateUserEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const targetUser = req.targetUser;

    const isExist = await User.findOne({ email, _id: { $ne: targetUser._id } });
    if (isExist)
      return res
        .status(400)
        .json({ success: false, error: "Email already taken by another user" });

    targetUser.email = email;
    await targetUser.save();
    res
      .status(200)
      .json({
        success: true,
        data: `User email updated to ${targetUser.email}`,
      });
  } catch (err) {
    next(err);
  }
};

const changeRole = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, select: "-password" },
    );
    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  adminUpdateUserPassword,
  adminUpdateUserName,
  adminUpdateUserEmail,
  changeRole,
};
