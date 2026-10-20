const crypto = require('crypto');
const mongoose = require('mongoose');
const QRShare = require('../models/QRShare');
const Vehicle = require('../models/Vehicle');

// Helper to generate a 32-byte cryptographically secure random token (64 hex characters)
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper to compute SHA-256 hash of a raw token string
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Helper to sanitize QR share document and guarantee tokenHash is never leaked
const sanitizeQRShare = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.tokenHash;
  return obj;
};

// Helper to update active QR shares that have reached expiration
const updateExpiredQRSharesForOwner = async (ownerId) => {
  const now = new Date();
  await QRShare.updateMany(
    {
      ownerId,
      status: 'active',
      expiresAt: { $lte: now },
    },
    {
      $set: { status: 'expired' },
    }
  );
};

// @desc    Create a new secure vehicle QR share
// @route   POST /api/qr-shares or POST /api/vehicles/:vehicleId/qr-shares
// @access  Private (Vehicle Owner only)
const createQRShare = async (req, res, next) => {
  try {
    // Authenticated owner authorization
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only registered vehicle owners can generate QR shares.',
      });
    }

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

    // Ownership check: must currently own the vehicle
    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create QR shares for vehicles you currently own.',
      });
    }

    const {
      purpose,
      permissionLevel = 'limited',
      allowedSections,
      expiresAt,
      maxScans,
      qrLabel,
      recipientName,
      notes,
    } = req.body;

    // Validation: expiresAt must be provided, valid, and in the future
    if (!expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date/time (expiresAt) is required.',
      });
    }

    const expirationDate = new Date(expiresAt);
    if (isNaN(expirationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiration date format.',
      });
    }

    if (expirationDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date must be in the future.',
      });
    }

    // Validation: permissionLevel enum
    const validPermissionLevels = ['full', 'limited', 'selected'];
    if (!validPermissionLevels.includes(permissionLevel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid permission level: "${permissionLevel}". Must be one of: ${validPermissionLevels.join(', ')}.`,
      });
    }

    // Validation: if permissionLevel = selected, allowedSections must not be empty
    if (
      permissionLevel === 'selected' &&
      (!Array.isArray(allowedSections) || allowedSections.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'allowedSections array must not be empty when permissionLevel is "selected".',
      });
    }

    // Validation: maxScans >= 1 if provided
    let parsedMaxScans = null;
    if (maxScans !== undefined && maxScans !== null && maxScans !== '') {
      parsedMaxScans = Number(maxScans);
      if (isNaN(parsedMaxScans) || parsedMaxScans < 1) {
        return res.status(400).json({
          success: false,
          message: 'maxScans must be a number greater than or equal to 1.',
        });
      }
    }

    // Generate cryptographically secure raw token (64 hex characters)
    const rawToken = generateSecureToken();

    // Compute SHA-256 hash to persist in database
    const tokenHash = hashToken(rawToken);

    const qrShare = await QRShare.create({
      vehicleId: targetVehicleId,
      ownerId: req.user._id,
      tokenHash,
      purpose: typeof purpose === 'string' ? purpose.trim() : '',
      permissionLevel,
      allowedSections: permissionLevel === 'selected' ? allowedSections : allowedSections || [],
      expiresAt: expirationDate,
      status: 'active',
      maxScans: parsedMaxScans,
      scanCount: 0,
      qrLabel: typeof qrLabel === 'string' ? qrLabel.trim() : '',
      recipientName: typeof recipientName === 'string' ? recipientName.trim() : '',
      createdBy: req.user._id,
      notes: typeof notes === 'string' ? notes.trim() : '',
    });

    await qrShare.populate(
      'vehicleId',
      'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage'
    );

    const sanitizedQRShare = sanitizeQRShare(qrShare);

    // Return raw token ONLY once in the create response
    return res.status(201).json({
      success: true,
      message: 'Secure QR share generated successfully.',
      data: {
        qrShare: sanitizedQRShare,
        rawToken,
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

// @desc    Get all QR shares generated by current owner
// @route   GET /api/qr-shares
// @access  Private (Owner only)
const getOwnerQRShares = async (req, res, next) => {
  try {
    // 1. Run dynamic expiration update for owner's active QR shares whose expiresAt <= now
    await updateExpiredQRSharesForOwner(req.user._id);

    const query = {
      ownerId: req.user._id,
    };

    // Optional vehicleId filter (from params or query)
    const targetVehicleId = req.params?.vehicleId || req.query?.vehicleId;
    if (targetVehicleId) {
      if (!mongoose.Types.ObjectId.isValid(targetVehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format.',
        });
      }
      query.vehicleId = targetVehicleId;
    }

    // Optional status filter
    if (req.query?.status) {
      const validStatuses = ['active', 'revoked', 'expired'];
      if (!validStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}.`,
        });
      }
      query.status = req.query.status;
    }

    const qrShares = await QRShare.find(query)
      .select('-tokenHash')
      .populate(
        'vehicleId',
        'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage'
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: qrShares.length,
      data: {
        qrShares,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single QR share by ID
// @route   GET /api/qr-shares/:id
// @access  Private (Owner only)
const getQRShareById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR share ID format.',
      });
    }

    const qrShare = await QRShare.findById(id).populate(
      'vehicleId',
      'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage'
    );

    if (!qrShare) {
      return res.status(404).json({
        success: false,
        message: 'QR share not found.',
      });
    }

    // Authorization: owner only
    if (qrShare.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this QR share.',
      });
    }

    // Expiry check: if active but expiration has passed, update to expired
    if (qrShare.status === 'active' && qrShare.expiresAt <= new Date()) {
      qrShare.status = 'expired';
      await qrShare.save();
    }

    const sanitizedQRShare = sanitizeQRShare(qrShare);

    return res.status(200).json({
      success: true,
      data: {
        qrShare: sanitizedQRShare,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke an active QR share
// @route   PATCH /api/qr-shares/:id/revoke
// @access  Private (Owner only)
const revokeQRShare = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR share ID format.',
      });
    }

    const qrShare = await QRShare.findById(id);
    if (!qrShare) {
      return res.status(404).json({
        success: false,
        message: 'QR share not found.',
      });
    }

    // Authorization: owner only
    if (qrShare.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the QR share owner can revoke this QR share.',
      });
    }

    // Check if QR share has already expired by timestamp
    if (qrShare.status === 'active' && qrShare.expiresAt <= new Date()) {
      qrShare.status = 'expired';
      await qrShare.save();
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke an expired QR share.',
      });
    }

    // Only active QR shares can be revoked
    if (qrShare.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot revoke QR share with status "${qrShare.status}". Only active QR shares can be revoked.`,
      });
    }

    qrShare.status = 'revoked';
    qrShare.revokedAt = new Date();
    await qrShare.save();

    const sanitizedQRShare = sanitizeQRShare(qrShare);

    return res.status(200).json({
      success: true,
      message: 'QR share revoked successfully.',
      data: {
        qrShare: sanitizedQRShare,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a QR share (revoked or expired only)
// @route   DELETE /api/qr-shares/:id
// @access  Private (Owner only)
const deleteQRShare = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR share ID format.',
      });
    }

    const qrShare = await QRShare.findById(id);
    if (!qrShare) {
      return res.status(404).json({
        success: false,
        message: 'QR share not found.',
      });
    }

    // Authorization: owner only
    if (qrShare.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the QR share owner can delete this QR share.',
      });
    }

    // Dynamic expiry update if still active but past expiration date
    if (qrShare.status === 'active' && qrShare.expiresAt <= new Date()) {
      qrShare.status = 'expired';
      await qrShare.save();
    }

    // Prohibit deleting active QR shares directly
    if (qrShare.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Active QR shares cannot be deleted directly. Please revoke the QR share before deleting.',
      });
    }

    await QRShare.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'QR share deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQRShare,
  getOwnerQRShares,
  getQRShareById,
  revokeQRShare,
  deleteQRShare,
};
