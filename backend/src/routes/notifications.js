// src/routes/notifications.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET api/notifications
// @desc    Get all active notifications for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Usuario solicitando notificaciones:', req.user.id);
    const notifications = await Notification.find({ 
      user: req.user.id,
      isDismissed: false 
    });
    console.log('Notificaciones encontradas:', notifications);
    res.json(notifications);
  } catch (err) {
    console.error('Error al obtener notificaciones:', err);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
});

// @route   PUT api/notifications/:id/dismiss
// @desc    Dismiss a notification
// @access  Private
router.put('/:id/dismiss', auth, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Make sure user owns notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { active: false } },
      { new: true }
    );

    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;