const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const AuditLog = require('../models/AuditLog');
const Expense = require('../models/Expense');

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

// @desc    Get list of garages (with optional status filter)
// @route   GET /api/admin/garages
// @access  Private (Admin Only)
const getGarages = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { role: 'garage' };
    if (status) {
      filter.status = status;
    }

    const garages = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: garages.length,
      data: {
        garages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify and activate a garage partner (BRULE-01, FR-05)
// @route   PATCH /api/admin/garages/:id/verify
// @access  Private (Admin Only)
const verifyGarage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garage ID format.',
      });
    }

    const garage = await User.findOne({ _id: id, role: 'garage' });
    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage partner not found.',
      });
    }

    garage.status = 'active';
    await garage.save();

    // Log admin action to AuditLog
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

    return res.status(200).json({
      success: true,
      message: `Garage partner "${garage.fullName}" has been verified and activated.`,
      data: {
        garage: {
          id: garage._id,
          fullName: garage.fullName,
          email: garage.email,
          status: garage.status,
          role: garage.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or update garage status
// @route   PATCH /api/admin/garages/:id/status
// @access  Private (Admin Only)
const updateGarageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be active, pending, or suspended.',
      });
    }

    const garage = await User.findOne({ _id: id, role: 'garage' });
    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage partner not found.',
      });
    }

    garage.status = status;
    await garage.save();

    await AuditLog.create({
      action: 'ADMIN_UPDATE_GARAGE_STATUS',
      actorId: req.user._id,
      actorRole: 'admin',
      actorName: req.user.fullName,
      recipientInfo: garage.email,
      status: 'success',
      details: { garageId: garage._id, newStatus: status },
    });

    return res.status(200).json({
      success: true,
      message: `Garage status updated to ${status}.`,
      data: { garage },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs with filters (BR-08)
// @route   GET /api/admin/audit-logs
// @access  Private (Admin Only)
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, vehicleId, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      filter.vehicleId = vehicleId;
    }

    const limitNum = Math.min(Number(limit) || 50, 100);
    const skip = (Number(page) - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('vehicleId', 'registrationNumber manufacturer model')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
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
  verifyGarage,
  updateGarageStatus,
  getAuditLogs,
};
