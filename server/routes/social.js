const express = require("express");
const socialRouter = express.Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  addCommentToPost,
  updateComment,
  getThreads,
  createThread,
  updateThread,
  deleteThread,
  addReplyToThread,
  updateReply,
  adminDeleteComment,
  adminDeleteReply,
  reportPost,
  reportThread,
  getReportedPosts,
  getReportedThreads,
  dismissPostReports,
  dismissThreadReports,
} = require("../controllers/social");

const { verifyToken, forAdmins } = require("../middlewares/auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many uploads. Please wait 5 minutes.",
  },
});

socialRouter.post(
  "/upload",
  verifyToken,
  uploadLimiter,
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No image provided" });
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "playcheck_feed" },
        (error, result) => {
          if (error)
            return res
              .status(500)
              .json({ success: false, message: "Upload failed" });
          res
            .status(200)
            .json({
              success: true,
              url: result.secure_url,
              publicId: result.public_id,
            });
        },
      );
      uploadStream.end(req.file.buffer);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  },
);

// ==========================
// פוסטים - פיד
// ==========================
socialRouter.get("/posts", getPosts);
socialRouter.post("/posts", verifyToken, createPost);
socialRouter.put("/posts/:id", verifyToken, updatePost);
socialRouter.delete("/posts/:id", verifyToken, deletePost);

socialRouter.post("/posts/:id/like", verifyToken, toggleLikePost);
socialRouter.post("/posts/:id/comments", verifyToken, addCommentToPost);
socialRouter.put(
  "/posts/:postId/comments/:commentId",
  verifyToken,
  updateComment,
);

// ==========================
// דיונים - פורום
// ==========================
socialRouter.get("/threads", getThreads);
socialRouter.post("/threads", verifyToken, createThread);
socialRouter.put("/threads/:id", verifyToken, updateThread);
socialRouter.delete("/threads/:id", verifyToken, deleteThread);

socialRouter.post("/threads/:id/replies", verifyToken, addReplyToThread);
socialRouter.put(
  "/threads/:threadId/replies/:replyId",
  verifyToken,
  updateReply,
);

// ==========================
// מנהלים בלבד - מחיקת תגובות
// ==========================
socialRouter.delete(
  "/admin/posts/:postId/comments/:commentId",
  verifyToken,
  forAdmins,
  adminDeleteComment,
);
socialRouter.delete(
  "/admin/threads/:threadId/replies/:replyId",
  verifyToken,
  forAdmins,
  adminDeleteReply,
);

socialRouter.post("/posts/:postId/report", verifyToken, reportPost);
socialRouter.get("/posts/reported", verifyToken, forAdmins, getReportedPosts);
socialRouter.delete(
  "/posts/:postId/reports",
  verifyToken,
  forAdmins,
  dismissPostReports,
);

socialRouter.post("/threads/:threadId/report", verifyToken, reportThread);
socialRouter.get(
  "/threads/reported",
  verifyToken,
  forAdmins,
  getReportedThreads,
);
socialRouter.delete(
  "/threads/:threadId/reports",
  verifyToken,
  forAdmins,
  dismissThreadReports,
);

module.exports = socialRouter;
