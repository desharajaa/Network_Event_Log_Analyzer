const mongoose = require('mongoose');

const networkLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILED'],
      index: true
    },
    fsmState: {
      type: String,
      required: true,
      enum: ['S0', 'S1', 'S2', 'S3'],
      index: true
    },
    previousState: {
      type: String,
      enum: ['S0', 'S1', 'S2', 'S3']
    },
    input: {
      type: String,
      enum: ['S', 'F']
    },
    analysisResult: {
      type: String,
      default: ''
    },
    rawLog: {
      type: String,
      default: ''
    },
    lineNumber: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NetworkLog', networkLogSchema);
