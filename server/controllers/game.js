const axios = require("axios");
const apiKey = process.env.RAWG_API_KEY;
const Game = require("../models/Game");
const { parseGameRequirements } = require("../utils/hardwareParser");
const User = require("../models/User");
const Hardware = require("../models/Hardware");

// --- Hardware Cache ---
// יצירת אובייקט שיחזיק את רשימות החומרה בזיכרון
const hardwareCache = {
  cpuList: [],
  gpuList: [],
  isInitialized: false,
};

// פונקציה שתאכלס את המטמון מה-DB
const initializeHardwareCache = async () => {
  if (hardwareCache.isInitialized) return;

  try {
    console.log("Initializing hardware cache...");
    const [cpus, gpus] = await Promise.all([
      Hardware.find({ type: "CPU" }).lean(),
      Hardware.find({ type: "GPU" }).lean(),
    ]);
    hardwareCache.cpuList = cpus;
    hardwareCache.gpuList = gpus;
    hardwareCache.isInitialized = true;
    console.log(
      `✅ Hardware cache initialized successfully. (${cpus.length} CPUs, ${gpus.length} GPUs)`,
    );
  } catch (error) {
    console.error("❌ Failed to initialize hardware cache:", error);
    // במקרה של כישלון, ננסה שוב בעוד 10 שניות
    setTimeout(initializeHardwareCache, 10000);
  }
};
// --- End of Hardware Cache ---

// Utility to extract raw hardware strings from RAWG API requirement texts
const extractHardwareText = (text, type) => {
  if (!text || typeof text !== "string") return "Not specified by developer";

  console.log(`\n--- RAWG RAW TEXT (${type}) ---`, text, "\n");

  // 1. Strip HTML tags (replace with space to avoid merging words like "systemOS")
  let cleanText = text.replace(/<[^>]*>?/gm, " ");
  // 2. Normalize whitespace (remove newlines, tabs, and double spaces)
  cleanText = cleanText.replace(/\s+/g, " ").trim();

  const regex =
    type === "CPU"
      ? /(?:Processor \(CPU\)|Processor|CPU):\s*(.*?)(?=\s*(?:,|Graphics:|Memory:|OS:|$))/i
      : /(?:Graphics Card|Video Card|Graphics|Video|GPU):\s*(.*?)(?=\s*(?:,|DirectX:|Storage:|$))/i;
  const match = cleanText.match(regex);

  if (match && match[1]) {
    let result = match[1].trim();

    // ✨ התיקון האמיתי יושב כאן: אנחנו מסננים את הטקסט אחרי שהרג'קס שלף אותו ✨
    if (type === "GPU" && /^\d+(\.\d+)?\s*(mb|gb|vram)\s*$/i.test(result)) {
      return `Any GPU with ${result.toUpperCase()} VRAM`;
    }

    return result;
  }
};

// Helper to dynamically format RAM (GB vs MB)
const formatRam = (ramGb) => {
  if (ramGb === undefined || ramGb === null || ramGb === 0)
    return "Not specified by developer";
  const num = Number(ramGb);
  if (isNaN(num)) return `${ramGb}`;
  if (num < 1) return `${Math.round(num * 1024)} MB`;
  return `${num} GB`;
};

