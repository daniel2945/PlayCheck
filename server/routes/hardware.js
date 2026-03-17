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

// --- נתיבים ציבוריים / לכל המשתמשים ---
// שליפת כל החומרה
hardwareRouter.get('/search', searchHardware);

// --- נתיבי ניהול (Admins Only) ---
// כל מה שמוגדר מתחת לשורה הזו יחייב טוקן והרשאת מנהל באופן אוטומטי
hardwareRouter.use(verifyToken, forAdmins);

// יצירת חומרה חדשה
hardwareRouter.post('/', createHardware);
hardwareRouter.get('/', getAllHardwares);

// פעולות על פריט חומרה ספציפי (עריכה ומחיקה)
hardwareRouter.route('/:id')
  .put(updateHardware)
  .delete(deleteHardware);

module.exports = hardwareRouter;