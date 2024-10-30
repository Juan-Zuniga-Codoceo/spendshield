// src/routes/overview.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

router.get('/summary', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get total income and expenses for the current month
    const monthlyTransactions = await Transaction.aggregate([
      { $match: { user: req.user.id, date: { $gte: firstDayOfMonth } } },
      { $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        totalExpenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
      } }
    ]);

    // Get total budget for the current month
    const monthlyBudget = await Budget.aggregate([
      { $match: { user: req.user.id, month: currentDate.getMonth(), year: currentDate.getFullYear() } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const { totalIncome, totalExpenses } = monthlyTransactions[0] || { totalIncome: 0, totalExpenses: 0 };
    const budgetTotal = monthlyBudget[0]?.total || 0;

    res.json({
      currentBalance: totalIncome - totalExpenses,
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      remainingBudget: budgetTotal - totalExpenses
    });
  } catch (err) {
    console.error('Error en la ruta de resumen:', err);
    res.status(500).json({ message: 'Error al obtener el resumen financiero', error: err.message });
  }
});

module.exports = router;