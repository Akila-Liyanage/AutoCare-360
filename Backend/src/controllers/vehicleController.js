const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const AuditLog = require('../models/AuditLog');

const currentYear = new Date().getFullYear();

// Helper to remove temporary uploaded file on validation/operation failure
const cleanupUploadedFile = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.warn('[File Cleanup Warning]: Could not unlink file:', e.message);
    }
  }
};

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
      manufacturingYear === '' ||
      currentMileage === undefined ||
      currentMileage === null ||
      currentMileage === ''
    ) {
      cleanupUploadedFile(req.file);
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
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message:
          'VIN must be a valid 17-character alphanumeric identifier (excluding letters I, O, and Q).',
      });
    }

    // Mileage non-negative validation
    const mileageNum = Number(currentMileage);
    if (isNaN(mileageNum) || mileageNum < 0) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: 'Current mileage must be a non-negative number.',
      });
    }

    // Manufacturing year range validation
    const yearNum = Number(manufacturingYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: `Manufacturing year must be between 1900 and ${currentYear + 1}.`,
      });
    }

    // Check for duplicate VIN before database insert
    const existingVehicle = await Vehicle.findOne({ vin: normalizedVin });
    if (existingVehicle) {
      cleanupUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this VIN / Chassis number is already registered.',
      });
    }

    // Determine final image URL: uploaded file takes highest priority, then imageUrl body param
    let finalImageUrl = '';
    if (req.file) {
      finalImageUrl = `/uploads/vehicles/${req.file.filename}`;
    } else if (imageUrl) {
      finalImageUrl = String(imageUrl).trim();
    }

    // Reject direct base64 / data URLs or oversized imageUrl strings
    if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.length > 2048)) {
      cleanupUploadedFile(req.file);
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
      insuranceExpiryDate: req.body.insuranceExpiryDate ? new Date(req.body.insuranceExpiryDate) : null,
      insuranceCompany: req.body.insuranceCompany ? String(req.body.insuranceCompany).trim() : 'Ceylinco General Insurance',
      revenueLicenseExpiryDate: req.body.revenueLicenseExpiryDate ? new Date(req.body.revenueLicenseExpiryDate) : null,
      emissionTestExpiryDate: req.body.emissionTestExpiryDate ? new Date(req.body.emissionTestExpiryDate) : null,
      emissionTestCompany: req.body.emissionTestCompany ? String(req.body.emissionTestCompany).trim() : 'DriveGreen (CleanCo)',
      status: status || 'Active',
      imageUrl: finalImageUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle digital passport created successfully.',
      data: {
        vehicle,
      },
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
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

    // Tenant isolation: Owner can only access their own vehicle; verified garages and admins can inspect
    const isOwner = req.user.role === 'owner';
    const ownerIdStr = vehicle.ownerId?._id ? vehicle.ownerId._id.toString() : vehicle.ownerId?.toString();
    if (isOwner && ownerIdStr !== req.user._id.toString()) {
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
    if (req.body.insuranceExpiryDate !== undefined) {
      vehicle.insuranceExpiryDate = req.body.insuranceExpiryDate ? new Date(req.body.insuranceExpiryDate) : null;
    }
    if (req.body.insuranceCompany !== undefined) {
      vehicle.insuranceCompany = String(req.body.insuranceCompany).trim();
    }
    if (req.body.revenueLicenseExpiryDate !== undefined) {
      vehicle.revenueLicenseExpiryDate = req.body.revenueLicenseExpiryDate ? new Date(req.body.revenueLicenseExpiryDate) : null;
    }
    if (req.body.emissionTestExpiryDate !== undefined) {
      vehicle.emissionTestExpiryDate = req.body.emissionTestExpiryDate ? new Date(req.body.emissionTestExpiryDate) : null;
    }
    if (req.body.emissionTestCompany !== undefined) {
      vehicle.emissionTestCompany = String(req.body.emissionTestCompany).trim();
    }
    if (req.body.status) {
      vehicle.status = req.body.status;
    }
    if (req.file) {
      // Clean up previous uploaded image if one existed
      if (vehicle.imageUrl && vehicle.imageUrl.includes('/uploads/vehicles/')) {
        try {
          const oldFilename = path.basename(vehicle.imageUrl);
          const oldFilePath = path.join(__dirname, '../../uploads/vehicles', oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (cleanErr) {
          console.warn('[Vehicle Photo Cleanup Notice]:', cleanErr.message);
        }
      }
      vehicle.imageUrl = `/uploads/vehicles/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
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
    cleanupUploadedFile(req.file);
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

// @desc    Lookup vehicle by registration number or VIN (BR-03: Garage vehicle search)
// @route   GET /api/vehicles/lookup
// @access  Private (Owner, Garage, Admin)
const lookupVehicle = async (req, res, next) => {
  try {
    if (req.user.role === 'garage' && req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only verified and active garage partners can look up customer vehicles (BR-03, BRULE-01).',
      });
    }

    const { regNumber, registrationNumber, vin, query } = req.query;
    const searchTerm = (regNumber || registrationNumber || vin || query || '').trim();

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a registration number or VIN to look up.',
      });
    }

    const cleanTerm = searchTerm.replace(/\s+/g, '').toUpperCase();
    const regex = new RegExp(searchTerm.trim(), 'i');

    const vehicle = await Vehicle.findOne({
      $or: [
        { registrationNumber: regex },
        { registrationNumber: cleanTerm },
        { vin: cleanTerm },
        { vin: regex },
      ],
    }).populate('ownerId', 'fullName email phone displayName');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `No vehicle found matching identifier "${searchTerm}".`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle passport retrieved successfully.',
      data: {
        vehicle,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit trail logs for a specific vehicle (BR-08)
// @route   GET /api/vehicles/:id/audit-logs
// @access  Private (Owner, Admin)
const getVehicleAuditLogs = async (req, res, next) => {
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
        message: 'Vehicle not found.',
      });
    }

    // Owner authorization: owners can only inspect their own vehicle logs
    const ownerIdStr = vehicle.ownerId?._id ? vehicle.ownerId._id.toString() : vehicle.ownerId?.toString();
    if (req.user.role === 'owner' && ownerIdStr !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view audit logs for this vehicle.',
      });
    }

    const logs = await AuditLog.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: {
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload vehicle image / photo
// @route   POST /api/vehicles/upload-image
// @access  Private (Owner Only)
const uploadVehiclePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid vehicle image file (JPG, PNG, WEBP).',
      });
    }

    const imageUrl = `/uploads/vehicles/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Vehicle photo uploaded successfully.',
      data: {
        imageUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
    next(error);
  }
};

// @desc    Upload / update photo for an existing vehicle
// @route   POST /api/vehicles/:id/image
// @access  Private (Owner Only)
const updateVehiclePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid vehicle image file (JPG, PNG, WEBP).',
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      cleanupUploadedFile(req.file);
      return res.status(404).json({
        success: false,
        message: 'Vehicle passport not found.',
      });
    }

    const ownerIdStr = vehicle.ownerId?._id ? vehicle.ownerId._id.toString() : vehicle.ownerId?.toString();
    if (ownerIdStr !== req.user._id.toString()) {
      cleanupUploadedFile(req.file);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this vehicle photo.',
      });
    }

    // Clean up previous uploaded image if one existed locally
    if (vehicle.imageUrl && vehicle.imageUrl.includes('/uploads/vehicles/')) {
      try {
        const oldFilename = path.basename(vehicle.imageUrl);
        const oldFilePath = path.join(__dirname, '../../uploads/vehicles', oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (cleanErr) {
        console.warn('[Vehicle Photo Cleanup Notice]:', cleanErr.message);
      }
    }

    const imageUrl = `/uploads/vehicles/${req.file.filename}`;
    vehicle.imageUrl = imageUrl;
    await vehicle.save();

    const populated = await Vehicle.findById(vehicle._id).populate('ownerId', 'fullName email phone');

    return res.status(200).json({
      success: true,
      message: 'Vehicle photo updated successfully.',
      data: {
        vehicle: populated || vehicle,
        imageUrl,
      },
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
    next(error);
  }
};

// @desc    Get quotations for a specific vehicle passport (BR-03, Owner & Garage)
// @route   GET /api/vehicles/:id/quotations
// @access  Private (Owner, Garage, Admin)
const getVehicleQuotations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Quotation = require('../models/Quotation');
    const quotations = await Quotation.find({ vehicleId: id })
      .populate('garageId', 'fullName displayName email phone city')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: quotations.length,
      data: {
        quotations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quotation status (accept/decline by vehicle owner or garage)
// @route   PATCH /api/vehicles/quotations/:id/status
// @access  Private (Owner & Garage)
const updateQuotationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const Quotation = require('../models/Quotation');
    const Notification = require('../models/Notification');
    const AuditLog = require('../models/AuditLog');

    if (!['accepted', 'declined', 'sent', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotation status. Must be accepted, declined, sent, or expired.',
      });
    }

    const quotation = await Quotation.findById(id).populate('garageId vehicleId');
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.',
      });
    }

    quotation.status = status;
    await quotation.save();

    // If accepted by owner, notify garage immediately
    if (status === 'accepted' && quotation.garageId?._id) {
      try {
        const vehicleInfo = quotation.vehicleId
          ? `${quotation.vehicleId.manufacturer || ''} ${quotation.vehicleId.model || ''} (${quotation.vehicleId.registrationNumber || ''})`
          : 'Vehicle';

        await Notification.create({
          userId: quotation.garageId._id,
          title: 'Quotation Accepted by Customer',
          message: `Customer ${req.user.fullName || req.user.displayName || 'Vehicle Owner'} accepted quotation ${quotation.quotationNumber} (LKR ${(quotation.totalAmount || 0).toLocaleString()}) for ${vehicleInfo}. Service authorized.`,
          type: 'service',
          priority: 'high',
          status: 'unread',
          source: 'service',
        });

        await AuditLog.create({
          action: 'QUOTATION_ACCEPTED_BY_OWNER',
          vehicleId: quotation.vehicleId?._id,
          actorId: req.user._id,
          actorRole: req.user.role,
          actorName: req.user.fullName || req.user.displayName,
          notes: `Quotation ${quotation.quotationNumber} approved with amount LKR ${quotation.totalAmount}`,
        });
      } catch (err) {
        console.warn('[Quotation Status Notification]:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Quotation marked as ${status} successfully.`,
      data: {
        quotation,
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
  lookupVehicle,
  getVehicleAuditLogs,
  getVehicleQuotations,
  updateQuotationStatus,
  uploadVehiclePhoto,
  updateVehiclePhoto,
  uploadVehicleImage: updateVehiclePhoto,
};

