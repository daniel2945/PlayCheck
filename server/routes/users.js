const express = require("express");
const userRouter = express.Router();
const { updateSpecs } = require("../controllers/users");
const { verifyToken } = require("../middlewares/auth");

// Protect all user routes with JWT
userRouter.use(verifyToken);

userRouter.put("/specs", updateSpecs);

module.exports = userRouter;
