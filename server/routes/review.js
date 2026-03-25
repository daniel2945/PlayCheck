const express = require("express");
const jwt = require("jsonwebtoken");
const reviewRouter = express.Router();

const { verifyToken, forAdmins } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { reviewSchema } = require("../utils/validatorSchema");
const { createReview, getGameReviews, deleteReview } = require("../controllers/review");

// מידלוור חכם: קורא את הטוקן אם קיים, אבל לא זורק שגיאה אם המשתמש אורח
const optionalAuth = (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // אם יש טוקן תקין, נשמור את המשתמש
    } catch (err) {}
  }
  next(); // ממשיכים לקונטרולר בכל מקרה
};

// --- הגדרת הראוטים ---

// 1. שליפת ביקורות (פתוח לכולם, סינון חומרה יעבוד רק למי שמחובר)
reviewRouter.get("/:id", optionalAuth, getGameReviews);

// 2. כתיבת ביקורת (חובה טוקן וחובה Zod)
reviewRouter.post("/", verifyToken, validate(reviewSchema), createReview);

// 3. מחיקת ביקורת (חובה טוקן וחובה הרשאת מנהל)
reviewRouter.delete("/:reviewId", verifyToken, forAdmins, deleteReview);

module.exports = reviewRouter;