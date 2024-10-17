// src/routes/budgets.js

const express = require('express');
const router = express.Router();

// TODO: Implement budget controller
// const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgets');

router.get('/', (req, res) => res.send('Get budgets route'));
router.post('/', (req, res) => res.send('Create budget route'));
router.put('/:id', (req, res) => res.send('Update budget route'));
router.delete('/:id', (req, res) => res.send('Delete budget route'));

module.exports = router;