// src/routes/reports.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');

// @route   GET api/reports/expenses-by-category
// @desc    Get expenses grouped by category
// @access  Private
router.get('/expenses-by-category', auth, async (req, res) => {
  try {
    const expenses = await Expense.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/income-vs-expenses
// @desc    Get income vs expenses for last 6 months
// @access  Private
router.get('/income-vs-expenses', auth, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const incomes = await Income.aggregate([
      { $match: { user: req.user.id, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $month: '$date' }, income: { $sum: '$amount' } } }
    ]);

    const expenses = await Expense.aggregate([
      { $match: { user: req.user.id, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $month: '$date' }, expenses: { $sum: '$amount' } } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const result = monthNames.map((month, index) => ({
      month,
      income: (incomes.find(i => i._id === index + 1) || {}).income || 0,
      expenses: (expenses.find(e => e._id === index + 1) || {}).expenses || 0
    })).slice(0, 6);

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/budget-overview
// @desc    Get budget overview (total budget vs total expenses)
// @access  Private
router.get('/budget-overview', auth, async (req, res) => {
  try {
    const totalBudget = await Budget.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpenses = await Expense.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      total: totalBudget[0]?.total || 0,
      used: totalExpenses[0]?.total || 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;