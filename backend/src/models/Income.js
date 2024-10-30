// src/models/Income.js

const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  source: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('income', IncomeSchema);