const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

const currentYear = new Date().getFullYear();

// @desc    Register / Create a new Vehicle Digital Passport
// @route   POST /api/vehicles
// @access  Private (Owner Only)
const createVehicle = async (req, res, next) => {
  try {
    const {
      registrationNumber,
      vin,
      engineNumber,
      vehicleType,
      manufacturer,
      model,
      manufacturingYear,
      currentMileage,
      fuelType,
      transmission,
      color,
      registrationJurisdiction,
      status,
      imageUrl,
    } = req.body;

    // Validate required fields
    if (
      !registrationNumber ||
      !vin ||
      !manufacturer ||
      !model ||
      manufacturingYear === undefined ||
      manufacturingYear === null ||
      currentMileage === undefined ||
      currentMileage === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required fields: registrationNumber, vin, manufacturer, model, manufacturingYear, currentMileage.',
      });
    }

    const normalizedVin = String(vin).trim().toUpperCase();

    // VIN format validation (17 alphanumeric characters excluding I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinRegex.test(normalizedVin)) {
      return res.status(400).json({
        success: false,
        message:
          'VIN must be a valid 17-character alphanumeric identifier (excluding letters I, O, and Q).',
      });
    }

    // Mileage non-negative validation
    const mileageNum = Number(currentMileage);
    if (isNaN(mileageNum) || mileageNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current mileage must be a non-negative number.',
      });
    }

    // Manufacturing year range validation
    const yearNum = Number(manufacturingYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      return res.status(400).json({
        success: false,
        message: `Manufacturing year must be between 1900 and ${currentYear + 1}.`,
      });
    }

    // Check for duplicate VIN before database insert
    const existingVehicle = await Vehicle.findOne({ vin: normalizedVin });
    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this VIN / Chassis number is already registered.',
      });
    }

    // Reject direct base64 / data URLs or oversized imageUrl strings
    if (imageUrl && (String(imageUrl).startsWith('data:') || String(imageUrl).length > 2048)) {
      return res.status(400).json({
        success: false,
        message: 'Direct base64/data URL image persistence is not supported. Please provide a valid image URL.',
      });
    }

    // Persist vehicle tied strictly to the authenticated owner
    const vehicle = await Vehicle.create({
      ownerId: req.user._id,
      registrationNumber: String(registrationNumber).trim().toUpperCase(),
      vin: normalizedVin,
      engineNumber: engineNumber ? String(engineNumber).trim().toUpperCase() : '',
      vehicleType: vehicleType || 'Sedan',
      manufacturer: String(manufacturer).trim(),
      model: String(model).trim(),
      manufacturingYear: yearNum,
      currentMileage: mileageNum,
      fuelType: fuelType || 'Petrol',
      transmission: transmission || 'Automatic',
      color: color ? String(color).trim() : '',
      registrationJurisdiction: registrationJurisdiction
        ? String(registrationJurisdiction).trim()
        : 'Western Province, Sri Lanka',
      status: status || 'Active',
      imageUrl: imageUrl || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle digital passport created successfully.',
      data: {
        vehicle,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this VIN / Chassis number is already registered.',
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    next(error);
  }
};

// @desc    Get all vehicles owned by current authenticated user
// @route   GET /api/vehicles
// @access  Private (Owner Only)
const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ ownerId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: {
        vehicles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single vehicle passport by ID (owner tenant protected)
// @route   GET /api/vehicles/:id
// @access  Private (Owner Only)
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await Vehicle.findById(id).populate('ownerId', 'fullName email phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle passport not found.',
      });
    }

    // Tenant isolation: Owner can only access their own vehicle
    const ownerIdStr = vehicle.ownerId?._id ? vehicle.ownerId._id.toString() : vehicle.ownerId?.toString();
    if (ownerIdStr !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this vehicle passport.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        vehicle,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle passport details (owner tenant protected)
// @route   PATCH /api/vehicles/:id
// @access  Private (Owner Only)
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle passport not found.',
      });
    }

    // Tenant isolation: Owner can only update their own vehicle
    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this vehicle passport.',
      });
    }

    // Protect immutable fields
    if (req.body.ownerId && req.body.ownerId.toString() !== vehicle.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ownership cannot be modified directly.',
      });
    }

    if (req.body.vin && String(req.body.vin).trim().toUpperCase() !== vehicle.vin) {
      return res.status(400).json({
        success: false,
        message: 'VIN / Chassis number is immutable once registered.',
      });
    }

    // Validate mileage if provided
    if (req.body.currentMileage !== undefined && req.body.currentMileage !== null) {
      const newMileage = Number(req.body.currentMileage);
      if (isNaN(newMileage) || newMileage < 0) {
        return res.status(400).json({
          success: false,
          message: 'Current mileage must be a non-negative number.',
        });
      }
      vehicle.currentMileage = newMileage;
    }

    // Validate manufacturing year if provided
    if (req.body.manufacturingYear !== undefined && req.body.manufacturingYear !== null) {
      const newYear = Number(req.body.manufacturingYear);
      if (isNaN(newYear) || newYear < 1900 || newYear > currentYear + 1) {
        return res.status(400).json({
          success: false,
          message: `Manufacturing year must be between 1900 and ${currentYear + 1}.`,
        });
      }
      vehicle.manufacturingYear = newYear;
    }

    // Updatable fields
    if (req.body.registrationNumber) {
      vehicle.registrationNumber = String(req.body.registrationNumber).trim().toUpperCase();
    }
    if (req.body.engineNumber !== undefined) {
      vehicle.engineNumber = String(req.body.engineNumber).trim().toUpperCase();
    }
    if (req.body.vehicleType) {
      vehicle.vehicleType = req.body.vehicleType;
    }
    if (req.body.manufacturer) {
      vehicle.manufacturer = String(req.body.manufacturer).trim();
    }
    if (req.body.model) {
      vehicle.model = String(req.body.model).trim();
    }
    if (req.body.fuelType) {
      vehicle.fuelType = req.body.fuelType;
    }
    if (req.body.transmission) {
      vehicle.transmission = req.body.transmission;
    }
    if (req.body.color !== undefined) {
      vehicle.color = String(req.body.color).trim();
    }
    if (req.body.registrationJurisdiction !== undefined) {
      vehicle.registrationJurisdiction = String(req.body.registrationJurisdiction).trim();
    }
    if (req.body.status) {
      vehicle.status = req.body.status;
    }
    if (req.body.imageUrl !== undefined) {
      vehicle.imageUrl = req.body.imageUrl;
    }
    if (req.body.lastServiceDate !== undefined) {
      vehicle.lastServiceDate = req.body.lastServiceDate;
    }
    if (req.body.nextServiceMileage !== undefined) {
      vehicle.nextServiceMileage = req.body.nextServiceMileage;
    }

    await vehicle.save();
    const populated = await Vehicle.findById(vehicle._id).populate('ownerId', 'fullName email phone');

    return res.status(200).json({
      success: true,
      message: 'Vehicle digital passport updated successfully.',
      data: {
        vehicle: populated,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    next(error);
  }
};

// @desc    Upload vehicle image (multipart/form-data)
// @route   POST /api/vehicles/:id/image
// @access  Private (Owner Only)
const uploadVehicleImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided. Please choose a JPG, PNG, or WEBP image.',
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle passport not found.',
      });
    }

    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this vehicle.',
      });
    }

    // Clean up previous image if stored locally
    if (vehicle.imageUrl && vehicle.imageUrl.includes('/uploads/vehicles/')) {
      try {
        const oldFilename = path.basename(vehicle.imageUrl);
        const oldFilePath = path.join(__dirname, '../../uploads/vehicles', oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (cleanErr) {
        console.warn('[Vehicle Image Cleanup Notice]:', cleanErr.message);
      }
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/vehicles/${req.file.filename}`;
    vehicle.imageUrl = imageUrl;
    await vehicle.save();

    const populated = await Vehicle.findById(vehicle._id).populate('ownerId', 'fullName email phone');

    return res.status(200).json({
      success: true,
      message: 'Vehicle image uploaded successfully.',
      data: {
        vehicle: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  uploadVehicleImage,
};
