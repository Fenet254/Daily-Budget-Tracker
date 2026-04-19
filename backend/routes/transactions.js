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
    const { startDate, endDate, category, limit } = req.query;
    const query = { user: req.user.id };
    
    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Filter by category
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }
    
    let transactionsQuery = Transaction.find(query).sort({ date: -1 });
    
    // Apply limit if provided
    if (limit) {
      transactionsQuery = transactionsQuery.limit(parseInt(limit));
    }
    
    const transactions = await transactionsQuery;
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
  protect,
  [
    body('type', 'Type is required').isIn(['income', 'expense']),
    body('amount', 'Amount is required').not().isEmpty(),
    body('category', 'Category is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, amount, category, description, date, source } = req.body;

    try {
      // Ensure amount is a number
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Please provide a valid amount' });
      }

      const transaction = new Transaction({
        user: req.user.id,
        type,
        amount: parsedAmount,
        category,
        description,
        date: date || Date.now(),
        source: source || 'manual',
      });

      await transaction.save();

      // Update budget if expense
      if (type === 'expense') {
        const currentDate = new Date(date) || new Date();
        const budget = await Budget.findOne({
          user: req.user.id,
          category: { $regex: new RegExp(category, 'i') },
          period: 'monthly',
          startDate: { $lte: currentDate },
          $or: [
            { endDate: { $gte: currentDate } },
            { endDate: { $exists: false } }
          ]
        });
        
        if (budget) {
          budget.spent = (budget.spent || 0) + parsedAmount;
          await budget.save();
          console.log(`Updated budget for ${category}: spent now is ${budget.spent}`);
        }
      }

      res.json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
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

    // If amount is being updated, ensure it's a number
    if (req.body.amount) {
      req.body.amount = parseFloat(req.body.amount);
    }

    // Get original transaction for budget adjustment
    const originalTransaction = await Transaction.findById(req.params.id);
    
    // Update transaction
    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // Adjust budget if expense and changes affect amount/category
    if (originalTransaction.type === 'expense' && transaction.type === 'expense') {
      const amountDiff = transaction.amount - originalTransaction.amount;
      const categoryChanged = transaction.category.toLowerCase() !== originalTransaction.category.toLowerCase();
      
      if (amountDiff !== 0 || categoryChanged) {
        // Adjust old budget
        const oldBudget = await Budget.findOne({
          user: req.user.id,
          category: { $regex: new RegExp(originalTransaction.category, 'i') },
        });
        if (oldBudget) {
          oldBudget.spent = Math.max(0, (oldBudget.spent || 0) - originalTransaction.amount);
          await oldBudget.save();
        }
        
        // Adjust new budget if category changed
        if (categoryChanged) {
          const newBudget = await Budget.findOne({
            user: req.user.id,
            category: { $regex: new RegExp(transaction.category, 'i') },
          });
          if (newBudget) {
            newBudget.spent = (newBudget.spent || 0) + transaction.amount;
            await newBudget.save();
          }
        } else if (amountDiff !== 0) {
          const updatedBudget = await Budget.findOne({
            user: req.user.id,
            category: { $regex: new RegExp(transaction.category, 'i') },
          });
          if (updatedBudget) {
            updatedBudget.spent = Math.max(0, (updatedBudget.spent || 0) + amountDiff);
            await updatedBudget.save();
          }
        }
      }
    }

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

    // Adjust budget before delete if expense
    if (transaction.type === 'expense') {
      const budget = await Budget.findOne({
        user: req.user.id,
        category: { $regex: new RegExp(transaction.category, 'i') },
      });
      if (budget) {
        budget.spent = Math.max(0, (budget.spent || 0) - transaction.amount);
        await budget.save();
        console.log(`Reduced budget spent for ${transaction.category} by ${transaction.amount}`);
      }
    }

    await Transaction.findByIdAndRemove(req.params.id);
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
