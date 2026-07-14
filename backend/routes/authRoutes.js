const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter, verifyLimiter } = require('../middleware/rateLimiter');
const authenticateToken = require('../middleware/authMiddleware');

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Prevent email spam bombing
  message: { error: 'Too many password reset requests. Please wait an hour before requesting another.' },
  keyGenerator: (req) => req.realIP || req.ip,
  validate: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset attempts. Please try again after 15 minutes.' },
  keyGenerator: (req) => req.realIP || req.ip,
  validate: false,
});

router.post('/register', registerLimiter, authController.register);
router.post('/register-verify', verifyLimiter, authController.verifyOtp);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordLimiter, authController.resetPassword);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshAccessToken);
router.get('/me', authenticateToken, authController.me);

// Profile routes (migrated from server.js inline handlers)
router.get('/user/:email', authenticateToken, authController.getUserByEmail);
router.get('/student/vanity/:username', authenticateToken, authController.getVanityProfile);
router.post('/complete-profile', authenticateToken, authController.completeProfile);
router.put('/company-profile', authenticateToken, authController.updateCompanyProfile);
router.put('/faculty-profile', authenticateToken, authController.updateFacultyProfile);

module.exports = router;

