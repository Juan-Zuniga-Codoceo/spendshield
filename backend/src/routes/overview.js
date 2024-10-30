// src/routes/overview.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Debt = require('../models/Debt');

// @route   GET api/overview/summary
// @desc    Get financial summary for a user
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    // Obtener el primer día del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Obtener todas las transacciones del usuario
    const transactions = await Transaction.find({ 
      user: req.user.id,
      date: { $gte: firstDayOfMonth }
    });

    // Calcular ingresos y gastos del mes
    const monthlyIncome = transactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular el balance actual
    const currentBalance = monthlyIncome - monthlyExpenses;

    // Obtener totales por categoría para gastos
    const expensesByCategory = transactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Obtener deudas pendientes
    const unpaidDebts = await Debt.find({
      user: req.user.id,
      isPaid: false
    }).sort({ dueDate: 1 });

    const totalDebts = unpaidDebts.reduce((sum, debt) => sum + debt.amount, 0);

    res.json({
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      totalDebts,
      expensesByCategory,
      lastUpdate: new Date(),
      summary: {
        income: {
          total: monthlyIncome,
          transactions: transactions.filter(t => t.type === 'ingreso').length
        },
        expenses: {
          total: monthlyExpenses,
          transactions: transactions.filter(t => t.type === 'gasto').length
        },
        debts: {
          total: totalDebts,
          count: unpaidDebts.length
        }
      }
    });

  } catch (err) {
    console.error('Error obteniendo resumen financiero:', err);
    res.status(500).json({ 
      message: 'Error al obtener el resumen financiero',
      error: err.message 
    });
  }
});

// @route   GET api/overview/trends
// @desc    Get monthly trends
// @access  Private
router.get('/trends', auth, async (req, res) => {
  try {
    // Obtener fecha de hace 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.find({
      user: req.user.id,
      date: { $gte: sixMonthsAgo }
    });

    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, ingresos: 0, gastos: 0 };
      }

      if (transaction.type === 'ingreso') {
        acc[monthKey].ingresos += transaction.amount;
      } else {
        acc[monthKey].gastos += transaction.amount;
      }

      return acc;
    }, {});

    const trends = Object.values(monthlyData).sort((a, b) => {
      return new Date(a.month) - new Date(b.month);
    });

    res.json(trends);

  } catch (err) {
    console.error('Error obteniendo tendencias:', err);
    res.status(500).json({ 
      message: 'Error al obtener tendencias',
      error: err.message 
    });
  }
});

// @route   GET api/overview/categories
// @desc    Get expenses by category
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await Transaction.find({
      user: req.user.id,
      type: 'gasto',
      date: { $gte: firstDayOfMonth }
    });

    const categoryData = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }

      acc[transaction.category].total += transaction.amount;
      acc[transaction.category].count += 1;
      acc[transaction.category].transactions.push({
        id: transaction._id,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description
      });

      return acc;
    }, {});

    const categories = Object.entries(categoryData).map(([name, data]) => ({
      name,
      ...data,
      percentage: (data.total / transactions.reduce((sum, t) => sum + t.amount, 0)) * 100
    }));

    res.json(categories);

  } catch (err) {
    console.error('Error obteniendo categorías:', err);
    res.status(500).json({ 
      message: 'Error al obtener categorías',
      error: err.message 
    });
  }
});

module.exports = router;