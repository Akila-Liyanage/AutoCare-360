const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  lookupVehicle,
} = require('../controllers/vehicleController');
const { getVehicleHealthScore } = require('../controllers/healthController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All vehicle operations require an authenticated session
router.use(protect);

// Vehicle lookup by registration number or VIN (Owner, Verified Garage, and Admin)
router.get('/lookup', authorize('owner', 'garage', 'admin'), lookupVehicle);

// AI Vehicle Health Assessment & Trust Score (BR-09, FR-10)
router.get('/:id/health-score', authorize('owner', 'garage', 'admin'), getVehicleHealthScore);

// Owner vehicle digital passport management
router.route('/')
  .post(authorize('owner'), createVehicle)
  .get(authorize('owner'), getMyVehicles);

// Single vehicle passport view and modification
router.route('/:id')
  .get(authorize('owner', 'garage', 'admin'), getVehicleById)
  .patch(authorize('owner'), updateVehicle);

module.exports = router;
