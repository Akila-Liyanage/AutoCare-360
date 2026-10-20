const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');

// @desc    Create / Log a new expense
// @route   POST /api/expenses or POST /api/vehicles/:vehicleId/expenses
// @access  Private (Owner Only)
const createExpense = async (req, res, next) => {
  try {
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

    const isOwner = req.user.role === 'owner';

    // Owner authorization: owners can only log expenses for vehicles they own
    if (isOwner && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only log expenses for vehicles you own.',
      });
    }

    const {
      category,
      title,
      description,
      amount,
      expenseDate,
      vendor,
      paymentMethod,
      receiptUrl,
      serviceRecordId,
      notes,
    } = req.body;

    // Validate required fields
    if (!category || !String(category).trim() || !title || !String(title).trim() || amount === undefined || amount === null || !expenseDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: category, title, amount, and expenseDate.',
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be a non-negative number.',
      });
    }

    const parsedDate = new Date(expenseDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid expense date.',
      });
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (parsedDate > endOfToday) {
      return res.status(400).json({
        success: false,
        message: 'Expense date cannot be in the future.',
      });
    }

    // Determine provenance source and validate service record association if supplied
    let source = 'manual';
    let linkedServiceRecordId = null;

    if (serviceRecordId) {
      if (!mongoose.Types.ObjectId.isValid(serviceRecordId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid service record ID format.',
        });
      }

      const serviceRecord = await ServiceRecord.findById(serviceRecordId);
      if (!serviceRecord) {
        return res.status(404).json({
          success: false,
          message: 'Linked service record not found.',
        });
      }

      if (serviceRecord.vehicleId.toString() !== vehicle._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Service record does not belong to the specified vehicle.',
        });
      }

      source = 'service_record';
      linkedServiceRecordId = serviceRecord._id;
    }

    const expense = await Expense.create({
      vehicleId: vehicle._id,
      ownerId: vehicle.ownerId,
      serviceRecordId: linkedServiceRecordId,
      category: String(category).trim(),
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      amount: parsedAmount,
      expenseDate: parsedDate,
      vendor: vendor ? String(vendor).trim() : '',
      paymentMethod: paymentMethod ? String(paymentMethod).trim() : '',
      receiptUrl: receiptUrl ? String(receiptUrl).trim() : '',
      source,
      notes: notes ? String(notes).trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Expense logged successfully.',
      data: {
        expense,
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

// @desc    Get all expenses for a vehicle (sorted by date descending)
// @route   GET /api/vehicles/:vehicleId/expenses or GET /api/expenses?vehicleId=...
// @access  Private (Owner tenant protected)
const getVehicleExpenses = async (req, res, next) => {
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

    // Owner authorization: owners can view expenses only for their own vehicle
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view expenses for this vehicle.',
      });
    }

    const expenses = await Expense.find({ vehicleId: targetVehicleId }).sort({
      expenseDate: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: {
        expenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single expense by ID
// @route   GET /api/expenses/:id
// @access  Private (Owner tenant protected)
const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format.',
      });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.',
      });
    }

    const vehicle = await Vehicle.findById(expense.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle record not found.',
      });
    }

    // Owner authorization: owners can inspect only their own vehicle's expenses
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this expense.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        expense,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing expense
// @route   PATCH /api/expenses/:id
// @access  Private (Owner tenant protected)
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format.',
      });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.',
      });
    }

    const vehicle = await Vehicle.findById(expense.vehicleId);
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
        message: 'Access denied. You do not have permission to modify expenses for this vehicle.',
      });
    }

    if (isOwner && expense.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own expenses.',
      });
    }

    // Prevent changing immutable security fields
    if (req.body.vehicleId && req.body.vehicleId.toString() !== expense.vehicleId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle association cannot be modified once an expense is created.',
      });
    }

    if (req.body.ownerId && req.body.ownerId.toString() !== expense.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Expense ownership cannot be modified directly.',
      });
    }

    if (
      req.body.serviceRecordId !== undefined &&
      String(req.body.serviceRecordId || '') !== String(expense.serviceRecordId || '')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Linked service record association cannot be modified directly.',
      });
    }

    if (req.body.source && req.body.source !== expense.source) {
      return res.status(400).json({
        success: false,
        message: 'Expense source provenance cannot be modified.',
      });
    }

    // Validate and update fields
    if (req.body.category !== undefined) {
      if (!String(req.body.category).trim()) {
        return res.status(400).json({ success: false, message: 'Expense category cannot be empty.' });
      }
      expense.category = String(req.body.category).trim();
    }

    if (req.body.title !== undefined) {
      if (!String(req.body.title).trim()) {
        return res.status(400).json({ success: false, message: 'Expense title cannot be empty.' });
      }
      expense.title = String(req.body.title).trim();
    }

    if (req.body.description !== undefined) {
      expense.description = String(req.body.description).trim();
    }

    if (req.body.amount !== undefined && req.body.amount !== null) {
      const parsed = Number(req.body.amount);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({
          success: false,
          message: 'Expense amount must be a non-negative number.',
        });
      }
      expense.amount = parsed;
    }

    if (req.body.expenseDate !== undefined) {
      const d = new Date(req.body.expenseDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid expense date.',
        });
      }
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (d > endOfToday) {
        return res.status(400).json({
          success: false,
          message: 'Expense date cannot be in the future.',
        });
      }
      expense.expenseDate = d;
    }

    if (req.body.vendor !== undefined) {
      expense.vendor = String(req.body.vendor).trim();
    }

    if (req.body.paymentMethod !== undefined) {
      expense.paymentMethod = String(req.body.paymentMethod).trim();
    }

    if (req.body.receiptUrl !== undefined) {
      expense.receiptUrl = String(req.body.receiptUrl).trim();
    }

    if (req.body.notes !== undefined) {
      expense.notes = String(req.body.notes).trim();
    }

    await expense.save();

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully.',
      data: {
        expense,
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

// @desc    Delete an expense (manual expenses only)
// @route   DELETE /api/expenses/:id
// @access  Private (Owner tenant protected)
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format.',
      });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.',
      });
    }

    const vehicle = await Vehicle.findById(expense.vehicleId);
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
        message: 'Access denied. You do not have permission to delete expenses for this vehicle.',
      });
    }

    if (isOwner && expense.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own expenses.',
      });
    }

    // Strict provenance protection: Prevent direct deletion of service_record-linked expenses
    if (expense.source === 'service_record') {
      return res.status(403).json({
        success: false,
        message: 'Service-linked expenses cannot be deleted directly. They are managed through the associated service record.',
      });
    }

    await expense.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense analytics summary for a vehicle
