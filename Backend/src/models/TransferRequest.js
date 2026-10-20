const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    fromOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Current owner ID (fromOwnerId) is required'],
      index: true,
    },
    toOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email address is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid recipient email address'],
    },
    recipientName: {
      type: String,
      trim: true,
      default: '',
    },
    transferReason: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
        message: '{VALUE} is not a valid transfer request status',
      },
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    verificationCodeHash: {
      type: String,
      default: null,
    },
    verificationExpiresAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Optimized query for transfer requests for a vehicle, sorted newest first
transferRequestSchema.index({ vehicleId: 1, createdAt: -1 });

// Query outgoing transfer requests by current owner, sorted newest first
transferRequestSchema.index({ fromOwnerId: 1, createdAt: -1 });

// Query incoming transfer requests by new owner, sorted newest first
transferRequestSchema.index({ toOwnerId: 1, createdAt: -1 });

// Fast lookup for transfers addressed to a recipient email by status
transferRequestSchema.index({ recipientEmail: 1, status: 1 });

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);

module.exports = TransferRequest;
