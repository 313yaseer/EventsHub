const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  signup,
  verifyEmail,
  login,
  logout,
  getMe,
  resendVerification,
  forgotPassword,
  resetPassword,
  completeOnboarding,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/onboarding', protect, completeOnboarding);

module.exports = router;
