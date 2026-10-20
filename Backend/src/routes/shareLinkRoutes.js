const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getOwnerShareLinks,
  getShareLinkById,
  revokeShareLink,
  deleteShareLink,
} = require('../controllers/shareLinkController');
const { protect } = require('../middlewares/authMiddleware');

// All share-link endpoints require an authenticated session
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
