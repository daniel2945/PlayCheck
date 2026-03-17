const Hardware = require("../models/Hardware");

// ==========================================
// פונקציות פתוחות לכולם (Public)
// ==========================================

const getHardware = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};

    const hardwareList = await Hardware.find(filter);
    res
      .status(200)
      .json({ success: true, count: hardwareList.length, data: hardwareList });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "שגיאת שרת בשליפת החומרה" });
  }
};

// ==========================================
// פונקציות למנהלים בלבד (Admin Only)
// ==========================================

const createHardware = async (req, res) => {
  try {
    const newHardware = await Hardware.create(req.body);
    res.status(201).json({ success: true, data: newHardware });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateHardware = async (req, res) => {
  try {
    const hardware = await Hardware.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!hardware) {
      return res
        .status(404)
        .json({ success: false, message: "חומרה לא נמצאה" });
    }

    res.status(200).json({ success: true, data: hardware });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteHardware = async (req, res) => {
  try {
    const hardware = await Hardware.findByIdAndDelete(req.params.id);

    if (!hardware) {
      return res
        .status(404)
        .json({ success: false, message: "חומרה לא נמצאה" });
    }

    res.status(200).json({ success: true, message: "החומרה נמחקה בהצלחה" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHardware,
  createHardware,
  updateHardware,
  deleteHardware,
};
