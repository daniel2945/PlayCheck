const mongoose = require("mongoose");
const csv = require("csvtojson");
const fs = require("fs");
const Hardware = require("../models/Hardware"); 
require('dotenv').config();


const files = [
  { 
    path: "./CPU_benchmark_v4.csv", 
    type: "CPU", 
    nameField: "cpuName", 
    scoreField: "cpuMark"  
  },
  { 
    path: "./GPU_benchmarks_v7.csv", 
    type: "GPU", 
    nameField: "gpuName",
    scoreField: "G3Dmark" 
  }
];

const seedDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI; 
    await mongoose.connect(dbURI);
    console.log("🚀 מחובר ל-MongoDB Atlas...");

    await Hardware.deleteMany({});
    console.log("🗑️  מסד הנתונים נוקה מנתונים ישנים.");

    for (const file of files) {
      if (fs.existsSync(file.path)) {
        console.log(`⏳ מעבד את קובץ ה-${file.type}...`);

        const jsonArray = await csv().fromFile(file.path);
        
        const formattedData = jsonArray.map(row => ({
          type: file.type,
          brand: row[file.nameField] ? row[file.nameField].split(" ")[0] : "Unknown",
          model: row[file.nameField],
          benchmarkScore: Number(row[file.scoreField]) || 0
        }));

        await Hardware.insertMany(formattedData);
        console.log(`✅ הועלו ${formattedData.length} רכיבי ${file.type}!`);
        
        fs.unlinkSync(file.path);
        console.log(`📁 הקובץ ${file.path} נמחק מהמחשב.`);
      } else {
        console.log(`⚠️ הקובץ ${file.path} לא נמצא, מדלג עליו.`);
      }
    }

    console.log("✨ המערכת מוכנה! כל הנתונים בענן.");
    process.exit(); 
  } catch (err) {
    console.error("❌ שגיאה במהלך ההרצה:", err);
    process.exit(1);
  }
};

seedDB();