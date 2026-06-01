const Review = require("../models/Review");
const User = require("../models/User");
const Notification = require("../models/Notification");

const createReview = async (req, res, next) => {
  try {
    const { gameId, rating, text } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    if (!user || !user.myPc || !user.myPc.cpuId || !user.myPc.gpuId) {
      return res.status(400).json({
        success: false,
        message: "You must set up your PC specs before leaving a review.",
      });
    }

    const existingReview = await Review.findOne({ gameId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this game.",
      });
    }

    const hardwareSnapshot = {
      cpuScore: user.myPc.cpuId.benchmarkScore,
      gpuScore: user.myPc.gpuId.benchmarkScore,
      ramGb: user.myPc.ramGb,
      cpuName: `${user.myPc.cpuId.brand} ${user.myPc.cpuId.model}`,
      gpuName: `${user.myPc.gpuId.brand} ${user.myPc.gpuId.model}`,
    };

    const newReview = new Review({
      gameId,
      userId,
      rating,
      text,
      hardwareSnapshot,
    });
    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: newReview,
    });
  } catch (err) {
    next(err);
  }
};

const getGameReviews = async (req, res, next) => {
  try {
    const gameId = Number(req.params.id);
    const userId = req.user ? req.user.id : null; // ייתכן שהמשתמש אורח

    // הגנה מפני קריסות: מוודא שה-ID שהתקבל הוא אכן מספר
    if (isNaN(gameId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid game ID format" });
    }

    let reviews = await Review.find({ gameId: gameId })
      .populate("userId", "userName")
      .lean();

    // אם זה אורח, פשוט מחזירים את הביקורות בלי סינון (ללא Match Level)
    if (!userId) {
      const basicReviews = reviews.map((r) => ({
        ...r,
        reviewerName: r.userId?.userName || "Unknown",
        matchLevel: null,
      }));
      return res.status(200).json({
        success: true,
        count: basicReviews.length,
        data: basicReviews,
      });
    }

    const currentUser = await User.findById(userId)
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");

    // אם המשתמש מחובר אבל אין לו מפרט מוגדר
    if (
      !currentUser ||
      !currentUser.myPc ||
      !currentUser.myPc.cpuId ||
      !currentUser.myPc.gpuId
    ) {
      const basicReviews = reviews.map((r) => ({
        ...r,
        reviewerName: r.userId?.userName || "Unknown",
        matchLevel: null,
      }));
      return res.status(200).json({
        success: true,
        count: basicReviews.length,
        data: basicReviews,
      });
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
        diffPercent: totalDiffPercent.toFixed(1),
      };
    });

    processedReviews.sort(
      (a, b) => parseFloat(a.diffPercent) - parseFloat(b.diffPercent),
    );
    res.status(200).json({
      success: true,
      count: processedReviews.length,
      data: processedReviews,
    });
  } catch (err) {
    next(err);
  }
};

// פונקציית עריכה למנהלים ולבעלים (וכמובן לכותב עצמו)
const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { text, rating } = req.body;

    const review = await Review.findById(reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });

    if (
      review.userId.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "owner"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this review",
      });
    }

    if (text) review.text = text;
    if (rating) review.rating = rating;

    await review.save();
    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

// פונקציית המחיקה החדשה למנהלים
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Notification.deleteMany({ entityId: reviewId });
    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// פונקציית דיווח על ביקורת
const reportReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });

    if (!review.reports) review.reports = [];

    const alreadyReported = review.reports.find(
      (r) => r.userId && r.userId.toString() === userId.toString(),
    );
    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this review",
      });
    }

    review.reports.push({ userId, reason, createdAt: new Date() });
    await review.save();

    await Notification.create({
      isAdminNotification: true,
      sender: userId,
      type: "review_report",
      entityId: review._id,
      message: `reported a review for: ${reason}`,
    });

    res
      .status(200)
      .json({ success: true, message: "Review reported successfully" });
  } catch (err) {
    next(err);
  }
};

// פונקציה למנהלים - שליפת כל הביקורות שדווחו
const getReportedReviews = async (req, res, next) => {
  try {
    // שולף רק ביקורות שיש להן לפחות דיווח אחד
    const reportedReviews = await Review.find({
      "reports.0": { $exists: true },
    })
      .populate("userId", "userName")
      .populate("reports.userId", "userName");

    res.status(200).json({
      success: true,
      count: reportedReviews.length,
      data: reportedReviews,
    });
  } catch (err) {
    next(err);
  }
};

// פונקציה למנהלים - ביטול כל הדיווחים על ביקורת
const dismissReports = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // איפוס מערך הדיווחים
    review.reports = [];
    await review.save();
    await Notification.deleteMany({
      entityId: review._id,
      type: "review_report",
    });

    res
      .status(200)
      .json({ success: true, message: "Reports dismissed successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getGameReviews,
  updateReview,
  deleteReview,
  reportReview,
  getReportedReviews,
  dismissReports,
};
