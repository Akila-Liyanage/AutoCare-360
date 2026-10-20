const express = require('express');
const router = express.Router();
const {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationRead,
  markNotificationUnread,
  dismissNotification,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// All notification endpoints require an authenticated session
router.use(protect);

// Unread count aggregate route (registered before /:id to prevent route shadowing)
router.get('/unread-count', getUnreadCount);

// Base notification collection routes
router
  .route('/')
  .post(createNotification)
  .get(getNotifications);

// Individual notification status mutation routes
router.patch('/:id/read', markNotificationRead);
router.patch('/:id/unread', markNotificationUnread);
router.patch('/:id/dismiss', dismissNotification);

// Single notification resource operations
router
  .route('/:id')
  .get(getNotificationById)
  .delete(deleteNotification);

module.exports = router;
