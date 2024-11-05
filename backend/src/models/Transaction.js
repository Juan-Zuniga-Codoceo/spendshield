// models/Transaction.js
/*
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['ingreso', 'gasto'],
    required: true
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

module.exports = mongoose.model('transaction', TransactionSchema);*/

const mongoose = require('mongoose');

// Primero definimos el esquema
const TransactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['ingreso', 'gasto'],
    required: true
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

// Después de definir el esquema, añadimos los índices
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, type: 1 });

// Método para obtener transacciones del mes actual
TransactionSchema.statics.getCurrentMonthTransactions = async function(userId) {
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  try {
    const transactions = await this.find({
      user: userId,
      date: { $gte: firstDayOfMonth }
    }).sort({ date: -1 });

    console.log('Transacciones encontradas para el mes:', {
      userId,
      count: transactions.length,
      firstDay: firstDayOfMonth,
      ingresos: transactions.filter(t => t.type === 'ingreso').length,
      gastos: transactions.filter(t => t.type === 'gasto').length
    });

    return transactions;
  } catch (error) {
    console.error('Error al obtener transacciones del mes:', error);
    throw error;
  }
};

// Método para calcular totales
TransactionSchema.statics.calculateTotals = function(transactions) {
  try {
    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'ingreso') {
        acc.ingresos += transaction.amount;
      } else {
        acc.gastos += transaction.amount;
      }
      return acc;
    }, { ingresos: 0, gastos: 0 });

    console.log('Totales calculados:', totals);
    return totals;
  } catch (error) {
    console.error('Error al calcular totales:', error);
    throw error;
  }
};

// Finalmente exportamos el modelo
const Transaction = mongoose.model('transaction', TransactionSchema);

module.exports = Transaction;