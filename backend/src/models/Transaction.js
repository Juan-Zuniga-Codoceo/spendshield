// src/models/Transaction.js

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('transaction', TransactionSchema);