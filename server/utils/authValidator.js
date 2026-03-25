// validators/authValidator.js
const { z } = require("zod");

// סכמה להרשמה
const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  userName: z.string().min(2, "Username must be at least 2 characters long"),
  myPc: z.object({
    cpuId: z.string().min(1, "CPU ID is required"),
    gpuId: z.string().min(1, "GPU ID is required"),
    ramGb: z.number().min(4, "Minimum 4GB RAM is required")
  })
});

// סכמה להתחברות
const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});

// סכמה לשינוי סיסמה
const updatePasswordSchema = z.object({
  password: z.string().min(6, "New password must be at least 6 characters long")
});

// סכמה לשינוי שם משתמש
const updateNameSchema = z.object({
  userName: z.string().min(2, "New username must be at least 2 characters long")
});

// סכמה לשינוי אימייל
const updateEmailSchema = z.object({
  email: z.string().email("Please provide a valid email address")
});

// סכמה לשינוי הרשאת מנהל (Admin)
const updateRoleSchema = z.object({
  isAdmin: z.boolean({
    required_error: "isAdmin field is required",
    invalid_type_error: "isAdmin must be a boolean (true or false)",
  })
});

module.exports = { 
  registerSchema, 
  loginSchema, 
  updatePasswordSchema, 
  updateNameSchema, 
  updateEmailSchema,
  updateRoleSchema
};