const searchGames = async (req, res, next) => {
  try {
    // ✨ הוספנו פה את genre לשליפה ✨
    const { q, year, page, sort, genre } = req.query;

    console.log(
      `[SEARCH DEBUG] Query: ${q}, Year: ${year}, Genre: ${genre}, Page: ${page}`,
    );

    const params = {
      key: apiKey, // ודא שהמשתנה הזה מוגדר אצלך בקובץ כמו קודם
      page: page || 1,
      page_size: 12,
    };

    // אם חיפשנו מילה - נותנים ל-RAWG לחפש התאמה מדויקת (בלי למיין)
    if (q && q.trim() !== "" && q !== "popular") {
      params.search = q;
    } else {
      // אם אין חיפוש (קטלוג רגיל) - נמיין לפי הכי פופולרי
      params.ordering = "-added";
    }

    // תמיכה במיון דינמי (כדי להציג תוצאות טובות יותר בחיפוש ב-Navbar)
    if (sort) {
      params.ordering = sort;
    }

    if (year) params.dates = `${year}-01-01,${year}-12-31`;

    // ✨ הוספנו את הסינון לפי ז'אנר ✨
    if (genre) params.genres = genre;

    const response = await axios.get("https://api.rawg.io/api/games", {
      params,
    });

    console.log(`[RAWG DEBUG] Has Next: ${!!response.data.next}`);

    const games = response.data.results.map((game) => ({
      _id: game.id, // קריטי עבור הלחיצה ב-Navbar
      rawgId: game.id,
      name: game.name,
      title: game.name, // קריטי לאחידות בתצוגה
      image: game.background_image,
      releasedDate: game.released,
      metacritic: game.metacritic,
    }));

    res.status(200).json({
      success: true,
      data: games,
      hasNextPage: !!response.data.next,
    });
  } catch (err) {
    console.error("[RAWG API ERROR]:", err.message);
    next(err);
  }
};

const searchGame = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id)
      return res.status(400).json({ success: false, data: "game not found" });
    const game = await getOrFetchGame(id);

    res.status(200).json({ success: true, data: game });
  } catch (err) {
    next(err);
  }
};

const createGame = async (req, res, next) => {
  try {
    const { _id, title, image, description, releasedDate, requirements } =
      req.body;
    const { cpuList, gpuList } = hardwareCache;
    const minimum = await parseGameRequirements(
      requirements.minimum,
      cpuList,
      gpuList,
      true,
      title,
      description,
    );
    const recommended = await parseGameRequirements(
      requirements.recommended,
      cpuList,
      gpuList,
      false,
      title,
      description,
    );
    recommended.cpuScore = Math.max(minimum.cpuScore, recommended.cpuScore);
    recommended.gpuScore = Math.max(minimum.gpuScore, recommended.gpuScore);
    recommended.ramGb = Math.max(minimum.ramGb, recommended.ramGb);

    minimum.cpuText =
      minimum.cpuText || extractHardwareText(requirements.minimum, "CPU");
    minimum.gpuText =
      minimum.gpuText || extractHardwareText(requirements.minimum, "GPU");
    recommended.cpuText =
      recommended.cpuText ||
      extractHardwareText(requirements.recommended, "CPU");
    recommended.gpuText =
      recommended.gpuText ||
      extractHardwareText(requirements.recommended, "GPU");

    const newGame = new Game({
      _id,
      title,
      image,
      description,
      releasedDate,
      requirements: {
        minimum: {
          cpuScore: minimum.cpuScore,
          gpuScore: minimum.gpuScore,
          ramGb: minimum.ramGb,
          cpuText: minimum.cpuText,
          gpuText: minimum.gpuText,
        },
        recommended: {
          cpuScore: recommended.cpuScore,
          gpuScore: recommended.gpuScore,
          ramGb: recommended.ramGb,
          cpuText: recommended.cpuText,
          gpuText: recommended.gpuText,
        },
      },
    });
    await newGame.save();
    res.status(201).json({ success: true, data: newGame });
  } catch (err) {
    next(err);
  }
};

const getSavedGames = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.q;
    const filter = searchQuery
      ? { title: { $regex: searchQuery, $options: "i" } }
      : {};

    const games = await Game.find(filter).skip(skip).limit(limit);
    const total = await Game.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: games.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: games,
    });
  } catch (err) {
    next(err);
  }
};

const getSavedGameById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const game = await Game.findById(id);

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found in local DB" });
    }

    res.status(200).json({ success: true, data: game });
  } catch (err) {
    next(err);
  }
};

const deleteGame = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedGame = await Game.findByIdAndDelete(id);

    if (!deletedGame) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found or already deleted" });
    }

    res
      .status(200)
      .json({ success: true, message: "Game deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const updateGame = async (req, res, next) => {
  try {
    const id = req.params.id;

    const updatedGame = await Game.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedGame) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found to update" });
    }

    res.status(200).json({ success: true, data: updatedGame });
  } catch (err) {
    next(err);
  }
};

// Temporary function to clear all cached games from MongoDB
const clearAllGames = async (req, res, next) => {
  try {
    await Game.deleteMany({});
    res
      .status(200)
      .json({ success: true, message: "All cached games cleared" });
  } catch (err) {
    next(err);
  }
};

