const mongoose = require('mongoose');
const User = require('../models/User');

// @desc    Get all garage accounts with status filtering and search
// @route   GET /api/admin/garages
// @access  Private (Admin only)
const getGarages = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = { role: 'garage' };

    // Status filter
    if (status && ['pending', 'active', 'suspended'].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    // Search query across name, email, workshop name, BRN, city
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

    const safeGarages = garages.map((g) => ({
      id: g._id,
      _id: g._id,
      fullName: g.fullName,
      email: g.email,
      phone: g.phone,
      workshopName: g.workshopName || g.displayName || g.fullName,
      businessRegNumber: g.businessRegNumber || '',
      city: g.city || '',
      address: g.address || '',
      status: g.status,
      createdAt: g.createdAt,
      verifiedAt: g.verifiedAt,
      verifiedBy: g.verifiedBy,
      rejectionReason: g.rejectionReason,
    }));

    return res.status(200).json({
      success: true,
      count: safeGarages.length,
      data: safeGarages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single garage details for verification review
// @route   GET /api/admin/garages/:id
// @access  Private (Admin only)
const getGarageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garage ID format.',
      });
    }

    const garage = await User.findOne({ _id: id, role: 'garage' })
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
      workshopName: garage.workshopName || garage.displayName || garage.fullName,
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

// @desc    Approve a pending or suspended garage account
// @route   PATCH /api/admin/garages/:id/approve
// @access  Private (Admin only)
const approveGarage = async (req, res, next) => {
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
        message: 'Garage partner account not found.',
      });
    }

    garage.status = 'active';
    garage.verifiedAt = new Date();
    garage.verifiedBy = req.user._id;
    garage.rejectionReason = null;

    await garage.save();
    await garage.populate('verifiedBy', 'fullName email');

    const safeData = {
      id: garage._id,
      _id: garage._id,
      fullName: garage.fullName,
      email: garage.email,
      phone: garage.phone,
      workshopName: garage.workshopName || garage.displayName || garage.fullName,
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
      message: 'Garage partner account successfully approved and activated.',
      data: safeData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject or suspend a garage account with reason
// @route   PATCH /api/admin/garages/:id/reject
// @access  Private (Admin only)
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

    const garage = await User.findOne({ _id: id, role: 'garage' });

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
      await garage.populate('verifiedBy', 'fullName email');
    }

    const safeData = {
      id: garage._id,
      _id: garage._id,
      fullName: garage.fullName,
      email: garage.email,
      phone: garage.phone,
      workshopName: garage.workshopName || garage.displayName || garage.fullName,
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
      message: 'Garage partner account has been suspended/rejected.',
      data: safeData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGarages,
  getGarageById,
  approveGarage,
  rejectGarage,
};
