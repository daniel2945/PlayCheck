const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
const User = require("../models/User");


const register = async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    if (!email || !password || !userName) {
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
    });
    await newUser.save();
    res.status(201).json({
      success: true,
      data: "user created successfully",
      user: { id: newUser._id, userName: newUser.userName },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { password, email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, data: "user not found" });
    }
    const isVerified = await bcrypt.compare(password, user.password);
    if (!isVerified) {
      return res
        .status(400)
        .json({ success: false, data: "password is invalid" });
    }
    const token = await jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      PROCESS.env.JWT_SECRET,
      { expiresIn: "2h" },
    );
    res.status(200).json({ success: true, token: token });
  } catch (err) {
    res.status(500).json({ success: false, data: err.message });
  }
};

const changeMyPassword = async (req, res) => {
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
    res.status(500).json({success: false, error: err.message})
  }
};

const getUser = async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        if(!user){
          return  res.status(404).json({success: false, data: 'user not found'})
        }
        res.status(200).json({success: true, data: {userName: user.userName, email: user.email}});
    }
    catch(err){
        res.status(500).json({success: false, error: err.message})
    }
}

const getAllUsers = async (req, res) => {
    try{
        const users = await User.find().select('-password');
        if(!users){
            return res.status(404).json({success: false, data: 'users not found'})
        }
        res.status(200).json({success: true, data: users});
    }
    catch(err){
        res.status(500).json({success: false, data: err.message})
    }
}

const deleteUser = async (req, res) => {
    try{
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user){
           return res.status(404).json({success: false, data: 'user not found'});
        }
        res.status(200).json({success: true, data: `the user: ${user.userName} deleted successfully`})
    }
    catch(err){
        res.status(500).json({success: false, error: err.message})
    }
}

const changePassword = async (req, res) => {
    try{
        const {password} = req.body;
        const user = await User.findById(req.params.id);
        if(!user){
            return res.status(404).json({success: false, data: 'user not found'})
        }
        user.password = password;
        await user.save();
        res.status(200).json({success: true, data: 'password updated'})
    }
    catch(err){
        res.status(500).json({success: false, error: err.message})
    }
}

const changeName = async (req, res) => {
    try{
        const {userName} = req.body;
            if (!userName) {
      return res.status(400).json({ success: false, message: "Please provide a new username" });
    }
    const isExist = await User.findOne({userName, _id: { $ne: req.params.id }});
    if(isExist){
        return res.status(400).json({ success: false, error: "Username already exists" })
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, {userName: userName}, {new: true, runValidators: true});
    res.status(200).json({success: true, data: `name updated to ${updatedUser.userName}`})
    }
    catch(err){
        res.status(500).json({success: false, error: err.message})
    }
}

const changeMyName = async (req, res) => {
    try{
        const {userName} = req.body;
            if (!userName) {
      return res.status(400).json({ success: false, message: "Please provide a new username" });
    }
    const isExist = await User.findOne({userName, _id: { $ne: req.user.id }});
    if(isExist){
        return res.status(400).json({ success: false, error: "Username already exists" })
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {userName: userName}, {new: true, runValidators: true});
    res.status(200).json({success: true, data: `name updated to ${updatedUser.userName}`})
    }
    catch(err){
        res.status(500).json({success: false, error: err.message})
    }
}

const changeEmail = async (req, res) => {
    try{
        const {email} = req.body;
            if (!email) {
      return res.status(400).json({ success: false, message: "Please provide a new email" });
    }
    const isExist = await User.findOne({email, _id: { $ne: req.params.id }});
    if(isExist){
        return res.status(400).json({ success: false, error: "email already exists" })
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, {email: email}, {new: true, runValidators: true});
    res.status(200).json({success: true, data: `email updated to ${updatedUser.email}`})
    }
    catch(err){
        res.status(500).json({success: false, error: err.message})
    }
}

const changeMyEmail = async (req, res) => {
    try{
        const {email} = req.body;
            if (!email) {
      return res.status(400).json({ success: false, message: "Please provide a new email" });
    }
    const isExist = await User.findOne({email, _id: { $ne: req.user.id }});
    if(isExist){
        return res.status(400).json({ success: false, error: "email already exists" })
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {email: email}, {new: true, runValidators: true});
    res.status(200).json({success: true, data: `email updated to ${updatedUser.email}`})
    }
    catch(err){
        res.status(500).json({success: false, error: err.message})
    }
}

module.exports = {register, login, deleteUser, getAllUsers, getUser, changeEmail, changeMyEmail, changeMyName, changeName, changePassword, changeMyPassword}

