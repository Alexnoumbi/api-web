const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entreprise',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['BUSINESS_PLAN', 'FINANCIAL_STATEMENT', 'TAX_CERTIFICATE', 'SOCIAL_SECURITY', 'TRADE_REGISTER']
  },
  required: {
    type: Boolean,
    default: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['RECEIVED', 'WAITING', 'EXPIRED', 'UPDATE_REQUIRED', 'VALIDATED'],
    default: 'WAITING'
  },
  files: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  uploadedAt: Date,
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: Date,
  comment: String
}, {
  timestamps: true
});

documentSchema.index({ enterpriseId: 1, type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Document', documentSchema);
