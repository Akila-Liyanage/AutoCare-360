const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
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
    serviceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRecord',
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Expense amount cannot be negative'],
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: '',
    },
    receiptUrl: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: {
        values: ['service_record', 'manual'],
        message: '{VALUE} is not a valid expense source',
      },
      default: 'manual',
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
// Optimized query for vehicle expenses sorted by date descending
expenseSchema.index({ vehicleId: 1, expenseDate: -1 });

// Optimized query for owner-wide expense summaries sorted by date descending
expenseSchema.index({ ownerId: 1, expenseDate: -1 });

// Sparse index for querying expenses linked to service records
expenseSchema.index({ serviceRecordId: 1 }, { sparse: true });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
