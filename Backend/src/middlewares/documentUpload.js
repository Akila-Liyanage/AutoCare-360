const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure destination directory exists: Backend/uploads/documents/
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration with safe unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${safeBase || 'file'}-${uniqueSuffix}${ext}`);
  },
});

// Allowed file types: PDF, JPEG, PNG
const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// Middleware wrapper to handle multer errors gracefully with 400 status codes
const uploadDocument = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 10 MB limit.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Document file upload failed.',
      });
    }
    next();
  });
};

module.exports = {
  uploadDocument,
  documentUploadDir: uploadDir,
};
