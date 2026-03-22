const express = require("express");
require("dotenv").config();
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const hardwareRouter = require("./routes/hardware");
const userRouter = require("./routes/users");
const gameRouter = require("./routes/game");


const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/hardware", hardwareRouter);
app.use("/api/users", userRouter);
app.use("/api/game", gameRouter)



app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
