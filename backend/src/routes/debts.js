// src/routes/debts.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Debt = require('../models/Debt');

// @route   GET api/debts
// @desc    Get all debts for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ user: req.user.id }).sort({ dueDate: 1 });
    res.json(debts);
  } catch (err) {
    console.error('Error al obtener deudas:', err);
    res.status(500).json({ message: 'Error al obtener deudas', error: err.message });
  }
});

// @route   GET api/debts/upcoming
// @desc    Get upcoming debt payments for the user
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const oneMonthFromNow = new Date(currentDate.setMonth(currentDate.getMonth() + 1));

    const upcomingDebts = await Debt.find({
      user: req.user.id,
      dueDate: { $gte: currentDate, $lte: oneMonthFromNow },
      isPaid: false
    }).sort({ dueDate: 1 }).limit(5);

    res.json(upcomingDebts);
  } catch (err) {
    console.error('Error al obtener deudas próximas:', err);
    res.status(500).json({ message: 'Error al obtener deudas próximas', error: err.message });
  }
});

// @route   POST api/debts
// @desc    Add new debt
// @access  Private
router.post('/', auth, async (req, res) => {
  const { description, amount, dueDate, isPaid } = req.body;

  try {
    const newDebt = new Debt({
      user: req.user.id,
      description,
      amount,
      dueDate,
      isPaid: isPaid || false
    });

    const debt = await newDebt.save();
    res.json(debt);
  } catch (err) {
    console.error('Error al añadir deuda:', err);
    res.status(500).json({ message: 'Error al añadir deuda', error: err.message });
  }
});

// @route   PUT api/debts/:id
// @desc    Update debt
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { description, amount, dueDate, isPaid } = req.body;

  try {
    let debt = await Debt.findById(req.params.id);

    if (!debt) return res.status(404).json({ msg: 'Deuda no encontrada' });

    // Asegurarse de que el usuario sea dueño de la deuda
    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    debt = await Debt.findByIdAndUpdate(
      req.params.id,
      { $set: { description, amount, dueDate, isPaid } },
      { new: true }
    );

    res.json(debt);
  } catch (err) {
    console.error('Error al actualizar deuda:', err);
    res.status(500).json({ message: 'Error al actualizar deuda', error: err.message });
  }
});

// @route   DELETE api/debts/:id
// @desc    Delete a debt
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let debt = await Debt.findById(req.params.id);

    if (!debt) return res.status(404).json({ msg: 'Deuda no encontrada' });

    // Asegurarse de que el usuario sea dueño de la deuda
    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    await Debt.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Deuda eliminada' });
  } catch (err) {
    console.error('Error al eliminar deuda:', err);
    res.status(500).json({ message: 'Error al eliminar deuda', error: err.message });
  }
});

module.exports = router;