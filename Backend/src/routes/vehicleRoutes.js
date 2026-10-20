const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Enforce authentication and Vehicle Owner role for all vehicle operations in this phase
router.use(protect);
router.use(authorize('owner'));

router.route('/')
  .post(createVehicle)
  .get(getMyVehicles);

router.route('/:id')
  .get(getVehicleById)
  .patch(updateVehicle);

module.exports = router;
