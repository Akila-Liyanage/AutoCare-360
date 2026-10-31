const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getGarages,
  verifyGarage,
  updateGarageStatus,
  getAuditLogs,
  getAllUsers,
  createUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserAnalytics,
  seedDummyUsers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All admin endpoints require an authenticated System Administrator session
router.use(protect);
router.use(authorize('admin'));

// Platform-level & garage management
router.get('/stats', getAdminStats);
router.get('/garages', getGarages);
router.patch('/garages/:id/verify', verifyGarage);
router.patch('/garages/:id/status', updateGarageStatus);
router.get('/audit-logs', getAuditLogs);

// System User Management & Analytics
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/user-analytics', getUserAnalytics);
router.post('/seed-dummy-users', seedDummyUsers);

module.exports = router;
