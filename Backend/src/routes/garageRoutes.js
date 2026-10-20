const express = require('express');
const router = express.Router();
const {
  getGarageDashboardStats,
  getGarageRecords,
} = require('../controllers/garageController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All garage endpoints require an authenticated verified garage or admin session
router.use(protect);
router.use(authorize('garage', 'admin'));

router.get('/dashboard-stats', getGarageDashboardStats);
router.get('/my-records', getGarageRecords);

module.exports = router;