// @route   GET /api/vehicles/:vehicleId/expenses/summary
// @access  Private (Owner tenant protected)
const getExpenseSummary = async (req, res, next) => {
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

    // Owner authorization: must own the vehicle
    if (req.user.role === 'owner' && vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view expense summaries for this vehicle.',
      });
    }

    const expenses = await Expense.find({ vehicleId: targetVehicleId }).sort({
      expenseDate: -1,
    });

    let totalExpense = 0;
    let serviceExpenseTotal = 0;
    let manualExpenseTotal = 0;

    const categoryTotals = {};
    const categoryCounts = {};
    const monthlyTotals = {};
    const monthlyCounts = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalExpense += amt;

      if (exp.source === 'service_record') {
        serviceExpenseTotal += amt;
      } else {
        manualExpenseTotal += amt;
      }

      // Category breakdown
      const cat = exp.category ? String(exp.category).trim() : 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // Monthly breakdown (YYYY-MM)
      if (exp.expenseDate) {
        const d = new Date(exp.expenseDate);
        if (!isNaN(d.getTime())) {
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amt;
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        }
      }
    }

    const categoryBreakdown = Object.keys(categoryTotals).map((cat) => ({
      category: cat,
      total: categoryTotals[cat],
      count: categoryCounts[cat],
      percentage: totalExpense > 0 ? Number(((categoryTotals[cat] / totalExpense) * 100).toFixed(1)) : 0,
    }));

    const monthlyBreakdown = Object.keys(monthlyTotals)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => ({
        month: m,
        total: monthlyTotals[m],
        count: monthlyCounts[m],
      }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalExpense,
          totalExpenses: totalExpense,
          serviceExpenseTotal,
          manualExpenseTotal,
          expenseCount: expenses.length,
          categoryBreakdown,
          monthlyBreakdown,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getVehicleExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
};
