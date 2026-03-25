const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // קישור למשחק (ה-ID של RAWG הוא מספר, כפי שהגדרתם ב-Game.js)
    gameId: {
      type: Number,
      ref: "Game",
      required: true,
    },
    // קישור למשתמש שכתב את הביקורת
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // דירוג מספרי (למשל מ-1 עד 5)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    // תוכן הביקורת הטקסטואלית
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // מונע מאנשים להספים את ה-DB עם מגילות
    },
    // 📸 "צילום המצב" - כאן טמון הקסם של הפיצ'ר
    hardwareSnapshot: {
      cpuScore: { type: Number, required: true },
      gpuScore: { type: Number, required: true },
      ramGb: { type: Number, required: true },
      // שומרים גם את השמות כדי שנוכל להציג: "נכתב על ידי משתמש עם Intel Core i5"
      cpuName: { type: String, required: true }, 
      gpuName: { type: String, required: true },
    }
  },
  { timestamps: true } // מוסיף אוטומטית createdAt ו-updatedAt
);

module.exports = mongoose.model("Review", reviewSchema);