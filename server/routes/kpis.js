const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const { proteger } = require('../middleware/auth');

// Protected routes requiring authentication
router.use(proteger);

// Get KPIs for an enterprise
router.get('/enterprise/:enterpriseId', kpiController.getKPIsByEnterprise);

// Submit a new KPI value
router.post('/:kpiId/submit', kpiController.submitKPIValue);

// Validate a KPI submission
router.put('/:kpiId/submissions/:submissionId', kpiController.validateKPISubmission);

// Get KPI history
router.get('/:kpiId/history', kpiController.getKPIHistory);

// Get KPI overview for an enterprise
router.get('/enterprise/:enterpriseId/overview', kpiController.getKPIOverview);

module.exports = router;
