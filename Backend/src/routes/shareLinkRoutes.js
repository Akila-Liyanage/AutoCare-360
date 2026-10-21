const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getOwnerShareLinks,
  getShareLinkById,
  revokeShareLink,
  deleteShareLink,
  getPublicSharedRecord,
  getPublicQrImage,
} = require('../controllers/shareLinkController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes (No login required - token validated)
router.get('/public/:token/qr', getPublicQrImage);
router.get('/public/:token', getPublicSharedRecord);

// All protected share-link endpoints require an authenticated owner session
router.use(protect);

// Base collection routes
router
  .route('/')
  .post(createShareLink)
  .get(getOwnerShareLinks);

// Revocation status mutation route
router.patch('/:id/revoke', revokeShareLink);

// Individual share-link resource routes
router
  .route('/:id')
  .get(getShareLinkById)
  .delete(deleteShareLink);

module.exports = router;
