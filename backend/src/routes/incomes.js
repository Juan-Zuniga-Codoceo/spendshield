// src/routes/incomes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Income = require('../models/Income');

// @route   GET api/incomes
// @desc    Get all income sources for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(incomes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/incomes
// @desc    Add new income source
// @access  Private
router.post('/', auth, async (req, res) => {
  const { source, amount, frequency, isRecurring } = req.body;

  try {
    const newIncome = new Income({
      user: req.user.id,
      source,
      amount,
      frequency,
      isRecurring
    });

    const income = await newIncome.save();
    res.json(income);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;