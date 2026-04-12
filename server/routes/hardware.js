const express = require("express");
const hardwareRouter = express.Router();

const {
  getAllHardwares,
  createHardware,
  updateHardware,
  deleteHardware,
  searchHardware,
  autoDetectHardware,
  syncSubmit,
  syncStatus,
} = require("../controllers/hardware");

const { verifyToken, forAdmins, forOwner } = require("../middlewares/auth");

hardwareRouter.get("/search", searchHardware);

// Auto-Detect PC Specs
hardwareRouter.post("/auto-detect", autoDetectHardware);

// Deep Scan Desktop Sync
hardwareRouter.post("/sync-submit", syncSubmit);
hardwareRouter.get("/sync-status/:token", syncStatus);

hardwareRouter.post("/", verifyToken, forAdmins, createHardware);
hardwareRouter.get("/", verifyToken, forAdmins, getAllHardwares);
hardwareRouter
  .route("/:id")
  .put(verifyToken, forAdmins, updateHardware)
  .delete(verifyToken, forAdmins, deleteHardware);

module.exports = hardwareRouter;
