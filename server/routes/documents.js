const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { proteger } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes requiring authentication
router.use(proteger);

// Get all documents for a company
router.get('/company/:companyId', documentController.getCompanyDocuments);

// Upload a new document
router.post('/company/:companyId/upload', upload.single('file'), documentController.uploadDocument);

// Validate a document
router.put('/:id/validate', documentController.validateDocument);

// Delete a document
router.delete('/:id', documentController.deleteDocument);

// Get document types
router.get('/types', documentController.getDocumentTypes);

module.exports = router;
