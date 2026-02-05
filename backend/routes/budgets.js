const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /budgets
// @desc    Get all budgets for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /budgets
// @desc    Add new budget
// @access  Private
router.post(
  '/',
  [
    protect,
    body('category', 'Category is required').not().isEmpty(),
    body('amount', 'Amount is required').isNumeric(),
    body('period', 'Period is required').isIn(['daily', 'weekly', 'monthly']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, period, startDate, endDate } = req.body;

    try {
      const budget = new Budget({
        user: req.user.id,
        category,
        amount,
        period,
        startDate: startDate || new Date(),
        endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        spent: 0,
      });

      await budget.save();
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Budget.findByIdAndRemove(req.params.id);
    res.json({ message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
