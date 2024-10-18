// src/routes/categories.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');

// @route   GET api/categories
// @desc    Get all categories for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories
// @desc    Add new category
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name } = req.body;

  try {
    const newCategory = new Category({
      user: req.user.id,
      name
    });

    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;