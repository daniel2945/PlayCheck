// validators/authValidator.js
const { z } = require("zod");

// סכמה להרשמה
const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  userName: z.string().min(3, "Username must be at least 3 characters long"),
  myPc: z.object({
    cpuId: z.string().min(1, "CPU ID is required"),
    gpuId: z.string().min(1, "GPU ID is required"),
    ramGb: z.number().min(4, "Minimum 4GB RAM is required"),
  }),
});

// סכמה להתחברות
const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// סכמה לשינוי סיסמה
const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(6, "New password must be at least 6 characters long"),
});

// סכמה לעדכון שם
const updateNameSchema = z.object({
  userName: z.string().min(3, "Username must be at least 3 characters long"),
});

// סכמה לעדכון אימייל
const updateEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().optional(), // נדרש רק כשמשתמש מעדכן לעצמו
});

// סכמה לעדכון תפקיד - כאן התיקון המרכזי
const updateRoleSchema = z.object({
  role: z.enum(["user", "admin", "owner"], {
    errorMap: () => ({
      message: "Invalid role specified. Must be 'user', 'admin', or 'owner'.",
    }),
  }),
});

// סכמה לכתיבת ביקורת (מתוך review.js)
const reviewSchema = z.object({
  gameId: z.number().positive("Game ID must be a valid number"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  text: z.string().min(10, "Review is too short (min 10 characters)").max(1000),
});

module.exports = {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateNameSchema,
  updateEmailSchema,
  updateRoleSchema,
  reviewSchema,
};
