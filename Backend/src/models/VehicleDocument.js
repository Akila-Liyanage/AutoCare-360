const mongoose = require('mongoose');

const vehicleDocumentSchema = new mongoose.Schema(
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
      required: [true, 'Owner ID is required'],
      index: true,
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      minlength: [2, 'Document title must be at least 2 characters long'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
      default: '',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
      default: 0,
    },
    issueDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value || !this.issueDate) return true;
          return new Date(value) >= new Date(this.issueDate);
        },
        message: 'Expiry date cannot be earlier than issue date',
      },
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by user ID is required'],
    },
    source: {
      type: String,
      enum: {
        values: ['owner_upload', 'verified_garage'],
        message: '{VALUE} is not a valid document source',
      },
      default: 'owner_upload',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['self_reported', 'pending', 'verified'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'self_reported',
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
// Optimized lookup for vehicle documents sorted by newest upload first
vehicleDocumentSchema.index({ vehicleId: 1, createdAt: -1 });

// Tracking document renewals and expirations (sparse index since expiryDate is optional)
vehicleDocumentSchema.index({ expiryDate: 1 }, { sparse: true });

const VehicleDocument = mongoose.model('VehicleDocument', vehicleDocumentSchema);

module.exports = VehicleDocument;
