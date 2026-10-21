const express = require('express');
const router = express.Router();

const {
  getAdminStats,
  getGarages,
  getGarageById,
  approveGarage,
  verifyGarage,
  rejectGarage,
  updateGarageStatus,
  getAuditLogs,
} = require('../controllers/adminController');

const {
  protect,
  authorize,
} = require('../middlewares/authMiddleware');

// ============================================================
// ADMIN ROUTES
// All routes below require an authenticated Admin account
// ============================================================

router.use(protect);
router.use(authorize('admin'));

// ============================================================
// ADMIN DASHBOARD / PLATFORM STATISTICS
// ============================================================

// GET /api/admin/stats
router.get('/stats', getAdminStats);

// ============================================================
// GARAGE MANAGEMENT
// ============================================================

// GET /api/admin/garages
// Supports optional:
// ?status=pending|active|suspended
// ?search=keyword
router.get('/garages', getGarages);

// GET /api/admin/garages/:id
// Get one garage for admin verification/review
router.get('/garages/:id', getGarageById);

// ------------------------------------------------------------
// Garage approval / verification
//
// Both endpoints are intentionally supported because the
// existing main branch and garage verification frontend use
// different route names.
// ------------------------------------------------------------

// PATCH /api/admin/garages/:id/approve
router.patch('/garages/:id/approve', approveGarage);

// PATCH /api/admin/garages/:id/verify
router.patch('/garages/:id/verify', verifyGarage);

// ------------------------------------------------------------
// Garage rejection / suspension
// ------------------------------------------------------------

// PATCH /api/admin/garages/:id/reject
router.patch('/garages/:id/reject', rejectGarage);

// PATCH /api/admin/garages/:id/status
// Body example:
// {
//   "status": "active" | "pending" | "suspended",
//   "reason": "optional reason"
// }
router.patch('/garages/:id/status', updateGarageStatus);

// ============================================================
// AUDIT LOGS
// ============================================================

// GET /api/admin/audit-logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;