// פילטר סופי שמתקן טקסטים של VRAM בלבד
const fixGpuVramText = (text) => {
  if (!text || text === "Not specified by developer") return text;
  
  // אם הטקסט הוא רק מספר עם GB/MB (למשל "1 GB")
  if (/^\d+(\.\d+)?\s*(mb|gb|vram)\s*$/i.test(text.trim())) {
    return `Any GPU with ${text.trim().toUpperCase()} VRAM`;
  }
  return text;
};

const getOrFetchGame = async (gameId) => {
  let game = await Game.findById(gameId);
  if (game) return game;

  const response = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
    params: { key: apiKey },
  });
  //console.log(gameData.JSON());
  const gameData = response.data;
  const pcPlatform = gameData.platforms?.find(
    (p) => p.platform.name.toLowerCase() === "pc",
  );

  const pcRequirements =
    pcPlatform && pcPlatform.requirements
      ? pcPlatform.requirements
      : { minimum: null, recommended: null };

  const { cpuList, gpuList } = hardwareCache;

  console.log("\n=============================================");
  console.log(`🎮 RAW REQUIREMENTS FOR GAME ID: ${gameId} (${gameData.name})`);
  console.log("MINIMUM:", pcRequirements.minimum);
  console.log("RECOMMENDED:", pcRequirements.recommended);
  console.log("=============================================\n");

  const minimum = await parseGameRequirements(
    pcRequirements.minimum,
    cpuList,
    gpuList,
    true,
    gameData.name,
    gameData.description,
  );
  const recommended = await parseGameRequirements(
    pcRequirements.recommended,
    cpuList,
    gpuList,
    false,
    gameData.name,
    gameData.description,
  );

  recommended.cpuScore = Math.max(minimum.cpuScore, recommended.cpuScore);
  recommended.gpuScore = Math.max(minimum.gpuScore, recommended.gpuScore);
  recommended.ramGb = Math.max(minimum.ramGb, recommended.ramGb);

  // מחזירים את ה- || כדי לא לדרוס את ה-AI, ומעבירים את ה-GPU דרך הפילטר הסופי
  minimum.cpuText =
    minimum.cpuText || extractHardwareText(pcRequirements.minimum, "CPU");
  minimum.gpuText = fixGpuVramText(
    minimum.gpuText || extractHardwareText(pcRequirements.minimum, "GPU"),
  );

  recommended.cpuText =
    recommended.cpuText ||
    extractHardwareText(pcRequirements.recommended, "CPU");
  recommended.gpuText = fixGpuVramText(
    recommended.gpuText ||
      extractHardwareText(pcRequirements.recommended, "GPU"),
  );

  game = new Game({
    _id: gameId,
    title: gameData.name,
    image: gameData.background_image,
    description: gameData.description,
    releasedDate: gameData.released,
    requirements: {
      minimum: {
        cpuScore: minimum.cpuScore,
        gpuScore: minimum.gpuScore,
        ramGb: minimum.ramGb,
        cpuText: minimum.cpuText,
        gpuText: minimum.gpuText,
      },
      recommended: {
        cpuScore: recommended.cpuScore,
        gpuScore: recommended.gpuScore,
        ramGb: recommended.ramGb,
        cpuText: recommended.cpuText,
        gpuText: recommended.gpuText,
      },
    },
  });

  await game.save();
  return game;
};;

