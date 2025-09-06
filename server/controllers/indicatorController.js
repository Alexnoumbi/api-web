const Indicator = require('../models/Indicator');
const Convention = require('../models/Convention');

exports.createIndicator = async (req, res) => {
  try {
    const {
      conventionId,
      name,
      description,
      type,
      unit,
      frequency,
      targetValue,
      minValue,
      maxValue
    } = req.body;

    // Verify convention exists
    const convention = await Convention.findById(conventionId);
    if (!convention) {
      return res.status(404).json({ message: 'Convention not found' });
    }

    const indicator = new Indicator({
      conventionId,
      name,
      description,
      type,
      unit,
      frequency,
      targetValue,
      minValue,
      maxValue,
      metadata: {
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      }
    });

    await indicator.save();

    // Add indicator reference to convention
    convention.indicators.push(indicator._id);
    await convention.save();

    res.status(201).json(indicator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIndicatorsByConvention = async (req, res) => {
  try {
    const { conventionId } = req.params;
    const indicators = await Indicator.find({ conventionId })
      .populate('metadata.createdBy', 'name email')
      .populate('metadata.lastModifiedBy', 'name email')
      .sort('name');
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIndicatorDetails = async (req, res) => {
  try {
    const indicator = await Indicator.findById(req.params.id)
      .populate('history.submittedBy', 'name email')
      .populate('metadata.createdBy', 'name email')
      .populate('metadata.lastModifiedBy', 'name email');

    if (!indicator) {
      return res.status(404).json({ message: 'Indicator not found' });
    }

    res.json(indicator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const indicator = await Indicator.findById(id);
    if (!indicator) {
      return res.status(404).json({ message: 'Indicator not found' });
    }

    Object.assign(indicator, updateData, {
      'metadata.lastModifiedBy': req.user._id,
      'metadata.updatedAt': new Date()
    });

    await indicator.save();
    res.json(indicator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitIndicatorValue = async (req, res) => {
  try {
    const { value, comment, attachments } = req.body;
    const indicator = await Indicator.findById(req.params.id)
      .populate('conventionId', 'enterpriseId');

    if (!indicator) {
      return res.status(404).json({ message: 'Indicator not found' });
    }

    indicator.addHistoryEntry(value, req.user._id, attachments, comment);
    await indicator.save();

    // Get Socket.io instance
    const io = req.app.get('io');

    // Emit to enterprise room
    io.to(`enterprise_${indicator.conventionId.enterpriseId}`).emit('indicator:updated', {
      type: 'VALUE_SUBMITTED',
      indicatorId: indicator._id,
      value,
      submittedBy: req.user._id
    });

    // Emit to inspectors
    io.to(`role_INSPECTOR`).emit('indicator:pending-validation', {
      type: 'NEW_SUBMISSION',
      indicatorId: indicator._id,
      enterpriseId: indicator.conventionId.enterpriseId
    });

    res.json(indicator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateIndicatorSubmission = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { status, comment } = req.body;

    const indicator = await Indicator.findById(id)
      .populate('conventionId', 'enterpriseId');

    if (!indicator) {
      return res.status(404).json({ message: 'Indicator not found' });
    }

    const submission = indicator.history.id(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = status;
    if (comment) submission.comment = comment;
    await indicator.save();

    // Get Socket.io instance
    const io = req.app.get('io');

    // Emit validation result to enterprise
    io.to(`enterprise_${indicator.conventionId.enterpriseId}`).emit('indicator:validated', {
      type: 'SUBMISSION_VALIDATED',
      indicatorId: indicator._id,
      submissionId,
      status,
      validatedBy: req.user._id
    });

    res.json(indicator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIndicatorHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const indicator = await Indicator.findById(id)
      .select('history')
      .populate('history.submittedBy', 'name email');

    if (!indicator) {
      return res.status(404).json({ message: 'Indicator not found' });
    }

    res.json(indicator.history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIndicatorsReport = async (req, res) => {
  try {
    const { conventionId } = req.params;
    const indicators = await Indicator.find({ conventionId })
      .select('name type currentValue targetValue status nextReportingDate')
      .sort('name');

    const summary = {
      total: indicators.length,
      onTrack: indicators.filter(i => i.status === 'ON_TRACK').length,
      atRisk: indicators.filter(i => i.status === 'AT_RISK').length,
      offTrack: indicators.filter(i => i.status === 'OFF_TRACK').length,
      notStarted: indicators.filter(i => i.status === 'NOT_STARTED').length,
      indicators
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
