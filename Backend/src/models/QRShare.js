const mongoose = require('mongoose');

const qrShareSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vehicle Owner ID is required'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
      trim: true,
    },
    purpose: {
      type: String,
      default: '',
      trim: true,
    },
    permissionLevel: {
      type: String,
      enum: {
        values: ['full', 'limited', 'selected'],
        message: '{VALUE} is not a valid permission level. Must be full, limited, or selected',
      },
      default: 'limited',
      required: [true, 'Permission level is required'],
    },
    allowedSections: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          if (this.permissionLevel === 'selected') {
            return Array.isArray(val) && val.length > 0;
          }
          return true;
        },
        message: 'allowedSections must not be empty when permissionLevel is "selected"',
      },
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date/time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'revoked', 'expired'],
        message: '{VALUE} is not a valid QR share status. Must be active, revoked, or expired',
      },
      default: 'active',
      index: true,
    },
    maxScans: {
      type: Number,
      default: null,
      min: [1, 'Maximum scans must be at least 1 if set'],
    },
    scanCount: {
      type: Number,
      default: 0,
      min: [0, 'Scan count cannot be negative'],
    },
    lastScannedAt: {
      type: Date,
      default: null,
    },
    qrLabel: {
      type: String,
      default: '',
      trim: true,
    },
    recipientName: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    protection: {
      allowDownload: {
        type: Boolean,
        default: false,
      },
      allowPrint: {
        type: Boolean,
        default: false,
      },
      allowCopy: {
        type: Boolean,
        default: false,
      },
      watermarkEnabled: {
        type: Boolean,
        default: true,
      },
      watermarkText: {
        type: String,
        default: 'AutoCare 360 - Confidential',
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound and query indexes
// 1. Efficient queries for QR shares of a specific vehicle, ordered newest first
qrShareSchema.index({ vehicleId: 1, createdAt: -1 });

// 2. Efficient queries for QR shares created by an owner, ordered newest first
qrShareSchema.index({ ownerId: 1, createdAt: -1 });

const QRShare = mongoose.model('QRShare', qrShareSchema);

module.exports = QRShare;
