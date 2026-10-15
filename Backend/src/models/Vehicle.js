const mongoose = require('mongoose');

const currentYear = new Date().getFullYear();

const vehicleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'License plate / registration number is required'],
      trim: true,
      uppercase: true,
    },
    vin: {
      type: String,
      required: [true, 'VIN / Chassis number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-HJ-NPR-Z0-9]{17}$/,
        'VIN must be a valid 17-character alphanumeric identifier (excluding letters I, O, Q)',
      ],
      index: true,
    },
    engineNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: [
          'Sedan',
          'SUV',
          'Hatchback',
          'Van',
          'Pickup Truck',
          'Coupe',
          'Motorcycle',
          'Wagon',
          'Convertible',
          'Other',
        ],
        message: '{VALUE} is not a supported vehicle type',
      },
      default: 'Sedan',
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer / Make is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    manufacturingYear: {
      type: Number,
      required: [true, 'Manufacturing year is required'],
      min: [1900, 'Manufacturing year cannot be earlier than 1900'],
      max: [currentYear + 1, `Manufacturing year cannot exceed ${currentYear + 1}`],
    },
    currentMileage: {
      type: Number,
      required: [true, 'Current mileage is required'],
      min: [0, 'Current mileage cannot be negative'],
    },
    fuelType: {
      type: String,
      enum: {
        values: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid', 'Other'],
        message: '{VALUE} is not a supported fuel type',
      },
      default: 'Petrol',
    },
    transmission: {
      type: String,
      enum: {
        values: ['Automatic', 'Manual', 'CVT', 'Dual-Clutch', 'Other'],
        message: '{VALUE} is not a supported transmission type',
      },
      default: 'Automatic',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    registrationJurisdiction: {
      type: String,
      trim: true,
      default: 'Western Province, Sri Lanka',
    },
    lastServiceDate: {
      type: Date,
      default: null,
    },
    nextServiceMileage: {
      type: Number,
      min: [0, 'Next service mileage cannot be negative'],
      default: null,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'In Service', 'Archived'],
        message: '{VALUE} is not a valid vehicle status',
      },
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Clean JSON representation
vehicleSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
