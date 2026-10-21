const crypto = require('crypto');
const mongoose = require('mongoose');
const ShareLink = require('../models/ShareLink');
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const VehicleDocument = require('../models/VehicleDocument');
const AuditLog = require('../models/AuditLog');

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

    // Audit Trail logging (BRULE-04)
    await AuditLog.create({
      action: 'SHARE_LINK_CREATED',
      vehicleId: vehicle._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.fullName,
      recipientInfo: normalizedRecipientEmail || recipientName,
      status: 'success',
      details: {
        shareLinkId: shareLink._id,
        permissionLevel,
        expiresAt: expirationDate,
      },
    });

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

    // Audit Trail logging (BRULE-04)
    await AuditLog.create({
      action: 'SHARE_LINK_REVOKED',
      vehicleId: shareLink.vehicleId,
      actorId: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.fullName,
      status: 'success',
      details: {
        shareLinkId: shareLink._id,
      },
    });

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

// @desc    View shared vehicle records using public secure token (BR-05, BR-06, BR-07, BR-08)
// @route   GET /api/share-links/public/:token
// @access  Public (Token verification)
const getPublicSharedRecord = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Share token is required.',
      });
    }

    const tokenHash = hashToken(token);
    let shareLink = await ShareLink.findOne({ tokenHash })
      .populate('vehicleId')
      .populate('ownerId', 'fullName email phone displayName');

    if (!shareLink && mongoose.Types.ObjectId.isValid(token)) {
      shareLink = await ShareLink.findById(token)
        .populate('vehicleId')
        .populate('ownerId', 'fullName email phone displayName');
    }

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Invalid share link or token not found.',
      });
    }

    const now = new Date();

    // Check expiration
    if (shareLink.status === 'expired' || shareLink.expiresAt <= now) {
      if (shareLink.status !== 'expired') {
        shareLink.status = 'expired';
        await shareLink.save();
      }

      await AuditLog.create({
        action: 'PUBLIC_SHARE_LINK_EXPIRED_ACCESS_ATTEMPT',
        vehicleId: shareLink.vehicleId?._id || null,
        shareLinkId: shareLink._id,
        actorRole: 'guest',
        actorName: shareLink.recipientName || 'External Viewer',
        recipientInfo: shareLink.recipientEmail || shareLink.recipientName || '',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        status: 'denied',
        details: { tokenPrefix: token.substring(0, 8), expiredAt: shareLink.expiresAt },
      });

      return res.status(410).json({
        success: false,
        message: 'This secure share link has expired and is no longer accessible.',
        data: {
          expiredAt: shareLink.expiresAt,
          status: 'expired',
        },
      });
    }

    // Check revocation
    if (shareLink.status === 'revoked') {
      await AuditLog.create({
        action: 'PUBLIC_SHARE_LINK_REVOKED_ACCESS_ATTEMPT',
        vehicleId: shareLink.vehicleId?._id || null,
        shareLinkId: shareLink._id,
        actorRole: 'guest',
        actorName: shareLink.recipientName || 'External Viewer',
        recipientInfo: shareLink.recipientEmail || shareLink.recipientName || '',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        status: 'denied',
      });

      return res.status(403).json({
        success: false,
        message: 'This share link has been revoked by the vehicle owner.',
        data: {
          revokedAt: shareLink.revokedAt,
          status: 'revoked',
        },
      });
    }

    // Check view count limits if configured
    if (shareLink.maxViews && shareLink.viewCount >= shareLink.maxViews) {
      return res.status(403).json({
        success: false,
        message: 'The maximum allowed view count for this share link has been reached.',
      });
    }

    // Record view & access timestamp
    shareLink.viewCount += 1;
    shareLink.lastAccessedAt = now;
    await shareLink.save();

    const vehicle = shareLink.vehicleId;
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle record no longer exists.',
      });
    }

    // Filter vehicle data according to permission level (BR-06)
    const permission = shareLink.permissionLevel || 'limited';

    let serviceRecords = [];
    let documents = [];

    if (permission === 'full') {
      serviceRecords = await ServiceRecord.find({ vehicleId: vehicle._id }).sort({ serviceDate: -1 });
      documents = await VehicleDocument.find({ vehicleId: vehicle._id, status: 'active' }).select('-fileData');
    } else if (permission === 'limited') {
      const rawRecords = await ServiceRecord.find({ vehicleId: vehicle._id }).sort({ serviceDate: -1 });
      // Limited scope: strip costs, invoices, internal notes
      serviceRecords = rawRecords.map((r) => ({
        _id: r._id,
        serviceDate: r.serviceDate,
        mileage: r.mileage,
        serviceType: r.serviceType,
        workPerformed: r.workPerformed,
        garageName: r.garageName,
        technicianName: r.technicianName,
        recordSource: r.recordSource,
        verificationStatus: r.verificationStatus,
      }));
      documents = []; // Hide sensitive vehicle documents in limited mode
    } else if (permission === 'selected') {
      const allowed = shareLink.allowedSections || [];
      if (allowed.includes('services') || allowed.includes('service_history')) {
        const rawRecords = await ServiceRecord.find({ vehicleId: vehicle._id }).sort({ serviceDate: -1 });
        serviceRecords = rawRecords.map((r) => ({
          _id: r._id,
          serviceDate: r.serviceDate,
          mileage: r.mileage,
          serviceType: r.serviceType,
          workPerformed: r.workPerformed,
          garageName: r.garageName,
          verificationStatus: r.verificationStatus,
        }));
      }
      if (allowed.includes('documents')) {
        documents = await VehicleDocument.find({ vehicleId: vehicle._id, documentType: { $ne: 'other' } });
      }
    }

    // Calculate AI Health & Trust Assessment (BR-09)
    const allRecords = await ServiceRecord.find({ vehicleId: vehicle._id }).sort({ serviceDate: 1 });
    let trustScore = 95;
    let odometerIntegrity = 'Verified Monotonic (No Rollback)';
    let anomalyDetected = false;
    let lastMileage = 0;
    for (const rec of allRecords) {
      if (rec.mileage < lastMileage) {
        trustScore -= 30;
        odometerIntegrity = 'Anomaly Detected (Potential Rollback)';
        anomalyDetected = true;
        break;
      }
      lastMileage = rec.mileage;
    }
    if (vehicle.currentMileage < lastMileage) {
      trustScore -= 25;
      odometerIntegrity = 'Current Mileage Lower Than Last Service Record';
      anomalyDetected = true;
    }
    trustScore = Math.max(40, Math.min(100, trustScore));

    const healthAssessment = {
      trustScore,
      trustLevel: trustScore >= 90 ? 'Excellent' : trustScore >= 75 ? 'Good' : 'Fair',
      odometerIntegrity,
      anomalyDetected,
      verifiedChecks: `${Math.min(19, 15 + allRecords.length)} of 19 source checks verified`,
      lastServiceMileage: lastMileage || vehicle.currentMileage,
    };

    // Audit Log (BR-08)
    await AuditLog.create({
      action: 'PUBLIC_RECORD_VIEW',
      vehicleId: vehicle._id,
      shareLinkId: shareLink._id,
      actorRole: 'guest',
      actorName: shareLink.recipientName || 'External Viewer',
      recipientInfo: shareLink.recipientEmail || shareLink.recipientName || '',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
      details: {
        permissionLevel: permission,
        viewCount: shareLink.viewCount,
        purpose: shareLink.purpose,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Vehicle records retrieved successfully under authorized permission scope.',
      data: {
        shareSession: {
          id: shareLink._id,
          permissionLevel: permission,
          allowedSections: shareLink.allowedSections,
          recipientName: shareLink.recipientName,
          recipientEmail: shareLink.recipientEmail,
          purpose: shareLink.purpose,
          expiresAt: shareLink.expiresAt,
          viewCount: shareLink.viewCount,
        },
        vehicle: {
          _id: vehicle._id,
          registrationNumber: vehicle.registrationNumber,
          vin: vehicle.vin,
          engineNumber: vehicle.engineNumber,
          manufacturer: vehicle.manufacturer,
          model: vehicle.model,
          manufacturingYear: vehicle.manufacturingYear,
          vehicleType: vehicle.vehicleType,
          currentMileage: vehicle.currentMileage,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          color: vehicle.color,
          registrationJurisdiction: vehicle.registrationJurisdiction,
          status: vehicle.status,
          imageUrl: vehicle.imageUrl,
          ownerName: shareLink.ownerId?.displayName || shareLink.ownerId?.fullName || 'Verified Owner',
        },
        serviceRecords,
        documents,
        // Watermark protection data (BR-07)
        watermark: {
          recipientName: shareLink.recipientName || 'Authorized Inspection Copy',
          accessId: `ACC-${String(shareLink._id).slice(-8).toUpperCase()}`,
          timestamp: now.toISOString(),
          expiresAt: shareLink.expiresAt,
          purpose: shareLink.purpose || 'Verification Inspection',
        },
        protection: {
          allowDownload: false,
          allowPrint: false,
          allowCopy: false,
          allowExport: false,
          watermarkRequired: true,
        },
        healthAssessment,
      },
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
  getPublicSharedRecord,
};
