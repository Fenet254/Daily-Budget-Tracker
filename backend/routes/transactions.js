const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /transactions
// @desc    Get all transactions for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /transactions
// @desc    Add new transaction
// @access  Private
router.post(
  '/',
  [
    protect,
    body('type', 'Type is required').isIn(['income', 'expense']),
    body('amount', 'Amount is required').isNumeric(),
    body('category', 'Category is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, amount, category, description, date, source } = req.body;

    try {
      const transaction = new Transaction({
        user: req.user.id,
        type,
        amount,
        category,
        description,
        date: date || Date.now(),
        source: source || 'manual',
      });

      await transaction.save();

      // Update budget if expense
      if (type === 'expense') {
        const budget = await Budget.findOne({
          user: req.user.id,
          category,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        });
        if (budget) {
          budget.spent += amount;
          await budget.save();
        }
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Transaction.findByIdAndRemove(req.params.id);
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
