const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: ['unread', 'read'],
        message: '{VALUE} is not a valid notification status',
      },
      default: 'unread',
    },
    reminderDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: {
        values: ['manual', 'service', 'document', 'system'],
        message: '{VALUE} is not a valid notification source',
      },
      default: 'system',
    },
    relatedServiceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRecord',
      default: null,
    },
    relatedDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleDocument',
      default: null,
    },
    isDismissed: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Optimized query for user notifications sorted by newest first
notificationSchema.index({ userId: 1, createdAt: -1 });

// Fast filtering by user and read/unread status
notificationSchema.index({ userId: 1, status: 1 });

// Vehicle-specific reminders lookup
notificationSchema.index({ vehicleId: 1, reminderDate: 1 });

// Sparse index for querying upcoming due dates
notificationSchema.index({ dueDate: 1 }, { sparse: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
