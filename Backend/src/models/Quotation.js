const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    garageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Garage ID is required'],
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: [
      {
        description: { type: String, required: true, trim: true },
        quantity: { type: Number, default: 1, min: 1 },
        unitPrice: { type: Number, default: 0, min: 0 },
        total: { type: Number, default: 0, min: 0 },
      },
    ],
    estimatedLabour: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedParts: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    validUntil: {
      type: Date,
      required: [true, 'Validity date is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'declined', 'expired'],
      default: 'draft',
      index: true,
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

quotationSchema.index({ garageId: 1, createdAt: -1 });
quotationSchema.index({ vehicleId: 1, createdAt: -1 });

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
