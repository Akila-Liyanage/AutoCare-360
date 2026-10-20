const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  lookupVehicle,
  getVehicleAuditLogs,
  uploadVehiclePhoto,
  updateVehiclePhoto,
} = require('../controllers/vehicleController');
const { getVehicleHealthScore } = require('../controllers/healthController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadVehicleImage, vehicleUploadDir } = require('../middlewares/vehicleUpload');

// Serve uploaded vehicle photo files safely (path.basename prevents directory traversal attacks)
router.get('/images/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(vehicleUploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle photo not found.',
    });
  }

  return res.sendFile(filePath);
});

// All vehicle operations below require an authenticated session
router.use(protect);

// Upload vehicle photo (Owner only)
router.post('/upload-image', authorize('owner'), uploadVehicleImage, uploadVehiclePhoto);

// Upload or replace photo for an existing vehicle (Owner only)
router.post('/:id/image', authorize('owner'), uploadVehicleImage, updateVehiclePhoto);

// Vehicle lookup by registration number or VIN (Owner, Verified Garage, and Admin)
router.get('/lookup', authorize('owner', 'garage', 'admin'), lookupVehicle);

// AI Vehicle Health Assessment & Trust Score (BR-09, FR-10)
router.get('/:id/health-score', authorize('owner', 'garage', 'admin'), getVehicleHealthScore);

// Vehicle Audit Trail logs (BR-08)
router.get('/:id/audit-logs', authorize('owner', 'admin'), getVehicleAuditLogs);

// Owner vehicle digital passport management
router.route('/')
  .post(authorize('owner'), uploadVehicleImage, createVehicle)
  .get(authorize('owner'), getMyVehicles);

// Single vehicle passport view and modification
router.route('/:id')
  .get(authorize('owner', 'garage', 'admin'), getVehicleById)
  .patch(authorize('owner'), uploadVehicleImage, updateVehicle);

module.exports = router;
