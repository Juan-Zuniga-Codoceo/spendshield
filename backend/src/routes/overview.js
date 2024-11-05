// src/routes/overview.js
/*
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
    console.log('Iniciando obtención de resumen financiero para usuario:', req.user.id);
    
    // Obtener el primer día del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    console.log('Fecha inicio del mes:', firstDayOfMonth);

    // Obtener todas las transacciones del usuario
    console.log('Buscando transacciones desde:', firstDayOfMonth);
    const transactions = await Transaction.find({ 
      user: req.user.id,
      date: { $gte: firstDayOfMonth }
    });
    console.log('Transacciones encontradas:', transactions.length);

    // Calcular ingresos y gastos del mes
    const monthlyIncome = transactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    console.log('Ingresos mensuales calculados:', monthlyIncome);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);
    console.log('Gastos mensuales calculados:', monthlyExpenses);

    // Calcular el balance actual
    const currentBalance = monthlyIncome - monthlyExpenses;
    console.log('Balance actual calculado:', currentBalance);

    // Obtener totales por categoría para gastos
    const expensesByCategory = transactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
    console.log('Gastos por categoría:', expensesByCategory);

    // Obtener deudas pendientes
    console.log('Buscando deudas pendientes...');
    const unpaidDebts = await Debt.find({
      user: req.user.id,
      isPaid: false
    }).sort({ dueDate: 1 });
    console.log('Deudas pendientes encontradas:', unpaidDebts.length);

    const totalDebts = unpaidDebts.reduce((sum, debt) => sum + debt.amount, 0);
    console.log('Total de deudas calculado:', totalDebts);

    const summaryData = {
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
    };

    console.log('Datos del resumen a enviar:', {
      balance: summaryData.currentBalance,
      ingresos: summaryData.monthlyIncome,
      gastos: summaryData.monthlyExpenses,
      deudas: summaryData.totalDebts,
      numTransacciones: transactions.length
    });

    res.json(summaryData);

  } catch (err) {
    console.error('Error detallado al obtener resumen financiero:', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id
    });
    
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

module.exports = router;*/



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
    console.log('Iniciando obtención de resumen financiero para usuario:', req.user.id);
    
    // Calcular fechas
    const currentDate = new Date();
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const sixMonthsAgo = new Date(currentDate);
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Primer día del mes
    
    console.log('Rango de fechas:', {
      desde: sixMonthsAgo.toISOString(),
      hasta: currentDate.toISOString()
    });

    // Obtener todas las transacciones de los últimos 6 meses
    const allTransactions = await Transaction.find({
      user: req.user.id,
      date: { 
        $gte: sixMonthsAgo,
        $lte: currentDate
      }
    }).sort({ date: 1 }).lean();

    console.log(`Total transacciones encontradas: ${allTransactions.length}`);

    // Inicializar acumuladores
    const monthlyData = {};
    const expensesByCategory = {};
    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;

    // Procesar todas las transacciones
    allTransactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleString('es-ES', { month: 'short' });
      const isCurrentMonth = date >= startOfCurrentMonth;

      // Inicializar datos del mes si no existe
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          ingresos: 0,
          gastos: 0
        };
      }

      // Actualizar datos mensuales
      if (transaction.type === 'ingreso') {
        monthlyData[monthKey].ingresos += amount;
        if (isCurrentMonth) currentMonthIncome += amount;
      } else if (transaction.type === 'gasto') {
        monthlyData[monthKey].gastos += amount;
        if (isCurrentMonth) {
          currentMonthExpenses += amount;
          // Actualizar gastos por categoría solo para el mes actual
          const category = transaction.category || 'Sin Categoría';
          expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
        }
      }
    });

    // Convertir datos mensuales a array y ordenar
    const monthlyTrends = Object.values(monthlyData)
      .sort((a, b) => {
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return months.indexOf(a.month.toLowerCase()) - months.indexOf(b.month.toLowerCase());
      });

    // Crear objeto de respuesta
    const response = {
      currentBalance: currentMonthIncome - currentMonthExpenses,
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpenses,
      expensesByCategory,
      monthlyTrends,
      summary: {
        totalTransactions: allTransactions.length,
        months: monthlyTrends.length,
        periodStart: sixMonthsAgo,
        lastUpdate: new Date()
      }
    };

    console.log('Datos de tendencias:', {
      mesesProcesados: monthlyTrends.length,
      meses: monthlyTrends.map(m => m.month),
      totalesIngresos: monthlyTrends.map(m => m.ingresos),
      totalesGastos: monthlyTrends.map(m => m.gastos)
    });

    res.json(response);

  } catch (err) {
    console.error('Error en resumen financiero:', err);
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
    console.log('Obteniendo tendencias para usuario:', req.user.id);
    
    // Obtener fecha de hace 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    console.log('Buscando transacciones desde:', sixMonthsAgo.toISOString());
    const transactions = await Transaction.find({
      user: req.user.id,
      date: { $gte: sixMonthsAgo }
    }).lean();

    if (!Array.isArray(transactions)) {
      throw new Error('Error al obtener transacciones para tendencias');
    }
    console.log('Transacciones encontradas para tendencias:', transactions.length);

    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, ingresos: 0, gastos: 0 };
      }

      const amount = Number(transaction.amount);
      if (!isNaN(amount)) {
        if (transaction.type === 'ingreso') {
          acc[monthKey].ingresos += amount;
        } else {
          acc[monthKey].gastos += amount;
        }
      }

      return acc;
    }, {});

    const trends = Object.values(monthlyData).sort((a, b) => {
      return new Date(a.month) - new Date(b.month);
    });

    console.log('Tendencias calculadas:', trends.length, 'meses');
    res.json(trends);

  } catch (err) {
    console.error('Error detallado al obtener tendencias:', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id
    });
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
    console.log('Obteniendo categorías para usuario:', req.user.id);
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    console.log('Buscando transacciones desde:', firstDayOfMonth.toISOString());
    const transactions = await Transaction.find({
      user: req.user.id,
      type: 'gasto',
      date: { $gte: firstDayOfMonth }
    }).lean();

    if (!Array.isArray(transactions)) {
      throw new Error('Error al obtener transacciones para categorías');
    }
    console.log('Transacciones de gastos encontradas:', transactions.length);

    const categoryData = transactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Sin Categoría';
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }

      const amount = Number(transaction.amount);
      if (!isNaN(amount)) {
        acc[category].total += amount;
        acc[category].count += 1;
        acc[category].transactions.push({
          id: transaction._id,
          amount: amount,
          date: transaction.date,
          description: transaction.description
        });
      }

      return acc;
    }, {});

    const totalGastos = transactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      return isNaN(amount) ? sum : sum + amount;
    }, 0);

    const categories = Object.entries(categoryData).map(([name, data]) => ({
      name,
      ...data,
      percentage: totalGastos > 0 ? (data.total / totalGastos * 100) : 0
    }));

    console.log('Categorías procesadas:', categories.length);
    res.json(categories);

  } catch (err) {
    console.error('Error detallado al obtener categorías:', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id
    });
    res.status(500).json({ 
      message: 'Error al obtener categorías',
      error: err.message 
    });
  }
});

module.exports = router;