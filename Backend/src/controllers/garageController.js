const mongoose = require('mongoose');
const ServiceRecord = require('../models/ServiceRecord');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Get dashboard KPIs and operational summary for verified garage
// @route   GET /api/garage/dashboard-stats
// @access  Private (Garage Only)
const getGarageDashboardStats = async (req, res, next) => {
  try {
    const garageId = req.user._id;

    // Get all records associated with this garage
    const records = await ServiceRecord.find({
      $or: [{ garageId }, { garageName: new RegExp(req.user.fullName || req.user.displayName, 'i') }],
    })
      .populate('vehicleId', 'registrationNumber manufacturer model currentMileage')
      .sort({ serviceDate: -1 });

    const totalRecordsCount = records.length;

    // Calculate unique vehicles and revenue
    const vehicleIdSet = new Set();
    let totalRevenue = 0;
    let pendingCount = 0;

    records.forEach((rec) => {
      if (rec.vehicleId?._id) {
        vehicleIdSet.add(rec.vehicleId._id.toString());
      }
      totalRevenue += rec.totalCost || 0;
      if (rec.verificationStatus === 'pending') {
        pendingCount += 1;
      }
    });

    const uniqueVehiclesCount = vehicleIdSet.size;

    // Recent 5 entries formatted for dashboard display
    const recentEntries = records.slice(0, 5).map((r) => ({
      _id: r._id,
      vehicleTitle: r.vehicleId ? `${r.vehicleId.manufacturer} ${r.vehicleId.model}` : 'Vehicle Record',
      regNumber: r.vehicleId ? r.vehicleId.registrationNumber : 'WP-Unknown',
      mileage: `${r.mileage?.toLocaleString() || '0'} km`,
      serviceDescription: r.serviceType || r.workPerformed,
      serviceDate: r.serviceDate,
      totalCost: r.totalCost,
      status: r.verificationStatus === 'verified' ? 'COMMITTED' : 'PENDING APPROVAL',
    }));

    return res.status(200).json({
      success: true,
      data: {
        kpis: [
          {
            id: 'kpi-customers',
            label: 'TOTAL CUSTOMERS',
            value: String(uniqueVehiclesCount > 0 ? uniqueVehiclesCount : 0),
            subtext: `${totalRecordsCount} Lifetime Service Logs`,
            subtextType: 'positive',
          },
          {
            id: 'kpi-serviced',
            label: 'VEHICLES SERVICED',
            value: String(uniqueVehiclesCount),
            subtext: `LKR ${(totalRevenue).toLocaleString()} Ledger Value`,
            subtextType: 'info',
          },
          {
            id: 'kpi-pending',
            label: 'PENDING ENTRIES',
            value: String(pendingCount),
            subtext: pendingCount === 0 ? 'All entries certified' : 'Awaiting confirmation',
            subtextType: pendingCount === 0 ? 'positive' : 'warning',
          },
          {
            id: 'kpi-revenue',
            label: 'TOTAL REVENUE',
            value: `Rs. ${(totalRevenue).toLocaleString()}`,
            subtext: 'Certified Maintenance Ledger',
            subtextType: 'positive',
          },
        ],
        recentEntries,
        garageProfile: {
          id: req.user._id,
          name: req.user.displayName || req.user.fullName,
          email: req.user.email,
          status: req.user.status,
          city: req.user.city || 'Colombo',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all service records logged by this garage partner
// @route   GET /api/garage/my-records
// @access  Private (Garage Only)
const getGarageRecords = async (req, res, next) => {
  try {
    const garageId = req.user._id;

    const records = await ServiceRecord.find({
      $or: [{ garageId }, { garageName: new RegExp(req.user.fullName || req.user.displayName, 'i') }],
    })
      .populate('vehicleId', 'registrationNumber manufacturer model currentMileage vin ownerId')
      .sort({ serviceDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: {
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGarageDashboardStats,
  getGarageRecords,
};
