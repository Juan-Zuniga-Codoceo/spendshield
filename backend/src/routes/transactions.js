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

// @route   GET api/transactions/income
// @desc    Get all income transactions for a user
// @access  Private
router.get('/income', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      user: req.user.id,
      type: 'ingreso'
    }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('Error al obtener ingresos:', err);
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});

// @route   GET api/transactions/expenses
// @desc    Get all expense transactions for a user
// @access  Private
router.get('/expenses', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      user: req.user.id,
      type: 'gasto'
    }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('Error al obtener gastos:', err);
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});

// @route   POST api/transactions
// @desc    Add new transaction
// @access  Private
// routes/transactions.js
router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, type, category, date } = req.body;

    // Validación básica
    if (!description || !amount || !type || !category) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar que amount sea un número
    if (isNaN(amount)) {
      return res.status(400).json({ message: 'El monto debe ser un número válido' });
    }

    const newTransaction = new Transaction({
      user: req.user.id,
      description,
      amount: Number(amount),
      type,
      category,
      date: date || new Date()
    });

    const transaction = await newTransaction.save();
    res.json(transaction);
  } catch (err) {
    console.error('Error al crear transacción:', err);
    res.status(500).json({ message: 'Error al crear la transacción' });
  }
});

// @route   PUT api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { description, amount, type, category } = req.body;

  // Validación básica
  if (!description || !amount || !type || !category) {
    return res.status(400).json({ msg: 'Por favor, complete todos los campos' });
  }

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
      { 
        $set: { 
          description, 
          amount: Number(amount), 
          type, 
          category 
        } 
      },
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