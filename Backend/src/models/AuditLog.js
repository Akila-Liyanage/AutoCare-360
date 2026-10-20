const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true,
      trim: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['owner', 'garage', 'admin', 'guest', 'system'],
      default: 'guest',
      index: true,
    },
    actorName: {
      type: String,
      default: 'Anonymous / Guest',
      trim: true,
    },
    shareLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShareLink',
      default: null,
      index: true,
    },
    recipientInfo: {
      type: String,
      default: '',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'denied', 'failed'],
      default: 'success',
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast auditing and dashboard filtering
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ vehicleId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
