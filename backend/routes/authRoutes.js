// server/routes/authRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const { register, login, logout, refresh } = require("../controllers/authController");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Brute-force protection should only penalize failed attempts.
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: "TooManyRequests",
    message: "Too many failed login attempts. Try again in 15 minutes",
  },
});

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

router.post(
  "/logout",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validateRequest,
  logout
);

router.post(
  "/refresh",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validateRequest,
  refresh
);

module.exports = router;
