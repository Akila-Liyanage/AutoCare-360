const express = require('express');
const router = express.Router();
const {
  getGarageDashboardStats,
  getGarageRecords,
  createQuotation,
  getQuotations,
  createInvoice,
  getInvoices,
} = require('../controllers/garageController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All garage endpoints require an authenticated verified garage or admin session
router.use(protect);
router.use(authorize('garage', 'admin'));

router.get('/dashboard-stats', getGarageDashboardStats);
router.get('/my-records', getGarageRecords);

// Quotations per BR-03
router.route('/quotations').post(createQuotation).get(getQuotations);

// Invoices per BR-03
router.route('/invoices').post(createInvoice).get(getInvoices);

module.exports = router;
