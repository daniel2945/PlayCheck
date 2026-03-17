const Hardware = require("../models/Hardware");

// ==========================================
// פונקציות פתוחות לכולם (Public)
// ==========================================

const searchHardware = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }
    const results = await Hardware.find({
      type: type.toUpperCase(),
      model: { $regex: q, $options: "i" },
    })
      .sort({ benchmarkScore: -1 })
      .limit(10)
      .select("model brand benchmarkScore type");
    if (!results) {
      res.status(400).json({ success: false, data: "hardwares not found" });
    }
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// פונקציות למנהלים בלבד (Admin Only)
// ==========================================

const createHardware = async (req, res, next) => {
  try {
    const { model } = req.body;

    // 1. הגנה: בודקים אם המודל כבר קיים ב-DB (מתעלם מאותיות גדולות/קטנות)
    const existingHardware = await Hardware.findOne({
      model: { $regex: new RegExp(`^${model}$`, "i") },
    });

    if (existingHardware) {
      // אם מצאנו אותו, עוצרים הכל ומחזירים שגיאה למנהל
      return res.status(409).json({
        success: false,
        message: "הרכיב כבר קיים במערכת!",
      });
    }

    const newHardware = await Hardware.create(req.body);
    res.status(201).json({ success: true, data: newHardware });
  } catch (error) {
    next(error);
  }
};

const updateHardware = async (req, res, next) => {
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
    next(error);
  }
};

const deleteHardware = async (req, res, next) => {
  try {
    const hardware = await Hardware.findByIdAndDelete(req.params.id);

    if (!hardware) {
      return res
        .status(404)
        .json({ success: false, message: "חומרה לא נמצאה" });
    }

    res.status(200).json({ success: true, message: "החומרה נמחקה בהצלחה" });
  } catch (error) {
    next(error);
  }
};

const getAllHardwares = async (req, res, next) => {
  try{
    const results = await Hardware.find();
    res.status(200).json({success: true, data: results})
  }
  catch(error){
    next(error)
  }
}

module.exports = {
  searchHardware,
  createHardware,
  updateHardware,
  deleteHardware,
  getAllHardwares
};
