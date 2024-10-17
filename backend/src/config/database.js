// src/config/database.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
    const uri = process.env.MONGODB_URI.replace('<password>', password);
    
    console.log('Attempting to connect to MongoDB...');
    console.log('URI (with password hidden):', uri.replace(password, '********'));
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDB;