const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Report = require('../models/Reports');
const mongoose = require('mongoose');

// @route   GET api/budgets
// @desc    Get all budgets for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (err) {
    console.error('Error al obtener presupuestos:', err.message);
    res.status(500).json({ message: 'Error al obtener presupuestos' });
  }
});

// @route   POST api/budgets
// @desc    Add new budget
// @access  Private
router.post('/', auth, async (req, res) => {
  const { category, amount } = req.body;

  try {
    const newBudget = new Budget({
      user: req.user.id,
      category,
      amount
    });

    const budget = await newBudget.save();
    res.json(budget);
  } catch (err) {
    console.error('Error al crear presupuesto:', err.message);
    res.status(500).json({ message: 'Error al crear presupuesto' });
  }
});

// @route   PUT api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { category, amount } = req.body;

  try {
    let budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      { $set: { category, amount } },
      { new: true }
    );

    res.json(budget);
  } catch (err) {
    console.error('Error al actualizar presupuesto:', err.message);
    res.status(500).json({ message: 'Error al actualizar presupuesto' });
  }
});

// @route   DELETE api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await budget.deleteOne();
    res.json({ message: 'Presupuesto eliminado' });
  } catch (err) {
    console.error('Error al eliminar presupuesto:', err.message);
    res.status(500).json({ message: 'Error al eliminar presupuesto' });
  }
});

// @route   POST api/budgets/reset
// @desc    Reset monthly budget and archive data
// @access  Private
router.post('/reset', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Obtener datos actuales
    const [transactions, budgets] = await Promise.all([
      Transaction.find({ user: req.user.id }),
      Budget.find({ user: req.user.id })
    ]);

    // 2. Separar y calcular totales
    const incomes = transactions.filter(t => t.type === 'ingreso');
    const expenses = transactions.filter(t => t.type === 'gasto');
    
    const totals = {
      totalIncome: incomes.reduce((acc, inc) => acc + inc.amount, 0),
      totalExpenses: expenses.reduce((acc, exp) => acc + exp.amount, 0),
      totalBudget: budgets.reduce((acc, budget) => acc + budget.amount, 0)
    };

    // 3. Crear informe mensual automático
    const monthlyReport = new Report({
      user: req.user.id,
      title: `Informe Mensual - ${new Date().toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      })}`,
      data: {
        transactions,
        incomes,
        expenses,
        budgets,
        summary: {
          ...totals,
          monthName: new Date().toLocaleDateString('es-ES', { month: 'long' }),
          year: new Date().getFullYear()
        }
      },
      date: new Date(),
      type: 'monthly'
    });

    await monthlyReport.save({ session });

    // 4. Eliminar transacciones del mes actual
    await Transaction.deleteMany({ 
      user: req.user.id 
    }, { session });

    // 5. Reiniciar montos de presupuestos a cero
    const resetPromises = budgets.map(budget => 
      Budget.findByIdAndUpdate(
        budget._id,
        { $set: { spent: 0 } },
        { session }
      )
    );
    await Promise.all(resetPromises);

    await session.commitTransaction();
    session.endSession();

    res.json({ 
      message: 'Presupuesto reiniciado exitosamente',
      report: monthlyReport
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error al reiniciar presupuesto:', error);
    res.status(500).json({ 
      message: 'Error al reiniciar presupuesto',
      error: error.message 
    });
  }
});

// @route   GET api/budgets/summary
// @desc    Get budget summary with spending progress
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    const transactions = await Transaction.find({ 
      user: req.user.id,
      type: 'gasto'
    });

    // Calcular gastos por categoría
    const spendingByCategory = transactions.reduce((acc, trans) => {
      acc[trans.category] = (acc[trans.category] || 0) + trans.amount;
      return acc;
    }, {});

    // Agregar información de gastos a cada presupuesto
    const budgetSummary = budgets.map(budget => ({
      _id: budget._id,
      category: budget.category,
      amount: budget.amount,
      spent: spendingByCategory[budget.category] || 0,
      remaining: budget.amount - (spendingByCategory[budget.category] || 0),
      percentage: ((spendingByCategory[budget.category] || 0) / budget.amount) * 100
    }));

    res.json(budgetSummary);
  } catch (err) {
    console.error('Error al obtener resumen de presupuesto:', err.message);
    res.status(500).json({ message: 'Error al obtener resumen de presupuesto' });
  }
});

module.exports = router;