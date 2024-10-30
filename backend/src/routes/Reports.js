// src/routes/reports.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Debt = require('../models/Debt');

// @route   GET api/reports
// @desc    Get all reports for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error al obtener informes:', err);
    res.status(500).json({ message: 'Error al obtener informes' });
  }
});

// @route   POST api/reports
// @desc    Create a new report
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    // Obtener todos los datos financieros actuales
    const [expenses, incomes, debts] = await Promise.all([
      Expense.find({ user: req.user.id }),
      Income.find({ user: req.user.id }),
      Debt.find({ user: req.user.id })
    ]);

    // Calcular totales
    const totalIncome = incomes.reduce((acc, inc) => acc + inc.amount, 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalDebts = debts.reduce((acc, debt) => acc + debt.amount, 0);
    const balance = totalIncome - totalExpenses;

    const newReport = new Report({
      user: req.user.id,
      title: req.body.title || `Informe Financiero - ${new Date().toLocaleDateString()}`,
      data: {
        expenses,
        incomes,
        debts,
        summary: {
          totalIncome,
          totalExpenses,
          totalDebts,
          balance
        }
      },
      description: req.body.description
    });

    const report = await newReport.save();
    res.json(report);
  } catch (err) {
    console.error('Error al crear informe:', err);
    res.status(500).json({ message: 'Error al crear informe' });
  }
});

// @route   GET api/reports/:id
// @desc    Get a specific report
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    // Verificar que el informe pertenece al usuario
    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    res.json(report);
  } catch (err) {
    console.error('Error al obtener informe:', err);
    res.status(500).json({ message: 'Error al obtener informe' });
  }
});

// @route   DELETE api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    // Verificar que el informe pertenece al usuario
    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Informe eliminado' });
  } catch (err) {
    console.error('Error al eliminar informe:', err);
    res.status(500).json({ message: 'Error al eliminar informe' });
  }
});

module.exports = router;