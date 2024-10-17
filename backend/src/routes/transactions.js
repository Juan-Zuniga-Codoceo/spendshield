// src/routes/transactions.js

const express = require('express');
const router = express.Router();

// TODO: Implement transaction controller
// const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = require('../controllers/transactions');

router.get('/', (req, res) => res.send('Get transactions route'));
router.post('/', (req, res) => res.send('Create transaction route'));
router.put('/:id', (req, res) => res.send('Update transaction route'));
router.delete('/:id', (req, res) => res.send('Delete transaction route'));

module.exports = router;