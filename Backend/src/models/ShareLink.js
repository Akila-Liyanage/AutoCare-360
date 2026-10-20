const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
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
    recipientName: {
      type: String,
      default: '',
      trim: true,
    },
    recipientEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
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
        message: '{VALUE} is not a valid share link status. Must be active, revoked, or expired',
      },
      default: 'active',
      index: true,
    },
    passcodeHash: {
      type: String,
      default: null,
    },
    maxViews: {
      type: Number,
      default: null,
      min: [1, 'Maximum views must be at least 1 if set'],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    lastAccessedAt: {
      type: Date,
      default: null,
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
// Optimized query for share links associated with a vehicle, sorted newest first
shareLinkSchema.index({ vehicleId: 1, createdAt: -1 });

// Optimized query for share links created by an owner, sorted newest first
shareLinkSchema.index({ ownerId: 1, createdAt: -1 });

// Fast lookup for links filtered by recipient email and status
shareLinkSchema.index({ recipientEmail: 1, status: 1 });

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);

module.exports = ShareLink;
