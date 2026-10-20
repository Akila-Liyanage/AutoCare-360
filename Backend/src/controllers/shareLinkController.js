const crypto = require('crypto');
const mongoose = require('mongoose');
const ShareLink = require('../models/ShareLink');
const Vehicle = require('../models/Vehicle');

// Helper to generate a 32-byte cryptographically secure random token (64 hex characters)
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper to compute SHA-256 hash of a raw token string
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Helper to sanitize share link document and guarantee sensitive hashes are removed
const sanitizeShareLink = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.tokenHash;
  delete obj.passcodeHash;
  return obj;
};

// Helper to update active links that have reached expiration
const updateExpiredLinksForOwner = async (ownerId) => {
  const now = new Date();
  await ShareLink.updateMany(
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

// @desc    Create a new secure vehicle share link
// @route   POST /api/share-links or POST /api/vehicles/:vehicleId/share-links
// @access  Private (Vehicle Owner only)
const createShareLink = async (req, res, next) => {
  try {
    // Authenticated owner authorization
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only registered vehicle owners can generate share links.',
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
        message: 'Access denied. You can only create share links for vehicles you currently own.',
      });
    }

    const {
      recipientName,
      recipientEmail,
      purpose,
      permissionLevel = 'limited',
      allowedSections,
      expiresAt,
      maxViews,
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

    // Validation: maxViews >= 1 if provided
    let parsedMaxViews = null;
    if (maxViews !== undefined && maxViews !== null) {
      parsedMaxViews = Number(maxViews);
      if (isNaN(parsedMaxViews) || parsedMaxViews < 1) {
        return res.status(400).json({
          success: false,
          message: 'maxViews must be a number greater than or equal to 1.',
        });
      }
    }

    // Validation: recipientEmail format if provided
    let normalizedRecipientEmail = '';
    if (recipientEmail && typeof recipientEmail === 'string' && recipientEmail.trim()) {
      normalizedRecipientEmail = recipientEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedRecipientEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid recipient email address.',
        });
      }
    }

    // Generate cryptographically secure raw token and its SHA-256 hash
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    const shareLink = await ShareLink.create({
      vehicleId: vehicle._id,
      ownerId: req.user._id,
      createdBy: req.user._id,
      tokenHash,
      recipientName: recipientName ? recipientName.trim() : '',
      recipientEmail: normalizedRecipientEmail,
      purpose: purpose ? purpose.trim() : '',
      permissionLevel,
      allowedSections: Array.isArray(allowedSections) ? allowedSections : [],
      expiresAt: expirationDate,
      maxViews: parsedMaxViews,
      viewCount: 0,
      status: 'active',
      notes: notes ? notes.trim() : '',
    });

    const sanitizedLink = sanitizeShareLink(shareLink);

    // Return the raw token ONLY once in the creation response
    return res.status(201).json({
      success: true,
      message: 'Secure vehicle share link generated successfully.',
      data: {
        shareLink: sanitizedLink,
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

// @desc    Get all share links generated by current owner
// @route   GET /api/share-links
// @access  Private (Owner only)
const getOwnerShareLinks = async (req, res, next) => {
  try {
    // 1. Run dynamic expiration update for owner's active links whose expiresAt <= now
    await updateExpiredLinksForOwner(req.user._id);

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

    const shareLinks = await ShareLink.find(query)
      .select('-tokenHash -passcodeHash')
      .populate('vehicleId', 'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: shareLinks.length,
      data: {
        shareLinks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single share link by ID
// @route   GET /api/share-links/:id
// @access  Private (Owner only)
const getShareLinkById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid share link ID format.',
      });
    }

    const shareLink = await ShareLink.findById(id)
      .populate('vehicleId', 'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage');

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found.',
      });
    }

    // Authorization: owner only
    if (shareLink.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this share link.',
      });
    }

    // Expiry check: if active but expiration has passed, update to expired
    if (shareLink.status === 'active' && shareLink.expiresAt <= new Date()) {
      shareLink.status = 'expired';
      await shareLink.save();
    }

    const sanitizedLink = sanitizeShareLink(shareLink);

    return res.status(200).json({
      success: true,
      data: {
        shareLink: sanitizedLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke an active share link
// @route   PATCH /api/share-links/:id/revoke
// @access  Private (Owner only)
const revokeShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid share link ID format.',
      });
    }

    const shareLink = await ShareLink.findById(id);
    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found.',
      });
    }

    // Authorization: owner only
    if (shareLink.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the link owner can revoke this share link.',
      });
    }

    // Check if link has already expired by timestamp
    if (shareLink.status === 'active' && shareLink.expiresAt <= new Date()) {
      shareLink.status = 'expired';
      await shareLink.save();
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke an expired share link.',
      });
    }

    // Only active links can be revoked
    if (shareLink.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot revoke share link with status "${shareLink.status}". Only active links can be revoked.`,
      });
    }

    shareLink.status = 'revoked';
    shareLink.revokedAt = new Date();
    await shareLink.save();

    const sanitizedLink = sanitizeShareLink(shareLink);

    return res.status(200).json({
      success: true,
      message: 'Share link revoked successfully.',
      data: {
        shareLink: sanitizedLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a share link (revoked or expired only)
// @route   DELETE /api/share-links/:id
// @access  Private (Owner only)
const deleteShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid share link ID format.',
      });
    }

    const shareLink = await ShareLink.findById(id);
    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found.',
      });
    }

    // Authorization: owner only
    if (shareLink.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the link owner can delete this share link.',
      });
    }

    // Dynamic expiry update if still active but past expiration date
    if (shareLink.status === 'active' && shareLink.expiresAt <= new Date()) {
      shareLink.status = 'expired';
      await shareLink.save();
    }

    // Prohibit deleting active links directly
    if (shareLink.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Active share links cannot be deleted directly. Please revoke the link before deleting.',
      });
    }

    await ShareLink.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Share link deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShareLink,
  getOwnerShareLinks,
  getShareLinkById,
  revokeShareLink,
  deleteShareLink,
};
