const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getOwnerShareLinks,
  getShareLinkById,
  revokeShareLink,
  deleteShareLink,
  getPublicSharedRecord,
  updateShareLinkPermissions,
} = require('../controllers/shareLinkController');
const { protect } = require('../middlewares/authMiddleware');

// Public route to view shared vehicle records (No login required - token validated)
router.get('/public/:token', getPublicSharedRecord);

// All protected share-link endpoints require an authenticated owner session
router.use(protect);

// Base collection routes
router
  .route('/')
  .post(createShareLink)
  .get(getOwnerShareLinks);

// Permissions update mutation route
router.patch('/:id/permissions', updateShareLinkPermissions);

// Revocation status mutation route
router.patch('/:id/revoke', revokeShareLink);

// Individual share-link resource routes
router
  .route('/:id')
  .get(getShareLinkById)
  .delete(deleteShareLink);

module.exports = router;
