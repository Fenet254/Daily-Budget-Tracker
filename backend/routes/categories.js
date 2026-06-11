const express = require('express');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /categories
// @desc    Get all categories for user (user-specific + defaults)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query; // Optional filter by income/expense
    const query = type ? { type, $or: [{ user: req.user.id }, { user: null }] } : { $or: [{ user: req.user.id }, { user: null }] };
    
    const categories = await Category.find(query).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /categories
// @desc    Create new category
// @access  Private
router.post('/', protect, [
  body('name', 'Name required').notEmpty(),
  body('type', 'Type must be income or expense').isIn(['income', 'expense'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, type, isDefault = false } = req.body;
    
    // Check duplicate
    const existing = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      type,
      user: req.user.id 
    });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name,
      type,
      user: req.user.id,
      isDefault
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.user && category.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /categories/:id
// @desc    Delete category (user-specific only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.user && category.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (category.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default category' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

