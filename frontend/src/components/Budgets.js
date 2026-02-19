import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  FiPlus, FiEdit2, FiTrash2, FiDownload, FiFilter, FiSun, FiMoon,
  FiAlertCircle, FiCheckCircle, FiX, FiChevronDown, FiTrendingUp,
  FiCoffee, FiTruck, FiHome, FiZap, FiMusic, FiShoppingCart, FiDollarSign,
  FiCreditCard, FiTarget, FiCalendar, FiFileText, FiGrid, FiList
} from 'react-icons/fi';
import { GiPiggyBank, GiWallet } from 'react-icons/gi';
import './Budgets.css';

// Category icons mapping
const getCategoryIcon = (category) => {
  const categoryLower = category?.toLowerCase() || '';
  const icons = {
    food: <FiCoffee />,
    transport: <FiTruck />,
    rent: <FiHome />,
    utilities: <FiZap />,
    entertainment: <FiMusic />,
    shopping: <FiShoppingCart />,
    salary: <FiDollarSign />,
    investment: <GiPiggyBank />,
    health: <FiCreditCard />,
  };
  return icons[categoryLower] || <FiCreditCard />;
};

// Category options with icons
const CATEGORY_OPTIONS = [
  { value: 'food', label: 'Food', icon: <FiCoffee />, color: '#10B981' },
  { value: 'transport', label: 'Transport', icon: <FiTruck />, color: '#F59E0B' },
  { value: 'rent', label: 'Rent', icon: <FiHome />, color: '#6366F1' },
  { value: 'utilities', label: 'Utilities', icon: <FiZap />, color: '#8B5CF6' },
  { value: 'entertainment', label: 'Entertainment', icon: <FiMusic />, color: '#EC4899' },
  { value: 'shopping', label: 'Shopping', icon: <FiShoppingCart />, color: '#14B8A6' },
  { value: 'health', label: 'Health', icon: <FiCreditCard />, color: '#EF4444' },
];

// Category colors for charts
const CATEGORY_COLORS = {
  Food: '#10B981',
  Transport: '#F59E0B',
  Rent: '#6366F1',
  Utilities: '#8B5CF6',
  Entertainment: '#EC4899',
  Shopping: '#14B8A6',
  Health: '#EF4444',
  Other: '#64748B'
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Get progress color based on percentage
const getProgressColor = (percentage) => {
  if (percentage < 70) return 'var(--color-income)';
  if (percentage < 90) return '#F59E0B';
  return 'var(--color-expense)';
};

// Get progress status
const getProgressStatus = (percentage) => {
  if (percentage < 70) return 'healthy';
  if (percentage < 90) return 'warning';
  return 'danger';
};

// Animated Progress Bar Component
const AnimatedProgressBar = ({ percentage, status }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  return (
    <div className="progress-bar-container">
      <div 
        className={`progress-bar-fill ${status}`}
        style={{ width: `${animatedWidth}%` }}
      />
      <span className="progress-percentage">{Math.round(percentage)}%</span>
    </div>
  );
};

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`toast-notification ${type}`}>
      <span className="toast-icon">
        {type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <FiX />
      </button>
    </div>
  );
};

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="budget-card-skeleton">
    <div className="skeleton-header">
      <div className="skeleton skeleton-icon"></div>
      <div className="skeleton skeleton-title"></div>
    </div>
    <div className="skeleton skeleton-amount"></div>
    <div className="skeleton skeleton-progress"></div>
  </div>
);

