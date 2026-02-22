import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Transactions.css';

// Category icons mapping
const categoryIcons = {
  'Food': '🍔',
  'Transport': '🚗',
  'Utilities': '💡',
  'Entertainment': '🎮',
  'Health': '💊',
  'Salary': '💰',
  'Shopping': '🛍️',
  'Education': '📚',
  'Travel': '✈️',
  'Other': '📦',
  'Food & Dining': '🍔',
  'Transportation': '🚗',
  'Bills & Utilities': '💡',
  'Shopping': '🛍️',
  'Entertainment': '🎮',
  'Health & Fitness': '💊',
  'Income': '💰',
  'Salary': '💰',
  'Investment': '📈',
  'Gift': '🎁',
  'Salary': '💰',
};

// Default categories for income and expense
const incomeCategories = ['Salary', 'Investment', 'Income', 'Gift', 'Other'];
const expenseCategories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Education', 'Travel', 'Other'];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get auth token from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/transactions', {
        headers: getAuthHeader()
      });
      setTransactions(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
      showToast('Failed to load transactions', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset category when type changes
    if (name === 'type') {
      setFormData({ 
        ...formData, 
        [name]: value,
        category: '' 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate amount
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    
    // Validate category
    if (!formData.category) {
      showToast('Please select a category', 'error');
      return;
    }
    
    // Prepare data with proper type conversion
    const transactionData = {
      type: formData.type,
      amount: parsedAmount, // Convert to number
      category: formData.category,
      description: formData.description || '',
      date: formData.date || new Date().toISOString().split('T')[0]
    };
    
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/transactions/${editing}`, transactionData, {
          headers: getAuthHeader()
        });
        showToast('Transaction updated successfully!', 'success');
        setEditing(null);
      } else {
        const response = await axios.post('http://localhost:5000/transactions', transactionData, {
          headers: getAuthHeader()
        });
        console.log('Transaction saved:', response.data);
        showToast('Transaction added successfully!', 'success');
      }
      setFormData({ 
        type: formData.type, 
        amount: '', 
        category: '', 
        description: '', 
        date: new Date().toISOString().split('T')[0] 
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save transaction';
      showToast(errorMessage, 'error');
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date.split('T')[0]
    });
    setEditing(transaction._id);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/transactions/${id}`, {
        headers: getAuthHeader()
      });
      showToast('Transaction deleted successfully!', 'success');
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({ 
      type: 'income', 
      amount: '', 
      category: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0] 
    });
  };

  const getFilteredCategories = () => {
    return formData.type === 'income' ? incomeCategories : expenseCategories;
  };

  const getCategoryIcon = (category) => {
    return categoryIcons[category] || '📦';
  };

  const filteredTransactions = transactions.filter(transaction => {
    return (
      (!filters.type || transaction.type === filters.type) &&
      (!filters.category || transaction.category.toLowerCase().includes(filters.category.toLowerCase())) &&
      (!filters.startDate || new Date(transaction.date) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(transaction.date) <= new Date(filters.endDate))
    );
  });

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="transactions">
        <div className="transactions-layout">
          <div className="add-transaction-card">
            <div className="skeleton" style={{ height: '400px' }}></div>
          </div>
          <div className="transactions-section">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-row">
                <div className="skeleton skeleton-cell"></div>
                <div className="skeleton skeleton-cell"></div>
                <div className="skeleton skeleton-cell"></div>
                <div className="skeleton skeleton-cell"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions">
      <div className="transactions-header">
        <h1>Transactions</h1>
      </div>

      <div className="transactions-layout">
        {/* Add Transaction Card */}
        <div className="add-transaction-card">
          <div className="card-header">
            <div className="card-header-icon">
              <span>+</span>
            </div>
            <h2 className="card-title">
              {editing ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Type Toggle */}
            <div className="type-toggle">
              <button
                type="button"
                className={`income-type ${formData.type === 'income' ? 'active' : ''}`}
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
              >
                <span>↑</span> Income
              </button>
              <button
                type="button"
                className={`expense-type ${formData.type === 'expense' ? 'active' : ''}`}
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
              >
                <span>↓</span> Expense
              </button>
            </div>

            {/* Amount */}
            <div className="form-group amount-group">
              <label>Amount</label>
              <div className="input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Category</label>
              <div className="input-wrapper">
                <span className="input-icon">{getCategoryIcon(formData.category) || '📦'}</span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {getFilteredCategories().map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <div className="input-wrapper">
                <span className="input-icon">📝</span>
                <input
                  type="text"
                  name="description"
                  placeholder="What's this for?"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label>Date</label>
              <div className="input-wrapper">
                <span className="input-icon">📅</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`submit-btn ${formData.type === 'income' ? 'income-btn' : 'expense-btn'}`}
            >
              {editing ? '✏️ Update Transaction' : `➕ Add ${formData.type === 'income' ? 'Income' : 'Expense'}`}
            </button>

            {editing && (
              <button 
                type="button" 
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel Editing
              </button>
            )}
          </form>
        </div>

        {/* Transactions List */}
        <div className="transactions-section">
          {/* Filters */}
          <div className="filters-bar">
            <div className="filter-group">
              <label>Type:</label>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Category:</label>
              <input
                type="text"
                name="category"
                placeholder="Filter by category"
                value={filters.category}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-group">
              <label>From:</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-group">
              <label>To:</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Table or Empty State */}
          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <h3>No Transactions Yet</h3>
              <p>Start tracking your finances by adding your first transaction above.</p>
            </div>
          ) : (
            <div className="transaction-table-container">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td>{new Date(transaction.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</td>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type === 'income' ? '↑' : '↓'} {transaction.type}
                        </span>
                      </td>
                      <td className={`amount-cell ${transaction.type}`}>
                        <span className="amount-prefix">{transaction.type === 'income' ? '+' : '-'}</span>
                        ${formatAmount(transaction.amount)}
                      </td>
                      <td>
                        <div className="category-cell">
                          <span className="category-icon">{getCategoryIcon(transaction.category)}</span>
                          {transaction.category}
                        </div>
                      </td>
                      <td>{transaction.description || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleEdit(transaction)} 
                            className="action-btn edit-btn"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(transaction._id)} 
                            className="action-btn delete-btn"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>
        <span className="toast-icon">
          {toast.type === 'success' ? '✓' : '✕'}
        </span>
        <span className="toast-message">{toast.message}</span>
      </div>
    </div>
  );
};

export default Transactions;
