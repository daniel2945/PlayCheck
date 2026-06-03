const Hardware = require("../models/Hardware");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiWeakerModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

// ==========================================
// Global Cache & Helpers for Deep Scan Sync
// ==========================================
const syncCache = new Map();

const findBestHardwareMatch = async (rawString, type) => {
  if (!rawString) return null;
  let cleanStr = rawString.toLowerCase();

  const noiseWords = [
    "direct3d11",
    "d3d11",
    "d3d12",
    "direct3d",
    "vs_11_0",
    "vs_5_0",
    "ps_5_0",
    "opengl",
    "webgl",
    "graphics",
    "video",
    "adapter",
    "cpu",
    "apu",
    "ghz",
    "@",
    "processor",
  ];
  noiseWords.forEach((word) => {
    // Use word boundaries for alphanumeric noise words to prevent accidental truncation
    const regex = /^[a-z0-9]+$/i.test(word)
      ? new RegExp(`\\b${word}\\b`, "gi")
      : new RegExp(word, "gi");
    cleanStr = cleanStr.replace(regex, " ");
  });

  // Explicitly remove "Xth Gen" markers (e.g., "13th Gen", "12th gen")
  cleanStr = cleanStr.replace(/\b\d{1,2}th gen\b/gi, " ");

  cleanStr = cleanStr.replace(/\(r\)/gi, "").replace(/\(tm\)/gi, "");
  cleanStr = cleanStr
    .replace(/,/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const allHardware = await Hardware.find({ type }).lean();

  let bestMatch = null;
  let highestScore = 0;

  // 1. Identify Major Brands in the raw string to enforce Strict Matching
  const majorBrands = ["intel", "amd", "nvidia", "apple", "arm", "qualcomm"];
  const brandsInString = majorBrands.filter((b) => cleanStr.includes(b));

  for (const item of allHardware) {
    const dbBrandClean = item.brand
      .toLowerCase()
      .replace(/\(r\)/gi, "")
      .replace(/\(tm\)/gi, "")
      .trim();
    const dbModelClean = item.model
      .toLowerCase()
      .replace(/\(r\)/gi, "")
      .replace(/\(tm\)/gi, "")
      .replace(/[-_]/g, " ")
      .trim();

    // --- STRICT BRAND MATCHING ---
    // If the script string explicitly contains a known major brand (e.g. 'intel'),
    // we instantly skip any DB items that do not match that brand (preventing 'arm' matches).
    if (brandsInString.length > 0) {
      const isBrandMatch = brandsInString.some((b) => dbBrandClean.includes(b));
      if (!isBrandMatch) {
        continue;
      }
    }

    let score = 0;
    let fullName = dbModelClean.startsWith(dbBrandClean)
      ? dbModelClean
      : `${dbBrandClean} ${dbModelClean}`;
    fullName = fullName.replace(/\s+/g, " ");

    // --- EXACT & SUBSTRING WEIGHT ---
    if (cleanStr.includes(fullName) || cleanStr.includes(dbModelClean)) {
      score += 100;
    }

    // --- TOKEN WEIGHTING (Prioritize Model Numbers) ---
    const modelTokens = dbModelClean.split(/\s+/).filter(Boolean);
    const stringTokens = cleanStr.split(/\s+/).filter(Boolean);

    for (const token of modelTokens) {
      if (stringTokens.includes(token)) {
        // Massive weight for alphanumeric identifiers (e.g. "13700k", "5600x", "4060")
        if (/\d/.test(token)) {
          score += 50;
        } else {
          // Minor weight for generic terms ("core", "ryzen", "processor")
          score += 10;
        }
      }
    }

    // --- ULTRA-FUZZY CORE IDENTIFIER MATCH ---
    if (type === "CPU") {
      const cleanStrNoSpaces = cleanStr.replace(/\s+/g, "");
      const numericTokens = modelTokens.filter((t) => /\d/.test(t));
      if (numericTokens.length > 0) {
        const coreIdentifier = numericTokens.sort(
          (a, b) => b.length - a.length,
        )[0];

        if (
          coreIdentifier.length >= 3 &&
          cleanStrNoSpaces.includes(coreIdentifier)
        ) {
          score += 60; // Extra boost for perfectly isolating the core numeric identifier
        }
      }
    }

    // --- REGISTER BEST MATCH & CLEANUP ---
    // Minimum threshold of 40 ensures at least one significant alphanumeric token was matched
    if (score > highestScore && score >= 40) {
      highestScore = score;

      // Cleanup: Ensure the model name doesn't double-up on the brand name
      let cleanModelReturn = item.model;
      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const brandPrefixRegex = new RegExp(
        `^${escapeRegExp(item.brand)}\\s+`,
        "i",
      );

      if (brandPrefixRegex.test(cleanModelReturn)) {
        cleanModelReturn = cleanModelReturn.replace(brandPrefixRegex, "");
      }

      bestMatch = { ...item, model: cleanModelReturn };
    }
  }

  return bestMatch;
};

const autoDetectHardware = async (req, res, next) => {
  try {
    const { rawGpuString, reportedRam } = req.body;

    if (!rawGpuString) {
      return res.status(200).json({
        success: true,
        data: { gpu: null, ram: reportedRam },
      });
    }

    console.log("\n--- 🔍 AUTO-DETECT DEBUG LOGS ---");
    console.log("1. Original rawGpuString:", rawGpuString);

    // 1. Gentle Sanitization Pipeline
    let cleanStr = rawGpuString.toLowerCase();

    // Extract inner string if wrapped in ANGLE(...)
    const angleMatch = cleanStr.match(/angle\s*\((.*)\)/);
    if (angleMatch) cleanStr = angleMatch[1];

    const noiseWords = [
      "direct3d11",
      "d3d11",
      "d3d12",
      "direct3d",
      "vs_11_0",
      "vs_5_0",
      "ps_5_0",
      "opengl",
      "webgl",
    ];

    noiseWords.forEach((word) => {
      cleanStr = cleanStr.replace(new RegExp(word, "gi"), " ");
    });

    // Clean up trademarks (r)/(tm) and extra spaces for better substring matching
    cleanStr = cleanStr.replace(/\(r\)/gi, "").replace(/\(tm\)/gi, "");
    cleanStr = cleanStr.replace(/,/g, " ").replace(/\s+/g, " ").trim();

    console.log("2. Cleaned string before DB search:", cleanStr);

    // 2. Smart Database Search
    const allGpus = await Hardware.find({ type: "GPU" }).lean();

    // Sort by length descending to match longer names (e.g., "RTX 4060 Ti" before "RTX 4060")
    allGpus.sort((a, b) => b.model.length - a.model.length);

    let matchedGpu = null;

    for (const dbGpu of allGpus) {
      const dbBrandClean = dbGpu.brand
        .toLowerCase()
        .replace(/\(r\)/gi, "")
        .replace(/\(tm\)/gi, "")
        .trim();
      const dbModelClean = dbGpu.model
        .toLowerCase()
        .replace(/\(r\)/gi, "")
        .replace(/\(tm\)/gi, "")
        .trim();

      let fullName = dbModelClean.startsWith(dbBrandClean)
        ? dbModelClean
        : `${dbBrandClean} ${dbModelClean}`;
      fullName = fullName.replace(/\s+/g, " ");

      // Check if the cleaned browser string contains the full DB name OR the DB model
      if (cleanStr.includes(fullName) || cleanStr.includes(dbModelClean)) {
        matchedGpu = dbGpu;
        console.log(`3. ✅ Match Found: ${dbGpu.brand} ${dbGpu.model}`);
        break;
      }
    }

    if (!matchedGpu) {
      console.log("3. ❌ No DB Match Found");
    }
    console.log("---------------------------------\n");

    // 3. Best Effort Return
    return res.status(200).json({
      success: true,
      data: { gpu: matchedGpu, ram: reportedRam },
    });
  } catch (error) {
    console.error("Auto-Detect Error in Controller:", error);
    next(error);
  }
};

const syncSubmit = async (req, res, next) => {
  try {
    const { syncToken, cpu, gpu, ram } = req.body;
    if (!syncToken)
      return res
        .status(400)
        .json({ success: false, message: "No token provided" });

    const matchedCpu = await findBestHardwareMatch(cpu, "CPU");
    const matchedGpu = await findBestHardwareMatch(gpu, "GPU");

    syncCache.set(syncToken, {
      cpu: matchedCpu,
      gpu: matchedGpu,
      ram: Number(ram) || 8,
    });

    // Prevent memory leaks: Delete token after 5 minutes
    setTimeout(() => syncCache.delete(syncToken), 5 * 60 * 1000);

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const syncStatus = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (syncCache.has(token)) {
      const data = syncCache.get(token);
      syncCache.delete(token); // Clear immediately to prevent duplicate reads
      return res.status(200).json({ success: true, status: "completed", data });
    }
    return res.status(200).json({ success: true, status: "pending" });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// פונקציות פתוחות לכולם (Public)
// ==========================================

const searchHardware = async (req, res, next) => {
  try {
    const { q, type, brand } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const query = {
      type: type.toUpperCase(),
      $or: [
        { model: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
      ],
    };

    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }

    const results = await Hardware.find(query)
      .sort({ benchmarkScore: -1 })
      .limit(10)
      .select("_id model brand benchmarkScore integratedGpuScore type");
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
  try {
    const results = await Hardware.find();
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const getUpgradeRecommendations = async (req, res, next) => {
  try {
    const { type } = req.params; // "CPU" or "GPU"
    const { userScore, recommendedScore, currentSpecs } = req.query;

    if (!type || !userScore || !recommendedScore) {
      return res.status(400).json({
        success: false,
        message: "Missing hardware type, user score, or recommended score",
      });
    }

    const currentScore = Number(userScore);
    const recScore = Number(recommendedScore);
    let targetScoreThreshold = 0;

    // 1. לוגיקת בחירת הציון לשדרוג
    if (currentScore < recScore) {
      const safetyMargin = 1.05;
      targetScoreThreshold = recScore * safetyMargin;
    } else {
      targetScoreThreshold = currentScore * 1.1;
    }

    // 2. שליפת הרכיבים הרלוונטיים מה-DB
    // 2. שליפת יותר רכיבים מה-DB כדי לתת ל-AI מבחר לברור מתוכו
    const upgrades = await Hardware.find({
      type: type.toUpperCase(),
      benchmarkScore: { $gte: targetScoreThreshold },
    })
      .sort({ benchmarkScore: 1 })
      .limit(10); // שונה מ-3 ל-10 כדי שיהיה ל-AI מגוון לבדוק

    // ממירים מודלים של מונגוס לאובייקטים רגילים
    let finalUpgrades = upgrades.map((u) => u.toObject());

    // 3. אינטגרציה עם Gemini AI לבדיקת תאימות
    if (currentSpecs && finalUpgrades.length > 0) {
      try {
        const prompt = `
        You are a strictly realistic PC hardware expert.
        The user's current PC specifications are: ${currentSpecs}
        We need to upgrade the ${type}.
        Here are ${finalUpgrades.length} possible upgrade options from our database:
        ${finalUpgrades.map((u, i) => `${i + 1}. ${u.brand} ${u.model}`).join("\n")}

        CRITICAL REAL-WORLD RULES:
        1. LAPTOPS CANNOT BE UPGRADED: If the user's current PC is a laptop (indicated by mobile CPUs ending in 'H', 'U', 'P', 'HX', or GPUs labeled 'Laptop'/'Mobile'), changing the CPU or GPU is physically IMPOSSIBLE. Compatibility MUST be 0%.
        2. DESKTOPS (DEDUCE FROM CURRENT SPECS): DO NOT ask for missing motherboard info. Deduce compatibility based on the fact that the PC successfully runs the current hardware.
           - If upgrading CPU: Does the new CPU fit the EXACT SAME socket as the CURRENT CPU? If yes, high compatibility. If no, 0% compatibility.
           - If upgrading GPU: Assume a standard PCIe slot exists. Base your compatibility score ONLY on logical pairings (will the current CPU bottleneck the new GPU?).
        
        Analyze the compatibility of EACH option.
        YOU MUST RETURN ONLY A RAW JSON ARRAY. NO CONVERSATIONAL TEXT. NO "I need more info".
        Example format:
        [
          { "index": 1, "compatibility_percentage": 90, "reason": "short explanation in English" }
        ]`;

        console.log("Calling Gemini for compatibility check...");
        const result = await aiWeakerModel.generateContent(prompt);
        const rawResponse = result.response.text();

        // ✨ חילוץ חכם: מחפשים רק את המערך (מ-[ ועד ]) ומתעלמים מכל טקסט חופשי שה-AI הוסיף
        const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);

        if (!jsonMatch) {
          throw new Error("AI response did not contain a valid JSON array.");
        }

        const parsedAIResults = JSON.parse(jsonMatch[0]);
        console.log("Gemini Results:", parsedAIResults);

        // 4. מיזוג התוצאות
        finalUpgrades = finalUpgrades.map((upg, i) => {
          const aiMatch = parsedAIResults.find((item) => item.index === i + 1);
          return {
            ...upg,
            compatibility_percentage: aiMatch
              ? aiMatch.compatibility_percentage
              : null,
            compatibility_reason: aiMatch ? aiMatch.reason : null,
          };
        });

        // ✨ התיקון הקריטי: ממיינים לפי האחוז הכי גבוה, ורק אז חותכים ל-3 התוצאות הטובות ביותר!
        finalUpgrades.sort(
          (a, b) =>
            (b.compatibility_percentage || 0) -
            (a.compatibility_percentage || 0),
        );
        finalUpgrades = finalUpgrades.slice(0, 3);
      } catch (aiError) {
        console.error("Gemini Compatibility Check Failed:", aiError.message);
        // במקום 0%, נחזיר null כדי שהבר לא ירונדר, ונשים הודעה ידידותית למשתמש
        finalUpgrades = finalUpgrades.map((upg) => ({
          ...upg,
          compatibility_percentage: null,
          compatibility_reason:
            "⚠️ AI compatibility analysis is temporarily unavailable due to high server demand. Please check hardware compatibility manually.",
        }));
        finalUpgrades = finalUpgrades.slice(0, 3);
      }
    } else {
      // אם אין AI (למשל לא נשלח currentSpecs), עדיין נחזיר רק 3
      finalUpgrades = finalUpgrades.slice(0, 3);
    }

    res.status(200).json({ success: true, data: finalUpgrades });
  } catch (error) {
    console.error("Error fetching hardware upgrades:", error);
    next(error);
  }
};

module.exports = {
  searchHardware,
  createHardware,
  updateHardware,
  deleteHardware,
  getAllHardwares,
  autoDetectHardware,
  syncSubmit,
  syncStatus,
  getUpgradeRecommendations,
};
