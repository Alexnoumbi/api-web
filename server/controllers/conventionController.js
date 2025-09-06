const Convention = require('../models/Convention');
const Enterprise = require('../models/Entreprise');

exports.createConvention = async (req, res) => {
  try {
    const {
      enterpriseId,
      signedDate,
      startDate,
      endDate,
      type,
      advantages,
      obligations
    } = req.body;

    // Verify enterprise exists
    const enterprise = await Enterprise.findById(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({ message: 'Enterprise not found' });
    }

    const convention = new Convention({
      enterpriseId,
      signedDate,
      startDate,
      endDate,
      type,
      advantages,
      obligations,
      metadata: {
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      }
    });

    convention._lastModifiedBy = req.user._id;
    convention.addHistoryEntry('CREATED', req.user._id, { type });

    await convention.save();
    res.status(201).json(convention);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConventionsByEnterprise = async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const conventions = await Convention.find({ enterpriseId })
      .populate('indicators')
      .populate('documents')
      .sort('-createdAt');
    res.json(conventions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveConventions = async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const conventions = await Convention.findActiveForEnterprise(enterpriseId)
      .populate('indicators')
      .populate('documents');
    res.json(conventions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateConvention = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const convention = await Convention.findById(id);
    if (!convention) {
      return res.status(404).json({ message: 'Convention not found' });
    }

    // Record what fields are being updated
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (convention[key] !== updateData[key]) {
        changes[key] = {
          from: convention[key],
          to: updateData[key]
        };
      }
    });

    convention._lastModifiedBy = req.user._id;
    convention.addHistoryEntry('UPDATED', req.user._id, changes);

    Object.assign(convention, updateData, {
      'metadata.lastModifiedBy': req.user._id
    });

    await convention.save();
    res.json(convention);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateConventionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const convention = await Convention.findById(id);
    if (!convention) {
      return res.status(404).json({ message: 'Convention not found' });
    }

    const oldStatus = convention.status;
    convention.status = status;
    convention._lastModifiedBy = req.user._id;
    convention.addHistoryEntry('STATUS_CHANGED', req.user._id, {
      from: oldStatus,
      to: status
    });

    await convention.save();
    res.json(convention);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addDocumentToConvention = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentId } = req.body;

    const convention = await Convention.findById(id);
    if (!convention) {
      return res.status(404).json({ message: 'Convention not found' });
    }

    convention.documents.push(documentId);
    convention._lastModifiedBy = req.user._id;
    convention.addHistoryEntry('DOCUMENT_ADDED', req.user._id, { documentId });

    await convention.save();
    res.json(convention);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConventionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const convention = await Convention.findById(id)
      .populate('history.userId', 'name email')
      .select('history');

    if (!convention) {
      return res.status(404).json({ message: 'Convention not found' });
    }

    res.json(convention.history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConventionSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const convention = await Convention.findById(id)
      .populate('indicators', 'name currentValue targetValue status')
      .populate('documents', 'name status uploadedAt')
      .select('-history');

    if (!convention) {
      return res.status(404).json({ message: 'Convention not found' });
    }

    const summary = {
      id: convention._id,
      type: convention.type,
      status: convention.status,
      progress: {
        documentsSubmitted: convention.documents.length,
        indicatorsOnTrack: convention.indicators.filter(i => i.status === 'ON_TRACK').length,
        totalIndicators: convention.indicators.length
      },
      startDate: convention.startDate,
      endDate: convention.endDate,
      daysRemaining: Math.ceil((convention.endDate - new Date()) / (1000 * 60 * 60 * 24))
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
