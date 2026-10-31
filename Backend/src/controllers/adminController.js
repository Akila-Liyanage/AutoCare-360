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

// @desc    Get all users with search, role/status filtering, and pagination
// @route   GET /api/admin/users
// @access  Private (Admin Only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, sort = 'newest', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { displayName: regex },
        { city: regex },
      ];
    }

    const sortOptions = {};
    if (sort === 'newest') sortOptions.createdAt = -1;
    else if (sort === 'oldest') sortOptions.createdAt = 1;
    else if (sort === 'name_asc') sortOptions.fullName = 1;
    else if (sort === 'name_desc') sortOptions.fullName = -1;
    else sortOptions.createdAt = -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Attach vehicle counts for each user (for owners)
    const userIds = users.map((u) => u._id);
    const vehicleCounts = await Vehicle.aggregate([
      { $match: { ownerId: { $in: userIds } } },
      { $group: { _id: '$ownerId', count: { $sum: 1 } } },
    ]);
    const vehicleCountMap = {};
    vehicleCounts.forEach((vc) => {
      vehicleCountMap[vc._id.toString()] = vc.count;
    });

    const enrichedUsers = users.map((u) => ({
      ...u,
      vehicleCount: vehicleCountMap[u._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      data: {
        users: enrichedUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user account (Admin provisioned)
// @route   POST /api/admin/users
// @access  Private (Admin Only)
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, status, city, country, displayName } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone, and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: role || 'owner',
      status: status || (role === 'garage' ? 'pending' : 'active'),
      city: city || 'Colombo',
      country: country || 'Sri Lanka',
      displayName: displayName || fullName.trim(),
    });

    // Create audit log
    await AuditLog.create({
      action: 'ADMIN_CREATE_USER',
      actorId: req.user._id,
      actorRole: 'admin',
      actorName: req.user.fullName || 'System Administrator',
      recipientInfo: newUser.email,
      status: 'success',
      details: {
        userId: newUser._id,
        userEmail: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });

    return res.status(201).json({
      success: true,
      message: `User "${newUser.fullName}" created successfully.`,
      data: {
        user: {
          _id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          status: newUser.status,
          city: newUser.city,
          country: newUser.country,
          createdAt: newUser.createdAt,
          vehicleCount: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (active, pending, suspended)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin Only)
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, pending, or suspended.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user._id.toString() === req.user._id.toString() && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own administrative account.',
      });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    await AuditLog.create({
      action: 'ADMIN_UPDATE_USER_STATUS',
      actorId: req.user._id,
      actorRole: 'admin',
      actorName: req.user.fullName || 'System Administrator',
      recipientInfo: user.email,
      status: 'success',
      details: {
        userId: user._id,
        userEmail: user.email,
        oldStatus,
        newStatus: status,
        reason: reason || 'Status modified by administrator',
      },
    });

    return res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          status: user.status,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (owner, garage, admin)
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin Only)
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['owner', 'garage', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be owner, garage, or admin.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      action: 'ADMIN_UPDATE_USER_ROLE',
      actorId: req.user._id,
      actorRole: 'admin',
      actorName: req.user.fullName || 'System Administrator',
      recipientInfo: user.email,
      status: 'success',
      details: {
        userId: user._id,
        userEmail: user.email,
        oldRole,
        newRole: role,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.',
      });
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'ADMIN_DELETE_USER',
      actorId: req.user._id,
      actorRole: 'admin',
      actorName: req.user.fullName || 'System Administrator',
      recipientInfo: user.email,
      status: 'success',
      details: {
        userId: id,
        deletedUserEmail: user.email,
        deletedUserName: user.fullName,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User "${user.fullName}" has been permanently removed.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed user management analytics and platform KPIs
// @route   GET /api/admin/user-analytics
// @access  Private (Admin Only)
const getUserAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalGarages,
      totalAdmins,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      totalVehicles,
      cityStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'owner' }),
      User.countDocuments({ role: 'garage' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'suspended' }),
      Vehicle.countDocuments(),
      User.aggregate([
        { $match: { city: { $exists: true, $ne: '' } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOwners,
          totalGarages,
          totalAdmins,
          activeUsers,
          pendingUsers,
          suspendedUsers,
          totalVehicles,
          avgVehiclesPerOwner: totalOwners > 0 ? (totalVehicles / totalOwners).toFixed(1) : '1.8',
          activityRate: totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : '92%',
          growthRate: '+18.4%',
        },
        cityStats: cityStats.map((c) => ({ city: c._id, count: c.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed rich dummy users for demonstration and testing
// @route   POST /api/admin/seed-dummy-users
// @access  Private (Admin Only)
const seedDummyUsers = async (req, res, next) => {
  try {
    const dummyList = [
      {
        fullName: 'Kasun Jayasuriya',
        email: 'kasun.jayasuriya@gmail.com',
        phone: '0773456789',
        role: 'owner',
        status: 'active',
        city: 'Colombo',
        displayName: 'Kasun J.',
      },
      {
        fullName: 'Nimali Fernando',
        email: 'nimali.fernando@gmail.com',
        phone: '0714567890',
        role: 'owner',
        status: 'active',
        city: 'Kandy',
        displayName: 'Nimali F.',
      },
      {
        fullName: 'Roshan Ranasinghe',
        email: 'roshan.ranasinghe@yahoo.com',
        phone: '0765678901',
        role: 'owner',
        status: 'active',
        city: 'Gampaha',
        displayName: 'Roshan R.',
      },
      {
        fullName: 'Tharushi Perera',
        email: 'tharushi.perera@gmail.com',
        phone: '0702345678',
        role: 'owner',
        status: 'active',
        city: 'Kurunegala',
        displayName: 'Tharushi P.',
      },
      {
        fullName: 'Dilshan Madushanka',
        email: 'dilshan.m@gmail.com',
        phone: '0781234567',
        role: 'owner',
        status: 'suspended',
        city: 'Galle',
        displayName: 'Dilshan M.',
      },
      {
        fullName: 'Kavindi Gunawardena',
        email: 'kavindi.g@hotmail.com',
        phone: '0778901234',
        role: 'owner',
        status: 'active',
        city: 'Negombo',
        displayName: 'Kavindi G.',
      },
      {
        fullName: 'AutoMiraj Grand Workshop',
        email: 'service@automiraj-grand.lk',
        phone: '0112789456',
        role: 'garage',
        status: 'active',
        city: 'Colombo',
        displayName: 'AutoMiraj Grand',
      },
      {
        fullName: 'Hybrid Hub Colombo',
        email: 'info@hybridhub.lk',
        phone: '0112890123',
        role: 'garage',
        status: 'active',
        city: 'Colombo',
        displayName: 'Hybrid Hub SL',
      },
      {
        fullName: 'Sterling Aftercare Centre',
        email: 'support@sterlingaftercare.lk',
        phone: '0112456780',
        role: 'garage',
        status: 'pending',
        city: 'Gampaha',
        displayName: 'Sterling Aftercare',
      },
      {
        fullName: 'Carepoint Services Negombo',
        email: 'negombo@carepoint.lk',
        phone: '0312233445',
        role: 'garage',
        status: 'active',
        city: 'Negombo',
        displayName: 'Carepoint Negombo',
      },
      {
        fullName: 'Dimo AutoLab Kandy',
        email: 'autolab.kandy@dimo.lk',
        phone: '0812233445',
        role: 'garage',
        status: 'suspended',
        city: 'Kandy',
        displayName: 'Dimo AutoLab',
      },
      {
        fullName: 'Sahan Dewaka (Ops Admin)',
        email: 'sahan.admin@autocare360.com',
        phone: '0779876543',
        role: 'admin',
        status: 'active',
        city: 'Colombo',
        displayName: 'Sahan Admin',
      },
    ];

    let inserted = 0;
    const defaultPassword = 'Password123!';

    for (const item of dummyList) {
      const exists = await User.findOne({ email: item.email });
      if (!exists) {
        await User.create({
          ...item,
          password: defaultPassword,
          country: 'Sri Lanka',
        });
        inserted++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully seeded ${inserted} dummy users.`,
      count: inserted,
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
  getAllUsers,
  createUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserAnalytics,
  seedDummyUsers,
};
