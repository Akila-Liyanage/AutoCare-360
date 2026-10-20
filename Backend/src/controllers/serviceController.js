const mongoose = require('mongoose');
const ServiceRecord = require('../models/ServiceRecord');
const Vehicle = require('../models/Vehicle');

// @desc    Create a new service record
// @route   POST /api/services or POST /api/vehicles/:vehicleId/services
// @access  Private (Owner or Garage)
const createServiceRecord = async (req, res, next) => {
  try {
    const targetVehicleId = req.params.vehicleId || req.body.vehicleId;

    if (!targetVehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetVehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.',
      });
    }

    const isOwner = req.user.role === 'owner';
    const isGarage = req.user.role === 'garage';

    // Owner authorization: owners can only log records for their own vehicles
    if (isOwner && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only log service records for vehicles you own.',
      });
    }

    const {
      serviceDate,
      mileage,
      serviceType,
      workPerformed,
      partsReplaced,
      labourCost,
      partsCost,
      totalCost,
      invoiceUrl,
      serviceImages,
      garageName,
      technicianName,
      notes,
    } = req.body;

    // Required fields validation
    if (!serviceDate || mileage === undefined || mileage === null || !serviceType || !workPerformed) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: serviceDate, mileage, serviceType, and workPerformed.',
      });
    }

    const parsedMileage = Number(mileage);
    if (isNaN(parsedMileage) || parsedMileage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Mileage must be a non-negative number.',
      });
    }

    const parsedDate = new Date(serviceDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid service date.',
      });
    }

    // Cost calculations & non-negative bounds validation
    const parsedLabour = labourCost !== undefined ? Number(labourCost) : 0;
    const parsedParts = partsCost !== undefined ? Number(partsCost) : 0;
    let parsedTotal = totalCost !== undefined ? Number(totalCost) : 0;

    if (isNaN(parsedLabour) || parsedLabour < 0 || isNaN(parsedParts) || parsedParts < 0 || isNaN(parsedTotal) || parsedTotal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost amounts (labourCost, partsCost, totalCost) cannot be negative.',
      });
    }

    // Auto-compute totalCost if not explicitly provided
    if (parsedTotal === 0 && (parsedLabour > 0 || parsedParts > 0)) {
      parsedTotal = parsedLabour + parsedParts;
    }

    // Determine security classification by user role
    let recordSource;
    let verificationStatus;
    let assignedGarageId = null;
    let resolvedGarageName = '';
    let resolvedTechnician = '';

    if (isOwner) {
      // Owners can ONLY create self-reported records per platform rules
      recordSource = 'self_reported';
      verificationStatus = 'self_reported';
      resolvedGarageName = garageName ? String(garageName).trim() : 'Self-Reported by Owner';
      resolvedTechnician = technicianName ? String(technicianName).trim() : req.user.fullName;
    } else if (isGarage) {
      // Garage prepared support (placeholder verification status until Phase 6 full garage verification)
      recordSource = 'verified_garage';
      verificationStatus = 'verified';
      assignedGarageId = req.user._id;
      resolvedGarageName = req.user.displayName || req.user.fullName || (garageName ? String(garageName).trim() : 'Verified Workshop');
      resolvedTechnician = technicianName ? String(technicianName).trim() : req.user.fullName;
    } else {
      recordSource = 'self_reported';
      verificationStatus = 'self_reported';
    }

    const serviceRecord = await ServiceRecord.create({
      vehicleId: vehicle._id,
      garageId: assignedGarageId,
      garageName: resolvedGarageName,
      technicianName: resolvedTechnician,
      serviceDate: parsedDate,
      mileage: parsedMileage,
      serviceType: String(serviceType).trim(),
      workPerformed: String(workPerformed).trim(),
      partsReplaced: Array.isArray(partsReplaced) ? partsReplaced.map((p) => String(p).trim()).filter(Boolean) : [],
      labourCost: parsedLabour,
      partsCost: parsedParts,
      totalCost: parsedTotal,
      invoiceUrl: invoiceUrl ? String(invoiceUrl).trim() : '',
      serviceImages: Array.isArray(serviceImages) ? serviceImages.map((img) => String(img).trim()).filter(Boolean) : [],
      recordSource,
      verificationStatus,
      notes: notes ? String(notes).trim() : '',
    });

    // Optionally update vehicle's currentMileage and lastServiceDate if this entry is newer
    if (parsedMileage > (vehicle.currentMileage || 0)) {
      vehicle.currentMileage = parsedMileage;
    }
    if (!vehicle.lastServiceDate || parsedDate > new Date(vehicle.lastServiceDate)) {
      vehicle.lastServiceDate = parsedDate;
    }
    await vehicle.save();

    return res.status(201).json({
      success: true,
      message: 'Service record created successfully.',
      data: {
        serviceRecord,
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

// @desc    Get all service records for a vehicle (sorted by serviceDate descending)
// @route   GET /api/vehicles/:vehicleId/services or GET /api/services?vehicleId=...
// @access  Private (Owner tenant protected)
const getVehicleServiceRecords = async (req, res, next) => {
  try {
    const targetVehicleId = req.params.vehicleId || req.query.vehicleId;

    if (!targetVehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetVehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.',
      });
    }

    // Owner authorization: owners can view records only for their own vehicle
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view service records for this vehicle.',
      });
    }

    const records = await ServiceRecord.find({ vehicleId: targetVehicleId }).sort({ serviceDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: {
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single service record by ID
// @route   GET /api/services/:id
// @access  Private (Owner tenant protected)
const getServiceRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service record ID format.',
      });
    }

    const serviceRecord = await ServiceRecord.findById(id);
    if (!serviceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Service record not found.',
      });
    }

    // Fetch related vehicle to enforce ownership authorization
    const vehicle = await Vehicle.findById(serviceRecord.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle record not found.',
      });
    }

    // Owner authorization: owners can inspect only their own vehicle's records
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this service record.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        serviceRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a service record (owner can update only their own self-reported records)
// @route   PATCH /api/services/:id
// @access  Private (Owner tenant protected)
const updateServiceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service record ID format.',
      });
    }

    const serviceRecord = await ServiceRecord.findById(id);
    if (!serviceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Service record not found.',
      });
    }

    const vehicle = await Vehicle.findById(serviceRecord.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle record not found.',
      });
    }

    // Owner authorization: must own the vehicle
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify records for this vehicle.',
      });
    }

    // Strict provenance protection: owners can ONLY update self-reported records
    if (req.user.role === 'owner' && serviceRecord.recordSource !== 'self_reported') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vehicle owners cannot modify records published and certified by verified garages.',
      });
    }

    // Prevent changing vehicleId
    if (req.body.vehicleId && req.body.vehicleId.toString() !== serviceRecord.vehicleId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle association cannot be modified once a record is created.',
      });
    }

    // Validate mileage if provided
    if (req.body.mileage !== undefined && req.body.mileage !== null) {
      const newMileage = Number(req.body.mileage);
      if (isNaN(newMileage) || newMileage < 0) {
        return res.status(400).json({
          success: false,
          message: 'Mileage must be a non-negative number.',
        });
      }
      serviceRecord.mileage = newMileage;
    }

    // Validate serviceDate if provided
    if (req.body.serviceDate) {
      const newDate = new Date(req.body.serviceDate);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid service date.',
        });
      }
      serviceRecord.serviceDate = newDate;
    }

    // Validate costs if provided
    if (req.body.labourCost !== undefined) {
      const labour = Number(req.body.labourCost);
      if (isNaN(labour) || labour < 0) {
        return res.status(400).json({ success: false, message: 'Labour cost cannot be negative.' });
      }
      serviceRecord.labourCost = labour;
    }

    if (req.body.partsCost !== undefined) {
      const parts = Number(req.body.partsCost);
      if (isNaN(parts) || parts < 0) {
        return res.status(400).json({ success: false, message: 'Parts cost cannot be negative.' });
      }
      serviceRecord.partsCost = parts;
    }

    if (req.body.totalCost !== undefined) {
      const total = Number(req.body.totalCost);
      if (isNaN(total) || total < 0) {
        return res.status(400).json({ success: false, message: 'Total cost cannot be negative.' });
      }
      serviceRecord.totalCost = total;
    }

    // Updatable descriptive fields
    if (req.body.serviceType) {
      serviceRecord.serviceType = String(req.body.serviceType).trim();
    }
    if (req.body.workPerformed) {
      serviceRecord.workPerformed = String(req.body.workPerformed).trim();
    }
    if (req.body.partsReplaced !== undefined) {
      serviceRecord.partsReplaced = Array.isArray(req.body.partsReplaced)
        ? req.body.partsReplaced.map((p) => String(p).trim()).filter(Boolean)
        : [];
    }
    if (req.body.invoiceUrl !== undefined) {
      serviceRecord.invoiceUrl = String(req.body.invoiceUrl).trim();
    }
    if (req.body.serviceImages !== undefined) {
      serviceRecord.serviceImages = Array.isArray(req.body.serviceImages)
        ? req.body.serviceImages.map((img) => String(img).trim()).filter(Boolean)
        : [];
    }
    if (req.body.notes !== undefined) {
      serviceRecord.notes = String(req.body.notes).trim();
    }
    if (req.body.garageName && serviceRecord.recordSource === 'self_reported') {
      serviceRecord.garageName = String(req.body.garageName).trim();
    }
    if (req.body.technicianName && serviceRecord.recordSource === 'self_reported') {
      serviceRecord.technicianName = String(req.body.technicianName).trim();
    }

    // Ensure security fields are preserved (prevent elevation by owner)
    if (req.user.role === 'owner') {
      serviceRecord.recordSource = 'self_reported';
      serviceRecord.verificationStatus = 'self_reported';
    }

    await serviceRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Service record updated successfully.',
      data: {
        serviceRecord,
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

module.exports = {
  createServiceRecord,
  getVehicleServiceRecords,
  getServiceRecordById,
  updateServiceRecord,
};
