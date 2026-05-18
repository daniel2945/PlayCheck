const mongoose = require("mongoose");
const path = require("path"); // מודול מובנה של Node.js לניהול נתיבים
const Hardware = require("../models/Hardware"); // ודא שהנתיב נכון
const newData = require("./new_hardware.json"); // מושך את ה-JSON שיצרנו

// מגדיר במפורש לחפש את קובץ ה-.env תיקייה אחת למעלה, בלי קשר למאיפה מריצים את הסקריפט
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};

const updateDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;
    
    // בדיקת שפיות כדי למנוע את שגיאת ה-"undefined" של Mongoose
    if (!dbURI) {
        throw new Error("לא נמצא משתנה MONGO_URI. ודא שקובץ ה-.env קיים בתיקיית ה-server ומוגדר נכון.");
    }

    await mongoose.connect(dbURI);
    console.log("🚀 מחובר ל-MongoDB Atlas לצורך עדכון...");

    let addedCount = 0;
    let skippedCount = 0;

    for (const item of newData) {
      const escapedModel = escapeRegex(item.model || "");
      const exists = await Hardware.findOne({
        model: { $regex: new RegExp(`^${escapedModel}$`, "i") },
      });

      if (!exists) {
        await Hardware.create(item);
        console.log(`✅ נוסף: ${item.model}`);
        addedCount++;
      } else {
        console.log(`⚠️ דולג (כבר קיים): ${item.model}`);
        skippedCount++;
      }
    }

    console.log("-----------------------------------");
    console.log(
      `✨ סיום העדכון! נוספו ${addedCount} רכיבים חדשים. דולגו ${skippedCount} קיימים.`
    );
    process.exit();
  } catch (err) {
    console.error("❌ שגיאה:", err.message || err);
    process.exit(1);
  }
};

updateDB();