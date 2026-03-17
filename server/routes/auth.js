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
const { verifyToken, forAdmins } = require('../middlewares/auth');

// --- נתיבים ציבוריים ---
authRouter.post('/register', register);
authRouter.post('/login', login);

// --- נתיבים עבור המשתמש המחובר (עצמי) ---
// שימוש ב-me/ הוא הסטנדרט המקובל עבור פעולות של משתמש על עצמו
authRouter.use('/me', verifyToken); // הגנת טוקן גורפת לכל נתיבי ה-me

authRouter.get('/me', getUser);
authRouter.put('/me/email', changeMyEmail);
authRouter.put('/me/name', changeMyName);
authRouter.put('/me/password', changeMyPassword);

// --- נתיבי ניהול (Admins Only) ---
authRouter.route('/')
  .get(verifyToken, forAdmins, getAllUsers);

authRouter.route('/:id')
  .delete(verifyToken, forAdmins, deleteUser);

authRouter.route('/:id/email')
  .put(verifyToken, forAdmins, changeEmail);

authRouter.route('/:id/name')
  .put(verifyToken, forAdmins, changeName);

authRouter.route('/:id/password')
  .put(verifyToken, forAdmins, changePassword);

module.exports = authRouter;