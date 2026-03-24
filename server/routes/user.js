const express = require("express");
const userRouter = express.Router();
<<<<<<< HEAD:server/routes/users.js
const { updateSpecs } = require("../controllers/users");
=======
const { updateSpecs, getRecommendations ,getSearchHistory } = require("../controllers/user");
>>>>>>> fcde8e3109dccda3b8ec10880406b049b8b00542:server/routes/user.js
const { verifyToken } = require("../middlewares/auth");

// Protect all user routes with JWT
userRouter.use(verifyToken);

userRouter.put("/specs", updateSpecs);

userRouter.get("/history", getSearchHistory);

userRouter.get("/recommendations", getRecommendations);


module.exports = userRouter;
