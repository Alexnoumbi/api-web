const Visit = require('../models/Visit');
const { uploadToS3 } = require('../utils/s3');

exports.getVisitsByEnterprise = async (req, res) => {
  try {
    const visits = await Visit.find({ enterpriseId: req.params.enterpriseId })
      .populate('inspectorId', 'name')
      .sort({ scheduledAt: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestVisit = async (req, res) => {
  try {
    const { scheduledAt, type, comment } = req.body;

    const visit = new Visit({
      enterpriseId: req.params.enterpriseId,
      scheduledAt,
      type,
      comment,
      status: 'SCHEDULED'
    });

    await visit.save();
    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelVisit = async (req, res) => {
  try {
    const { reason } = req.body;
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    if (visit.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot cancel a completed visit' });
    }

    visit.status = 'CANCELLED';
    visit.cancellationReason = reason;
    await visit.save();

    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitVisitReport = async (req, res) => {
  try {
    const { content, outcome } = req.body;
    const files = req.files;

    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    const uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await uploadToS3(file);
        uploadedFiles.push({
          name: file.originalname,
          url: uploadResult.Location
        });
      }
    }

    visit.report = {
      content,
      files: uploadedFiles,
      submittedAt: new Date(),
      submittedBy: req.user.id,
      outcome
    };
    visit.status = 'COMPLETED';

    await visit.save();
    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUpcomingVisits = async (req, res) => {
  try {
    const visits = await Visit.find({
      enterpriseId: req.params.enterpriseId,
      status: 'SCHEDULED',
      scheduledAt: { $gte: new Date() }
    })
    .populate('inspectorId', 'name')
    .sort({ scheduledAt: 1 });

    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPastVisits = async (req, res) => {
  try {
    const visits = await Visit.find({
      enterpriseId: req.params.enterpriseId,
      $or: [
        { status: 'COMPLETED' },
        { scheduledAt: { $lt: new Date() } }
      ]
    })
    .populate('inspectorId', 'name')
    .sort({ scheduledAt: -1 });

    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignInspector = async (req, res) => {
  try {
    const { inspectorId } = req.body;
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    visit.inspectorId = inspectorId;
    await visit.save();

    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInspectorVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ inspectorId: req.user._id })
      .populate('enterpriseId', 'nom')
      .sort({ scheduledAt: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVisitStatus = async (req, res) => {
  try {
    const { status, outcome } = req.body;
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    if (visit.inspectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this visit' });
    }

    visit.status = status;
    if (outcome) {
      visit.outcome = outcome;
    }

    await visit.save();
    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVisitDetails = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('enterpriseId', 'nom adresse telephone email')
      .populate('inspectorId', 'name email');

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
