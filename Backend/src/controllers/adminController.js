const mongoose = require('mongoose');

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const AuditLog = require('../models/AuditLog');

// @desc    Get system-wide platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin Only)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalGarages,
      pendingGarages,
      totalVehicles,
      totalServiceRecords,
      totalAuditLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'owner' }),
      User.countDocuments({ role: 'garage' }),
      User.countDocuments({ role: 'garage', status: 'pending' }),
      Vehicle.countDocuments(),
      ServiceRecord.countDocuments(),
      AuditLog.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          owners: totalOwners,
          garages: totalGarages,
          pendingGarages,
        },
        vehicles: {
          total: totalVehicles,
        },
        serviceRecords: {
          total: totalServiceRecords,
        },
        auditLogs: {
          total: totalAuditLogs,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all garage accounts with filtering and search
// @route   GET /api/admin/garages
// @access  Private (Admin Only)
const getGarages = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = {
      role: 'garage',
    };

    if (
      status &&
      ['pending', 'active', 'suspended'].includes(status.toLowerCase())
    ) {
      query.status = status.toLowerCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { workshopName: searchRegex },
        { businessRegNumber: searchRegex },
        { city: searchRegex },
      ];
    }

    const garages = await User.find(query)
      .select('-password -__v')
      .populate('verifiedBy', 'fullName email')
      .sort({ createdAt: -1 });

    const safeGarages = garages.map((garage) => ({
      id: garage._id,
      _id: garage._id,
      fullName: garage.fullName,
      email: garage.email,
      phone: garage.phone,
      role: garage.role,
      workshopName:
        garage.workshopName || garage.displayName || garage.fullName,
      businessRegNumber: garage.businessRegNumber || '',
      city: garage.city || '',
      address: garage.address || '',
      status: garage.status,
      createdAt: garage.createdAt,
      updatedAt: garage.updatedAt,
      verifiedAt: garage.verifiedAt,
      verifiedBy: garage.verifiedBy,
      rejectionReason: garage.rejectionReason,
    }));

    return res.status(200).json({
      success: true,
      count: safeGarages.length,

      // Current garage verification frontend compatibility
      data: safeGarages,

      // Keep an additional named property for other consumers
      garages: safeGarages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single garage details
// @route   GET /api/admin/garages/:id
// @access  Private (Admin Only)
const getGarageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garage ID format.',
      });
    }

    const garage = await User.findOne({
      _id: id,
      role: 'garage',
    })
      .select('-password -__v')
      .populate('verifiedBy', 'fullName email');

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage partner account not found.',
      });
    }

    const safeData = {
      id: garage._id,
      _id: garage._id,
      fullName: garage.fullName,
      email: garage.email,
      phone: garage.phone,
      role: garage.role,
      workshopName:
        garage.workshopName || garage.displayName || garage.fullName,
      businessRegNumber: garage.businessRegNumber || '',
      city: garage.city || '',
      address: garage.address || '',
      status: garage.status,
      createdAt: garage.createdAt,
      updatedAt: garage.updatedAt,
      verifiedAt: garage.verifiedAt,
      verifiedBy: garage.verifiedBy,
      rejectionReason: garage.rejectionReason,
    };

    return res.status(200).json({
      success: true,
      data: safeData,
    });
  } catch (error) {
    next(error);
  }
};

// Shared internal helper for approving/verifying garage
const activateGarage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garage ID format.',
      });
    }

    const garage = await User.findOne({
      _id: id,
      role: 'garage',
    });

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage partner account not found.',
      });
    }

    garage.status = 'active';

    // Keep verification metadata when schema supports it
    garage.verifiedAt = new Date();
    garage.verifiedBy = req.user._id;
    garage.rejectionReason = null;

    await garage.save();

    try {
      await garage.populate('verifiedBy', 'fullName email');
    } catch (error) {
      // Do not fail activation if populate is unavailable.
    }

    // Preserve the audit behaviour from main
    try {
      await AuditLog.create({
        action: 'ADMIN_VERIFY_GARAGE',
        actorId: req.user._id,
        actorRole: 'admin',
        actorName: req.user.fullName || 'System Administrator',
        recipientInfo: garage.email,
        status: 'success',
        details: {
          garageId: garage._id,
          garageName: garage.fullName,
          newStatus: 'active',
        },
      });
    } catch (error) {
      console.warn('Garage verification audit log failed:', error.message);
    }

    const safeData = {
      id: garage._id,
      _id: garage._id,
      fullName: garage.fullName,
      email: garage.email,
      phone: garage.phone,
      role: garage.role,
      workshopName:
        garage.workshopName || garage.displayName || garage.fullName,
      businessRegNumber: garage.businessRegNumber || '',
      city: garage.city || '',
      address: garage.address || '',
      status: garage.status,
      createdAt: garage.createdAt,
      updatedAt: garage.updatedAt,
      verifiedAt: garage.verifiedAt,
      verifiedBy: garage.verifiedBy,
      rejectionReason: garage.rejectionReason,
    };

    return res.status(200).json({
      success: true,
      message: `Garage partner "${garage.fullName}" has been verified and activated.`,
      data: safeData,
    });
  } catch (error) {
    next(error);
  }
};

// Support both route names from the two branches
const approveGarage = activateGarage;
const verifyGarage = activateGarage;

// @desc    Reject/suspend garage with a reason
// @route   PATCH /api/admin/garages/:id/reject
// @access  Private (Admin Only)
const rejectGarage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garage ID format.',
      });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection or suspension reason is required.',
      });
    }

    const garage = await User.findOne({
      _id: id,
      role: 'garage',
    });

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage partner account not found.',
      });
    }

    garage.status = 'suspended';
    garage.rejectionReason = reason.trim();

    await garage.save();

    if (garage.verifiedBy) {
      try {
        await garage.populate('verifiedBy', 'fullName email');
      } catch (error) {
        // Ignore populate failure
      }
    }

    try {
      await AuditLog.create({
        action: 'ADMIN_UPDATE_GARAGE_STATUS',
        actorId: req.user._id,
        actorRole: 'admin',
        actorName: req.user.fullName || 'System Administrator',
        recipientInfo: garage.email,
        status: 'success',
        details: {
          garageId: garage._id,
          newStatus: 'suspended',
          reason: reason.trim(),
        },
      });
    } catch (error) {
      console.warn('Garage rejection audit log failed:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Garage partner account has been suspended/rejected.',
      data: garage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update garage status
// @route   PATCH /api/admin/garages/:id/status
// @access  Private (Admin Only)
const updateGarageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garage ID format.',
      });
    }

    if (!['active', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be active, pending, or suspended.',
      });
    }

    const garage = await User.findOne({
      _id: id,
      role: 'garage',
    });

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage partner account not found.',
      });
    }

    garage.status = status;

    if (status === 'suspended' && reason) {
      garage.rejectionReason = reason.trim();
    }

    if (status === 'active') {
      garage.rejectionReason = null;
    }

    await garage.save();

    try {
      await AuditLog.create({
        action: 'ADMIN_UPDATE_GARAGE_STATUS',
        actorId: req.user._id,
        actorRole: 'admin',
        actorName: req.user.fullName || 'System Administrator',
        recipientInfo: garage.email,
        status: 'success',
        details: {
          garageId: garage._id,
          newStatus: status,
        },
      });
    } catch (error) {
      console.warn('Garage status audit log failed:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: `Garage status updated to ${status}.`,
      data: garage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin Only)
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      action,
      vehicleId,
      limit = 50,
      page = 1,
    } = req.query;

    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (
      vehicleId &&
      mongoose.Types.ObjectId.isValid(vehicleId)
    ) {
      filter.vehicleId = vehicleId;
    }

    const limitNum = Math.min(Number(limit) || 50, 100);
    const pageNum = Math.max(Number(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate(
          'vehicleId',
          'registrationNumber manufacturer model'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: {
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,

  getGarages,
  getGarageById,

  approveGarage,
  verifyGarage,

  rejectGarage,
  updateGarageStatus,

  getAuditLogs,
};