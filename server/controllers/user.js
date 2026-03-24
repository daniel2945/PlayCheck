const User = require("../models/User");
const Game = require("../models/Game")

const updateSpecs = async (req, res, next) => {
  try {
    // Correctly expect cpuId, gpuId, and ramGb from the body
    const { cpuId, gpuId, ramGb } = req.body;

    // Validate that all required fields are present
    if (!cpuId || !gpuId || !ramGb) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields: cpuId, gpuId, ramGb" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      // Only use req.user.id, which is reliably set by the verifyToken middleware
      req.user.id,
      {
        // Update only the 'myPc' object, which is defined in the schema
        myPc: { cpuId, gpuId, ramGb },
      },
      { new: true, runValidators: true },
    )
      // Correctly populate the fields within the 'myPc' object
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
    const userGpuScore = Number(user.myPc.gpuId.benchmarkScore) || 0;
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
