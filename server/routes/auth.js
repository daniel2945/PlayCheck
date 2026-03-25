const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  googleLogin,
  deleteUser,
  getAllUsers,
  getUser,
  updateEmail,
  updateName,
  updatePassword,
  changeRole,
} = require("../controllers/auth");
const { verifyToken, forAdmins } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");

// --- ייבוא Zod ---
const {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateNameSchema,
  updateEmailSchema,
  updateRoleSchema,
} = require("../utils/validatorSchema");

// --- נתיבי התחברות והרשמה ---
authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/google", googleLogin);

// --- נתיבי משתמש מחובר (דורש טוקן) ---
authRouter.use("/me", verifyToken);

authRouter.get("/me", getUser);
authRouter.put("/me/email", validate(updateEmailSchema), updateEmail);
authRouter.put("/me/name", validate(updateNameSchema), updateName);
authRouter.put("/me/password", validate(updatePasswordSchema), updatePassword);

// --- נתיבי ניהול (Admins Only) ---
authRouter.route("/").get(verifyToken, forAdmins, getAllUsers);

authRouter.route("/:id").delete(verifyToken, forAdmins, deleteUser);

authRouter
  .route("/:id/password")
  .put(verifyToken, forAdmins, validate(updatePasswordSchema), updatePassword);
authRouter
  .route("/:id/name")
  .put(verifyToken, forAdmins, validate(updateNameSchema), updateName);
authRouter
  .route("/:id/email")
  .put(verifyToken, forAdmins, validate(updateEmailSchema), updateEmail);
authRouter
  .route("/:id/role")
  .put(verifyToken, forAdmins, validate(updateRoleSchema), changeRole);

module.exports = authRouter;
