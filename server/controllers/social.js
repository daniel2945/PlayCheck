const Post = require("../models/Post");
const Thread = require("../models/Thread");
const User = require("../models/User");
const Notification = require("../models/Notification");

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate("user", "userName")
      .populate("comments.user", "userName")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");
    let hardwareSnapshot = null;
    if (user && user.myPc && user.myPc.cpuId && user.myPc.gpuId) {
      hardwareSnapshot = {
        cpuName: `${user.myPc.cpuId.brand} ${user.myPc.cpuId.model}`,
        gpuName: `${user.myPc.gpuId.brand} ${user.myPc.gpuId.model}`,
        ramGb: user.myPc.ramGb,
      };
    }

    const newPost = new Post({
      user: req.user.id,
      content: req.body.content,
      image: {
        url: req.body.imageUrl || "",
        publicId: req.body.publicId || "",
      },
      taggedGame: req.body.taggedGame || null,
      hardwareSnapshot,
    });
    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id).populate(
      "user",
      "userName",
    );
    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    if (
      post.user.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "owner"
    )
      return res.status(403).json({ success: false, message: "No permission" });

    post.content = req.body.content || post.content;
    if (req.body.image !== undefined) post.image = req.body.image;
    if (req.body.taggedGame !== undefined)
      post.taggedGame = req.body.taggedGame;
    post.isEdited = true;
    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    if (
      post.user.toString() === req.user.id ||
      req.user.role === "admin" ||
      req.user.role === "owner"
    ) {
      await post.deleteOne();
      await Notification.deleteMany({ entityId: post._id });
      res.status(200).json({ success: true, message: "Post deleted" });
    } else res.status(403).json({ success: false, message: "No permission" });
  } catch (error) {
    next(error);
  }
};

const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    const isLiked = post.likes.includes(req.user.id);
    if (isLiked) {
      post.likes.pull(req.user.id);
      await Notification.findOneAndDelete({
        type: "post_like",
        entityId: post._id,
        sender: req.user.id,
      });
    } else {
      post.likes.push(req.user.id);
      if (post.user.toString() !== req.user.id) {
        await Notification.create({
          recipient: post.user,
          sender: req.user.id,
          type: "post_like",
          entityId: post._id,
          message: "liked your post",
        });
      }
    }
    await post.save();
    res.status(200).json({ success: true, likes: post.likes });
  } catch (error) {
    next(error);
  }
};

const addCommentToPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: req.user.id, text: req.body.text });
    await post.save();
    if (post.user.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.user,
        sender: req.user.id,
        type: "post_comment",
        entityId: post._id,
        message: "commented on your post",
      });
    }
    const updatedPost = await Post.findById(req.params.id)
      .populate("user", "userName")
      .populate("comments.user", "userName");
    res.status(201).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    const comment = post.comments.id(req.params.commentId);
    if (
      comment.user.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "owner"
    )
      return res.status(403).json({ message: "No permission" });
    comment.text = req.body.text;
    comment.updatedAt = new Date();
    await post.save();
    const updatedPost = await Post.findById(req.params.postId).populate(
      "comments.user",
      "userName",
    );
    res.status(200).json(updatedPost.comments);
  } catch (error) {
    next(error);
  }
};

// ======================= Threads ======================= //

const getThreads = async (req, res, next) => {
  try {
    const threads = await Thread.find()
      .populate("author", "userName")
      .populate("replies.author", "userName")
      .sort({ createdAt: -1 });
    res.status(200).json(threads);
  } catch (error) {
    next(error);
  }
};

const createThread = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");
    let hardwareSnapshot = null;
    if (user && user.myPc && user.myPc.cpuId && user.myPc.gpuId) {
      hardwareSnapshot = {
        cpuName: `${user.myPc.cpuId.brand} ${user.myPc.cpuId.model}`,
        gpuName: `${user.myPc.gpuId.brand} ${user.myPc.gpuId.model}`,
        ramGb: user.myPc.ramGb,
      };
    }

    const newThread = new Thread({
      title: req.body.title,
      content: req.body.content,
      author: req.user.id,
      category: req.body.category || "General",
      image: {
        url: req.body.imageUrl || "",
        publicId: req.body.publicId || "",
      },
      taggedGame: req.body.taggedGame || null,
      hardwareSnapshot,
    });
    const savedThread = await newThread.save();
    res.status(201).json(savedThread);
  } catch (error) {
    next(error);
  }
};

const updateThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (
      thread.author.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "owner"
    )
      return res.status(403).json({ message: "No permission" });
    thread.title = req.body.title || thread.title;
    thread.content = req.body.content || thread.content;
    thread.category = req.body.category || thread.category;
    if (req.body.image !== undefined) thread.image = req.body.image;
    if (req.body.taggedGame !== undefined)
      thread.taggedGame = req.body.taggedGame;
    thread.isEdited = true;
    const updatedThread = await thread.save();
    res.status(200).json(updatedThread);
  } catch (error) {
    next(error);
  }
};

const deleteThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (
      thread.author.toString() === req.user.id ||
      req.user.role === "admin" ||
      req.user.role === "owner"
    ) {
      await thread.deleteOne();
      await Notification.deleteMany({ entityId: thread._id });
      res.status(200).json({ success: true, message: "Thread deleted" });
    } else res.status(403).json({ message: "No permission" });
  } catch (error) {
    next(error);
  }
};

const addReplyToThread = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("myPc.cpuId")
      .populate("myPc.gpuId");
    let hardwareSnapshot = null;
    if (user && user.myPc && user.myPc.cpuId && user.myPc.gpuId) {
      hardwareSnapshot = {
        cpuName: `${user.myPc.cpuId.brand} ${user.myPc.cpuId.model}`,
        gpuName: `${user.myPc.gpuId.brand} ${user.myPc.gpuId.model}`,
        ramGb: user.myPc.ramGb,
      };
    }

    const thread = await Thread.findById(req.params.id);
    thread.replies.push({
      author: req.user.id,
      content: req.body.content,
      image: req.body.image || { url: "", publicId: "" }, // ✨ שמירת תמונה בתגובה ✨
      hardwareSnapshot,
    });
    await thread.save();
    if (thread.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: thread.author,
        sender: req.user.id,
        type: "thread_reply",
        entityId: thread._id,
        message: "replied to your thread",
      });
    }
    res.status(201).json(thread);
  } catch (error) {
    next(error);
  }
};

const updateReply = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    const reply = thread.replies.id(req.params.replyId);
    if (
      reply.author.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "owner"
    )
      return res.status(403).json({ message: "No permission" });
    reply.content = req.body.content;
    reply.updatedAt = new Date();
    if (req.body.image !== undefined) reply.image = req.body.image; // ✨ עדכון תמונה בתגובה ✨
    await thread.save();
    res.status(200).json(thread.replies);
  } catch (error) {
    next(error);
  }
};

const adminDeleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    post.comments.id(req.params.commentId).deleteOne();
    await post.save();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const adminDeleteReply = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    thread.replies.id(req.params.replyId).deleteOne();
    await thread.save();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const reportPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    if (!post.reports) post.reports = [];
    if (
      post.reports.find((r) => r.userId && r.userId.toString() === req.user.id)
    )
      return res
        .status(400)
        .json({ success: false, message: "Already reported" });
    post.reports.push({ userId: req.user.id, reason: req.body.reason });
    await post.save();
    await Notification.create({
      isAdminNotification: true,
      sender: req.user.id,
      type: "post_report",
      entityId: post._id,
      message: `reported a post for: ${req.body.reason}`,
    });
    res
      .status(200)
      .json({ success: true, message: "Post reported successfully" });
  } catch (error) {
    next(error);
  }
};

const reportThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    if (!thread)
      return res
        .status(404)
        .json({ success: false, message: "Thread not found" });
    if (!thread.reports) thread.reports = [];
    if (
      thread.reports.find(
        (r) => r.userId && r.userId.toString() === req.user.id,
      )
    )
      return res
        .status(400)
        .json({ success: false, message: "Already reported" });
    thread.reports.push({ userId: req.user.id, reason: req.body.reason });
    await thread.save();
    await Notification.create({
      isAdminNotification: true,
      sender: req.user.id,
      type: "thread_report",
      entityId: thread._id,
      message: `reported a thread for: ${req.body.reason}`,
    });
    res
      .status(200)
      .json({ success: true, message: "Thread reported successfully" });
  } catch (error) {
    next(error);
  }
};

const getReportedPosts = async (req, res, next) => {
  try {
    const reportedPosts = await Post.find({ "reports.0": { $exists: true } })
      .populate("user", "userName")
      .populate("reports.userId", "userName");
    res
      .status(200)
      .json({
        success: true,
        count: reportedPosts.length,
        data: reportedPosts,
      });
  } catch (error) {
    next(error);
  }
};

const getReportedThreads = async (req, res, next) => {
  try {
    const reportedThreads = await Thread.find({
      "reports.0": { $exists: true },
    })
      .populate("author", "userName")
      .populate("reports.userId", "userName");
    res
      .status(200)
      .json({
        success: true,
        count: reportedThreads.length,
        data: reportedThreads,
      });
  } catch (error) {
    next(error);
  }
};

const dismissPostReports = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    post.reports = [];
    await post.save();
    await Notification.deleteMany({ entityId: post._id, type: "post_report" });
    res.status(200).json({ success: true, message: "Reports dismissed." });
  } catch (error) {
    next(error);
  }
};

const dismissThreadReports = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    if (!thread)
      return res
        .status(404)
        .json({ success: false, message: "Thread not found" });
    thread.reports = [];
    await thread.save();
    await Notification.deleteMany({
      entityId: thread._id,
      type: "thread_report",
    });
    res.status(200).json({ success: true, message: "Reports dismissed." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
