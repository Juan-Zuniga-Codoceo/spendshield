// src/models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  data: {
    transactions: [{
      type: Object
    }],
    incomes: [{
      type: Object
    }],
    expenses: [{
      type: Object
    }],
    debts: [{
      type: Object
    }],
    summary: {
      totalIncome: Number,
      totalExpenses: Number,
      totalDebts: Number
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('report', ReportSchema);