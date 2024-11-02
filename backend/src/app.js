require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');
const cron = require('node-cron');
const notificationService = require('./services/notificationService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const debtRoutes = require('./routes/debts');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const overviewRoutes = require('./routes/overview');
const budgetRoutes = require('./routes/budgets');

const app = express();

// Middleware - IMPORTANTE: Todo el middleware debe ir ANTES de las rutas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Configuración de Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://*"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      connectSrc: ["'self'", "https://*"],
    },
  },
}));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', 'https://spendshield.netlify.app');
  }
}));

// Connect to Database
const initializeApp = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected successfully');

    console.log('Iniciando verificación inicial de deudas...');
    await notificationService.checkUpcomingDebts();
    console.log('Verificación inicial completada');
  } catch (err) {
    console.error('Error durante la inicialización:', err);
    process.exit(1);
  }
};

// Health check endpoint con más información
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV,
    version: process.version
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/budgets', budgetRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error middleware:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 404 Not Found middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Verificaciones programadas
cron.schedule('0 9 * * *', async () => {
  console.log('Ejecutando verificación diaria de deudas (9 AM)...');
  try {
    await notificationService.checkUpcomingDebts();
    console.log('Verificación diaria completada exitosamente');
  } catch (err) {
    console.error('Error en verificación diaria:', err);
  }
});

cron.schedule('*/5 * * * *', async () => {
  console.log('Ejecutando verificación de prueba de deudas (cada 5 min)...');
  try {
    await notificationService.checkUpcomingDebts();
    console.log('Verificación de prueba completada exitosamente');
  } catch (err) {
    console.error('Error en verificación de prueba:', err);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await initializeApp();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;