// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: 'CLP',
    enum: ['CLP', 'USD', 'EUR']
  },
  avatar: {
    type: String,
    default: null
  },
  avatarPath: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);