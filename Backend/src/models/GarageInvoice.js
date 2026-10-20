const mongoose = require('mongoose');

const garageInvoiceSchema = new mongoose.Schema(
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
    serviceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRecord',
      default: null,
    },
    invoiceNumber: {
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
    labourCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    partsCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partially_paid', 'cancelled'],
      default: 'unpaid',
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
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

garageInvoiceSchema.index({ garageId: 1, createdAt: -1 });
garageInvoiceSchema.index({ vehicleId: 1, createdAt: -1 });

const GarageInvoice = mongoose.model('GarageInvoice', garageInvoiceSchema);

module.exports = GarageInvoice;
