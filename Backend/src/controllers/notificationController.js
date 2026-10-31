const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Vehicle = require('../models/Vehicle');

// @desc    Create a new manual notification/reminder
// @route   POST /api/notifications
// @access  Private (Owner Only)
const createNotification = async (req, res, next) => {
  try {
    // Authenticated owner authorization
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only vehicle owners can create manual notifications.',
      });
    }

    const {
      vehicleId,
      title,
      message,
      type,
      priority,
      reminderDate,
      dueDate,
      relatedServiceRecordId,
      relatedDocumentId,
    } = req.body;

    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, message, and type.',
      });
    }

    // Vehicle ownership validation if vehicleId is provided
    let associatedVehicleId = null;
    if (vehicleId) {
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format.',
        });
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Associated vehicle not found.',
        });
      }

      if (vehicle.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only create notifications for vehicles you own.',
        });
      }

      associatedVehicleId = vehicle._id;
    }

    // Optional related service record ID validation
    if (relatedServiceRecordId && !mongoose.Types.ObjectId.isValid(relatedServiceRecordId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid related service record ID format.',
      });
    }

    // Optional related document ID validation
    if (relatedDocumentId && !mongoose.Types.ObjectId.isValid(relatedDocumentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid related document ID format.',
      });
    }

    // Create notification document enforcing owner provenance defaults
    const notification = await Notification.create({
      userId: req.user._id,
      vehicleId: associatedVehicleId,
      title: title.trim(),
      message: message.trim(),
      type: type.trim(),
      priority: priority || 'medium',
      status: 'unread',
      source: 'manual',
      reminderDate: reminderDate ? new Date(reminderDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      relatedServiceRecordId: relatedServiceRecordId || null,
      relatedDocumentId: relatedDocumentId || null,
      isDismissed: false,
      readAt: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully.',
      data: {
        notification,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    next(error);
  }
};

// Helper to automatically check and generate regulatory expiry notifications (Insurance, Revenue License, Emission Test)
const checkAndGenerateExpiryNotifications = async (userId) => {
  try {
    const vehicles = await Vehicle.find({ ownerId: userId, status: { $ne: 'Archived' } });
    const now = new Date();

    for (const vehicle of vehicles) {
      // 1. Insurance Expiry Check
      if (vehicle.insuranceExpiryDate) {
        const expiry = new Date(vehicle.insuranceExpiryDate);
        const diffMs = expiry - now;
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft <= 30) {
          const priority = daysLeft <= 7 ? 'high' : 'medium';
          const urgency =
            daysLeft < 0
              ? 'has expired'
              : daysLeft === 0
              ? 'expires today'
              : `expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
          const formattedDate = expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const title = `Insurance Renewal: ${vehicle.registrationNumber} ${urgency}`;
          const message = `Comprehensive policy (${vehicle.insuranceCompany || 'Ceylinco General Insurance'}) for ${vehicle.manufacturer} ${vehicle.model} (${vehicle.registrationNumber}) ${urgency} on ${formattedDate}. Renew with your insurer to ensure continuous road coverage.`;

          const existing = await Notification.findOne({
            userId,
            vehicleId: vehicle._id,
            type: 'insurance_expiry',
            createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          });

          if (!existing) {
            await Notification.create({
              userId,
              vehicleId: vehicle._id,
              title,
              message,
              type: 'insurance_expiry',
              priority,
              status: 'unread',
              source: 'system',
              dueDate: expiry,
            });
          }
        }
      }

      // 2. Revenue License Expiry Check
      if (vehicle.revenueLicenseExpiryDate) {
        const expiry = new Date(vehicle.revenueLicenseExpiryDate);
        const diffMs = expiry - now;
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft <= 30) {
          const priority = daysLeft <= 7 ? 'high' : 'medium';
          const urgency =
            daysLeft < 0
              ? 'has expired'
              : daysLeft === 0
              ? 'expires today'
              : `expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
          const formattedDate = expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const title = `Revenue License: ${vehicle.registrationNumber} ${urgency}`;
          const message = `Annual Motor Revenue License for ${vehicle.manufacturer} ${vehicle.model} (${vehicle.registrationNumber}) ${urgency} on ${formattedDate}. Please verify valid emission test and insurance certificates are ready for Divisional Secretariat or e-Revenue renewal.`;

          const existing = await Notification.findOne({
            userId,
            vehicleId: vehicle._id,
            type: 'revenue_license_expiry',
            createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          });

          if (!existing) {
            await Notification.create({
              userId,
              vehicleId: vehicle._id,
              title,
              message,
              type: 'revenue_license_expiry',
              priority,
              status: 'unread',
              source: 'system',
              dueDate: expiry,
            });
          }
        }
      }

      // 3. Emission Test Expiry Check
      if (vehicle.emissionTestExpiryDate) {
        const expiry = new Date(vehicle.emissionTestExpiryDate);
        const diffMs = expiry - now;
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft <= 30) {
          const priority = daysLeft <= 7 ? 'high' : 'medium';
          const urgency =
            daysLeft < 0
              ? 'has expired'
              : daysLeft === 0
              ? 'expires today'
              : `expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
          const formattedDate = expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const title = `Emission Test (VET): ${vehicle.registrationNumber} ${urgency}`;
          const message = `Vehicle Emission Test certificate (${vehicle.emissionTestCompany || 'DriveGreen / Laugfs Eco'}) for ${vehicle.registrationNumber} ${urgency} on ${formattedDate}. Valid VET test certificate is required before revenue license renewal.`;

          const existing = await Notification.findOne({
            userId,
            vehicleId: vehicle._id,
            type: 'emission_test_expiry',
            createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          });

          if (!existing) {
            await Notification.create({
              userId,
              vehicleId: vehicle._id,
              title,
              message,
              type: 'emission_test_expiry',
              priority,
              status: 'unread',
              source: 'system',
              dueDate: expiry,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error auto-generating vehicle expiry notifications:', err.message);
  }
};

// @desc    Get all notifications for current user with optional filtering
// @route   GET /api/notifications
// @access  Private (Owner/User tenant protected)
const getNotifications = async (req, res, next) => {
  try {
    // Automatically evaluate vehicle expiry dates and generate timely notifications
    if (req.user && req.user._id) {
      await checkAndGenerateExpiryNotifications(req.user._id);
    }

    const { status, priority, type, vehicleId, includeDismissed } = req.query;

    // Scope query strictly to authenticated user
    const query = {
      userId: req.user._id,
    };

    // Exclude dismissed notifications by default unless explicitly requested
    if (includeDismissed !== 'true') {
      query.isDismissed = false;
    }

    // Optional status filter
    if (status) {
      query.status = status;
    }

    // Optional priority filter
    if (priority) {
      query.priority = priority;
    }

    // Optional type filter
    if (type) {
      query.type = type;
    }

    // Optional vehicleId filter
    if (vehicleId) {
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format.',
        });
      }
      query.vehicleId = vehicleId;
    }

    const notifications = await Notification.find(query).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: {
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single notification by ID
// @route   GET /api/notifications/:id
// @access  Private (Owner/User tenant protected)
const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    // Enforce ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this notification.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (Owner/User tenant protected)
const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    // Enforce ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this notification.',
      });
    }

    notification.status = 'read';
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as unread
// @route   PATCH /api/notifications/:id/unread
// @access  Private (Owner/User tenant protected)
const markNotificationUnread = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    // Enforce ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this notification.',
      });
    }

    notification.status = 'unread';
    notification.readAt = null;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as unread.',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dismiss notification
// @route   PATCH /api/notifications/:id/dismiss
// @access  Private (Owner/User tenant protected)
const dismissNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    // Enforce ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this notification.',
      });
    }

    notification.isDismissed = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification dismissed.',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete manual notification (manual notifications only)
// @route   DELETE /api/notifications/:id
// @access  Private (Owner/User tenant protected)
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    // Enforce ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete this notification.',
      });
    }

    // Prevent direct deletion of system, service, or document generated notifications
    if (notification.source !== 'manual') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete automated system, service, or document notifications directly. You can dismiss them instead.',
      });
    }

    await Notification.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get count of unread, non-dismissed notifications for current user
// @route   GET /api/notifications/unread-count
// @access  Private (Owner/User tenant protected)
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      status: 'unread',
      isDismissed: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationRead,
  markNotificationUnread,
  dismissNotification,
  deleteNotification,
  getUnreadCount,
};
