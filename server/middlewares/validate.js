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
        message: errorMessages,
      });
    }

    // אם זו שגיאת שרת אחרת לגמרי (לא קשורה ל-Zod), נעביר אותה לטיפול הכללי
    next(error);
  }
};

module.exports = { validate };