const checkCompatibilityGuest = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const cpuId = req.body.myPc.cpuId;
    const gpuId = req.body.myPc.gpuId;
    const cpuUser = await Hardware.findById(cpuId);
    const gpuUser = await Hardware.findById(gpuId);
    const ramUser = req.body.myPc.ramGb;

    if (!cpuUser || !gpuUser || !ramUser) {
      return res.status(400).json({
        success: false,
        data: "Missing saved PC hardware data for this user.",
      });
    }

    let game;
    try {
      game = await getOrFetchGame(gameId);
    } catch (error) {
      console.error("Error fetching or parsing game:", error);
      return res.status(404).json({
        success: false,
        data: "Game not found and could not be fetched",
      });
    }

    const { minimum, recommended } = game.requirements;
    
    // הפונקציה המקורית - שומרת על תאימות לאחור
    const getComponentGrade = (userScore, minScore, recScore) => {
      if (userScore < minScore) return "weak";
      if (userScore >= recScore) return "optimal";
      return "okay";
    };

    // --- תוספת חדשה: חישוב מתמטי מדויק באחוזים ---
    const getDetailedPercents = (userScore, minScore, recScore) => {
      const safeMin = minScore || 1;
      const safeRec = (recScore && recScore > safeMin) ? recScore : safeMin * 1.5;

      let minPercent = Math.min(Math.round((userScore / safeMin) * 100), 100);
      let recPercent = Math.min(Math.round((userScore / safeRec) * 100), 100);

      let score = 0;
      if (userScore < safeMin) {
        score = Math.round((userScore / safeMin) * 49); // ציון 0-49
      } else if (userScore < safeRec) {
        const progress = userScore - safeMin;
        const range = safeRec - safeMin;
        score = 50 + Math.round((progress / range) * 49); // ציון 50-99
      } else {
        score = 100; // ציון מושלם
      }

      return { minPercent, recPercent, score };
    };
    // ----------------------------------------------

    const cpuGrade = getComponentGrade(cpuUser.benchmarkScore, minimum.cpuScore, recommended.cpuScore);
    const gpuGrade = getComponentGrade(gpuUser.benchmarkScore, minimum.gpuScore, recommended.gpuScore);
    const ramGrade = getComponentGrade(ramUser, minimum.ramGb, recommended.ramGb);

    // הפעלת החישוב החדש
    const cpuDetails = getDetailedPercents(cpuUser.benchmarkScore, minimum.cpuScore, recommended.cpuScore);
    const gpuDetails = getDetailedPercents(gpuUser.benchmarkScore, minimum.gpuScore, recommended.gpuScore);
    const ramDetails = getDetailedPercents(ramUser, minimum.ramGb, recommended.ramGb);

    let overallGrade = "optimal";
    const grades = [cpuGrade, gpuGrade, ramGrade];
    if (grades.includes("weak")) overallGrade = "weak";
    else if (grades.includes("okay")) overallGrade = "okay";

    // הציון הכללי של המחשב הוא לפי צוואר הבקבוק (הרכיב הכי חלש)
    const overallScore = Math.min(cpuDetails.score, gpuDetails.score, ramDetails.score);

    res.status(200).json({
      success: true,
      data: {
        gameTitle: game.title,
        overall: overallGrade,
        overallScore: overallScore, // התווסף
        components: { cpu: cpuGrade, gpu: gpuGrade, ram: ramGrade },
        componentScores: { cpu: cpuDetails, gpu: gpuDetails, ram: ramDetails }, // התווסף
        specsDetails: {
          cpu: {
            user: `${cpuUser.brand} ${cpuUser.model}`,
            min: minimum.cpuText || "Not specified by developer",
            rec: recommended.cpuText || "Not specified by developer",
          },
          gpu: {
            user: `${gpuUser.brand} ${gpuUser.model}`,
            min: minimum.gpuText || "Not specified by developer",
            rec: recommended.gpuText || "Not specified by developer",
          },
          ram: {
            user: formatRam(ramUser),
            min: formatRam(minimum.ramGb),
            rec: formatRam(recommended.ramGb),
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const checkCompatibilityUser = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const currentUser = await User.findById(req.user.id);
    console.log("DEBUG - User found:", JSON.stringify(currentUser, null, 2));

    if (!currentUser || !currentUser.myPc) {
      return res.status(400).json({
        success: false,
        data: "Missing saved PC hardware data for this user.",
      });
    }
    const cpuId = currentUser.myPc.cpuId;
    const gpuId = currentUser.myPc.gpuId;
    const cpuUser = await Hardware.findById(cpuId);
    const gpuUser = await Hardware.findById(gpuId);
    const ramUser = currentUser.myPc.ramGb;

    if (!cpuUser || !gpuUser || !ramUser) {
      return res
        .status(400)
        .json({ success: false, data: "Hardware details not found" });
    }

    let game;
    try {
      game = await getOrFetchGame(gameId);
    } catch (error) {
      console.error("Error fetching or parsing game:", error);
      return res.status(404).json({
        success: false,
        data: "Game not found and could not be fetched",
      });
    }

    const { minimum, recommended } = game.requirements;
    
    // הפונקציה המקורית
    const getComponentGrade = (userScore, minScore, recScore) => {
      if (userScore < minScore) return "weak";
      if (userScore >= recScore) return "optimal";
      return "okay";
    };

    // --- תוספת חדשה: חישוב מתמטי מדויק באחוזים ---
    const getDetailedPercents = (userScore, minScore, recScore) => {
      const safeMin = minScore || 1;
      const safeRec = (recScore && recScore > safeMin) ? recScore : safeMin * 1.5;

      let minPercent = Math.min(Math.round((userScore / safeMin) * 100), 100);
      let recPercent = Math.min(Math.round((userScore / safeRec) * 100), 100);

      let score = 0;
      if (userScore < safeMin) {
        score = Math.round((userScore / safeMin) * 49); 
      } else if (userScore < safeRec) {
        const progress = userScore - safeMin;
        const range = safeRec - safeMin;
        score = 50 + Math.round((progress / range) * 49); 
      } else {
        score = 100; 
      }

      return { minPercent, recPercent, score };
    };
    // ----------------------------------------------

    const cpuGrade = getComponentGrade(cpuUser.benchmarkScore, minimum.cpuScore, recommended.cpuScore);
    const gpuGrade = getComponentGrade(gpuUser.benchmarkScore, minimum.gpuScore, recommended.gpuScore);
    const ramGrade = getComponentGrade(ramUser, minimum.ramGb, recommended.ramGb);

    // הפעלת החישוב החדש
    const cpuDetails = getDetailedPercents(cpuUser.benchmarkScore, minimum.cpuScore, recommended.cpuScore);
    const gpuDetails = getDetailedPercents(gpuUser.benchmarkScore, minimum.gpuScore, recommended.gpuScore);
    const ramDetails = getDetailedPercents(ramUser, minimum.ramGb, recommended.ramGb);

    let overallGrade = "optimal";
    const grades = [cpuGrade, gpuGrade, ramGrade];
    if (grades.includes("weak")) overallGrade = "weak";
    else if (grades.includes("okay")) overallGrade = "okay";

    // הציון הכללי של המחשב הוא לפי צוואר הבקבוק (הרכיב הכי חלש)
    const overallScore = Math.min(cpuDetails.score, gpuDetails.score, ramDetails.score);

    currentUser.searchHistory = currentUser.searchHistory.filter(
      (item) => item.gameId.toString() !== gameId.toString(),
    );

    currentUser.searchHistory.unshift({
      gameId: game._id,
      searchedAt: Date.now(),
    });

    if (currentUser.searchHistory.length > 10) {
      currentUser.searchHistory = currentUser.searchHistory.slice(0, 10);
    }

    await currentUser.save();

    res.status(200).json({
      success: true,
      data: {
        gameTitle: game.title,
        overall: overallGrade,
        overallScore: overallScore, // התווסף
        components: { cpu: cpuGrade, gpu: gpuGrade, ram: ramGrade },
        componentScores: { cpu: cpuDetails, gpu: gpuDetails, ram: ramDetails }, // התווסף
        specsDetails: {
          cpu: {
            user: `${cpuUser.brand} ${cpuUser.model}`,
            min: minimum.cpuText || "Not specified by developer",
            rec: recommended.cpuText || "Not specified by developer",
          },
          gpu: {
            user: `${gpuUser.brand} ${gpuUser.model}`,
            min: minimum.gpuText || "Not specified by developer",
            rec: recommended.gpuText || "Not specified by developer",
          },
          ram: {
            user: formatRam(ramUser),
            min: formatRam(minimum.ramGb),
            rec: formatRam(recommended.ramGb),
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchGames,
  searchGame,
  createGame,
  getSavedGames,
  getSavedGameById,
  deleteGame,
  updateGame,
  checkCompatibilityGuest,
  checkCompatibilityUser,
  clearAllGames,
  initializeHardwareCache,
};
