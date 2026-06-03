const mongoose = require("mongoose");
const Hardware = require("../models/Hardware");
require("dotenv").config();

const appleHardware = [
  // M1 Family
  { type: "CPU", brand: "Apple", model: "Apple M1", benchmarkScore: 14200, integratedGpuScore: 7800 },
  { type: "CPU", brand: "Apple", model: "Apple M1 Pro (14-core GPU)", benchmarkScore: 18100, integratedGpuScore: 11500 },
  { type: "CPU", brand: "Apple", model: "Apple M1 Pro (16-core GPU)", benchmarkScore: 18100, integratedGpuScore: 13200 },
  { type: "CPU", brand: "Apple", model: "Apple M1 Max (24-core GPU)", benchmarkScore: 22500, integratedGpuScore: 17500 },
  { type: "CPU", brand: "Apple", model: "Apple M1 Max (32-core GPU)", benchmarkScore: 22500, integratedGpuScore: 20500 },
  { type: "CPU", brand: "Apple", model: "Apple M1 Ultra", benchmarkScore: 41000, integratedGpuScore: 35000 },

  // M2 Family
  { type: "CPU", brand: "Apple", model: "Apple M2", benchmarkScore: 15500, integratedGpuScore: 9800 },
  { type: "CPU", brand: "Apple", model: "Apple M2 Pro (16-core GPU)", benchmarkScore: 19500, integratedGpuScore: 14500 },
  { type: "CPU", brand: "Apple", model: "Apple M2 Pro (19-core GPU)", benchmarkScore: 19500, integratedGpuScore: 16800 },
  { type: "CPU", brand: "Apple", model: "Apple M2 Max (30-core GPU)", benchmarkScore: 24500, integratedGpuScore: 21500 },
  { type: "CPU", brand: "Apple", model: "Apple M2 Max (38-core GPU)", benchmarkScore: 24500, integratedGpuScore: 26000 },
  { type: "CPU", brand: "Apple", model: "Apple M2 Ultra", benchmarkScore: 48000, integratedGpuScore: 42000 },

  // M3 Family
  { type: "CPU", brand: "Apple", model: "Apple M3", benchmarkScore: 17500, integratedGpuScore: 12500 },
  { type: "CPU", brand: "Apple", model: "Apple M3 Pro (14-core GPU)", benchmarkScore: 21500, integratedGpuScore: 16500 },
  { type: "CPU", brand: "Apple", model: "Apple M3 Pro (18-core GPU)", benchmarkScore: 21500, integratedGpuScore: 19500 },
  { type: "CPU", brand: "Apple", model: "Apple M3 Max (30-core GPU)", benchmarkScore: 31000, integratedGpuScore: 27500 },
  { type: "CPU", brand: "Apple", model: "Apple M3 Max (40-core GPU)", benchmarkScore: 32500, integratedGpuScore: 34000 },

  // M4 Family
  { type: "CPU", brand: "Apple", model: "Apple M4", benchmarkScore: 21000, integratedGpuScore: 15500 },
  { type: "CPU", brand: "Apple", model: "Apple M4 Pro", benchmarkScore: 28000, integratedGpuScore: 24000 },
  { type: "CPU", brand: "Apple", model: "Apple M4 Max", benchmarkScore: 38000, integratedGpuScore: 41000 },

  // Also keep some "Virtual GPU" entries for backward compatibility if needed, 
  // but they are now secondary to the integratedGpuScore on the CPU.
  { type: "GPU", brand: "Apple", model: "Apple M1 Virtual GPU", benchmarkScore: 7800 },
  { type: "GPU", brand: "Apple", model: "Apple M1 Pro Virtual GPU", benchmarkScore: 12500 },
  { type: "GPU", brand: "Apple", model: "Apple M1 Max Virtual GPU", benchmarkScore: 19000 },
  { type: "GPU", brand: "Apple", model: "Apple M1 Ultra Virtual GPU", benchmarkScore: 35000 },
  { type: "GPU", brand: "Apple", model: "Apple M2 Virtual GPU", benchmarkScore: 9800 },
  { type: "GPU", brand: "Apple", model: "Apple M2 Pro Virtual GPU", benchmarkScore: 15500 },
  { type: "GPU", brand: "Apple", model: "Apple M2 Max Virtual GPU", benchmarkScore: 23500 },
  { type: "GPU", brand: "Apple", model: "Apple M2 Ultra Virtual GPU", benchmarkScore: 42000 },
  { type: "GPU", brand: "Apple", model: "Apple M3 Virtual GPU", benchmarkScore: 12500 },
  { type: "GPU", brand: "Apple", model: "Apple M3 Pro Virtual GPU", benchmarkScore: 18000 },
  { type: "GPU", brand: "Apple", model: "Apple M3 Max Virtual GPU", benchmarkScore: 31000 },
  { type: "GPU", brand: "Apple", model: "Apple M4 Virtual GPU", benchmarkScore: 15500 },
];

async function seedAppleHardware() {
  try {
    const dbURI = process.env.MONGO_URI;
    if (!dbURI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(dbURI);
    console.log("🚀 Connected to MongoDB...");

    // Clear existing Apple hardware to avoid duplicates/overlaps
    console.log("🧹 Cleaning up existing Apple hardware...");
    await Hardware.deleteMany({ brand: "Apple" });
    console.log("✅ Cleanup complete.");

    for (const item of appleHardware) {
      await Hardware.findOneAndUpdate(
        { model: item.model, type: item.type },
        item,
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded/Updated: ${item.brand} ${item.model}`);
    }

    console.log("✨ Apple Silicon hardware seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedAppleHardware();
