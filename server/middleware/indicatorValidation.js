const Indicator = require('../models/Indicator');
const Convention = require('../models/Convention');

const validateIndicatorSubmission = async (req, res, next) => {
  try {
    const { value } = req.body;
    const indicator = await Indicator.findById(req.params.id);

    if (!indicator) {
      return res.status(404).json({ message: 'Indicator not found' });
    }

    // Check if value is within min/max bounds
    if (indicator.minValue !== undefined && value < indicator.minValue) {
      return res.status(400).json({
        message: `Value cannot be less than ${indicator.minValue}`
      });
    }

    if (indicator.maxValue !== undefined && value > indicator.maxValue) {
      return res.status(400).json({
        message: `Value cannot be greater than ${indicator.maxValue}`
      });
    }

    // Check if it's time for a new submission based on frequency
    const lastSubmission = indicator.history[indicator.history.length - 1];
    if (lastSubmission) {
      const now = new Date();
      const nextAllowedDate = indicator.calculateNextReportingDate();

      if (now < nextAllowedDate) {
        return res.status(400).json({
          message: `Next submission allowed after ${nextAllowedDate.toLocaleDateString()}`,
          nextReportingDate: nextAllowedDate
        });
      }
    }

    // Add indicator and convention to request for use in controller
    req.indicator = indicator;
    const convention = await Convention.findById(indicator.conventionId);
    if (convention && convention.status !== 'ACTIVE') {
      return res.status(400).json({
        message: 'Cannot submit values for inactive convention'
      });
    }
    req.convention = convention;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateIndicatorSubmission };
