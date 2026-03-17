const mongoose = require("mongoose");
const Hardware = require("../models/Hardware"); // ודא שהנתיב נכון
const newData = require("./new_hardware.json"); // מושך את ה-JSON שיצרנו
require("dotenv").config();
const updateDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;
    await mongoose.connect(dbURI);
    console.log("🚀 מחובר ל-MongoDB Atlas לצורך עדכון...");

    let addedCount = 0;
    let skippedCount = 0;

    for (const item of newData) {
      const exists = await Hardware.findOne({
        model: { $regex: new RegExp(`^${item.model}$`, "i") },
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
      `✨ סיום העדכון! נוספו ${addedCount} רכיבים חדשים. דולגו ${skippedCount} קיימים.`,
    );
    process.exit();
  } catch (err) {
    console.error("❌ שגיאה:", err);
    process.exit(1);
  }
};

updateDB();
