const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  deleteUser,
  getAllUsers,
  getUser,
  changeEmail,
  changeMyEmail,
  changeMyName,
  changeName,
  changePassword,
  changeMyPassword,
} = require("../controllers/auth");
const {verifyToken, forAdmins} = require('../middlewares/auth')

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.delete('/deleteuser/:id', verifyToken, forAdmins, deleteUser);
authRouter.get('/getallusers', verifyToken, forAdmins, getAllUsers);
authRouter.get('/getuser', verifyToken, getUser);
authRouter.put('/changeemail/:id', verifyToken, forAdmins, changeEmail);
authRouter.put('/changemyemail', verifyToken, changeMyEmail);
authRouter.put('/changename/:id', verifyToken, forAdmins, changeName);
authRouter.put('/changemyname', verifyToken, changeMyName);
authRouter.put('/changepassword/:id', verifyToken, forAdmins, changePassword);
authRouter.put('/changemypassword', verifyToken, changeMyPassword);

module.exports = authRouter;


