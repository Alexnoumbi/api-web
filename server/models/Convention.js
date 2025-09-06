const mongoose = require('mongoose');

const conventionSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entreprise',
    required: true
  },
  signedDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'],
    default: 'DRAFT'
  },
  type: {
    type: String,
    required: true,
    enum: ['INVESTMENT', 'EXPORT', 'INNOVATION', 'OTHER']
  },
  advantages: [{
    type: {
      type: String,
      required: true,
      enum: ['TAX_RELIEF', 'CUSTOMS_EXEMPTION', 'FINANCIAL_AID', 'OTHER']
    },
    description: String,
    validUntil: Date,
    conditions: String
  }],
  obligations: [{
    type: {
      type: String,
      required: true,
      enum: ['INVESTMENT_COMMITMENT', 'JOB_CREATION', 'EXPORT_QUOTA', 'REPORTING', 'OTHER']
    },
    description: String,
    targetValue: Number,
    deadline: Date,
    unit: String
  }],
  indicators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Indicator'
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  history: [{
    action: {
      type: String,
      enum: ['CREATED', 'UPDATED', 'STATUS_CHANGED', 'DOCUMENT_ADDED', 'INDICATOR_UPDATED']
    },
    date: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: mongoose.Schema.Types.Mixed
  }],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Middleware to update lastModifiedBy
conventionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.lastModifiedBy = this._lastModifiedBy;
  }
  next();
});

// Method to add history entry
conventionSchema.methods.addHistoryEntry = function(action, userId, details) {
  this.history.push({
    action,
    userId,
    details,
    date: new Date()
  });
};

// Method to check if convention is active
conventionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'ACTIVE' &&
         now >= this.startDate &&
         now <= this.endDate;
};

// Static method to find active conventions for an enterprise
conventionSchema.statics.findActiveForEnterprise = function(enterpriseId) {
  const now = new Date();
  return this.find({
    enterpriseId,
    status: 'ACTIVE',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

module.exports = mongoose.model('Convention', conventionSchema);
