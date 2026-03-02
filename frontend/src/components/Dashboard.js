import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, 
  FiPieChart, FiSavings, FiPlus, FiFileText, FiTarget, FiDownload,
  FiEdit2, FiTrash2, FiArrowRight, FiFilter,
  FiShoppingCart, FiCoffee, FiHome, FiZap, FiMusic, FiTruck,
  FiAlertCircle, FiCheckCircle, FiX
} from 'react-icons/fi';
import { 
  GiMoneyStack, GiExpense, GiPiggyBank, GiWallet 
} from 'react-icons/gi';
import './Dashboard.css';

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
  };
  return icons[categoryLower] || <FiCreditCard />;
};

// Category colors for charts
const CATEGORY_COLORS = {
  Food: '#10B981',
  Transport: '#F59E0B',
  Rent: '#6366F1',
  Utilities: '#8B5CF6',
  Entertainment: '#EC4899',
  Shopping: '#14B8A6',
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

// Get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
};

// Animated counter component
const AnimatedCounter = ({ value, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{prefix}{formatCurrency(displayValue)}</span>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [dateRange, setDateRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Load data on mount
  useEffect(() => {
    fetchSummary();
    fetchRecentTransactions();
    fetchChartData();
    
    // Always set light theme
    document.documentElement.setAttribute('data-theme', 'light');
  }, [dateRange, selectedCategory]);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    }
    
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const res = await axios.get(`http://localhost:5000/api/reports/summary?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      showToast('Failed to fetch summary data', 'error');
    }
  };

  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      let url = `http://localhost:5000/api/transactions?limit=5&startDate=${startDate}&endDate=${endDate}`;
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTransactions(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  // Fetch chart data from actual transactions
  const fetchChartData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const res = await axios.get(`http://localhost:5000/api/reports/transactions?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const transactions = res.data;
      
      // Group transactions by date
      const groupedData = {};
      const days = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30;
      
      // Initialize all days with zero values
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        groupedData[dateKey] = { date: dateKey, income: 0, expenses: 0 };
      }
      
      // Sum up transactions by date
      transactions.forEach(t => {
        const dateKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (groupedData[dateKey]) {
          if (t.type === 'income') {
            groupedData[dateKey].income += t.amount;
          } else {
            groupedData[dateKey].expenses += t.amount;
          }
        }
      });
      
      const data = Object.values(groupedData);
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback to empty data on error
      const data = [];
      const days = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30;
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          income: 0,
          expenses: 0,
        });
      }
      setChartData(data);
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle delete transaction
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast('Transaction deleted successfully', 'success');
      fetchRecentTransactions();
      fetchSummary();
      fetchChartData();
    } catch (error) {
      showToast('Failed to delete transaction', 'error');
    }
  };

  // Handle export
  const handleExport = (format) => {
    showToast(`Exporting data as ${format.toUpperCase()}...`, 'success');
    // In a real app, this would trigger an API call to generate the report
  };

  // Get expense breakdown for doughnut chart
  const getExpenseBreakdown = () => {
    if (!summary?.categoryBreakdown) return [];
    
    return Object.entries(summary.categoryBreakdown)
      .filter(([_, data]) => data.expense > 0)
      .map(([name, data]) => ({
        name,
        value: data.expense,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other
      }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="skeleton skeleton-card" style={{ marginBottom: '24px', height: '80px' }}></div>
          <div className="kpi-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton skeleton-card"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header Section */}
        <header className="dashboard-header">
          <div className="dashboard-greeting">
            <h1>{user?.name ? `${getTimeBasedGreeting()}, ${user.name}` : `${getTimeBasedGreeting()}!`}</h1>
            <p>Here's your financial overview today</p>
          </div>
          
          <div className="dashboard-controls">
            <div className="date-selector">
              <button 
                className={`date-btn ${dateRange === 'today' ? 'active' : ''}`}
                onClick={() => setDateRange('today')}
              >
                Today
              </button>
              <button 
                className={`date-btn ${dateRange === 'week' ? 'active' : ''}`}
                onClick={() => setDateRange('week')}
              >
                This Week
              </button>
              <button 
                className={`date-btn ${dateRange === 'month' ? 'active' : ''}`}
                onClick={() => setDateRange('month')}
              >
                This Month
              </button>
            </div>
          </div>
        </header>

        {/* KPI Cards Section */}
        <section className="kpi-section">
          <div className="kpi-grid">
            {/* Total Income Card */}
            <div className="kpi-card income">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <FiTrendingUp size={24} />
                </div>
                <div className="kpi-trend up">
                  <FiTrendingUp size={14} />
                  <span>+12.5%</span>
                </div>
              </div>
              <p className="kpi-label">Total Income</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary?.totalIncome || 0} />
              </h3>
            </div>

            {/* Total Expenses Card */}
            <div className="kpi-card expense">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <FiTrendingDown size={24} />
                </div>
                <div className="kpi-trend down">
                  <FiTrendingDown size={14} />
                  <span>-8.2%</span>
                </div>
              </div>
              <p className="kpi-label">Total Expenses</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary?.totalExpense || 0} />
              </h3>
            </div>

            {/* Balance Card */}
            <div className="kpi-card balance">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <GiWallet size={24} />
                </div>
                <div className="kpi-trend up">
                  <FiTrendingUp size={14} />
                  <span>+5.3%</span>
                </div>
              </div>
              <p className="kpi-label">Current Balance</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary?.balance || 0} />
              </h3>
            </div>

            {/* Savings Card */}
            <div className="kpi-card savings">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <GiPiggyBank size={24} />
                </div>
                <div className="kpi-trend up">
                  <FiTrendingUp size={14} />
                  <span>+15.7%</span>
                </div>
              </div>
              <p className="kpi-label">Savings</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={Math.max(0, (summary?.totalIncome || 0) - (summary?.totalExpense || 0)) * 0.2} />
              </h3>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          {/* Line Chart - Income vs Expenses */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Income vs Expenses</h3>
              <div className="chart-actions">
                <button className="chart-filter-btn active">Weekly</button>
                <button className="chart-filter-btn">Monthly</button>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="date" 
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
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    name="Income"
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Expenses"
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Doughnut Chart - Expense Breakdown */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Expense Breakdown</h3>
            </div>
            <div className="chart-container" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getExpenseBreakdown()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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

        {/* Quick Actions Section */}
        <section className="quick-actions-section">
          <button className="quick-action-btn" onClick={() => navigate('/transactions')}>
            <span className="quick-action-icon"><FiPlus /></span>
            <span className="quick-action-label">Add Transaction</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/reports')}>
            <span className="quick-action-icon"><FiFileText /></span>
            <span className="quick-action-label">View Reports</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/budgets')}>
            <span className="quick-action-icon"><FiTarget /></span>
            <span className="quick-action-label">Set Budget</span>
          </button>
          <button className="quick-action-btn" onClick={() => handleExport('pdf')}>
            <span className="quick-action-icon"><FiDownload /></span>
            <span className="quick-action-label">Export Report</span>
          </button>
        </section>

        {/* Recent Transactions Section */}
        <section className="transactions-section">
          <div className="transactions-header">
            <h3 className="section-title">Recent Transactions</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Category Filter */}
              <div className="filter-dropdown">
                <button 
                  className="filter-btn"
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <FiFilter size={16} />
                  {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                </button>
                {showFilter && (
                  <div className="filter-menu">
                    <button 
                      className={`filter-option ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => { setSelectedCategory('all'); setShowFilter(false); }}
                    >
                      All Categories
                    </button>
                    {Object.keys(CATEGORY_COLORS).filter(c => c !== 'Other').map(cat => (
                      <button 
                        key={cat}
                        className={`filter-option ${selectedCategory === cat.toLowerCase() ? 'active' : ''}`}
                        onClick={() => { setSelectedCategory(cat.toLowerCase()); setShowFilter(false); }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button className="view-all-btn" onClick={() => navigate('/transactions')}>
                View All <FiArrowRight size={16} />
              </button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      <div className="transaction-info">
                        <div className={`transaction-icon ${transaction.type}`}>
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <div className="transaction-details">
                          <h4>{transaction.description || 'Transaction'}</h4>
                          <p>{transaction.category}</p>
                        </div>
                      </div>
                    </td>
                    <td>{new Date(transaction.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</td>
                    <td>{transaction.category}</td>
                    <td>
                      <span className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td>
                      <div className="transaction-actions">
                        <button className="action-icon-btn" title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          className="action-icon-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(transaction._id)}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No transactions yet</h3>
              <p>Start tracking your finances by adding your first transaction</p>
            </div>
          )}
        </section>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? <FiCheckCircle /> : <FiX />}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
