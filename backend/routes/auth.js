const express = require('express');

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

router.post('/signup', signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/onboarding', protect, completeOnboarding);

module.exports = router;
