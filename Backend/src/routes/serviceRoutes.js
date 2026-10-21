const express = require('express');
const router = express.Router({ mergeParams: true });
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  createServiceRecord,
  getVehicleServiceRecords,
  getServiceRecordById,
  updateServiceRecord,
} = require('../controllers/serviceController');
const { protect } = require('../middlewares/authMiddleware');

// Ensure destination directory exists: Backend/uploads/documents/
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
    cb(null, `srv-${safeBase || 'media'}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, and WebP files are allowed.'), false);
  }
};

const serviceUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter,
});

// All service record operations require an authenticated session
router.use(protect);

// Upload endpoint for service invoice and component photos (BR-03, FR-02)
router.post('/upload', (req, res) => {
  serviceUpload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }

    const files = req.files || [];
    let invoiceUrl = '';
    const photoUrls = [];

    files.forEach((f) => {
      const publicUrl = `/uploads/documents/${f.filename}`;
      if (f.fieldname === 'invoice' || (!invoiceUrl && f.mimetype === 'application/pdf')) {
        invoiceUrl = publicUrl;
      } else {
        photoUrls.push(publicUrl);
      }
    });

    // If only one file uploaded and it wasn't caught as invoice, assign it as primary
    if (files.length === 1 && !invoiceUrl) {
      invoiceUrl = `/uploads/documents/${files[0].filename}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully.',
      data: {
        files: files.map((f) => ({
          filename: f.filename,
          originalName: f.originalname,
          fieldname: f.fieldname,
          mimetype: f.mimetype,
          size: f.size,
          fileUrl: `/uploads/documents/${f.filename}`,
        })),
        invoiceUrl,
        photoUrls,
      },
    });
  });
});

router
  .route('/')
  .post(createServiceRecord)
  .get(getVehicleServiceRecords);

router
  .route('/:id')
  .get(getServiceRecordById)
  .patch(updateServiceRecord);

module.exports = router;

