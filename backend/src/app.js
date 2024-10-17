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

const app = express();

// Logging for development
console.log('MONGODB_URI:', process.env.MONGODB_URI.replace(/<password>.*@/, '<password>@'));
console.log('MONGODB_PASSWORD:', process.env.MONGODB_PASSWORD ? '[PASSWORD SET]' : '[PASSWORD NOT SET]');

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 404 Not Found middleware (moved to the end)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Function to start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`MongoDB Connected`);
    });
  } catch (error) {
    console.error('Failed to connect to the database. Server not started.', error);
    process.exit(1);
  }
};

// Unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;