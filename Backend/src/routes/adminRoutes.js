const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getGarages,
  verifyGarage,
  updateGarageStatus,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All admin endpoints require an authenticated System Administrator session
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/garages', getGarages);
router.patch('/garages/:id/verify', verifyGarage);
router.patch('/garages/:id/status', updateGarageStatus);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
