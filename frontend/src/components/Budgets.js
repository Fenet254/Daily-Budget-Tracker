import React, { useState, useEffect } from 'react';
import API from '../api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiDownload, FiFilter,
  FiAlertCircle, FiCheckCircle, FiX, FiTrendingUp,
  FiCoffee, FiTruck, FiHome, FiMusic, FiShoppingCart, FiDollarSign,
  FiCreditCard, FiTarget, FiFileText, FiGrid, FiList, FiSearch,
  FiAward, FiZap
} from 'react-icons/fi';
import { GiPiggyBank } from 'react-icons/gi';
import './Budgets.css';

// Confetti component for celebration
const Confetti = ({ active }) => {
  if (!active) return null;
  
  return (
    <div className="confetti-container">
      {[...Array(50)].map((_, i) => (
        <div 
          key={i} 
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
    </div>
  );
};

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

// Month options
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
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

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
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
  const [viewMode, setViewMode] = useState('cards');
  const [toast, setToast] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // New states for enhanced features
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  
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

  // Load data on mount
  useEffect(() => {
    fetchBudgets();
    
    // Check if budgets need refresh after returning from Transactions page
    const needsRefresh = localStorage.getItem('budgetsNeedRefresh');
    if (needsRefresh === 'true') {
      fetchBudgets();
      localStorage.removeItem('budgetsNeedRefresh');
    }
  }, []);

  // Fetch budgets from API
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await API.get('/budgets');
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

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const budgetData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        color: selectedColor,
        note: formData.note || ''
      };
      
      if (editingId) {
        await API.put(`/budgets/${editingId}`, budgetData);
        showToast('Budget updated successfully', 'success');
      } else {
        await API.post('/budgets', budgetData);
        showToast('Budget created successfully', 'success');
        // Trigger confetti for new budget
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      resetForm();
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      let errorMessage = 'Failed to save budget';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
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
    setSelectedColor(budget.color || '#3B82F6');
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle reset budget
  const handleReset = async (id) => {
    if (!window.confirm('Reset spent amount for this budget to 0? This starts a new tracking period.')) return;
    
    try {
      await API.put(`/budgets/${id}/reset`);
      showToast('Budget reset successfully! Fresh start for this period.', 'success');
      fetchBudgets();
    } catch (error) {
      console.error('Error resetting budget:', error);
      showToast('Failed to reset budget', 'error');
    }
  };

  // Handle delete budget
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await API.delete(`/budgets/${id}`);
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
    setSelectedColor('#3B82F6');
    setShowModal(false);
  };

  // Open modal for new budget
  const openAddModal = () => {
    setModalMode('add');
    resetForm();
    setShowModal(true);
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
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
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
    .filter(b => {
      const matchesCategory = filterCategory === 'all' || b.category.toLowerCase() === filterCategory;
      const matchesSearch = b.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'highest-spending':
          return b.spent - a.spent;
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

  // Get budget warnings
  const getWarnings = () => {
    const warnings = [];
    filteredBudgets.forEach(budget => {
      const percentage = (budget.spent / budget.amount) * 100;
      if (percentage >= 100) {
        warnings.push({
          type: 'danger',
          icon: <FiAlertCircle />,
          message: `${budget.category} budget exceeded by ${formatCurrency(budget.spent - budget.amount)}`,
          category: budget.category
        });
      } else if (percentage >= 70) {
        warnings.push({
          type: 'warning',
          icon: <FiZap />,
          category: budget.category
        });
      }
    });
    
    // Add positive insights
    const underBudgetCategories = filteredBudgets.filter(b => (b.spent / b.amount) * 100 < 50);
    if (underBudgetCategories.length > 0) {
      warnings.push({
        type: 'success',
        icon: <FiCheckCircle />,
        message: `✅ ${underBudgetCategories.length} categories are under 50% - great saving potential!`,
        category: 'general'
      });
    }
    
    return warnings.slice(0, 4);
  };

  // Get insights
  const getInsights = () => {
    const insights = [];
    
    // Calculate spending trends
    const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent, 0);
    const totalBudgeted = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
    const overallPercentage = (totalSpent / totalBudgeted) * 100;
    
    if (overallPercentage < 70) {
      insights.push({
        icon: <GiPiggyBank />,
        title: 'Savings Opportunity',
        description: `You can save ${formatCurrency(totalBudgeted - totalSpent)} this month!`,
        color: '#10B981'
      });
    }
    
    // Find highest spending category
    const highestSpending = [...filteredBudgets].sort((a, b) => b.spent - a.spent)[0];
    if (highestSpending) {
      insights.push({
        icon: <FiTrendingUp />,
        title: 'Highest Spending',
        description: `${highestSpending.category} takes ${Math.round((highestSpending.spent / totalSpent) * 100)}% of your expenses`,
        color: '#F59E0B'
      });
    }
    
    // Budget recommendations
    const overBudget = filteredBudgets.filter(b => b.spent > b.amount);
    if (overBudget.length > 0) {
      insights.push({
        icon: <FiAlertCircle />,
        title: 'Action Needed',
        description: `${overBudget.length} budget(s) exceeded. Consider adjusting limits.`,
        color: '#EF4444'
      });
    } else {
      insights.push({
        icon: <FiAward />,
        title: 'Great Job!',
        description: 'All budgets are within limits. Keep it up!',
        color: '#8B5CF6'
      });
    }
    
    return insights;
  };

  // Calculate totals
  const totalBudgeted = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent, 0);

  // Loading state
  if (loading) {
    return (
      <div className="budgets-page">
        <Confetti active={showConfetti} />
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
      <Confetti active={showConfetti} />
      <div className="budgets-container">

        <header className="budgets-header">
          <div className="header-content">
            <h1 className="header-title">Budgets</h1>
            <p className="header-subtitle">Plan and control your spending by category. Connected with Transactions.</p>
          </div>
          
          <div className="header-controls">
            <div className="month-selector">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="month-select"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="year-select"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          
            <button className="add-budget-btn" onClick={openAddModal}>
              <FiPlus size={18} />
              Add Budget
            </button>
          </div>
        </header>

        <section className="budget-cards-section">
          <div className="section-header">
            <h2 className="section-title">Budget Categories</h2>
            
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
                <option value="category">Sort by Category Asc</option>
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
              
              {/* Export Buttons */}
              <button className="export-btn" onClick={exportToCSV}>
                <FiDownload size={18} />
                CSV
              </button>
              <button className="export-btn pdf-btn" onClick={() => showToast('PDF export coming soon!', 'success')}>
                <FiFileText size={18} />
                PDF
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
                      key={budget._id || index} 
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
                          <button 
                            className="card-action-btn reset"
                            onClick={() => handleReset(budget._id)}
                            title="Reset Spent"
                          >
                            <FiRefreshCw size={16} />
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
                  <button className="btn-primary" onClick={openAddModal}>
                    <FiPlus size={18} />
                    Create Budget
                  </button>
                </div>
              )}
            </div>
          ) : (
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
                      <tr key={budget._id || Math.random()}>
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
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button 
                              className="table-action-btn delete"
                              onClick={() => handleDelete(budget._id)}
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                            <button 
                              className="table-action-btn reset"
                              onClick={() => handleReset(budget._id)}
                              title="Reset Spent"
                            >
                              <FiRefreshCw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredBudgets.length === 0 && (
                <div className="empty-table-state">
                  <FiTarget size={64} />
                  <p>No budgets match your current filters</p>
                </div>
              )}
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
                    <Bar dataKey="spent" name="Spent" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Expense Breakdown</h3>
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* Warnings and Insights */}
        {(getWarnings().length > 0 || getInsights().length > 0) && (
          <section className="insights-section">
            <div className="insights-grid">
              {getWarnings().map((warning, index) => (
                <div key={index} className={`insight-card warning-${warning.type}`}>
                  <div className="insight-icon">{warning.icon}</div>
                  {warning.message ? (
                    <div>
                      <div className="insight-message">{warning.message}</div>
                    </div>
                  ) : (
                    <div className="insight-title">⚠️ {warning.category} needs attention</div>
                  )}
                </div>
              ))}
              {getInsights().slice(0, 3).map((insight, index) => (
                <div key={index} className="insight-card" style={{ borderLeftColor: insight.color }}>
                  <div className="insight-icon" style={{ color: insight.color }}>{insight.icon}</div>
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={resetForm} 
        title={modalMode === 'add' ? 'Create New Budget' : 'Edit Budget'}
      >
        <form onSubmit={handleSubmit} className="budget-form">
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
              step="0.01"
            />
          </div>
          
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
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add a note for this budget..."
              rows={2}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              <FiPlus size={18} />
              {modalMode === 'add' ? 'Create Budget' : 'Update Budget'}
            </button>
          </div>
        </form>
      </Modal>

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
