const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const hardwareRoutes = require("./routes/hardware");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use(errorHandler);
app.use("/api/hardware", hardwareRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


