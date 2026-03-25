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

// middlewares/validate.js
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next(); 
  } catch (error) {
    // מוודאים שזו אכן שגיאה של Zod ושיש לה מערך של שגיאות
    if (error.issues || error.errors) {
      // תומך גם בגרסאות ישנות וגם בחדשות של Zod
      const zodErrors = error.issues || error.errors;
      const errorMessages = zodErrors.map((err) => err.message).join(", ");
      
      return res.status(400).json({ 
        success: false, 
        message: errorMessages 
      });
    }
    
    // אם זו שגיאת שרת אחרת לגמרי (לא קשורה ל-Zod), נעביר אותה לטיפול הכללי
    next(error);
  }
};

module.exports = { verifyToken, forAdmins, validate };
