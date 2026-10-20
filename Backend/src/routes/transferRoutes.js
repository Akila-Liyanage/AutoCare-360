const express = require('express');
const router = express.Router();
const {
  createTransferRequest,
  getOutgoingTransfers,
  getIncomingTransfers,
  getTransferById,
  acceptTransferRequest,
  rejectTransferRequest,
  cancelTransferRequest,
} = require('../controllers/transferController');
const { protect } = require('../middlewares/authMiddleware');

// All transfer endpoints require an authenticated session
router.use(protect);

// Predefined collection query routes (registered before /:id to prevent route shadowing)
router.get('/outgoing', getOutgoingTransfers);
router.get('/incoming', getIncomingTransfers);

// Base transfer request initiation route
router.post('/', createTransferRequest);

// Transfer lifecycle and decision mutation routes
router.patch('/:id/accept', acceptTransferRequest);
router.patch('/:id/reject', rejectTransferRequest);
router.patch('/:id/cancel', cancelTransferRequest);

// Single transfer resource lookup route
router.get('/:id', getTransferById);

module.exports = router;
