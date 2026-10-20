const express = require('express');
const router = express.Router();
const {
  createQRShare,
  getOwnerQRShares,
  getQRShareById,
  revokeQRShare,
  deleteQRShare,
  updateQRSharePermissions,
} = require('../controllers/qrShareController');
const { protect } = require('../middlewares/authMiddleware');

// All QR-share endpoints require an authenticated session
router.use(protect);

// Base collection routes
router
  .route('/')
  .post(createQRShare)
  .get(getOwnerQRShares);

// Permissions update mutation route
router.patch('/:id/permissions', updateQRSharePermissions);

// Revocation status mutation route
router.patch('/:id/revoke', revokeQRShare);

// Individual QR share resource routes
router
  .route('/:id')
  .get(getQRShareById)
  .delete(deleteQRShare);

module.exports = router;
