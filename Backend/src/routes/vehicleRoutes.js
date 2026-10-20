const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  uploadVehicleImage,
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const uploadDir = path.join(__dirname, '../../uploads/vehicles');
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
    const vehicleId = req.params.id || 'vehicle';
    cb(null, `vehicle-${vehicleId}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP images are supported'), false);
    }
  },
});

const uploadVehicleImageMiddleware = (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'vehicleImage', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed',
      });
    }
    if (!req.file && req.files) {
      req.file = req.files.image?.[0] || req.files.vehicleImage?.[0] || req.files.file?.[0];
    }
    next();
  });
};

// Enforce authentication and Vehicle Owner role for all vehicle operations in this phase
router.use(protect);
router.use(authorize('owner'));

router.route('/')
  .post(createVehicle)
  .get(getMyVehicles);

router.route('/:id')
  .get(getVehicleById)
  .patch(updateVehicle);

router.post('/:id/image', uploadVehicleImageMiddleware, uploadVehicleImage);

module.exports = router;
