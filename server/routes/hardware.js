const express = require("express");
const hardwareRouter = express.Router();

const {
  getAllHardwares,
  createHardware,
  updateHardware,
  deleteHardware,
  searchHardware
} = require("../controllers/hardware");

const { verifyToken, forAdmins } = require("../middlewares/auth");


hardwareRouter.get('/search', searchHardware);
hardwareRouter.use(verifyToken, forAdmins);
hardwareRouter.post('/', createHardware);
hardwareRouter.get('/', getAllHardwares);
hardwareRouter.route('/:id')
  .put(updateHardware)
  .delete(deleteHardware);

module.exports = hardwareRouter;