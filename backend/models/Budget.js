const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  spent: {
    type: Number,
    default: 0,
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'daily'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  color: {
    type: String,
    default: '#3B82F6',
  },
  note: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Budget', budgetSchema);
