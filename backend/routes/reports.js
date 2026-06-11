const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to get date range by period
const getDateRange = (period = 'monthly') => {
  const now = new Date();
  let startDate, endDate = now;
  
  switch (period.toLowerCase()) {
    case 'daily':
      startDate = new Date(now.setHours(0,0,0,0));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - now.getDay())); // Start of week
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
  }
  
  return { startDate, endDate };
};

router.get('/summary', protect, async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    // Use custom dates or calculate from period
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else {
      const range = getDateRange(period);
      dateQuery = { $gte: range.startDate, $lte: range.endDate };
    }

    const transactions = await Transaction.find({ 
      user: req.user.id, 
      date: dateQuery 
    });

    let totalIncome = 0, totalExpense = 0;
    const categoryBreakdown = {};
    const transactionsByDay = {};

    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || { income: 0, expense: 0 });
      categoryBreakdown[t.category][t.type] += t.amount;

      const dayKey = t.date.toISOString().split('T')[0];
      transactionsByDay[dayKey] = (transactionsByDay[dayKey] || 0) + t.amount;
    });

    // Top 5 categories by expense
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => (b.expense || 0) - (a.expense || 0))
      .slice(0, 5)
      .map(([category, data]) => ({ category, ...data }));

    // Budget status
    const budgets = await Budget.find({ user: req.user.id, isActive: true });
    const budgetStatus = budgets.map(budget => {
      const spent = transactions
        .filter(t => t.category.toLowerCase() === budget.category.toLowerCase() && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        category: budget.category,
        budgeted: budget.amount,
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0,
        color: budget.color
      };
    });

    // Trends data
    const trendData = Object.entries(transactionsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    res.json({
      period,
      dateRange: dateQuery,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0,
      categoryBreakdown,
      topCategories,
      budgetStatus,
      trends: trendData, // For charts
      transactionCount: transactions.length
    });
  } catch (error) {
    console.error('Reports summary error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.get('/transactions', protect, async (req, res) => {
  try {
    const { type, category, period } = req.query;
    let query = { user: req.user.id };

    if (type) query.type = type;
    if (category) query.category = { $regex: category, $options: 'i' };

    // Add period filter
    if (period) {
      const range = getDateRange(period);
      query.date = { $gte: range.startDate, $lte: range.endDate };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).limit(100);
    res.json(transactions);
  } catch (error) {
    console.error('Reports transactions error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
