// models/Debt.js
/*
const mongoose = require('mongoose');

const DebtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  isIndefinite: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    required: function() { return !this.isIndefinite; }
  },
  category: {
    type: String,
    required: true,
    enum: ['Personal', 'Préstamo Bancario', 'Tarjeta de Crédito', 'Hipoteca', 'Vehículo', 'Educación', 'Otros']
  },
  reminderFrequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
    default: 'WEEKLY'
  },
  lastReminderSent: {
    type: Date
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('debt', DebtSchema);*/



// models/Debt.js
const mongoose = require('mongoose');

const DebtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  isIndefinite: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    required: function() { 
      return !this.isIndefinite; // Solo requerido si no es indefinida
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['Personal', 'Préstamo Bancario', 'Tarjeta de Crédito', 'Hipoteca', 'Vehículo', 'Educación', 'Otros']
  },
  reminderFrequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
    default: 'WEEKLY'
  },
  lastReminderSent: {
    type: Date
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('debt', DebtSchema);