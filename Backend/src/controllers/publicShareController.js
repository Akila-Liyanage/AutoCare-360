const crypto = require('crypto');
const ShareLink = require('../models/ShareLink');
const QRShare = require('../models/QRShare');
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const VehicleDocument = require('../models/VehicleDocument');

// @desc    Access a shared vehicle record via public one-time or multi-use token
// @route   GET /api/public/shared/:token
// @access  Public (No JWT required)
const getPublicSharedRecord = async (req, res) => {
  try {
    const { token: rawToken } = req.params;

    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '') {
      return res.status(400).json({
        success: false,
        errorType: 'invalid_token',
        message: 'Shared token parameter is required.',
      });
    }

    const cleanToken = rawToken.trim();
    const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
    const now = new Date();

    // Look up in both ShareLink and QRShare
    let grant = await ShareLink.findOne({ tokenHash });
    let grantType = 'link';

    if (!grant) {
      grant = await QRShare.findOne({ tokenHash });
      grantType = 'qr';
    }

    // 1. Token Existence Check
    if (!grant) {
      return res.status(404).json({
        success: false,
        errorType: 'not_found',
        message: 'Invalid or non-existent shared record token. This link or QR code cannot be verified.',
      });
    }

    // 2. Status Validation: Revoked
    if (grant.status === 'revoked') {
      return res.status(403).json({
        success: false,
        errorType: 'revoked',
        message: 'This shared vehicle passport access has been revoked by the vehicle owner.',
      });
    }

    // 3. Status Validation: Expired
    if (grant.status === 'expired' || (grant.expiresAt && grant.expiresAt <= now)) {
      if (grant.status !== 'expired') {
        grant.status = 'expired';
        await grant.save();
      }
      return res.status(410).json({
        success: false,
        errorType: 'expired',
        message: 'This shared vehicle passport link or QR code authorization has expired.',
      });
    }

    // 4. Usage Limit Validation
    if (grantType === 'link') {
      if (grant.maxViews !== null && grant.maxViews !== undefined && grant.viewCount >= grant.maxViews) {
        return res.status(403).json({
          success: false,
          errorType: 'limit_reached',
          message: 'Maximum authorized view limit for this secure share link has been reached.',
        });
      }
    } else {
      if (grant.maxScans !== null && grant.maxScans !== undefined && grant.scanCount >= grant.maxScans) {
        return res.status(403).json({
          success: false,
          errorType: 'limit_reached',
          message: 'Maximum authorized scan limit for this QR authorization has been reached.',
        });
      }
    }

    // 5. Atomic Usage Increment to Prevent Race Condition Limit Bypass
    let updatedGrant = null;
    if (grantType === 'link') {
      const condition = {
        _id: grant._id,
        status: 'active',
        expiresAt: { $gt: now },
      };

      if (grant.maxViews !== null && grant.maxViews !== undefined) {
        condition.viewCount = { $lt: grant.maxViews };
      }

      updatedGrant = await ShareLink.findOneAndUpdate(
        condition,
        {
          $inc: { viewCount: 1 },
          $set: { lastAccessedAt: now },
        },
        { returnDocument: 'after' }
      );
    } else {
      const condition = {
        _id: grant._id,
        status: 'active',
        expiresAt: { $gt: now },
      };

      if (grant.maxScans !== null && grant.maxScans !== undefined) {
        condition.scanCount = { $lt: grant.maxScans };
      }

      updatedGrant = await QRShare.findOneAndUpdate(
        condition,
        {
          $inc: { scanCount: 1 },
          $set: { lastScannedAt: now },
        },
        { returnDocument: 'after' }
      );
    }

    if (!updatedGrant) {
      return res.status(403).json({
        success: false,
        errorType: 'limit_reached',
        message: 'The view or scan limit for this shared access has been reached.',
      });
    }

    // 6. Fetch Real Vehicle Data
    const vehicle = await Vehicle.findById(updatedGrant.vehicleId).populate(
      'ownerId',
      'fullName email phone'
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        errorType: 'vehicle_not_found',
        message: 'The vehicle associated with this shared passport is no longer registered.',
      });
    }

    // 7. Permission Filtering Based on permissionLevel and allowedSections
    const permissionLevel = updatedGrant.permissionLevel || 'limited';
    const allowedSections = Array.isArray(updatedGrant.allowedSections)
      ? updatedGrant.allowedSections
      : [];

    const isFull = permissionLevel === 'full';
    const isLimited = permissionLevel === 'limited';

    const canAccess = (sectionKey) => {
      if (isFull) return true;
      if (isLimited) {
        // Safe limited scope defaults: service dates, mileage, garage details
        return ['serviceDates', 'mileage', 'garageDetails', 'serviceHistory'].includes(sectionKey);
      }
      // 'selected' mode: strictly according to allowedSections checklist
      return allowedSections.includes(sectionKey);
    };

    // Construct Safe Vehicle Identity
    const safeVehicle = {
      _id: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      vin: vehicle.vin,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      manufacturingYear: vehicle.manufacturingYear,
      vehicleType: vehicle.vehicleType,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      color: vehicle.color || 'Unspecified',
      currentMileage: canAccess('mileage') ? vehicle.currentMileage : null,
      engineNumber: canAccess('engineRepair') || isFull ? vehicle.engineNumber : null,
      imageUrl: vehicle.imageUrl || null,
      trustScore: 92,
      owner:
        canAccess('ownerContact') || isFull
          ? {
              fullName: vehicle.ownerId?.fullName || 'Current Owner',
              email: vehicle.ownerId?.email || '',
              phone: vehicle.ownerId?.phone || '',
            }
          : null,
    };

    // Construct Filtered Maintenance Records
    let safeServices = [];
    if (canAccess('serviceHistory') || canAccess('serviceDates') || canAccess('costs') || isFull || isLimited) {
      const rawServices = await ServiceRecord.find({ vehicleId: vehicle._id }).sort({ serviceDate: -1 });

      safeServices = rawServices.map((rec) => ({
        _id: rec._id,
        serviceType: rec.serviceType,
        workPerformed: rec.workPerformed,
        verificationStatus: rec.verificationStatus,
        serviceDate: canAccess('serviceDates') || isFull || isLimited ? rec.serviceDate : null,
        mileage: canAccess('mileage') || isFull || isLimited ? rec.mileage : null,
        garageName: canAccess('garageDetails') || isFull || isLimited ? rec.garageName : null,
        technicianName: canAccess('garageDetails') || isFull ? rec.technicianName : null,
        partsReplaced: canAccess('engineRepair') || isFull || isLimited ? rec.partsReplaced : [],
        totalCost: canAccess('costs') || isFull ? rec.totalCost : null,
        labourCost: canAccess('costs') || isFull ? rec.labourCost : null,
        partsCost: canAccess('costs') || isFull ? rec.partsCost : null,
        invoiceUrl: canAccess('invoices') || isFull ? rec.invoiceUrl : null,
        serviceImages: canAccess('images') || isFull ? rec.serviceImages : [],
      }));
    }

    // Construct Filtered Documents
    let safeDocuments = [];
    if (canAccess('documents') || isFull) {
      const rawDocs = await VehicleDocument.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 });

      safeDocuments = rawDocs.map((doc) => ({
        _id: doc._id,
        title: doc.title,
        documentType: doc.documentType,
        description: doc.description,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate,
        source: doc.source,
        verificationStatus: doc.verificationStatus,
        fileUrl:
          updatedGrant.protection?.allowDownload || isFull
            ? doc.fileUrl
            : null,
      }));
    }

    // Safe Protection Configuration
    const safeProtection = {
      allowDownload: updatedGrant.protection?.allowDownload ?? false,
      allowPrint: updatedGrant.protection?.allowPrint ?? false,
      allowCopy: updatedGrant.protection?.allowCopy ?? false,
      watermarkEnabled: updatedGrant.protection?.watermarkEnabled ?? true,
      watermarkText: updatedGrant.protection?.watermarkText || 'AUTOCARE 360 SECURED',
    };

    // Return Complete Sanitized Public Access Payload
    return res.status(200).json({
      success: true,
      data: {
        grant: {
          id: updatedGrant._id,
          type: grantType,
          permissionLevel: updatedGrant.permissionLevel,
          allowedSections: updatedGrant.allowedSections || [],
          expiresAt: updatedGrant.expiresAt,
          purpose: updatedGrant.purpose || 'Vehicle Record Verification',
          recipientName: updatedGrant.recipientName || (grantType === 'qr' ? 'Inspection Officer' : 'Prospective Buyer'),
          viewCount: grantType === 'link' ? updatedGrant.viewCount : updatedGrant.scanCount,
          maxViews: grantType === 'link' ? updatedGrant.maxViews : updatedGrant.maxScans,
        },
        protection: safeProtection,
        vehicle: safeVehicle,
        services: safeServices,
        documents: safeDocuments,
      },
    });
  } catch (error) {
    console.error('[Public Share Error]:', error);
    return res.status(500).json({
      success: false,
      errorType: 'server_error',
      message: 'Failed to retrieve shared vehicle record. Please try again.',
    });
  }
};

module.exports = {
  getPublicSharedRecord,
};
