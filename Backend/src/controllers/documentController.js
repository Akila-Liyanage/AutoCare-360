const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const VehicleDocument = require('../models/VehicleDocument');
const Vehicle = require('../models/Vehicle');

// Helper to remove temporary uploaded file on validation/authorization failure
const cleanupUploadedFile = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.warn('[File Cleanup Warning]: Could not unlink file:', e.message);
    }
  }
};

// @desc    Create / Upload a new vehicle document (metadata)
// @route   POST /api/documents or POST /api/vehicles/:vehicleId/documents
// @access  Private (Owner or Verified Garage)
const createVehicleDocument = async (req, res, next) => {
  try {
    const targetVehicleId = req.params.vehicleId || req.body.vehicleId;

    if (!targetVehicleId) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetVehicleId)) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) {
      cleanupUploadedFile(req.file);
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.',
      });
    }

    const isOwner = req.user.role === 'owner';

    // Owner authorization: owners can only upload documents for vehicles they own
    if (isOwner && vehicle.ownerId.toString() !== req.user._id.toString()) {
      cleanupUploadedFile(req.file);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only upload documents for vehicles you own.',
      });
    }

    const {
      documentType,
      title,
      description,
      issueDate,
      expiryDate,
      notes,
    } = req.body;

    // Derive file attributes: Prioritize and trust Multer uploaded file over body payload
    let fileName = '';
    let originalName = '';
    let fileUrl = '';
    let mimeType = '';
    let fileSize = 0;

    if (req.file) {
      fileName = req.file.filename;
      originalName = req.file.originalname;
      fileUrl = `/api/documents/files/${req.file.filename}`;
      mimeType = req.file.mimetype;
      fileSize = req.file.size;
    } else {
      // Fallback for metadata-only creation
      fileName = req.body.fileName ? String(req.body.fileName).trim() : '';
      originalName = req.body.originalName ? String(req.body.originalName).trim() : fileName;
      fileUrl = req.body.fileUrl ? String(req.body.fileUrl).trim() : '';
      mimeType = req.body.mimeType ? String(req.body.mimeType).trim() : '';
      fileSize = req.body.fileSize !== undefined ? Number(req.body.fileSize) : 0;
    }

    // Validate required fields
    if (!documentType || !title || !fileName || !fileUrl) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: documentType, title, and a document file.',
      });
    }

    if (String(title).trim().length < 2) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: 'Document title must be at least 2 characters long.',
      });
    }

    // Parse and validate fileSize
    let parsedFileSize = fileSize;
    if (!req.file && req.body.fileSize !== undefined && req.body.fileSize !== null) {
      parsedFileSize = Number(req.body.fileSize);
      if (isNaN(parsedFileSize) || parsedFileSize < 0) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: 'File size must be a non-negative number.',
        });
      }
    }

    // Parse and validate dates
    let parsedIssueDate = null;
    if (issueDate) {
      parsedIssueDate = new Date(issueDate);
      if (isNaN(parsedIssueDate.getTime())) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid issue date.',
        });
      }
    }

    let parsedExpiryDate = null;
    if (expiryDate) {
      parsedExpiryDate = new Date(expiryDate);
      if (isNaN(parsedExpiryDate.getTime())) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid expiry date.',
        });
      }
    }

    if (parsedIssueDate && parsedExpiryDate && parsedExpiryDate < parsedIssueDate) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: 'Expiry date cannot be earlier than issue date.',
      });
    }

    // Determine provenance and verification status
    let source = 'owner_upload';
    let verificationStatus = 'self_reported';

    if (isOwner) {
      source = 'owner_upload';
      verificationStatus = 'self_reported';
    } else if (req.user.role === 'garage') {
      source = 'verified_garage';
      verificationStatus = 'verified';
    }

    const document = await VehicleDocument.create({
      vehicleId: vehicle._id,
      ownerId: vehicle.ownerId,
      documentType: String(documentType).trim(),
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      fileName: String(fileName).trim(),
      originalName: originalName ? String(originalName).trim() : String(fileName).trim(),
      fileUrl: String(fileUrl).trim(),
      mimeType: mimeType ? String(mimeType).trim() : '',
      fileSize: parsedFileSize,
      issueDate: parsedIssueDate,
      expiryDate: parsedExpiryDate,
      uploadedBy: req.user._id,
      source,
      verificationStatus,
      notes: notes ? String(notes).trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle document created successfully.',
      data: {
        document,
      },
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
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

// @desc    Get all documents for a vehicle (sorted by newest first)
// @route   GET /api/vehicles/:vehicleId/documents or GET /api/documents?vehicleId=...
// @access  Private (Owner tenant protected)
const getVehicleDocuments = async (req, res, next) => {
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

    // Owner authorization: owners can view documents only for their own vehicle
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view documents for this vehicle.',
      });
    }

    const documents = await VehicleDocument.find({ vehicleId: targetVehicleId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single vehicle document by ID
// @route   GET /api/documents/:id
// @access  Private (Owner tenant protected)
const getVehicleDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format.',
      });
    }

    const document = await VehicleDocument.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle document not found.',
      });
    }

    // Fetch related vehicle to check ownership
    const vehicle = await Vehicle.findById(document.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle record not found.',
      });
    }

    // Owner authorization: owners can inspect only their own vehicle's documents
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this vehicle document.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle document metadata
// @route   PATCH /api/documents/:id
// @access  Private (Owner tenant protected)
const updateVehicleDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format.',
      });
    }

    const document = await VehicleDocument.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle document not found.',
      });
    }

    const vehicle = await Vehicle.findById(document.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle record not found.',
      });
    }

    const isOwner = req.user.role === 'owner';

    // Owner authorization: must own the vehicle
    if (isOwner && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify documents for this vehicle.',
      });
    }

    // Owners can update only their own owner-uploaded documents
    if (isOwner && document.source !== 'owner_upload') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vehicle owners cannot modify documents certified or uploaded by verified garages.',
      });
    }

    if (isOwner && document.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own documents.',
      });
    }

    // Prevent modification of immutable fields
    if (req.body.vehicleId && req.body.vehicleId.toString() !== document.vehicleId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle association cannot be modified once a document is created.',
      });
    }

    if (req.body.ownerId && req.body.ownerId.toString() !== document.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Document ownership cannot be modified directly.',
      });
    }

    if (req.body.uploadedBy && req.body.uploadedBy.toString() !== document.uploadedBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Uploader identity cannot be modified.',
      });
    }

    if (req.body.source && req.body.source !== document.source) {
      return res.status(400).json({
        success: false,
        message: 'Document source provenance cannot be modified.',
      });
    }

    if (req.body.verificationStatus && req.body.verificationStatus !== document.verificationStatus) {
      return res.status(400).json({
        success: false,
        message: 'Document verification status cannot be modified directly.',
      });
    }

    // Validate and update fields
    if (req.body.documentType !== undefined) {
      if (!String(req.body.documentType).trim()) {
        return res.status(400).json({ success: false, message: 'Document type cannot be empty.' });
      }
      document.documentType = String(req.body.documentType).trim();
    }

    if (req.body.title !== undefined) {
      const trimmedTitle = String(req.body.title).trim();
      if (trimmedTitle.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Document title must be at least 2 characters long.',
        });
      }
      document.title = trimmedTitle;
    }

    if (req.body.description !== undefined) {
      document.description = String(req.body.description).trim();
    }

    if (req.body.fileName !== undefined) {
      if (!String(req.body.fileName).trim()) {
        return res.status(400).json({ success: false, message: 'File name cannot be empty.' });
      }
      document.fileName = String(req.body.fileName).trim();
    }

    if (req.body.originalName !== undefined) {
      document.originalName = String(req.body.originalName).trim();
    }

    if (req.body.fileUrl !== undefined) {
      if (!String(req.body.fileUrl).trim()) {
        return res.status(400).json({ success: false, message: 'File URL cannot be empty.' });
      }
      document.fileUrl = String(req.body.fileUrl).trim();
    }

    if (req.body.mimeType !== undefined) {
      document.mimeType = String(req.body.mimeType).trim();
    }

    if (req.body.fileSize !== undefined) {
      const parsedSize = Number(req.body.fileSize);
      if (isNaN(parsedSize) || parsedSize < 0) {
        return res.status(400).json({
          success: false,
          message: 'File size must be a non-negative number.',
        });
      }
      document.fileSize = parsedSize;
    }

    // Validate and update dates
    let targetIssueDate = document.issueDate;
    let targetExpiryDate = document.expiryDate;

    if (req.body.issueDate !== undefined) {
      if (req.body.issueDate === null || req.body.issueDate === '') {
        targetIssueDate = null;
      } else {
        const d = new Date(req.body.issueDate);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ success: false, message: 'Please provide a valid issue date.' });
        }
        targetIssueDate = d;
      }
      document.issueDate = targetIssueDate;
    }

    if (req.body.expiryDate !== undefined) {
      if (req.body.expiryDate === null || req.body.expiryDate === '') {
        targetExpiryDate = null;
      } else {
        const d = new Date(req.body.expiryDate);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ success: false, message: 'Please provide a valid expiry date.' });
        }
        targetExpiryDate = d;
      }
      document.expiryDate = targetExpiryDate;
    }

    if (targetIssueDate && targetExpiryDate && targetExpiryDate < targetIssueDate) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date cannot be earlier than issue date.',
      });
    }

    if (req.body.notes !== undefined) {
      document.notes = String(req.body.notes).trim();
    }

    // Enforce owner constraints
    if (isOwner) {
      document.source = 'owner_upload';
      document.verificationStatus = 'self_reported';
    }

    await document.save();

    return res.status(200).json({
      success: true,
      message: 'Vehicle document updated successfully.',
      data: {
        document,
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

// @desc    Delete a vehicle document
// @route   DELETE /api/documents/:id
// @access  Private (Owner tenant protected)
const deleteVehicleDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format.',
      });
    }

    const document = await VehicleDocument.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle document not found.',
      });
    }

    const vehicle = await Vehicle.findById(document.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle record not found.',
      });
    }

    const isOwner = req.user.role === 'owner';

    // Owner authorization: must own the vehicle
    if (isOwner && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete documents for this vehicle.',
      });
    }

    // Owners can delete only their own owner-uploaded documents
    if (isOwner && document.source !== 'owner_upload') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vehicle owners cannot delete documents certified or uploaded by verified garages.',
      });
    }

    if (isOwner && document.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own documents.',
      });
    }

    // Clean up physical file on disk if it exists
    if (document.fileName) {
      const filePath = path.join(__dirname, '../../uploads/documents', path.basename(document.fileName));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('[Document Cleanup Warning]: Could not unlink file:', e.message);
        }
      }
    }

    await document.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Vehicle document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicleDocument,
  getVehicleDocuments,
  getVehicleDocumentById,
  updateVehicleDocument,
  deleteVehicleDocument,
};
