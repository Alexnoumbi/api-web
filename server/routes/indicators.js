const express = require('express');
const router = express.Router();
const indicatorController = require('../controllers/indicatorController');
const { proteger } = require('../middleware/auth');
const { checkPermission } = require('../middleware/roles');
const { validateIndicatorSubmission } = require('../middleware/indicatorValidation');

// Protect all routes
router.use(proteger);

// Create a new indicator
router.post('/',
  checkPermission('indicators', 'create'),
  indicatorController.createIndicator
);

// Get all indicators for a convention
router.get('/convention/:conventionId',
  checkPermission('indicators', 'read'),
  indicatorController.getIndicatorsByConvention
);

// Get indicator report for a convention
router.get('/convention/:conventionId/report',
  checkPermission('indicators', 'read'),
  indicatorController.getIndicatorsReport
);

// Get specific indicator details
router.get('/:id',
  checkPermission('indicators', 'read'),
  indicatorController.getIndicatorDetails
);

// Update indicator details
router.put('/:id',
  checkPermission('indicators', 'update'),
  indicatorController.updateIndicator
);

// Submit new value for an indicator
router.post('/:id/submit',
  checkPermission('indicators', 'submit'),
  validateIndicatorSubmission,
  indicatorController.submitIndicatorValue
);

// Validate an indicator submission
router.patch('/:id/submissions/:submissionId/validate',
  checkPermission('indicators', 'validate'),
  indicatorController.validateIndicatorSubmission
);

// Get indicator history
router.get('/:id/history',
  checkPermission('indicators', 'read'),
  indicatorController.getIndicatorHistory
);

module.exports = router;
