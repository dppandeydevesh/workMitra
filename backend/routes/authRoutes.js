const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many accounts created from this IP. Please try again after 15 minutes." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Strict 5 attempt limit for brute-force protection
  message: { error: "Too many failed verification attempts. Please request a new OTP." }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Prevent email spam bombing
  message: { error: "Too many password reset requests. Please wait an hour before requesting another." }
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset attempts. Please try again after 15 minutes." }
});

router.post('/register', registerLimiter, authController.register);
router.post('/register-verify', otpVerifyLimiter, authController.verifyOtp);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordLimiter, authController.resetPassword);

router.post('/logout', authController.logout);

const authenticateToken = require(../middleware/authMiddleware);
router.get(/me, authenticateToken, authController.me);

module.exports = router;
