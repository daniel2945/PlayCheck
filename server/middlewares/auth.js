const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(400).json({ data: "there is no token" });
  }

  try {
    if (authHeader && authHeader.startsWith("Bearer")) {
      const token = authHeader.split(" ")[1];
      if (!token) {
        res.status(401);
        next(new Error("Not authorized, no token provided"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    }
  } catch (err) {
    next(new Error("Not authorized, token failed"));
  }
};

const forAdmins = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

module.exports = { verifyToken, forAdmins };
