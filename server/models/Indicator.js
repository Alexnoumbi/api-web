const mongoose = require('mongoose');

const indicatorHistorySchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'VALIDATED', 'REJECTED'],
    default: 'PENDING'
  },
  comment: String,
  attachments: [{
    name: String,
    url: String,
    uploadedAt: Date
  }]
});

const indicatorSchema = new mongoose.Schema({
  conventionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convention',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['NUMERIC', 'PERCENTAGE', 'CURRENCY', 'BOOLEAN'],
    required: true
  },
  unit: String,
  frequency: {
    type: String,
    enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  minValue: Number,
  maxValue: Number,
  currentValue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'NOT_STARTED'],
    default: 'NOT_STARTED'
  },
  nextReportingDate: Date,
  history: [indicatorHistorySchema],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }
}, {
  timestamps: true
});

// Calculate status based on current value vs target
indicatorSchema.methods.calculateStatus = function() {
  if (!this.currentValue) return 'NOT_STARTED';

  const percentage = (this.currentValue / this.targetValue) * 100;

  if (percentage >= 90) return 'ON_TRACK';
  if (percentage >= 70) return 'AT_RISK';
  return 'OFF_TRACK';
};

// Add a new value to history
indicatorSchema.methods.addHistoryEntry = function(value, userId, attachments = [], comment = '') {
  this.history.push({
    value,
    submittedBy: userId,
    attachments,
    comment
  });

  this.currentValue = value;
  this.status = this.calculateStatus();
  this.metadata.lastModifiedBy = userId;
  this.metadata.updatedAt = new Date();
};

// Get next reporting date based on frequency
indicatorSchema.methods.calculateNextReportingDate = function() {
  const now = new Date();
  let next = new Date();

  switch(this.frequency) {
    case 'MONTHLY':
      next.setMonth(now.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(now.getMonth() + 3);
      break;
    case 'SEMI_ANNUAL':
      next.setMonth(now.getMonth() + 6);
      break;
    case 'ANNUAL':
      next.setFullYear(now.getFullYear() + 1);
      break;
  }

  return next;
};

// Middleware to update status and next reporting date
indicatorSchema.pre('save', function(next) {
  if (this.isModified('currentValue')) {
    this.status = this.calculateStatus();
  }

  if (this.isModified('frequency') || !this.nextReportingDate) {
    this.nextReportingDate = this.calculateNextReportingDate();
  }

  next();
});

module.exports = mongoose.model('Indicator', indicatorSchema);
