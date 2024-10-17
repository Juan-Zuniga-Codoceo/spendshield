// backend/scripts/initDB.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function initializeDatabase() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Oculta la contraseña en el log

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Limpiar la colección de usuarios
    await User.deleteMany({});
    console.log('Users collection cleared');

    // Eliminar índices existentes (excepto el _id que es automático)
    const indexes = await User.collection.indexes();
    for (let index of indexes) {
      if (index.name !== '_id_') {
        await User.collection.dropIndex(index.name);
        console.log(`Dropped index: ${index.name}`);
      }
    }

    // Crear nuevos índices
    await User.createIndexes();
    console.log('User indexes recreated');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

initializeDatabase();