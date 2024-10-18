// src/app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const budgetRoutes = require('./routes/budgets');
const transactionRoutes = require('./routes/transactions');
const debtRoutes = require('./routes/debts');
const incomeRoutes = require('./routes/incomes');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const overviewRoutes = require('./routes/overview');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/overview', overviewRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'An unexpected error occurred!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 404 Not Found middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log('MongoDB connected');
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

module.exports = app;