const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createServiceRecord,
  getVehicleServiceRecords,
  getServiceRecordById,
  updateServiceRecord,
} = require('../controllers/serviceController');
const { protect } = require('../middlewares/authMiddleware');

// All service record operations require an authenticated session
router.use(protect);

router
  .route('/')
  .post(createServiceRecord)
  .get(getVehicleServiceRecords);

router
  .route('/:id')
  .get(getServiceRecordById)
  .patch(updateServiceRecord);

module.exports = router;
