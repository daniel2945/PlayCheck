const mongoose = require("mongoose");
const csv = require("csvtojson");
const fs = require("fs");
const path = require("path"); 
const Hardware = require("../models/Hardware"); 
require('dotenv').config();

const files = [
  { 
    path: path.join(__dirname, "CPU_benchmark_v4.csv"), 
    type: "CPU", 
    nameField: "cpuName", 
    scoreField: "cpuMark"  
  },
  { 
    path: path.join(__dirname, "GPU_benchmarks_v7.csv"), 
    type: "GPU", 
    nameField: "gpuName",
    scoreField: "G3Dmark" 
  }
];

function determineBrand(name) {
  if (!name) return "Unknown";
  
  const upperName = name.toUpperCase();
  
  if (upperName.includes("NVIDIA") || upperName.includes("GEFORCE") || upperName.includes("RTX") || upperName.includes("GTX") || upperName.includes("QUADRO") || upperName.includes("TITAN")) {
    return "NVIDIA";
  }
  if (upperName.includes("AMD") || upperName.includes("RADEON") || upperName.includes("RYZEN") || upperName.includes("THREADRIPPER") || upperName.includes("EPYC") || upperName.includes("FIREPRO") || upperName.includes("RX ")) {
    return "AMD";
  }
  if (upperName.includes("INTEL") || upperName.includes("CORE") || upperName.includes("PENTIUM") || upperName.includes("CELERON") || upperName.includes("XEON") || upperName.includes("ARC ") || upperName.includes("UHD GRAPHICS") || upperName.includes("IRIS")) {
    return "Intel";
  }
  if (upperName.includes("APPLE") || upperName.match(/\bM[1-4]\b/)) {
    return "Apple";
  }
  if (upperName.includes("QUALCOMM") || upperName.includes("SNAPDRAGON")) {
    return "Qualcomm";
  }
  if (upperName.includes("MEDIATEK") || upperName.includes("ARM ") || upperName.includes("CORTEX") || upperName.includes("MALI")) {
    return "ARM / MediaTek";
  }
  
  return name.split(" ")[0];
}

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
          brand: determineBrand(row[file.nameField]),
          model: row[file.nameField],
          benchmarkScore: Number(row[file.scoreField]) || 0
        }));

        await Hardware.insertMany(formattedData);
        console.log(`✅ הועלו ${formattedData.length} רכיבי ${file.type} עם מותגים מסודרים!`);
        
        fs.unlinkSync(file.path);
        console.log(`📁 הקובץ ${file.path} נמחק מהמחשב.`);
      } else {
        console.log(`⚠️ הקובץ ${file.path} לא נמצא, מדלג עליו. (שכחת להכניס אותו לתיקייה?)`);
      }
    }

    console.log("✨ המערכת מוכנה! כל הנתונים בענן ומסווגים מושלם.");
    process.exit(); 
  } catch (err) {
    console.error("❌ שגיאה במהלך ההרצה:", err);
    process.exit(1);
  }
};

seedDB();