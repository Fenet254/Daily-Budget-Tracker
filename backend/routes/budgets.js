const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /budgets
// @desc    Get all budgets for user with calculated spent amounts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    // Calculate spent amounts for each budget based on transactions
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      const startDate = budget.startDate || new Date(new Date().setDate(1)); // Start of month
      const endDate = budget.endDate || new Date();
      
      // Get transactions for this category in the budget period (case-insensitive)
      const transactions = await Transaction.find({
        user: req.user.id,
        category: { $regex: new RegExp('^' + budget.category + '$', 'i') },
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      });
      
      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      return {
        ...budget.toObject(),
        spent,
        percentage: budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0
      };
    }));
    
    res.json(budgetsWithSpent);
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
      const errorMessage = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ message: errorMessage, error: errorMessage });
    }

    const { category, amount, period, startDate, endDate, color, note } = req.body;

    try {
      const budget = new Budget({
        user: req.user.id,
        category,
        amount: parseFloat(amount),
        period,
        startDate: startDate || new Date(),
        endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        spent: 0,
        color: color || '#3B82F6',
        note: note || '',
      });

      await budget.save();
      res.json(budget);
    } catch (error) {
      console.error('Error saving budget:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
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

    // Validate period if provided
    if (req.body.period && !['daily', 'weekly', 'monthly'].includes(req.body.period)) {
      return res.status(400).json({ message: 'Invalid period. Must be daily, weekly, or monthly' });
    }

    // Validate amount if provided
    if (req.body.amount && isNaN(parseFloat(req.body.amount))) {
      return res.status(400).json({ message: 'Amount must be a valid number' });
    }

    budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

// @route   PUT /budgets/:id/reset
// @desc    Reset spent amount for budget (e.g., new period)
// @access  Private
router.put('/:id/reset', protect, async (req, res) => {
  try {
    let budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Reset spent and optionally update dates
    budget.spent = 0;
    budget.lastResetDate = new Date(); // Add this field if schema supports or ignore

    await budget.save();

    res.json({ 
      message: 'Budget reset successfully', 
      budget: {
        ...budget.toObject(),
        spent: 0,
        percentage: 0
      }
    });
  } catch (error) {
    console.error('Error resetting budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
