const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      query.date = { $gte: start, $lte: end };
    }

    const transactions = await Transaction.find(query);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    transactions.forEach((transaction) => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }

      if (!categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] = { income: 0, expense: 0 };
      }
      categoryBreakdown[transaction.category][transaction.type] += transaction.amount;
    });

    const budgets = await Budget.find({ user: req.user.id });
    const budgetStatus = budgets.map((budget) => ({
      category: budget.category,
      budgeted: budget.amount,
      spent: budget.spent,
      remaining: budget.amount - budget.spent,
    }));

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryBreakdown,
      budgetStatus,
    });
  } catch (error) {
    console.error('Reports summary error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.get('/transactions', protect, async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      query.date = { $gte: start, $lte: end };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Reports transactions error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;

