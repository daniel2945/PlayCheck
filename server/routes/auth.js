const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  googleLogin,
  getUser,
  updateOwnName,
  updateOwnEmail,
  updateOwnPassword,
  deleteOwnAccount,
} = require("../controllers/auth");

const { verifyToken } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");

const {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateNameSchema,
  updateEmailSchema,
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
authRouter.put(
  "/me/password",
  validate(updatePasswordSchema),
  updateOwnPassword,
);
authRouter.delete("/me", deleteOwnAccount);

module.exports = authRouter;
