const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createExpense,
  getVehicleExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

// All expense endpoints require an authenticated session
router.use(protect);

// Summary analytics endpoint (registered before /:id to prevent route shadowing)
router.get('/summary', getExpenseSummary);

// Base endpoints for vehicle expense collection
router
  .route('/')
  .post(createExpense)
  .get(getVehicleExpenses);

// Single expense item operations
router
  .route('/:id')
  .get(getExpenseById)
  .patch(updateExpense)
  .delete(deleteExpense);

module.exports = router;
