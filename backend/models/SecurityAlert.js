const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    totalFailures: {
      type: Number,
      required: true,
      default: 3
    },
    alertType: {
      type: String,
      required: true,
      default: 'BRUTE_FORCE_SUSPECTED'
    },
    severity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH'
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
