const mongoose = require('mongoose');
const TransferRequest = require('../models/TransferRequest');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// Helper to verify if user is the intended recipient of a transfer request
const isRecipient = (transfer, user) => {
  if (transfer.toOwnerId) {
    const toId = transfer.toOwnerId._id ? transfer.toOwnerId._id.toString() : transfer.toOwnerId.toString();
    if (toId === user._id.toString()) {
      return true;
    }
  }
  if (transfer.recipientEmail && transfer.recipientEmail.toLowerCase() === user.email.toLowerCase()) {
    return true;
  }
  return false;
};

// Helper to verify if user is the original sender/initiator
const isSender = (transfer, user) => {
  if (!transfer.fromOwnerId) return false;
  const fromId = transfer.fromOwnerId._id ? transfer.fromOwnerId._id.toString() : transfer.fromOwnerId.toString();
  return fromId === user._id.toString();
};

// @desc    Initiate a new vehicle ownership transfer request
// @route   POST /api/transfers or POST /api/vehicles/:vehicleId/transfers
// @access  Private (Vehicle Owner only)
const createTransferRequest = async (req, res, next) => {
  try {
    // Authenticated owner authorization
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only registered vehicle owners can initiate vehicle transfers.',
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
        message: 'Access denied. You can only initiate transfers for vehicles you currently own.',
      });
    }

    const {
      recipientEmail,
      recipientName,
      transferReason,
      message,
      notes,
    } = req.body;

    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required.',
      });
    }

    const normalizedRecipientEmail = recipientEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedRecipientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid recipient email address.',
      });
    }

    // Prevent transferring vehicle to current owner
    if (normalizedRecipientEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer vehicle ownership to yourself.',
      });
    }

    // Prevent duplicate active pending transfer for same vehicle
    const activePending = await TransferRequest.findOne({
      vehicleId: vehicle._id,
      status: 'pending',
    });

    if (activePending) {
      return res.status(400).json({
        success: false,
        message: 'An active pending transfer request already exists for this vehicle. Please cancel or resolve it before initiating a new one.',
      });
    }

    // Check if recipient user account already exists in AutoCare 360
    const recipientUser = await User.findOne({ email: normalizedRecipientEmail });
    const toOwnerId = recipientUser ? recipientUser._id : null;

    const transferRequest = await TransferRequest.create({
      vehicleId: vehicle._id,
      fromOwnerId: req.user._id,
      toOwnerId,
      recipientEmail: normalizedRecipientEmail,
      recipientName: recipientName ? recipientName.trim() : (recipientUser ? recipientUser.fullName : ''),
      transferReason: transferReason ? transferReason.trim() : '',
      message: message ? message.trim() : '',
      notes: notes ? notes.trim() : '',
      status: 'pending',
      requestedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle transfer request initiated successfully.',
      data: {
        transferRequest,
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

// @desc    Get all outgoing transfer requests initiated by current user
// @route   GET /api/transfers/outgoing
// @access  Private (Owner only)
const getOutgoingTransfers = async (req, res, next) => {
  try {
    const transfers = await TransferRequest.find({
      fromOwnerId: req.user._id,
    })
      .populate('vehicleId', 'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage')
      .populate('toOwnerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transfers.length,
      data: {
        transfers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all incoming transfer requests addressed to current user
// @route   GET /api/transfers/incoming
// @access  Private (Authenticated User)
const getIncomingTransfers = async (req, res, next) => {
  try {
    const userEmail = req.user.email.toLowerCase();

    const transfers = await TransferRequest.find({
      $or: [
        { toOwnerId: req.user._id },
        { recipientEmail: userEmail },
      ],
    })
      .populate('vehicleId', 'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage')
      .populate('fromOwnerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transfers.length,
      data: {
        transfers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transfer request by ID
// @route   GET /api/transfers/:id
// @access  Private (Sender or Recipient only)
const getTransferById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer request ID format.',
      });
    }

    const transfer = await TransferRequest.findById(id)
      .populate('vehicleId', 'registrationNumber manufacturer model manufacturingYear imageUrl status currentMileage')
      .populate('fromOwnerId', 'fullName email phone')
      .populate('toOwnerId', 'fullName email phone');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found.',
      });
    }

    // Authorization: only sender or intended recipient
    if (!isSender(transfer, req.user) && !isRecipient(transfer, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this transfer request.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        transferRequest: transfer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept transfer request and finalize vehicle ownership transfer
// @route   PATCH /api/transfers/:id/accept
// @access  Private (Intended Recipient only)
const acceptTransferRequest = async (req, res, next) => {
  let session = null;
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer request ID format.',
      });
    }

    const transfer = await TransferRequest.findById(id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found.',
      });
    }

    // Only intended recipient can accept
    if (!isRecipient(transfer, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the intended recipient can accept this transfer request.',
      });
    }

    // Must be pending
    if (transfer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept transfer request with status "${transfer.status}". Only pending requests can be accepted.`,
      });
    }

    const vehicle = await Vehicle.findById(transfer.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle not found.',
      });
    }

    // Vehicle must still belong to fromOwnerId
    if (vehicle.ownerId.toString() !== transfer.fromOwnerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Transfer cannot be completed. The vehicle is no longer owned by the transfer initiator.',
      });
    }

    const now = new Date();

    // Attempt transactional consistency using Mongoose session if supported
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      vehicle.ownerId = req.user._id;
      await vehicle.save({ session });

      transfer.status = 'completed';
      transfer.toOwnerId = req.user._id;
      transfer.respondedAt = now;
      transfer.completedAt = now;
      await transfer.save({ session });

      await session.commitTransaction();
    } catch (txError) {
      if (session) {
        await session.abortTransaction();
      }
      // If transaction failed due to replica set requirement missing, fall back to safe sequential update
      if (txError.message && txError.message.includes('Transactions are not supported')) {
        vehicle.ownerId = req.user._id;
        await vehicle.save();

        transfer.status = 'completed';
        transfer.toOwnerId = req.user._id;
        transfer.respondedAt = now;
        transfer.completedAt = now;
        await transfer.save();
      } else {
        throw txError;
      }
    } finally {
      if (session) {
        session.endSession();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle transfer accepted and ownership transferred successfully.',
      data: {
        transferRequest: transfer,
        vehicle,
      },
    });
  } catch (error) {
    if (session) {
      try {
        session.endSession();
      } catch {
        // Ignore session cleanup error
      }
    }
    next(error);
  }
};

// @desc    Reject transfer request
// @route   PATCH /api/transfers/:id/reject
// @access  Private (Intended Recipient only)
const rejectTransferRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer request ID format.',
      });
    }

    const transfer = await TransferRequest.findById(id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found.',
      });
    }

    // Only intended recipient can reject
    if (!isRecipient(transfer, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the intended recipient can reject this transfer request.',
      });
    }

    // Must be pending
    if (transfer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject transfer request with status "${transfer.status}". Only pending requests can be rejected.`,
      });
    }

    transfer.status = 'rejected';
    transfer.respondedAt = new Date();
    if (!transfer.toOwnerId) {
      transfer.toOwnerId = req.user._id;
    }
    if (req.body.notes) {
      transfer.notes = req.body.notes.trim();
    }

    await transfer.save();

    return res.status(200).json({
      success: true,
      message: 'Vehicle transfer request rejected.',
      data: {
        transferRequest: transfer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel transfer request
// @route   PATCH /api/transfers/:id/cancel
// @access  Private (Original Sender only)
const cancelTransferRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer request ID format.',
      });
    }

    const transfer = await TransferRequest.findById(id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found.',
      });
    }

    // Only original sender can cancel
    if (!isSender(transfer, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the transfer initiator can cancel this request.',
      });
    }

    // Must be pending
    if (transfer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel transfer request with status "${transfer.status}". Only pending requests can be cancelled.`,
      });
    }

    transfer.status = 'cancelled';
    transfer.respondedAt = new Date();
    await transfer.save();

    return res.status(200).json({
      success: true,
      message: 'Vehicle transfer request cancelled.',
      data: {
        transferRequest: transfer,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransferRequest,
  getOutgoingTransfers,
  getIncomingTransfers,
  getTransferById,
  acceptTransferRequest,
  rejectTransferRequest,
  cancelTransferRequest,
};
