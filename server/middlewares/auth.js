const jwt = require("jsonwebtoken");
const User = require("../models/User"); // חובה לייבא כדי לשלוף את המשתמש

const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed or expired",
      });
    }
  }

  return res
    .status(401)
    .json({ success: false, message: "Not authorized, no token provided" });
};

const forAdmins = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "owner")) {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Admins or Owner only." });
  }
};

const forOwner = (req, res, next) => {
  if (req.user && req.user.role === "owner") {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Owner only." });
  }
};

// --- המידלוואר החדש והחכם ---
const checkHierarchy = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, data: "User not found" });
    }

    // הגנת היררכיה: מנהל לא יכול לערוך/למחוק מנהלים או את הבעלים
    if (req.user.role === "admin" && (targetUser.role === "admin" || targetUser.role === "owner")) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admins cannot modify other staff members." 
      });
    }

    // מעבירים את המשתמש הלאה לקונטרולר כדי לחסוך קריאה ל-DB!
    req.targetUser = targetUser;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyToken,
  forAdmins,
  forOwner,
  checkHierarchy
};