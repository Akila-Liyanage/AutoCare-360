const express = require('express');
const router = express.Router();
const {
  getGarages,
  getGarageById,
  approveGarage,
  rejectGarage,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Enforce admin authentication & role authorization for all admin endpoints
router.use(protect, authorize('admin'));

// Garage verification endpoints
router.get('/garages', getGarages);
router.get('/garages/:id', getGarageById);
router.patch('/garages/:id/approve', approveGarage);
router.patch('/garages/:id/reject', rejectGarage);

module.exports = router;
