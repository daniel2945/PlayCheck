// Assume hardwareCache is imported from your initialization module.
// Mocking the cache for this example as requested:
const hardwareCache = {
  gpuList: [
    { _id: "mock1", brand: "NVIDIA", model: "GeForce RTX 4060" },
    { _id: "mock2", brand: "AMD", model: "Radeon RX 7600" },
    { _id: "mock3", brand: "Intel", model: "UHD Graphics" },
  ],
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

    // 1. Sanitization Pipeline
    let cleanStr = rawGpuString.toLowerCase();

    // Extract inner string if wrapped in ANGLE(...)
    const angleMatch = cleanStr.match(/angle\s*\((.*?)\)/);
    if (angleMatch) cleanStr = angleMatch[1];

    // Remove known API wrappers and generic technical terms
    const noiseWords = [
      "direct3d11",
      "d3d11",
      "d3d12",
      "direct3d",
      "vs_11_0",
      "ps_5_0",
      "opengl",
      "pcie",
      "sse2",
      "emulated",
      "software",
      "swiftshader",
      "webgl",
      "family",
      "graphics",
      "video",
      "adapter",
    ];

    noiseWords.forEach((word) => {
      cleanStr = cleanStr.replace(new RegExp(word, "g"), " ");
    });

    // Remove all non-alphanumeric characters
    cleanStr = cleanStr.replace(/[^a-z0-9]/g, " ");

    // Split into unique tokens
    const rawTokens = [...new Set(cleanStr.split(/\s+/).filter(Boolean))];

    // 2. Token Scoring Algorithm
    let bestMatch = null;
    let highestScore = 0;

    for (const dbGpu of hardwareCache.gpuList) {
      const dbNameClean = `${dbGpu.brand} ${dbGpu.model}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ");

      const dbTokens = [...new Set(dbNameClean.split(/\s+/).filter(Boolean))];

      // Count overlapping tokens
      let matchCount = 0;
      for (const token of dbTokens) {
        if (rawTokens.includes(token)) matchCount++;
      }

      // Calculate match percentage based on the DB GPU's required tokens
      const score = (matchCount / dbTokens.length) * 100;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = dbGpu;
      }
    }

    // 3. Strict Threshold Verification
    const matchedGpu = highestScore >= 80 ? bestMatch : null;

    return res.status(200).json({
      success: true,
      data: { gpu: matchedGpu, ram: reportedRam, confidence: highestScore },
    });
  } catch (error) {
    console.error("Auto-Detect Error:", error);
    next(error);
  }
};

module.exports = { autoDetectHardware };
