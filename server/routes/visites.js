const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { proteger } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes requiring authentication
router.use(proteger);

// Get all visits for an enterprise
router.get('/enterprise/:enterpriseId', visitController.getVisitsByEnterprise);

// Request a new visit
router.post('/request', visitController.requestVisit);

// Cancel a visit
router.put('/:id/cancel', visitController.cancelVisit);

// Submit visit report with file attachments
router.post('/:id/report', upload.array('files'), visitController.submitVisitReport);

// Get upcoming visits
router.get('/enterprise/:enterpriseId/upcoming', visitController.getUpcomingVisits);

// Get past visits
router.get('/enterprise/:enterpriseId/past', visitController.getPastVisits);

// Assign inspector to a visit (admin only)
router.put('/:id/assign-inspector', visitController.assignInspector);

// Get all visits assigned to the logged-in inspector
router.get('/inspector/my-visits', visitController.getInspectorVisits);

// Update visit status and outcome
router.put('/:id/status', visitController.updateVisitStatus);

// Get detailed visit information
router.get('/:id', visitController.getVisitDetails);

// Download visit report
router.get('/:id/report/download', visitController.downloadVisitReport);

module.exports = router;
