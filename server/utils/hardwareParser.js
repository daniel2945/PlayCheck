const axios = require("axios");
const Hardware = require("../models/Hardware");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const Game = require("../models/Game");
const aiWeakerModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const checkMatch = (dbName, apiText) => {
  const lowerDb = dbName.toLowerCase();
  const lowerApi = apiText.toLowerCase();
  const [shorter, longer] =
    lowerDb.length > lowerApi.length
      ? [lowerApi, lowerDb]
      : [lowerDb, lowerApi];
  const tokens = shorter.split(/[\s,\.\-]+/).filter((t) => t.length > 0);
  const cleanLonger = longer.replace(/[\s,\.\-]+/g, " ");
  return tokens.every((token) => cleanLonger.includes(token));
};

const findHardwareScore = (
  hardwareList,
  apiText,
  defaultScore = 5000,
  isMinimum = false,
) => {
  if (!apiText) {
    return defaultScore;
  }
  const sortedHardware = [...hardwareList].sort((a, b) => {
    return b.model.length - a.model.length;
  });
  const scoresFound = [];

  for (const item of sortedHardware) {
    if (item.benchmarkScore > 0 && checkMatch(item.model, apiText)) {
      console.log(
        `Match found: ${item.model} for text: "${apiText.substring(0, 30)}..."`,
      );
      scoresFound.push(item.benchmarkScore);
    }
  }
  if (scoresFound.length > 0) {
    return isMinimum ? Math.min(...scoresFound) : Math.max(...scoresFound);
  }

  return defaultScore;
};

const getScoreFromAi = async (hardwareText, type) => {
  try {
    const prompt = `You are a PC hardware expert. Estimate the PassMark benchmark score for this ${type} requirement for a video game: "${hardwareText}". Return ONLY a single integer number, nothing else.`;
    const result = await aiWeakerModel.generateContent(prompt);
    const score = parseInt(result.response.text().trim(), 10);
    if (isNaN(score)) {
      return type === "CPU" ? 4000 : 3000;
    }
    console.log(`AI scored ${type} "${hardwareText}": ${score}`);
    return score;
  } catch (error) {
    console.error("AI Fallback failed:", error.message);
    return type === "CPU" ? 4000 : 3000;
  }
};

const getMissingHardwareFromAi = async (
  gameTitle,
  isMinimum,
  description = "",
) => {
  const reqLevel = isMinimum ? "Minimum" : "Recommended";
  try {
    const cleanDescription = description
      .replace(/<[^>]*>/g, "")
      .substring(0, 300);
    prompt = `
      Task: Estimate PC hardware requirements for a video game.
      Game Title: "${gameTitle}"
      Game Description: "${cleanDescription}"
      Level: ${reqLevel}

      Rules:
      1. Scale: Check if the game is a Web game, Indie, or AAA. If it's a Web/Indie game, keep requirements very low.
      2. Comparison: Recommended hardware must be logically more powerful than Minimum hardware, following standard PC gaming evolution (e.g., a later generation CPU/GPU or more RAM). Do not invent unrealistic gaps for simple games.
      3. Format: Return ONLY a valid JSON object.
      
      Expected JSON:
      {"cpu": "Specific Model Name", "gpu": "Specific Model Name", "ramGb": number}
    `;

    const result = await aiWeakerModel.generateContent(prompt);
    const cleanJson = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const parsedData = JSON.parse(cleanJson);
    console.log(`AI Batch Data for ${gameTitle} (${reqLevel}):`, parsedData);
    return parsedData;
  } catch (error) {
    console.error("AI Batch Fallback failed:", error.message);
    return { cpu: "Unknown CPU", gpu: "Unknown GPU", ramGb: 8 };
  }
};

const parseGameRequirements = async (
  rawgText,
  cpuList,
  gpuList,
  isMinimum = false,
  gameTitle,
  description = ""
) => {
  let cpuText = "";
  let gpuText = "";
  let ramGb = null;

  if (rawgText && rawgText !== "") {
    const cpuMatch = rawgText.match(/(?:Processor|CPU)\s*:?\s*([^\n]+)/i);
    const gpuMatch = rawgText.match(
      /(?:Graphics|Video Card|GPU)\s*:?\s*([^\n]+)/i,
    );
    const ramMatch = rawgText.match(/(?:Memory|RAM).*?(\d+)\s*GB/i);
    cpuText = cpuMatch ? cpuMatch[1].trim() : "";
    gpuText = gpuMatch ? gpuMatch[1].trim() : "";

    if (ramMatch) ramGb = Number(ramMatch[1]);
  }
  const garbageTerms = [
    "operating system",
    "64-bit",
    "32-bit",
    "required",
    "compatible",
    "integrated",
    "better",
    "anything",
  ];
  const hardwareBrands = [
    "intel",
    "amd",
    "nvidia",
    "geforce",
    "radeon",
    "core",
    "pentium",
    "ryzen",
    "athlon",
    "gtx",
    "rtx",
    "i3",
    "i5",
    "i7",
    "i9",
  ];

  const isGarbage = (text) => {
    if (!text) return true;
    const lower = text.toLowerCase();
    if (lower.length > 100 || lower.length < 3) return true;
    const hasGarbage = garbageTerms.some((term) => lower.includes(term));
    const hasBrand = hardwareBrands.some((brand) => lower.includes(brand));

    return hasGarbage && !hasBrand;
  };

  if (isGarbage(cpuText)) {
    console.log(`Cleaning CPU garbage: "${cpuText}"`);
    cpuText = "";
  }
  if (isGarbage(gpuText)) {
    console.log(`Cleaning GPU garbage: "${gpuText}"`);
    gpuText = "";
  }

  if (!cpuText || !gpuText || ramGb === null) {
    const aiData = await getMissingHardwareFromAi(gameTitle, isMinimum, description);
    if (!cpuText || cpuText === "") cpuText = aiData.cpu;
    if (!gpuText || gpuText === "") gpuText = aiData.gpu;
    if (ramGb === null) ramGb = aiData.ramGb;
  }

  let cpuScore = findHardwareScore(cpuList, cpuText, 4000, isMinimum);
  let gpuScore = findHardwareScore(gpuList, gpuText, 3000, isMinimum);

  if (cpuScore === 4000) {
    cpuScore = await getScoreFromAi(cpuText, "CPU");
  }
  if (gpuScore === 3000) {
    gpuScore = await getScoreFromAi(gpuText, "GPU");
  }
  return { cpuScore, gpuScore, ramGb, cpuText, gpuText };
};

module.exports = { parseGameRequirements };
