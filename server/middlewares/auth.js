const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res
        .status(401)
        .json({
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
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

module.exports = { verifyToken, forAdmins };
