const express = require("express");
const hardwareRouter = express.Router();

const {
  getAllHardwares,
  createHardware,
  updateHardware,
  deleteHardware,
  searchHardware,
} = require("../controllers/hardware");

const { verifyToken, forAdmins, forOwner } = require("../middlewares/auth");

hardwareRouter.get("/search", searchHardware);
hardwareRouter.post("/", verifyToken, forAdmins, createHardware);
hardwareRouter.get("/", verifyToken, forAdmins, getAllHardwares);
hardwareRouter
  .route("/:id")
  .put(verifyToken, forAdmins, updateHardware)
  .delete(verifyToken, forAdmins, deleteHardware);

module.exports = hardwareRouter;
