const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  googleLogin,
  deleteUser,
  getAllUsers,
  getUser,
  changeRole,
  updateOwnName,
  updateOwnEmail,
  updateOwnPassword,
  adminUpdateUserName,
  adminUpdateUserEmail,
  adminUpdateUserPassword
} = require("../controllers/auth");

// ייבוא כל המידלווארים כולל checkHierarchy החדש
const { verifyToken, forAdmins, forOwner, checkHierarchy } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");

const {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateNameSchema,
  updateEmailSchema,
  updateRoleSchema,
} = require("../utils/validatorSchema");

// --- Auth & Registration ---
authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/google", googleLogin);

// ==========================================
// USER ROUTES (משתמש משנה את עצמו)
// ==========================================
authRouter.use("/me", verifyToken);

authRouter.get("/me", getUser);
authRouter.put("/me/email", validate(updateEmailSchema), updateOwnEmail);
authRouter.put("/me/name", validate(updateNameSchema), updateOwnName);
authRouter.put("/me/password", validate(updatePasswordSchema), updateOwnPassword);

// ==========================================
// ADMIN / OWNER ROUTES (פעולות ניהוליות)
// ==========================================
authRouter.get("/", verifyToken, forAdmins, getAllUsers);

// מחיקה ועדכון על ידי מנהל - הכל עובר דרך checkHierarchy קודם!
authRouter.delete("/:id", verifyToken, forAdmins, checkHierarchy, deleteUser);

authRouter.put("/:id/password", verifyToken, forAdmins, checkHierarchy, validate(updatePasswordSchema), adminUpdateUserPassword);
authRouter.put("/:id/name", verifyToken, forAdmins, checkHierarchy, validate(updateNameSchema), adminUpdateUserName);
authRouter.put("/:id/email", verifyToken, forAdmins, checkHierarchy, validate(updateEmailSchema), adminUpdateUserEmail);

// Owner בלבד - שינוי הרשאות (כאן לא צריך checkHierarchy כי רק לבעלים מותר לשנות לכולם)
authRouter.put("/:id/role", verifyToken, forOwner, validate(updateRoleSchema), changeRole);

module.exports = authRouter;