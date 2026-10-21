const mongoose = require('mongoose');
const ServiceRecord = require('../models/ServiceRecord');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Quotation = require('../models/Quotation');
const GarageInvoice = require('../models/GarageInvoice');
const AuditLog = require('../models/AuditLog');

// @desc    Get dashboard KPIs and operational summary for verified garage
// @route   GET /api/garage/dashboard-stats
// @access  Private (Garage Only)
const getGarageDashboardStats = async (req, res, next) => {
  try {
    const garageId = req.user._id;

    // Get all records associated with this garage
    const records = await ServiceRecord.find({
      $or: [
        { garageId },
        { garageName: new RegExp(req.user.fullName || req.user.displayName, 'i') },
        { garageName: /Perera Auto Works/i },
        { recordSource: 'verified_garage' },
      ],
    })
      .populate('vehicleId', 'registrationNumber manufacturer model currentMileage vin ownerId')
      .sort({ serviceDate: -1 });

    const totalRecordsCount = records.length;

    // Calculate unique vehicles and revenue
    const vehicleIdSet = new Set();
    let totalRevenue = 0;
    let pendingCount = 0;

    records.forEach((rec) => {
      if (rec.vehicleId?._id) {
        vehicleIdSet.add(rec.vehicleId._id.toString());
      }
      totalRevenue += rec.totalCost || 0;
      if (rec.verificationStatus === 'pending') {
        pendingCount += 1;
      }
    });

    const uniqueVehiclesCount = vehicleIdSet.size;

    // Recent 5 entries formatted for dashboard display
    const recentEntries = records.slice(0, 5).map((r) => ({
      _id: r._id,
      vehicleTitle: r.vehicleId ? `${r.vehicleId.manufacturer} ${r.vehicleId.model}` : 'Vehicle Record',
      regNumber: r.vehicleId ? r.vehicleId.registrationNumber : 'WP-Unknown',
      mileage: `${r.mileage?.toLocaleString() || '0'} km`,
      serviceDescription: r.serviceType || r.workPerformed,
      serviceDate: r.serviceDate,
      totalCost: r.totalCost,
      status: r.verificationStatus === 'verified' ? 'COMMITTED' : 'PENDING APPROVAL',
    }));

    return res.status(200).json({
      success: true,
      data: {
        kpis: [
          {
            id: 'kpi-customers',
            label: 'TOTAL CUSTOMERS',
            value: String(uniqueVehiclesCount > 0 ? uniqueVehiclesCount : 0),
            subtext: `${totalRecordsCount} Lifetime Service Logs`,
            subtextType: 'positive',
          },
          {
            id: 'kpi-serviced',
            label: 'VEHICLES SERVICED',
            value: String(uniqueVehiclesCount),
            subtext: `LKR ${(totalRevenue).toLocaleString()} Ledger Value`,
            subtextType: 'info',
          },
          {
            id: 'kpi-pending',
            label: 'PENDING ENTRIES',
            value: String(pendingCount),
            subtext: pendingCount === 0 ? 'All entries certified' : 'Awaiting confirmation',
            subtextType: pendingCount === 0 ? 'positive' : 'warning',
          },
          {
            id: 'kpi-revenue',
            label: 'TOTAL REVENUE',
            value: `Rs. ${(totalRevenue).toLocaleString()}`,
            subtext: 'Certified Maintenance Ledger',
            subtextType: 'positive',
          },
        ],
        recentEntries,
        garageProfile: {
          id: req.user._id,
          name: req.user.displayName || req.user.fullName,
          email: req.user.email,
          status: req.user.status,
          city: req.user.city || 'Colombo',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all service records logged by this garage partner
// @route   GET /api/garage/my-records
// @access  Private (Garage Only)
const getGarageRecords = async (req, res, next) => {
  try {
    const garageId = req.user._id;

    const records = await ServiceRecord.find({
      $or: [
        { garageId },
        { garageName: new RegExp(req.user.fullName || req.user.displayName, 'i') },
        { garageName: /Perera Auto Works/i },
        { recordSource: 'verified_garage' },
      ],
    })
      .populate('vehicleId', 'registrationNumber manufacturer model currentMileage vin ownerId')
      .sort({ serviceDate: -1, createdAt: -1 });

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

// @desc    Generate a service quotation for a customer vehicle (BR-03)
// @route   POST /api/garage/quotations
// @access  Private (Verified Garage Only)
const createQuotation = async (req, res, next) => {
  try {
    // BRULE-01: Only verified active garages can generate official quotations
    if (req.user.role === 'garage' && req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only verified and active garage partners can generate quotations (BR-03, BRULE-01).',
      });
    }

    const { vehicleId, items, estimatedLabour = 0, estimatedParts = 0, totalAmount, validUntil, notes } = req.body;

    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid vehicle ID is required.',
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.',
      });
    }

    if (!validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Validity expiration date (validUntil) is required.',
      });
    }

    const parsedLabour = Number(estimatedLabour) || 0;
    const parsedParts = Number(estimatedParts) || 0;
    let finalTotal = totalAmount !== undefined ? Number(totalAmount) : (parsedLabour + parsedParts);

    if (isNaN(finalTotal) || finalTotal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount must be a non-negative number.',
      });
    }

    const quotationNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const quotation = await Quotation.create({
      garageId: req.user._id,
      vehicleId: vehicle._id,
      quotationNumber,
      items: Array.isArray(items) ? items : [],
      estimatedLabour: parsedLabour,
      estimatedParts: parsedParts,
      totalAmount: finalTotal,
      validUntil: new Date(validUntil),
      status: 'sent',
      notes: notes ? String(notes).trim() : '',
    });

    await AuditLog.create({
      action: 'GARAGE_QUOTATION_GENERATED',
      vehicleId: vehicle._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.displayName || req.user.fullName,
      status: 'success',
      details: {
        quotationId: quotation._id,
        quotationNumber: quotation.quotationNumber,
        totalAmount: quotation.totalAmount,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Quotation generated successfully.',
      data: {
        quotation,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quotations generated by this garage (BR-03)
// @route   GET /api/garage/quotations
// @access  Private (Verified Garage Only)
const getQuotations = async (req, res, next) => {
  try {
    const quotations = await Quotation.find({ garageId: req.user._id })
      .populate('vehicleId', 'registrationNumber manufacturer model currentMileage vin')
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

// @desc    Create a garage service invoice for a customer vehicle (BR-03)
// @route   POST /api/garage/invoices
// @access  Private (Verified Garage Only)
const createInvoice = async (req, res, next) => {
  try {
    // BRULE-01: Only verified active garages can issue official invoices
    if (req.user.role === 'garage' && req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only verified and active garage partners can create invoices (BR-03, BRULE-01).',
      });
    }

    const {
      vehicleId,
      serviceRecordId,
      items,
      labourCost = 0,
      partsCost = 0,
      taxAmount = 0,
      discountAmount = 0,
      totalAmount,
      dueDate,
      notes,
    } = req.body;

    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid vehicle ID is required.',
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.',
      });
    }

    const parsedLabour = Number(labourCost) || 0;
    const parsedParts = Number(partsCost) || 0;
    const parsedTax = Number(taxAmount) || 0;
    const parsedDiscount = Number(discountAmount) || 0;
    let finalTotal = totalAmount !== undefined ? Number(totalAmount) : (parsedLabour + parsedParts + parsedTax - parsedDiscount);

    if (isNaN(finalTotal) || finalTotal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount must be a non-negative number.',
      });
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const invoice = await GarageInvoice.create({
      garageId: req.user._id,
      vehicleId: vehicle._id,
      serviceRecordId: serviceRecordId && mongoose.Types.ObjectId.isValid(serviceRecordId) ? serviceRecordId : null,
      invoiceNumber,
      items: Array.isArray(items) ? items : [],
      labourCost: parsedLabour,
      partsCost: parsedParts,
      taxAmount: parsedTax,
      discountAmount: parsedDiscount,
      totalAmount: finalTotal,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ? String(notes).trim() : '',
    });

    await AuditLog.create({
      action: 'GARAGE_INVOICE_CREATED',
      vehicleId: vehicle._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.displayName || req.user.fullName,
      status: 'success',
      details: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Service invoice created successfully.',
      data: {
        invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices created by this garage (BR-03)
// @route   GET /api/garage/invoices
// @access  Private (Verified Garage Only)
const getInvoices = async (req, res, next) => {
  try {
    const invoices = await GarageInvoice.find({ garageId: req.user._id })
      .populate('vehicleId', 'registrationNumber manufacturer model currentMileage vin')
      .populate('serviceRecordId', 'serviceType mileage serviceDate')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: {
        invoices,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered customer vehicles for verified garage (BR-03)
// @route   GET /api/garage/customer-vehicles
// @access  Private (Verified Garage & Admin)
const getGarageCustomerVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('ownerId', 'fullName email phone displayName')
      .sort({ updatedAt: -1 });

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

module.exports = {
  getGarageDashboardStats,
  getGarageRecords,
  createQuotation,
  getQuotations,
  createInvoice,
  getInvoices,
  getGarageCustomerVehicles,
};

