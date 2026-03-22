const express = require("express");
const userRouter = express.Router();
const { getProfile, updateSpecs } = require("../controllers/users");
const { verifyToken } = require("../middlewares/auth");

// Protect all user routes with JWT
userRouter.use(verifyToken);

userRouter.get("/profile", getProfile);
userRouter.put("/specs", updateSpecs);

module.exports = userRouter;
