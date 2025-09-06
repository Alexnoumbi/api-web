const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entreprise',
    required: true
  },
  inspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  type: {
    type: String,
    enum: ['REGULAR', 'FOLLOW_UP', 'EMERGENCY'],
    required: true
  },
  report: {
    content: String,
    files: [{
      name: String,
      url: String
    }],
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    outcome: {
      type: String,
      enum: ['COMPLIANT', 'NON_COMPLIANT', 'NEEDS_FOLLOW_UP']
    }
  },
  cancellationReason: String
}, {
  timestamps: true
});

visitSchema.index({ enterpriseId: 1, scheduledAt: 1 });
visitSchema.index({ status: 1 });
visitSchema.index({ inspectorId: 1 });

module.exports = mongoose.model('Visit', visitSchema);
