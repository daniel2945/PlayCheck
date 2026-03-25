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
  return match && match[1] ? match[1].trim() : "Not specified by developer";
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

    console.log(`[SEARCH DEBUG] Query: ${q}, Year: ${year}, Genre: ${genre}, Page: ${page}`);

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
    if (!id) return res.status(400).json({ success: false, data: "game not found" });
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

const getOrFetchGame = async (gameId) => {
  let game = await Game.findById(gameId);
  if (game) return game;

  const response = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
    params: { key: apiKey },
  });
  const gameData = response.data;
  const pcPlatform = gameData.platforms?.find(
    (p) => p.platform.name.toLowerCase() === "pc",
  );

  const pcRequirements =
    pcPlatform && pcPlatform.requirements
      ? pcPlatform.requirements
      : { minimum: null, recommended: null };

  const { cpuList, gpuList } = hardwareCache;

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

  minimum.cpuText =
    minimum.cpuText || extractHardwareText(pcRequirements.minimum, "CPU");
  minimum.gpuText =
    minimum.gpuText || extractHardwareText(pcRequirements.minimum, "GPU");
  recommended.cpuText =
    recommended.cpuText ||
    extractHardwareText(pcRequirements.recommended, "CPU");
  recommended.gpuText =
    recommended.gpuText ||
    extractHardwareText(pcRequirements.recommended, "GPU");

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
};

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
    const getComponentGrade = (userScore, minScore, recScore) => {
      if (userScore < minScore) return "weak";
      if (userScore >= recScore) return "optimal";
      return "okay";
    };

    const cpuGrade = getComponentGrade(
      cpuUser.benchmarkScore,
      minimum.cpuScore,
      recommended.cpuScore,
    );
    const gpuGrade = getComponentGrade(
      gpuUser.benchmarkScore,
      minimum.gpuScore,
      recommended.gpuScore,
    );
    const ramGrade = getComponentGrade(
      ramUser,
      minimum.ramGb,
      recommended.ramGb,
    );

    let overallGrade = "optimal";
    const grades = [cpuGrade, gpuGrade, ramGrade];
    if (grades.includes("weak")) overallGrade = "weak";
    else if (grades.includes("okay")) overallGrade = "okay";

    res.status(200).json({
      success: true,
      data: {
        gameTitle: game.title,
        overall: overallGrade,
        components: { cpu: cpuGrade, gpu: gpuGrade, ram: ramGrade },
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
    const getComponentGrade = (userScore, minScore, recScore) => {
      if (userScore < minScore) return "weak";
      if (userScore >= recScore) return "optimal";
      return "okay";
    };

    const cpuGrade = getComponentGrade(
      cpuUser.benchmarkScore,
      minimum.cpuScore,
      recommended.cpuScore,
    );
    const gpuGrade = getComponentGrade(
      gpuUser.benchmarkScore,
      minimum.gpuScore,
      recommended.gpuScore,
    );
    const ramGrade = getComponentGrade(
      ramUser,
      minimum.ramGb,
      recommended.ramGb,
    );

    let overallGrade = "optimal";
    const grades = [cpuGrade, gpuGrade, ramGrade];
    if (grades.includes("weak")) overallGrade = "weak";
    else if (grades.includes("okay")) overallGrade = "okay";

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
        components: { cpu: cpuGrade, gpu: gpuGrade, ram: ramGrade },
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
