const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['debt', 'budget', 'general'],
    default: 'general'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'debt',
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDismissed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('notification', NotificationSchema);