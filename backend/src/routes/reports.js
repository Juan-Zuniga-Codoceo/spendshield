// src/routes/reports.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Reports'); // Importante: importar el modelo Report

// @route   GET api/reports
// @desc    Get all reports for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error al obtener informes:', err);
    res.status(500).json({ message: 'Error al obtener informes' });
  }
});

// @route   POST api/reports
// @desc    Create a new report
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, data } = req.body;
    
    if (!data || !title) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const newReport = new Report({
      user: req.user.id,
      title,
      data
    });

    const savedReport = await newReport.save();
    res.json(savedReport);
  } catch (err) {
    console.error('Error al crear reporte:', err);
    res.status(500).json({ 
      message: 'Error al crear reporte',
      error: err.message 
    });
  }
});

// @route   DELETE api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    // Verificar que el informe pertenece al usuario
    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Informe eliminado' });
  } catch (err) {
    console.error('Error al eliminar informe:', err);
    res.status(500).json({ message: 'Error al eliminar informe' });
  }
});

module.exports = router;