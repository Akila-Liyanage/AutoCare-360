const express = require('express');
const router = express.Router();
const { getPublicSharedRecord } = require('../controllers/publicShareController');

// Public route to access shared vehicle passport via raw token
// GET /api/public/shared/:token
// No JWT authentication required
router.get('/:token', getPublicSharedRecord);

module.exports = router;
