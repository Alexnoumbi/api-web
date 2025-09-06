const express = require('express');
const router = express.Router();
const conventionController = require('../controllers/conventionController');
const { proteger } = require('../middleware/auth');

// Protect all routes
router.use(proteger);

// Create a new convention
router.post('/', conventionController.createConvention);

// Get conventions for an enterprise
router.get('/enterprise/:enterpriseId', conventionController.getConventionsByEnterprise);

// Get active conventions for an enterprise
router.get('/enterprise/:enterpriseId/active', conventionController.getActiveConventions);

// Update convention details
router.put('/:id', conventionController.updateConvention);

// Update convention status
router.patch('/:id/status', conventionController.updateConventionStatus);

// Add document to convention
router.post('/:id/documents', conventionController.addDocumentToConvention);

// Get convention history
router.get('/:id/history', conventionController.getConventionHistory);

// Get convention summary
router.get('/:id/summary', conventionController.getConventionSummary);

module.exports = router;
