const Document = require('../models/Document');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');

exports.getCompanyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ enterpriseId: req.params.companyId })
      .populate('validatedBy', 'name');
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Upload file to S3
    const uploadResult = await uploadToS3(file);

    // Create document record
    const document = new Document({
      enterpriseId: req.params.companyId,
      type,
      files: [{
        name: file.originalname,
        url: uploadResult.Location
      }],
      uploadedAt: new Date(),
      status: 'WAITING'
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateDocument = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = status;
    document.comment = comment;
    document.validatedBy = req.user.id;
    document.validatedAt = new Date();

    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete files from S3
    for (const file of document.files) {
      await deleteFromS3(file.url);
    }

    await document.remove();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocumentTypes = async (req, res) => {
  try {
    const types = Object.values(Document.schema.path('type').enumValues);
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
