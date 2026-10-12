const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  forgotPassword,
  verifyCode,
  resendCode,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Standard Auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Password Recovery Flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendCode);
router.post('/reset-password', resetPassword);

module.exports = router;
