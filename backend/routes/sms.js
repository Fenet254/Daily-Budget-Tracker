const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { parseSMS } = require('../utils/smsParser');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /sms/import
// @desc    Import transaction from SMS
// @access  Private
router.post('/import', protect, async (req, res) => {
  const { smsText } = req.body;

  if (!smsText) {
    return res.status(400).json({ message: 'SMS text is required' });
  }

  try {
    const parsedData = parseSMS(smsText);

    if (!parsedData) {
      return res.status(400).json({ message: 'Could not parse SMS' });
    }

    const transaction = new Transaction({
      user: req.user.id,
      ...parsedData,
      date: new Date(),
    });

    await transaction.save();

    // Update budget if expense
    if (parsedData.type === 'expense') {
      const budget = await Budget.findOne({
        user: req.user.id,
        category: parsedData.category,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });
      if (budget) {
        budget.spent += parsedData.amount;
        await budget.save();
      }
    }

    res.json({ message: 'Transaction imported successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
