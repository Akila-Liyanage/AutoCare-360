const express = require('express');
const router = express.Router();
const {
  getGarageDashboardStats,
  getGarageRecords,
  createQuotation,
  getQuotations,
  createInvoice,
  getInvoices,
  getGarageCustomerVehicles,
  createGarageExpense,
  getGarageExpenses,
  getGarageAuditLogs,
  getGarageProfile,
  updateGarageProfile,
} = require('../controllers/garageController');
const { updateQuotationStatus } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All garage endpoints require an authenticated verified garage or admin session
router.use(protect);
router.use(authorize('garage', 'admin'));

router.get('/dashboard-stats', getGarageDashboardStats);
router.get('/my-records', getGarageRecords);
router.get('/customer-vehicles', getGarageCustomerVehicles);

// Quotations per BR-03
router.route('/quotations').post(createQuotation).get(getQuotations);
router.route('/quotations/:id/status').patch(updateQuotationStatus).put(updateQuotationStatus);

// Invoices per BR-03
router.route('/invoices').post(createInvoice).get(getInvoices);

// Expenses per BR-03 (Figma Add Expense)
router.route('/expenses').post(createGarageExpense).get(getGarageExpenses);

// Audit Trail logs for garage
router.get('/audit-logs', getGarageAuditLogs);

// Garage Profile details & update
router.route('/profile').get(getGarageProfile).put(updateGarageProfile);

module.exports = router;
