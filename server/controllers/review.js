const Review = require("../models/Review");
const User = require("../models/User");

const createReview = async (req, res, next) => {
  try {
    const { gameId, rating, text } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).populate("myPc.cpuId").populate("myPc.gpuId");

    if (!user || !user.myPc || !user.myPc.cpuId || !user.myPc.gpuId) {
      return res.status(400).json({ 
        success: false, 
        message: "You must set up your PC specs before leaving a review." 
      });
    }

    const existingReview = await Review.findOne({ gameId, userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this game." });
    }

    const hardwareSnapshot = {
      cpuScore: user.myPc.cpuId.benchmarkScore,
      gpuScore: user.myPc.gpuId.benchmarkScore,
      ramGb: user.myPc.ramGb,
      cpuName: `${user.myPc.cpuId.brand} ${user.myPc.cpuId.model}`,
      gpuName: `${user.myPc.gpuId.brand} ${user.myPc.gpuId.model}`
    };

    const newReview = new Review({ gameId, userId, rating, text, hardwareSnapshot });
    await newReview.save();

    res.status(201).json({ success: true, message: "Review added successfully", data: newReview });
  } catch (err) {
    next(err);
  }
};

const getGameReviews = async (req, res, next) => {
  try {
    const gameId = Number(req.params.id);
    const userId = req.user ? req.user.id : null; // ייתכן שהמשתמש אורח

    let reviews = await Review.find({ gameId: gameId }).populate("userId", "userName").lean();

    // אם זה אורח, פשוט מחזירים את הביקורות בלי סינון (ללא Match Level)
    if (!userId) {
      const basicReviews = reviews.map(r => ({ ...r, reviewerName: r.userId?.userName || "Unknown", matchLevel: null }));
      return res.status(200).json({ success: true, count: basicReviews.length, data: basicReviews });
    }

    const currentUser = await User.findById(userId).populate("myPc.cpuId").populate("myPc.gpuId");

    // אם המשתמש מחובר אבל אין לו מפרט מוגדר
    if (!currentUser || !currentUser.myPc || !currentUser.myPc.cpuId || !currentUser.myPc.gpuId) {
      const basicReviews = reviews.map(r => ({ ...r, reviewerName: r.userId?.userName || "Unknown", matchLevel: null }));
      return res.status(200).json({ success: true, count: basicReviews.length, data: basicReviews });
    }

    const myCpuScore = currentUser.myPc.cpuId.benchmarkScore;
    const myGpuScore = currentUser.myPc.gpuId.benchmarkScore;

    const processedReviews = reviews.map((review) => {
      const cpuDiff = Math.abs(review.hardwareSnapshot.cpuScore - myCpuScore);
      const gpuDiff = Math.abs(review.hardwareSnapshot.gpuScore - myGpuScore);
      
      const cpuDiffPercent = (cpuDiff / myCpuScore) * 100;
      const gpuDiffPercent = (gpuDiff / myGpuScore) * 100;
      const totalDiffPercent = (cpuDiffPercent + gpuDiffPercent) / 2;

      let matchLevel = "Different Setup";
      if (totalDiffPercent <= 10) matchLevel = "Exact Match";
      else if (totalDiffPercent <= 25) matchLevel = "Similar Setup";

      return {
        ...review,
        reviewerName: review.userId?.userName || "Unknown",
        matchLevel: matchLevel,
        diffPercent: totalDiffPercent.toFixed(1)
      };
    });

    processedReviews.sort((a, b) => parseFloat(a.diffPercent) - parseFloat(b.diffPercent));
    res.status(200).json({ success: true, count: processedReviews.length, data: processedReviews });

  } catch (err) {
    next(err);
  }
};

// פונקציית המחיקה החדשה למנהלים
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, getGameReviews, deleteReview };