const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Destination directory for vehicle photos: Backend/uploads/vehicles/
const uploadDir = path.join(__dirname, '../../uploads/vehicles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage with unique timestamped filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `vehicle-${safeBase || 'photo'}-${uniqueSuffix}${ext}`);
  },
});

// Allowed photo file types: JPEG, JPG, PNG, WEBP
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only JPG, PNG, and WEBP image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// Wrapper middleware to support multiple possible field names: 'image', 'photo', 'vehicleImage'
const uploadVehicleImage = (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'vehicleImage', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Vehicle image file exceeds the 10 MB limit.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Vehicle image upload failed.',
      });
    }
    if (!req.file && req.files) {
      req.file = req.files.image?.[0] || req.files.photo?.[0] || req.files.vehicleImage?.[0] || req.files.file?.[0];
    }
    next();
  });
};

module.exports = {
  uploadVehicleImage,
  vehicleUploadDir: uploadDir,
};
