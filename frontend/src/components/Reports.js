import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUpDown, Zap, Award, Sparkles, Flame } from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, 
  FiPieChart, FiSavings, FiPlus, FiFileText, FiTarget, FiDownload,
  FiEdit2, FiTrash2, FiArrowRight, FiFilter, FiSearch,
  FiShoppingCart, FiCoffee, FiHome, FiMusic, FiTruck, FiZap,
  FiAlertCircle, FiCheckCircle, FiX
} from 'react-icons/fi';
import { 
  GiMoneyStack, GiExpense, GiPiggyBank, GiWallet, GiTakeMyMoney 
} from 'react-icons/gi';
import './Reports.css';

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

// Premium Sparkline Component for KPIs
const Sparkline = ({ data, color, type = 'income' }) => (
  <div className="sparkline-container">
    <ResponsiveContainer width="100%" height={30}>
      <AreaChart data={data.slice(-7)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area dataKey={type === 'income' ? 'income' : 'expenses'} stroke={color} strokeWidth={2} fill={`url(#spark-${type})`} dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// Animated counter component (Enhanced)
const AnimatedCounter = ({ value, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
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
  
  return <motion.span 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >{prefix}{formatCurrency(displayValue)}</motion.span>;
};

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

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [prevSummary, setPrevSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState(null);
  const [chartData, setChartData] = useState([]);



  useEffect(() => {
    fetchSummary();
    fetchRecentTransactions();
    fetchChartData();
    
    document.documentElement.setAttribute('data-theme', 'light');
  }, [dateRange, selectedCategory]);

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

  // Get previous period date range for percentage calculation
  const getPrevDateRange = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (dateRange) {
      case 'today':
        // Previous day
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // Previous week (7-14 days ago)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 14);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 8);
        break;
      case 'month':
        // Previous month
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 2);
        endDate = new Date(now);
        endDate.setMonth(now.getMonth() - 1);
        endDate.setDate(0); // Last day of previous month
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  // Calculate percentage change between current and previous period
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  // 🔥 NEW BUDGET UTILITIES
  const getBudgetStats = () => {
    const budgetStatus = summary?.budgetStatus || [];
    const totalBudgeted = budgetStatus.reduce((sum, b) => sum + b.budgeted, 0);
    const totalSpent = budgetStatus.reduce((sum, b) => sum + b.spent, 0);
    const avgUsage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    const onTrackCount = budgetStatus.filter(b => (b.spent / b.budgeted) * 100 < 80).length;
    const overBudgetCount = budgetStatus.filter(b => b.spent > b.budgeted).length;
    
    return {
      totalBudgeted,
      totalSpent,
      avgUsage,
      onTrackCount,
      totalBudgets: budgetStatus.length,
      overBudgetCount,
      budgetStatus
    };
  };

  const getBudgetHealthScore = () => {
    const stats = getBudgetStats();
    const avgUsage = stats.avgUsage;
    if (avgUsage <= 70) return 100;
    if (avgUsage <= 90) return 85;
    if (avgUsage <= 110) return 60;
    return 30;
  };

  const getTopBudgetAlerts = () => {
    return (summary?.budgetStatus || [])
      .filter(b => b.spent > b.budgeted * 0.8)
      .sort((a, b) => (b.spent / b.budgeted) - (a.spent / a.budgeted))
      .slice(0, 3);
  };

  const fetchSummary = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const res = await API.get(`/reports/summary?startDate=${startDate}&endDate=${endDate}`);
      setSummary(res.data);
      
      // Fetch previous period data for comparison
      const { startDate: prevStartDate, endDate: prevEndDate } = getPrevDateRange();
      const prevRes = await API.get(`/reports/summary?startDate=${prevStartDate}&endDate=${prevEndDate}`);
      setPrevSummary(prevRes.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      // Fallback empty data
      setSummary({});
      setPrevSummary({});
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      let url = `/transactions?limit=5&startDate=${startDate}&endDate=${endDate}`;
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      
      const res = await API.get(url);
      setTransactions(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const res = await API.get(`/reports/transactions?startDate=${startDate}&endDate=${endDate}`);
      
      const transactions = res.data;
      const groupedData = {};
      const days = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30;

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        groupedData[dateKey] = { date: dateKey, income: 0, expenses: 0 };
      }
    
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/transactions/${id}`);
      showToast('Transaction deleted successfully', 'success');
      fetchRecentTransactions();
      fetchSummary();
      fetchChartData();
    } catch (error) {
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleExport = (format) => {
    showToast(`Exporting data as ${format.toUpperCase()}...`, 'success');
  };

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
      


        {/* Premium Asymmetric KPI Section */}
        <motion.section 
          className="kpi-section" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delay: 0.6 }}
        >
          <div className="kpi-grid-asymmetric">
            {/* Income - Offset left */}
            <motion.div 
              className="kpi-card glass income glass-elevated" 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -8, boxShadow: 'var(--shadow-neon-hover)' }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="kpi-header">
                <div className="kpi-icon neumorphic">
                  <Zap size={24} />
                </div>
                <motion.div className={`kpi-trend up glass`}>
                  <TrendingUpDown size={16} />
                  <span>{formatPercentage(calculatePercentageChange(summary?.totalIncome || 0, prevSummary?.totalIncome || 0))}</span>
                </motion.div>
              </div>
              <Sparkline data={chartData} color="#10B981" type="income" />
              <p className="kpi-label glass-text">Total Income</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary?.totalIncome || 0} />
              </h3>
            </motion.div>

            {/* Expenses - Full width */}
            <motion.div 
              className="kpi-card glass expense glass-wide" 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -8, boxShadow: 'var(--shadow-neon-hover)' }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            >
              <div className="kpi-header">
                <div className="kpi-icon neumorphic">
                  <TrendingUpDown size={24} />
                </div>
                <motion.div className={`kpi-trend down glass`}>
                  <TrendingUpDown size={16} />
                  <span>{formatPercentage(calculatePercentageChange(summary?.totalExpense || 0, prevSummary?.totalExpense || 0))}</span>
                </motion.div>
              </div>
              <Sparkline data={chartData} color="#EF4444" type="expenses" />
              <p className="kpi-label glass-text">Total Expenses</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary?.totalExpense || 0} />
              </h3>
            </motion.div>

            {/* Balance - Overlap effect */}
            <motion.div 
              className="kpi-card glass balance overlap-left" 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -8, rotateX: 2, boxShadow: 'var(--shadow-neon-hover)' }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <div className="kpi-icon neumorphic balance-icon">
                <Award size={24} />
              </div>
              <div className="kpi-content">
                <div className="kpi-header">
                  <motion.div className="kpi-trend up glass">
                    <TrendingUpDown size={16} />
                    <span>{formatPercentage(calculatePercentageChange(summary?.balance || 0, (prevSummary?.totalIncome || 0) - (prevSummary?.totalExpense || 0)))}</span>
                  </motion.div>
                </div>
                <Sparkline data={chartData} color="#3B82F6" type="income" />
                <p className="kpi-label glass-text">Current Balance</p>
                <h3 className="kpi-amount">
                  <AnimatedCounter value={summary?.balance || 0} />
                </h3>
              </div>
            </motion.div>

            {/* Savings - Floating right */}
            <motion.div 
              className="kpi-card glass savings float-right" 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -12, rotateY: -2, boxShadow: 'var(--shadow-neon-hover)' }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
            >
              <div className="kpi-header">
                <div className="kpi-icon neumorphic">
                  <Sparkles size={24} />
                </div>
                <motion.div className="kpi-trend up glass savings-trend">
                  <Flame size={16} />
                  <span>{formatPercentage(calculatePercentageChange(Math.max(0, (summary?.totalIncome || 0) - (summary?.totalExpense || 0)) * 0.2, Math.max(0, ((prevSummary?.totalIncome || 0) - (prevSummary?.totalExpense || 0))) * 0.2))}</span>
                </motion.div>
              </div>
              <Sparkline data={chartData} color="#8B5CF6" type="income" />
              <p className="kpi-label glass-text">Projected Savings</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={Math.max(0, (summary?.totalIncome || 0) - (summary?.totalExpense || 0)) * 0.2} />
              </h3>
            </motion.div>
          </div>
        </motion.section>

        {/* Budget Progress Bars */}
        <section className="budget-progress-section">
          <h3 className="section-title">Budget Health</h3>
          <div className="progress-container">
            {getTopBudgetAlerts().map((budget, index) => (
              <motion.div 
                key={index}
                className="progress-item"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: (budget.spent / budget.budgeted) }}
                transition={{ duration: 1.5, delay: 1.5 + index * 0.1 }}
              >
                <div className="progress-label">
                  <span>{budget.category}</span>
                  <span>{formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${budget.spent > budget.budgeted ? 'danger' : budget.spent > budget.budgeted * 0.8 ? 'warning' : 'success'}`}
                  ></div>
                </div>
              </motion.div>
            ))}
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
          <button className="quick-action-btn" onClick={() => navigate('/transactions')}>
            <span className="quick-action-icon"><FiFileText /></span>
            <span className="quick-action-label">View Transactions</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/budgets')}>
            <span className="quick-action-icon"><FiTarget /></span>
            <span className="quick-action-label">Manage Budgets</span>
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
              <h3>No recent transactions</h3>
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

export default Reports;
