const User = require("../models/User");
const Game = require("../models/Game");
const Hardware = require("../models/Hardware");

const updateSpecs = async (req, res, next) => {
  try {
    let { cpuId, gpuId, ramGb } = req.body;

    // Validate CPU and RAM
    if (!cpuId || !ramGb) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields: cpuId, ramGb" });
    }

    // --- Apple Silicon Logic ---
    const selectedCpu = await Hardware.findById(cpuId);
    if (!selectedCpu) {
      return res.status(404).json({ success: false, message: "CPU not found" });
    }

    if (selectedCpu.integratedGpuScore && !gpuId) {
      // For CPUs with integrated GPUs, we can allow missing gpuId 
      // or assign a generic "Apple Integrated GPU" for consistency if needed.
      // For now, let's try to find the generic one or just allow it to be null/assigned below.
      const genericGpu = await Hardware.findOne({ 
        model: "Apple M1 Virtual GPU", // fallback to a known virtual GPU
        type: "GPU" 
      });
      if (genericGpu) {
        gpuId = genericGpu._id;
      }
    }

    // Final validation
    if (!gpuId && !selectedCpu.integratedGpuScore) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required field: gpuId" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        myPc: { cpuId, gpuId: gpuId || null, ramGb },
      },
      { new: true, runValidators: true },
    )
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Specs updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("SPECS UPDATE ERROR:", error);
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    if (!user || !user.myPc || !user.myPc.cpuId || !user.myPc.gpuId) {
      return res.status(400).json({ success: false, message: "No PC specs found" });
    }

    const userCpuScore = Number(user.myPc.cpuId.benchmarkScore) || 0;
    
    // Priority: CPU's integrated GPU score -> User's selected GPU score
    const userGpuScore = user.myPc.cpuId.integratedGpuScore || (Number(user.myPc.gpuId?.benchmarkScore) || 0);
    const userRam = Number(user.myPc.ramGb) || 0;

    const recommendations = await Game.aggregate([
      {
        $match: {
          "requirements.minimum.cpuScore": { $lte: userCpuScore, $gt: 0 },
          "requirements.minimum.gpuScore": { $lte: userGpuScore, $gt: 0 },
          "requirements.minimum.ramGb": { $lte: userRam, $gt: 0 },
          
 
          releasedDate: { $gte: "2014", $ne: "TBA" }
        }
      },
      {
        // 3. הקסם: שליפה אקראית!
        // זה יבחר 6 משחקים רנדומליים מתוך כל המשחקים שעברו את הסינון
        $sample: { size: 6 }
      }
    ]);

    res.status(200).json({ success: true, data: recommendations });

  } catch (error) {
    console.error("Error fetching recommendations:", error);
    next(error);
  }
};

const getSearchHistory = async (req, res, next) => {
  try {
    // שולפים את המשתמש ומאכלסים (Populate) את פרטי המשחק מתוך ההיסטוריה
    const user = await User.findById(req.user.id).populate({
      path: 'searchHistory.gameId',
      select: 'title image releasedDate' // מושכים רק את מה שצריך לתצוגה כדי לחסוך תעבורה
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // מנקים את המידע: מסננים חיפושים של משחקים שאולי נמחקו מה-DB בינתיים
    // ומסדרים את זה כאובייקט שטוח ונקי לריאקט
    const history = user.searchHistory
      .filter(item => item.gameId != null)
      .map(item => ({
        _id: item.gameId._id,
        title: item.gameId.title,
        image: item.gameId.image,
        releasedDate: item.gameId.releasedDate,
        searchedAt: item.searchedAt
      }));

    res.status(200).json({ 
      success: true, 
      data: history 
    });
  } catch (error) {
    console.error("Error fetching search history:", error);
    next(error);
  }
};

module.exports = { updateSpecs, getRecommendations, getSearchHistory };
