const express = require("express");
const adminRouter = express.Router();
const {
  deleteUser,
  getAllUsers,
  changeRole,
  adminUpdateUserName,
  adminUpdateUserEmail,
  adminUpdateUserPassword,
} = require("../controllers/admin");

const {
  verifyToken,
  forAdmins,
  forOwner,
  checkHierarchy,
} = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const {
  updatePasswordSchema,
  updateNameSchema,
  updateEmailSchema,
  updateRoleSchema,
} = require("../utils/validatorSchema");

adminRouter.get("/", verifyToken, forAdmins, getAllUsers);
adminRouter.delete("/:id", verifyToken, forAdmins, checkHierarchy, deleteUser);
adminRouter.put(
  "/:id/password",
  verifyToken,
  forAdmins,
  checkHierarchy,
  validate(updatePasswordSchema),
  adminUpdateUserPassword,
);
adminRouter.put(
  "/:id/name",
  verifyToken,
  forAdmins,
  checkHierarchy,
  validate(updateNameSchema),
  adminUpdateUserName,
);
adminRouter.put(
  "/:id/email",
  verifyToken,
  forAdmins,
  checkHierarchy,
  validate(updateEmailSchema),
  adminUpdateUserEmail,
);
adminRouter.put(
  "/:id/role",
  verifyToken,
  forOwner,
  validate(updateRoleSchema),
  changeRole,
);

module.exports = adminRouter;
