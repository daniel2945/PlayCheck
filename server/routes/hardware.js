const express = require("express");
const router = express.Router();

const {
  getHardware,
  createHardware,
  updateHardware,
  deleteHardware,
} = require("../controllers/hardware");

const { verifyToken, forAdmins } = require("../middlewares/auth");

router
  .route("/")

  .get(getHardware)
  // יצירה - שרשרת אבטחה: קודם מוודאים טוקן, אחר כך מוודאים מנהל, ורק אז יוצרים
  .post(verifyToken, forAdmins, createHardware);

router
  .route("/:id")
  // עריכה - רק מנהל מחובר
  .put(verifyToken, forAdmins, updateHardware)
  // מחיקה - רק מנהל מחובר
  .delete(verifyToken, forAdmins, deleteHardware);

module.exports = router;
