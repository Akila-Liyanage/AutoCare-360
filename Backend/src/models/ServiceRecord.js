const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    garageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    garageName: {
      type: String,
      trim: true,
      default: '',
    },
    technicianName: {
      type: String,
      trim: true,
      default: '',
    },
    serviceDate: {
      type: Date,
      required: [true, 'Service date is required'],
    },
    mileage: {
      type: Number,
      required: [true, 'Mileage is required'],
      min: [0, 'Mileage cannot be negative'],
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true,
    },
    workPerformed: {
      type: String,
      required: [true, 'Work performed details are required'],
      trim: true,
    },
    partsReplaced: {
      type: [String],
      default: [],
    },
    labourCost: {
      type: Number,
      default: 0,
      min: [0, 'Labour cost cannot be negative'],
    },
    partsCost: {
      type: Number,
      default: 0,
      min: [0, 'Parts cost cannot be negative'],
    },
    totalCost: {
      type: Number,
      default: 0,
      min: [0, 'Total cost cannot be negative'],
    },
    invoiceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    serviceImages: {
      type: [String],
      default: [],
    },
    recordSource: {
      type: String,
      enum: {
        values: ['verified_garage', 'self_reported'],
        message: '{VALUE} is not a valid record source',
      },
      default: 'verified_garage',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['verified', 'pending', 'self_reported'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'pending',
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

// Compound index for querying vehicle maintenance history in reverse chronological order
serviceRecordSchema.index({ vehicleId: 1, serviceDate: -1 });

const ServiceRecord = mongoose.model('ServiceRecord', serviceRecordSchema);

module.exports = ServiceRecord;
