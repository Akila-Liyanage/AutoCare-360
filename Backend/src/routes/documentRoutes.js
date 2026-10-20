const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createVehicleDocument,
  getVehicleDocuments,
  getVehicleDocumentById,
  updateVehicleDocument,
  deleteVehicleDocument,
} = require('../controllers/documentController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadDocument, documentUploadDir } = require('../middlewares/documentUpload');

// Serve uploaded document files safely (path.basename prevents directory traversal attacks)
router.get('/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(documentUploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'Document file not found.',
    });
  }

  return res.sendFile(filePath);
});

// All vehicle document management operations require an authenticated session
router.use(protect);

router
  .route('/')
  .post(uploadDocument, createVehicleDocument)
  .get(getVehicleDocuments);

router
  .route('/:id')
  .get(getVehicleDocumentById)
  .patch(updateVehicleDocument)
  .delete(deleteVehicleDocument);

module.exports = router;