const Budgets = () => {
  // State management
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [period, setPeriod] = useState('this-month');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    note: ''
  });
  const [editingId, setEditingId] = useState(null);
  
  // Filter and sort state
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('category');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Get auth token
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Load data on mount
  useEffect(() => {
    fetchBudgets();
    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [period]);

  // Fetch budgets from API
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/budgets', getAuthHeader());
      setBudgets(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      showToast('Failed to load budgets', 'error');
      setLoading(false);
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/budgets/${editingId}`, formData, getAuthHeader());
        showToast('Budget updated successfully', 'success');
      } else {
        await axios.post('http://localhost:5000/budgets', formData, getAuthHeader());
        showToast('Budget created successfully', 'success');
      }
      resetForm();
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      showToast('Failed to save budget', 'error');
    }
  };

  // Handle edit budget
  const handleEdit = (budget) => {
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      note: budget.note || ''
    });
    setEditingId(budget._id);
    setShowForm(true);
  };

  // Handle delete budget
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/budgets/${id}`, getAuthHeader());
      showToast('Budget deleted successfully', 'success');
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      showToast('Failed to delete budget', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ category: '', amount: '', period: 'monthly', note: '' });
    setEditingId(null);
    setShowForm(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Category', 'Budgeted', 'Spent', 'Remaining', 'Period'];
    const rows = filteredBudgets.map(b => [
      b.category,
      b.amount,
      b.spent,
      b.amount - b.spent,
      b.period
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Budgets exported to CSV', 'success');
  };

  // Filter and sort budgets
  const filteredBudgets = budgets
    .filter(b => filterCategory === 'all' || b.category.toLowerCase() === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'highest-spending':
          return b.spent - a.spending;
        case 'remaining':
          return (a.amount - a.spent) - (b.amount - b.spent);
        case 'category':
        default:
          return a.category.localeCompare(b.category);
      }
    });

  // Get chart data
  const getChartData = () => {
    return filteredBudgets.map(budget => ({
      name: budget.category,
      budgeted: budget.amount,
      spent: budget.spent,
      remaining: budget.amount - budget.spent
    }));
  };

  // Get expense breakdown for doughnut chart
  const getExpenseBreakdown = () => {
    return filteredBudgets
      .filter(b => b.spent > 0)
      .map(budget => ({
        name: budget.category,
        value: budget.spent,
        color: CATEGORY_COLORS[budget.category] || CATEGORY_COLORS.Other
      }));
  };

  // Generate smart warnings
  const getWarnings = () => {
    const warnings = [];
    filteredBudgets.forEach(budget => {
      const percentage = (budget.spent / budget.amount) * 100;
      if (percentage >= 90) {
        warnings.push({
          type: 'danger',
          message: `⚠️ You've used ${Math.round(percentage)}% of your ${budget.category} budget!`,
          category: budget.category
        });
      } else if (percentage >= 70) {
        warnings.push({
          type: 'warning',
          message: `⚡ You're at ${Math.round(percentage)}% of your ${budget.category} budget`,
          category: budget.category
        });
      } else {
        warnings.push({
          type: 'success',
          message: `✅ ${budget.category} budget is healthy`,
          category: budget.category
        });
      }
    });
    return warnings.slice(0, 3); // Show top 3 warnings
  };

  // Calculate totals
  const totalBudgeted = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  // Loading state
  if (loading) {
    return (
      <div className="budgets-page">
        <div className="budgets-container">
          <div className="skeleton skeleton-header-section" style={{ marginBottom: '32px' }}>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-subtitle"></div>
          </div>
          <div className="budgets-grid">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="budgets-page">
      <div className="budgets-container">
        {/* Header Section */}
        <header className="budgets-header">
          <div className="header-content">
            <h1 className="header-title">Budgets Overview</h1>
            <p className="header-subtitle">Plan and control your spending</p>
          </div>
          
          <div className="header-controls">
            <div className="period-selector">
              <button 
                className={`period-btn ${period === 'this-week' ? 'active' : ''}`}
                onClick={() => setPeriod('this-week')}
              >
                This Week
              </button>
              <button 
                className={`period-btn ${period === 'this-month' ? 'active' : ''}`}
                onClick={() => setPeriod('this-month')}
              >
                This Month
              </button>
              <button 
                className={`period-btn ${period === 'custom' ? 'active' : ''}`}
                onClick={() => setPeriod('custom')}
              >
                Custom
              </button>
            </div>
            
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
            </button>
          </div>
        </header>

        {/* Quick Stats */}
        <section className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon budgeted">
              <FiTarget size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Budgeted</span>
              <span className="stat-value">{formatCurrency(totalBudgeted)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon spent">
              <FiTrendingUp size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon remaining">
              <GiWallet size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Remaining</span>
              <span className="stat-value">{formatCurrency(totalRemaining)}</span>
            </div>
          </div>
        </section>

        {/* Create Budget Card */}
        <section className="create-budget-section">
          {!showForm ? (
            <button className="create-budget-trigger" onClick={() => setShowForm(true)}>
              <div className="trigger-icon">
                <FiPlus size={24} />
              </div>
              <div className="trigger-content">
                <span className="trigger-title">Create New Budget</span>
                <span className="trigger-subtitle">Set spending limits for your categories</span>
              </div>
              <FiChevronDown className="trigger-arrow" />
            </button>
          ) : (
            <div className="create-budget-card">
              <div className="card-header">
                <h3>{editingId ? 'Edit Budget' : 'Create New Budget'}</h3>
                <button className="close-form-btn" onClick={resetForm}>
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="budget-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <div className="select-wrapper">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select category</option>
                        {CATEGORY_OPTIONS.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      {formData.category && (
                        <span className="selected-icon">
                          {getCategoryIcon(formData.category)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Budget Amount (ETB)</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      required
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Period</label>
                    <div className="period-toggle">
                      <button
                        type="button"
                        className={`period-option ${formData.period === 'weekly' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, period: 'weekly' })}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        className={`period-option ${formData.period === 'monthly' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, period: 'monthly' })}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Note (Optional)</label>
                    <input
                      type="text"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Add a note..."
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    <FiPlus size={18} />
                    {editingId ? 'Update Budget' : 'Set Budget'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* Smart Warnings */}
        {getWarnings().length > 0 && (
          <section className="warnings-section">
            <div className="warnings-grid">
              {getWarnings().map((warning, index) => (
                <div key={index} className={`warning-card ${warning.type}`}>
                  <span className="warning-icon">
                    {warning.type === 'danger' ? <FiAlertCircle /> : 
                     warning.type === 'warning' ? <FiAlertCircle /> : <FiCheckCircle />}
                  </span>
                  <span className="warning-message">{warning.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Budget Progress Cards */}
        <section className="budget-cards-section">
          <div className="section-header">
            <h2 className="section-title">Budget Progress</h2>
            
            <div className="section-actions">
              {/* Filter */}
              <div className="filter-dropdown">
                <button 
                  className="filter-btn"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <FiFilter size={16} />
                  {filterCategory === 'all' ? 'All Categories' : filterCategory}
                </button>
                {showFilterMenu && (
                  <div className="filter-menu">
                    <button 
                      className={`filter-option ${filterCategory === 'all' ? 'active' : ''}`}
                      onClick={() => { setFilterCategory('all'); setShowFilterMenu(false); }}
                    >
                      All Categories
                    </button>
                    {CATEGORY_OPTIONS.map(cat => (
                      <button 
                        key={cat.value}
                        className={`filter-option ${filterCategory === cat.value ? 'active' : ''}`}
                        onClick={() => { setFilterCategory(cat.value); setShowFilterMenu(false); }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Sort */}
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="category">Sort by Category</option>
                <option value="highest-spending">Sort by Highest Spending</option>
                <option value="remaining">Sort by Remaining</option>
              </select>
              
              {/* View Toggle */}
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  <FiGrid size={18} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <FiList size={18} />
                </button>
              </div>
              
              {/* Export */}
              <button className="export-btn" onClick={exportToCSV}>
                <FiDownload size={18} />
                Export
              </button>
            </div>
          </div>

          {viewMode === 'cards' ? (
            <div className="budget-cards-grid">
              {filteredBudgets.length > 0 ? (
                filteredBudgets.map((budget, index) => {
                  const percentage = (budget.spent / budget.amount) * 100;
                  const status = getProgressStatus(percentage);
                  const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === budget.category.toLowerCase()) || { color: '#64748B', icon: <FiCreditCard /> };
                  
                  return (
                    <div 
                      key={budget._id} 
                      className="budget-card"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="card-top">
                        <div className="category-info">
                          <div 
                            className="category-icon"
                            style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
                          >
                            {categoryInfo.icon}
                          </div>
                          <span className="category-name">{budget.category}</span>
                        </div>
                        <div className="card-actions">
                          <button 
                            className="card-action-btn edit"
                            onClick={() => handleEdit(budget)}
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            className="card-action-btn delete"
                            onClick={() => handleDelete(budget._id)}
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="card-amounts">
                        <div className="amount-row">
                          <span className="amount-label">Budgeted</span>
                          <span className="amount-value">{formatCurrency(budget.amount)}</span>
                        </div>
                        <div className="amount-row">
                          <span className="amount-label">Spent</span>
                          <span className="amount-value spent">{formatCurrency(budget.spent)}</span>
                        </div>
                        <div className="amount-row">
                          <span className="amount-label">Remaining</span>
                          <span className={`amount-value remaining ${budget.amount - budget.spent < 0 ? 'negative' : ''}`}>
                            {formatCurrency(budget.amount - budget.spent)}
                          </span>
                        </div>
                      </div>
                      
                      <AnimatedProgressBar 
                        percentage={Math.min(percentage, 100)} 
                        status={status}
                      />
                      
                      {budget.note && (
                        <p className="budget-note">{budget.note}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiTarget size={48} />
                  </div>
                  <h3>No budgets yet</h3>
                  <p>Create your first budget to start tracking your spending</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <FiPlus size={18} />
                    Create Budget
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="budgets-table-container">
              <table className="budgets-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Budgeted</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th>Progress</th>
                    <th>Period</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgets.map(budget => {
                    const percentage = (budget.spent / budget.amount) * 100;
                    const status = getProgressStatus(percentage);
                    const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === budget.category.toLowerCase()) || { color: '#64748B', icon: <FiCreditCard /> };
                    
                    return (
                      <tr key={budget._id}>
                        <td>
                          <div className="category-cell">
                            <div 
                              className="category-icon-small"
                              style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
                            >
                              {categoryInfo.icon}
                            </div>
                            <span>{budget.category}</span>
                          </div>
                        </td>
                        <td className="amount-cell">{formatCurrency(budget.amount)}</td>
                        <td className="amount-cell spent">{formatCurrency(budget.spent)}</td>
                        <td className={`amount-cell remaining ${budget.amount - budget.spent < 0 ? 'negative' : ''}`}>
                          {formatCurrency(budget.amount - budget.spent)}
                        </td>
                        <td>
                          <div className="table-progress">
                            <div 
                              className={`table-progress-bar ${status}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                            <span>{Math.round(percentage)}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="period-badge">{budget.period}</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="table-action-btn edit"
                              onClick={() => handleEdit(budget)}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button 
                              className="table-action-btn delete"
                              onClick={() => handleDelete(budget._id)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Charts Section */}
        {filteredBudgets.length > 0 && (
          <section className="charts-section">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Budget vs Spent</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getChartData()} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--text-tertiary)"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="var(--text-tertiary)"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="budgeted" name="Budgeted" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Spent" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Budget Distribution</h3>
              </div>
              <div className="chart-container" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getExpenseBreakdown()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getExpenseBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="doughnut-legend">
                {getExpenseBreakdown().slice(0, 4).map((item, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-label">
                      <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </span>
                    <span className="legend-value">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default Budgets;
