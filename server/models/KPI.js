const mongoose = require('mongoose');

const kpiSubmissionSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending'
  },
  comment: String
});

const kpiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  targetValue: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entreprise',
    required: true
  },
  history: [kpiSubmissionSchema]
}, {
  timestamps: true
});

kpiSchema.index({ enterpriseId: 1 });
kpiSchema.index({ 'history.date': 1 });
kpiSchema.index({ 'history.status': 1 });

module.exports = mongoose.model('KPI', kpiSchema);
