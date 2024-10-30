/*const express = require('express');
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
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    const upcomingDebts = await Debt.find({
      user: req.user.id,
      dueDate: {
        $gte: currentDate,
        $lte: thirtyDaysFromNow
      },
      isPaid: false
    }).sort({ dueDate: 1 });

    res.json(upcomingDebts);
  } catch (err) {
    console.error('Error al obtener deudas próximas:', err);
    res.status(500).json({ message: 'Error al obtener deudas próximas' });
  }
});

// @route   POST api/debts
// @desc    Add new debt
// @access  Private
router.post('/', auth, async (req, res) => {
  const { description, amount, dueDate, isPaid, category } = req.body;

  try {
    const newDebt = new Debt({
      user: req.user.id,
      description,
      amount,
      dueDate,
      category,
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
  const { description, amount, dueDate, isPaid, category } = req.body;

  try {
    let debt = await Debt.findById(req.params.id);

    if (!debt) return res.status(404).json({ msg: 'Deuda no encontrada' });

    // Asegurarse de que el usuario sea dueño de la deuda
    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    debt = await Debt.findByIdAndUpdate(
      req.params.id,
      { $set: { description, amount, dueDate, isPaid, category } },
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

    await Debt.findByIdAndDelete(req.params.id); // Cambiado de findByIdAndRemove a findByIdAndDelete

    res.json({ msg: 'Deuda eliminada' });
  } catch (err) {
    console.error('Error al eliminar deuda:', err);
    res.status(500).json({ message: 'Error al eliminar deuda', error: err.message });
  }
});

module.exports = router;*/


// routes/debts.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Debt = require('../models/Debt');

// @route   GET api/debts
// @desc    Get all debts for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ user: req.user.id }).sort({ createdAt: -1 });
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
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    const upcomingDebts = await Debt.find({
      user: req.user.id,
      isPaid: false,
      $or: [
        {
          isIndefinite: true,
          lastReminderSent: { 
            $lt: getNextReminderDate(currentDate, 'WEEKLY') 
          }
        },
        {
          isIndefinite: false,
          dueDate: {
            $gte: currentDate,
            $lte: thirtyDaysFromNow
          }
        }
      ]
    }).sort({ dueDate: 1 });

    res.json(upcomingDebts);
  } catch (err) {
    console.error('Error al obtener deudas próximas:', err);
    res.status(500).json({ message: 'Error al obtener deudas próximas' });
  }
});

// @route   POST api/debts
// @desc    Add new debt
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      description,
      amount,
      dueDate,
      category,
      isIndefinite,
      reminderFrequency
    } = req.body;

    const newDebt = new Debt({
      user: req.user.id,
      description,
      amount,
      category,
      isIndefinite: isIndefinite || false,
      reminderFrequency: reminderFrequency || 'WEEKLY'
    });

    if (!isIndefinite && dueDate) {
      newDebt.dueDate = dueDate;
    }

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
  try {
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ msg: 'Deuda no encontrada' });
    }

    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    const updateData = { ...req.body };

    // Si la deuda se marca como pagada, agregar la fecha de pago
    if (req.body.isPaid && !debt.isPaid) {
      updateData.paidDate = new Date();
    } else if (!req.body.isPaid) {
      updateData.paidDate = null;
    }

    // Si la deuda se marca como indefinida, eliminar la fecha de vencimiento
    if (req.body.isIndefinite) {
      updateData.dueDate = null;
    }

    const updatedDebt = await Debt.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(updatedDebt);
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
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ msg: 'Deuda no encontrada' });
    }

    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    await Debt.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deuda eliminada' });
  } catch (err) {
    console.error('Error al eliminar deuda:', err);
    res.status(500).json({ message: 'Error al eliminar deuda', error: err.message });
  }
});

// Función auxiliar para calcular la próxima fecha de recordatorio
function getNextReminderDate(currentDate, frequency) {
  const date = new Date(currentDate);
  switch (frequency) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      date.setDate(date.getDate() + 7); // Default a semanal
  }
  return date;
}

module.exports = router;
