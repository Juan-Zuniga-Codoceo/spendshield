// routes/transactions.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @route   GET api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('Error al obtener transacciones:', err);
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});

// @route   POST api/transactions
// @desc    Add new transaction
// @access  Private
router.post('/', auth, async (req, res) => {
  const { description, amount, type, category } = req.body;

  try {
    const newTransaction = new Transaction({
      user: req.user.id,
      description,
      amount,
      type,
      category
    });

    const transaction = await newTransaction.save();
    res.json(transaction);
  } catch (err) {
    console.error('Error al añadir transacción:', err);
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});

// @route   PUT api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { description, amount, type, category } = req.body;

  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transacción no encontrada' });
    }

    // Verificar si el usuario es dueño de la transacción
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Usuario no autorizado' });
    }

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: { description, amount, type, category } },
      { new: true }
    );

    res.json(transaction);
  } catch (err) {
    console.error('Error al actualizar transacción:', err);
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});

// @route   DELETE api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transacción no encontrada' });
    }

    // Verificar si el usuario es dueño de la transacción
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Usuario no autorizado' });
    }

    await transaction.deleteOne();

    res.json({ msg: 'Transacción eliminada' });
  } catch (err) {
    console.error('Error al eliminar la transacción:', err);
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});

// @route   GET api/transactions/summary
// @desc    Get summary of transactions
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const income = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), type: 'ingreso' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expenses = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), type: 'gasto' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncome = income.length > 0 ? income[0].total : 0;
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses
    });
  } catch (err) {
    console.error('Error al obtener el resumen de transacciones:', err);
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});

module.exports = router;