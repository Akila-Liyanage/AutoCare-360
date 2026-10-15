const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  register,
  login,
  getMe,
  updateProfile,
  uploadProfileImage,
  forgotPassword,
  verifyCode,
  resendCode,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const uploadDir = path.join(__dirname, '../../uploads/profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const userId = req.user ? req.user._id : 'user';
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are supported'), false);
    }
  },
});

const uploadAvatarMiddleware = (req, res, next) => {
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed',
      });
    }
    if (!req.file && req.files) {
      req.file = req.files.profileImage?.[0] || req.files.image?.[0] || req.files.avatar?.[0];
    }
    next();
  });
};

// Static file serving for uploaded profile images
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
router.get('/profile-image/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  res.sendFile(filePath);
});

// Standard Auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.post('/profile/image', protect, uploadAvatarMiddleware, uploadProfileImage);
router.post('/profile-image', protect, uploadAvatarMiddleware, uploadProfileImage);

// Password Recovery Flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendCode);
router.post('/reset-password', resetPassword);

module.exports = router;
