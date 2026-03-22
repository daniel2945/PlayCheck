const axios = require("axios");
const apiKey = process.env.RAWG_API_KEY;
const Game = require("../models/Game");
const { parseGameRequirements } = require("../utils/hardwareParser");
const User = require("../models/User");
const Hardware = require("../models/Hardware");

const searchGames = async (req, res, next) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) {
      return res.status(400).json({ message: "there is no query" });
    }
    const response = await axios.get("https://api.rawg.io/api/games", {
      params: {
        key: apiKey,
        search: searchQuery,
        page_size: 10,
      },
    });
    const games = response.data.results.map((game) => ({
      rawgId: game.id,
      name: game.name,
      image: game.background_image,
      releaseDate: game.released,
    }));
    res.status(200).json({ success: true, data: games });
  } catch (err) {
    next(err);
  }
};

const searchGame = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, data: "game not found" });
    }

    const existingGame = await Game.findById(id);
    if (existingGame) {
      return res.status(200).json({ success: true, data: existingGame, fromLocal: true });
    }

    const response = await axios.get(`https://api.rawg.io/api/games/${id}`, {
      params: {
        key: apiKey,
      },
    });
    const gameData = response.data;
    const pcPlatform = gameData.platforms.find(
      (p) => p.platform.name.toLowerCase() === "pc",
    );

    const pcRequirements =
      pcPlatform && pcPlatform.requirements
        ? pcPlatform.requirements
        : { minimum: null, recommended: null };

    const game = {
      _id: id,
      title: gameData.name,
      image: gameData.background_image,
      description: gameData.description,
      requirements: {
        minimum: pcRequirements.minimum,
        recommended: pcRequirements.recommended,
      },
    };
    res.status(200).json({ success: true, data: game, fromLocal: false });
  } catch (err) {
    next(err);
  }
};

const createGame = async (req, res, next) => {
  try {
    const { _id, title, image, description, requirements } = req.body;
    const cpuList = await Hardware.find({ type: "CPU" });
    const gpuList = await Hardware.find({ type: "GPU" });
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

    const newGame = new Game({
      _id,
      title,
      image,
      description,
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

    const game = await Game.findById(gameId);
    if (!game)
      return res
        .status(404)
        .json({ success: false, data: "Game not found in database" });

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
    console.log("DEBUG - User found:", JSON.stringify(currentUser, null, 2)); // זה ידפיס לנו בדיוק מה חוזר מה-DB

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

    const game = await Game.findById(gameId);
    if (!game)
      return res
        .status(404)
        .json({ success: false, data: "Game not found in database" });

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
};
