const mongoose = require('mongoose');
const ServiceRecord = require('../models/ServiceRecord');
const Vehicle = require('../models/Vehicle');
const AuditLog = require('../models/AuditLog');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const GarageInvoice = require('../models/GarageInvoice');

// @desc    Create a new service record
// @route   POST /api/services or POST /api/vehicles/:vehicleId/services
// @access  Private (Owner or Garage)
const createServiceRecord = async (req, res, next) => {
  try {
    let targetVehicleId = req.params.vehicleId || req.body.vehicleId;

    if (!targetVehicleId && (req.body.registrationNumber || req.body.regNumber)) {
      const reg = String(req.body.registrationNumber || req.body.regNumber).trim();
      const cleanReg = reg.replace(/\s+/g, '').toUpperCase();
      const foundVeh = await Vehicle.findOne({
        $or: [
          { registrationNumber: new RegExp(reg, 'i') },
          { registrationNumber: cleanReg },
        ],
      });
      if (foundVeh) {
        targetVehicleId = foundVeh._id;
      }
    }

    if (!targetVehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID or registered Registration Number is required.',
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
      description,
      category,
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

    const effectiveWork = String(workPerformed || description || '').trim();
    const effectiveType = String(serviceType || category || '').trim();
    const effectiveMileage = mileage !== undefined && mileage !== null ? mileage : req.body.mileageAtService;

    // Required fields validation
    if (!serviceDate || effectiveMileage === undefined || effectiveMileage === null || !effectiveType || !effectiveWork) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: serviceDate, mileage, serviceType, and description/workPerformed.',
      });
    }

    const parsedMileage = Number(effectiveMileage);
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

    // Future date validation
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (parsedDate > endOfToday) {
      return res.status(400).json({
        success: false,
        message: 'Service date cannot be in the future.',
      });
    }

    // Cost calculations & non-negative bounds validation
    const parsedLabour = labourCost !== undefined && labourCost !== '' ? Number(labourCost) : 0;
    const parsedParts = partsCost !== undefined && partsCost !== '' ? Number(partsCost) : 0;
    let parsedTotal = totalCost !== undefined && totalCost !== '' ? Number(totalCost) : 0;

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
      // BRULE-01: Only verified garages can update and certify service records
      if (req.user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only verified and active garage partners can create certified service records (BRULE-01). Your account is currently pending admin verification.',
        });
      }
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
      serviceType: effectiveType,
      workPerformed: effectiveWork,
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

    // Audit Trail logging (BRULE-04: Every record update must be logged)
    await AuditLog.create({
      action: 'SERVICE_RECORD_CREATED',
      vehicleId: vehicle._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.fullName || req.user.displayName,
      status: 'success',
      details: {
        recordId: serviceRecord._id,
        recordSource,
        serviceType: serviceRecord.serviceType,
        mileage: serviceRecord.mileage,
        totalCost: serviceRecord.totalCost,
      },
    });

    // Optionally update vehicle's currentMileage and lastServiceDate if this entry is newer
    if (parsedMileage > (vehicle.currentMileage || 0)) {
      vehicle.currentMileage = parsedMileage;
    }
    if (!vehicle.lastServiceDate || parsedDate > new Date(vehicle.lastServiceDate)) {
      vehicle.lastServiceDate = parsedDate;
    }
    await vehicle.save();

    // Auto-sync Expense for Vehicle Owner (BR-04, FR-03: Cost tracking)
    if (serviceRecord.totalCost > 0) {
      try {
        await Expense.create({
          vehicleId: vehicle._id,
          ownerId: vehicle.ownerId,
          serviceRecordId: serviceRecord._id,
          category: 'Maintenance',
          title: serviceRecord.serviceType || 'Vehicle Maintenance',
          description: serviceRecord.workPerformed || '',
          amount: serviceRecord.totalCost,
          expenseDate: serviceRecord.serviceDate,
          vendor: resolvedGarageName,
          paymentMethod: 'Bank Transfer / Card',
          source: 'service_record',
          notes: `Auto-generated from certified service record #${serviceRecord._id}`,
        });
      } catch (expErr) {
        console.warn('[Expense Sync Notice]:', expErr.message);
      }
    }

    // Auto-sync Notification for Vehicle Owner (BR-04, FR-06: Notifications & Reminders)
    try {
      await Notification.create({
        userId: vehicle.ownerId,
        vehicleId: vehicle._id,
        title: isGarage ? 'New Certified Service Record' : 'Service Record Logged',
        message: `${resolvedGarageName} recorded a maintenance milestone (${serviceRecord.serviceType}) for your ${vehicle.manufacturer} ${vehicle.model} (${vehicle.registrationNumber}).`,
        type: 'service',
        priority: 'medium',
        status: 'unread',
        source: 'service',
        relatedServiceRecordId: serviceRecord._id,
      });
    } catch (notifErr) {
      console.warn('[Notification Sync Notice]:', notifErr.message);
    }

    // Auto-sync Invoice for Verified Garage (BR-03: Invoices)
    if (isGarage) {
      try {
        const count = await GarageInvoice.countDocuments();
        const invoiceNum = `INV-PAW-${Date.now().toString().slice(-4)}-${count + 1}`;
        await GarageInvoice.create({
          garageId: req.user._id,
          vehicleId: vehicle._id,
          serviceRecordId: serviceRecord._id,
          invoiceNumber: invoiceNum,
          items: [
            {
              description: serviceRecord.workPerformed || serviceRecord.serviceType,
              quantity: 1,
              unitPrice: serviceRecord.totalCost,
              total: serviceRecord.totalCost,
            },
          ],
          labourCost: parsedLabour,
          partsCost: parsedParts,
          totalAmount: serviceRecord.totalCost,
          paymentStatus: 'paid',
          issueDate: serviceRecord.serviceDate,
          notes: `Certified ledger invoice for ${vehicle.registrationNumber}`,
        });
      } catch (invErr) {
        console.warn('[GarageInvoice Sync Notice]:', invErr.message);
      }
    }

    // Auto-sync VehicleDocument if an invoice file was uploaded (BR-03, FR-02)
    if (serviceRecord.invoiceUrl) {
      try {
        const VehicleDocument = require('../models/VehicleDocument');
        const path = require('path');
        const fileName = path.basename(serviceRecord.invoiceUrl);
        await VehicleDocument.create({
          vehicleId: vehicle._id,
          ownerId: vehicle.ownerId,
          uploadedBy: req.user._id,
          source: isGarage ? 'verified_garage' : 'owner_upload',
          documentType: 'Invoice',
          title: `Certified Invoice — ${serviceRecord.serviceType}`,
          description: `Service invoice issued by ${resolvedGarageName} for ${vehicle.registrationNumber}`,
          fileName: fileName,
          originalName: fileName,
          fileUrl: serviceRecord.invoiceUrl,
          mimeType: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          fileSize: 1024 * 1024,
          issueDate: serviceRecord.serviceDate,
          verificationStatus: isGarage ? 'verified' : 'self_reported',
          notes: `Certified maintenance milestone #${serviceRecord._id}`,
        });
      } catch (docErr) {
        console.warn('[VehicleDocument Sync Notice]:', docErr.message);
      }
    }

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

    // Garage authorization: only active/verified garages can view customer vehicle service history (BRULE-01)
    if (req.user.role === 'garage' && req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only verified and active garage partners can view vehicle service history (BRULE-01).',
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

    // Authorization check by role
    if (req.user.role === 'garage') {
      // BRULE-01: Only verified garages can update service records
      if (req.user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only verified and active garage partners can update service records (BRULE-01).',
        });
      }
      // Garage can only modify records created by their own workshop
      if (serviceRecord.garageId && serviceRecord.garageId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify service records created by your own workshop.',
        });
      }
    } else if (req.user.role === 'owner') {
      // Owner authorization: must own the vehicle
      if (vehicle.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to modify records for this vehicle.',
        });
      }
      // Strict provenance protection: owners can ONLY update self-reported records
      if (serviceRecord.recordSource !== 'self_reported') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Vehicle owners cannot modify records published and certified by verified garages.',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this service record.',
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

    // Audit Trail logging (BRULE-04: Every record update must be logged)
    await AuditLog.create({
      action: 'SERVICE_RECORD_UPDATED',
      vehicleId: vehicle._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.fullName,
      status: 'success',
      details: {
        recordId: serviceRecord._id,
        updatedFields: Object.keys(req.body),
      },
    });

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
