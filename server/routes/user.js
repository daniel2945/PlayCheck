const express = require("express");
const userRouter = express.Router();
const { updateSpecs, getRecommendations ,getSearchHistory } = require("../controllers/user");
const { verifyToken } = require("../middlewares/auth");

// Protect all user routes with JWT
userRouter.use(verifyToken);

userRouter.put("/specs", updateSpecs);

userRouter.get("/history", getSearchHistory);

userRouter.get("/recommendations", getRecommendations);


module.exports = userRouter;
