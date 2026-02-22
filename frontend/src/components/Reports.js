import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Area, AreaChart
} from 'recharts';
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, 
  FiPieChart, FiSavings, FiDownload, FiFileText, FiPrinter,
  FiCalendar, FiFilter, FiAlertCircle, FiCheckCircle, FiInfo,
  FiArrowUp, FiArrowDown, FiRefreshCw
} from 'react-icons/fi';
import { 
  GiMoneyStack, GiExpense, GiPiggyBank, GiWallet, GiTakeMyMoney
} from 'react-icons/gi';
import './Reports.css';

// Category colors matching Dashboard
const CATEGORY_COLORS = {
  Food: '#10B981',
  Transport: '#F59E0B',
  Rent: '#6366F1',
  Utilities: '#8B5CF6',
  Entertainment: '#EC4899',
  Shopping: '#14B8A6',
  Other: '#64748B',
  Salary: '#22C55E',
  Investment: '#0EA5E9',
  OtherIncome: '#10B981'
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

// Format percentage
const formatPercent = (value) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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

// Skeleton loading component
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-icon"></div>
    <div className="skeleton skeleton-text"></div>
    <div className="skeleton skeleton-text-lg"></div>
  </div>
);

const Reports = () => {
  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({ 
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0] 
  });
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [chartTimeRange, setChartTimeRange] = useState('month');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const [summaryRes, transactionsRes] = await Promise.all([
        axios.get('http://localhost:5000/reports/summary', { 
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/reports/transactions', { 
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data);
      generateInsights(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (data) => {
    const newInsights = [];
    const savingsRate = data.totalIncome > 0 
      ? ((data.totalIncome - data.totalExpense) / data.totalIncome * 100) 
      : 0;
    
    // Savings rate insight
    if (savingsRate >= 20) {
      newInsights.push({
        icon: <FiCheckCircle />,
        text: `Great job! Your savings rate is ${savingsRate.toFixed(1)}%`,
        type: 'success',
        meta: 'Excellent savings'
      });
    } else if (savingsRate > 0) {
      newInsights.push({
        icon: <FiInfo />,
        text: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for 20% to build wealth.`,
        type: 'info',
        meta: 'Savings opportunity'
      });
    } else {
      newInsights.push({
        icon: <FiAlertCircle />,
        text: "You're spending more than you earn. Consider reducing expenses.",
        type: 'warning',
        meta: 'Action needed'
      });
    }

    // Category breakdown insights
    if (data.categoryBreakdown) {
      const categories = Object.entries(data.categoryBreakdown);
      const expenseCategories = categories.filter(([_, d]) => d.expense > 0);
      
      if (expenseCategories.length > 0) {
        const topExpense = expenseCategories.reduce((a, b) => 
          (a[1]?.expense || 0) > (b[1]?.expense || 0) ? a : b
        );
        
        newInsights.push({
          icon: <FiTrendingUp />,
          text: `Highest expense: ${topExpense[0]} - ${formatCurrency(topExpense[1]?.expense || 0)}`,
          type: 'info',
          meta: 'Top spending'
        });
      }
    }

    // Budget status insights
    if (data.budgetStatus) {
      const overBudget = data.budgetStatus.filter(b => b.spent > b.budgeted);
      if (overBudget.length > 0) {
        newInsights.push({
          icon: <FiAlertCircle />,
          text: `${overBudget.length} category(s) over budget`,
          type: 'warning',
          meta: 'Budget alert'
        });
      } else if (data.budgetStatus.length > 0) {
        newInsights.push({
          icon: <FiCheckCircle />,
          text: "You're within budget across all categories!",
          type: 'success',
          meta: 'On track'
        });
      }
    }

    setInsights(newInsights);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchData();
  };

  // Prepare chart data
  const getCategoryPieData = () => {
    if (!summary.categoryBreakdown) return [];
    
    return Object.entries(summary.categoryBreakdown)
      .filter(([_, data]) => data.expense > 0)
      .map(([name, data]) => ({
        name,
        value: data.expense,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other
      }));
  };

  const getBudgetBarData = () => {
    if (!summary.budgetStatus) return [];
    
    return summary.budgetStatus.map(budget => ({
      category: budget.category,
      budgeted: budget.budgeted,
      spent: budget.spent,
      remaining: budget.remaining,
      isOverBudget: budget.spent > budget.budgeted
    }));
  };

  // Generate line chart data for income vs expenses over time
  const getLineChartData = () => {
    // Group transactions by date
    const groupedData = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!groupedData[date]) {
        groupedData[date] = { date, income: 0, expenses: 0 };
      }
      
      if (tx.type === 'income') {
        groupedData[date].income += tx.amount;
      } else {
        groupedData[date].expenses += tx.amount;
      }
    });

    return Object.values(groupedData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  const savingsRate = summary.totalIncome > 0 
    ? ((summary.totalIncome - summary.totalExpense) / summary.totalIncome * 100) 
    : 0;

  // Export handlers
  const handleExport = (format) => {
    // In a real app, this would trigger an API call
    alert(`Exporting as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="reports">
        <div className="reports-container">
          <div className="reports-header-skeleton">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-subtitle"></div>
          </div>
          <div className="kpi-grid">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports">
      <div className="reports-container">
        {/* Header Section */}
        <header className="reports-header">
          <div className="reports-title-section">
            <h1>Reports</h1>
            <p>Track your income, expenses, and financial trends.</p>
          </div>
          
          <div className="reports-controls">
            <div className="date-range-picker">
              <div className="date-input-group">
                <FiCalendar className="date-icon" />
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="date-input"
                />
              </div>
              <span className="date-separator">to</span>
              <div className="date-input-group">
                <FiCalendar className="date-icon" />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="date-input"
                />
              </div>
              <button className="filter-btn" onClick={applyFilters}>
                <FiFilter size={16} />
                Apply Filter
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
                  <FiArrowUp size={14} />
                  <span>+12.5%</span>
                </div>
              </div>
              <p className="kpi-label">Total Income</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary.totalIncome || 0} />
              </h3>
            </div>

            {/* Total Expenses Card */}
            <div className="kpi-card expense">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <FiTrendingDown size={24} />
                </div>
                <div className="kpi-trend down">
                  <FiArrowDown size={14} />
                  <span>-8.2%</span>
                </div>
              </div>
              <p className="kpi-label">Total Expenses</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary.totalExpense || 0} />
              </h3>
            </div>

            {/* Balance Card */}
            <div className="kpi-card balance">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <GiWallet size={24} />
                </div>
                <div className={`kpi-trend ${summary.balance >= 0 ? 'up' : 'down'}`}>
                  {summary.balance >= 0 ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                  <span>{summary.balance >= 0 ? '+' : ''}{((summary.balance / (summary.totalIncome || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <p className="kpi-label">Balance</p>
              <h3 className="kpi-amount">
                <AnimatedCounter value={summary.balance || 0} />
              </h3>
            </div>

            {/* Savings Rate Card */}
            <div className="kpi-card savings">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <GiPiggyBank size={24} />
                </div>
                <div className={`kpi-trend ${savingsRate >= 20 ? 'up' : savingsRate > 0 ? 'neutral' : 'down'}`}>
                  {savingsRate >= 20 ? <FiArrowUp size={14} /> : savingsRate > 0 ? <FiTrendingUp size={14} /> : <FiArrowDown size={14} />}
                  <span>{formatPercent(savingsRate)}</span>
                </div>
              </div>
              <p className="kpi-label">Savings Rate</p>
              <h3 className="kpi-amount">
                {savingsRate.toFixed(1)}%
              </h3>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          {/* Line Chart - Income vs Expenses */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Income vs Expenses (Monthly Trend)</h3>
              <div className="chart-actions">
                <button 
                  className={`chart-filter-btn ${chartTimeRange === 'week' ? 'active' : ''}`}
                  onClick={() => setChartTimeRange('week')}
                >
                  Weekly
                </button>
                <button 
                  className={`chart-filter-btn ${chartTimeRange === 'month' ? 'active' : ''}`}
                  onClick={() => setChartTimeRange('month')}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getLineChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                      boxShadow: 'var(--shadow-lg)'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="Income"
                    stroke="#10B981" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Expenses"
                    stroke="#EF4444" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart - Expense Distribution */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Expense Distribution by Category</h3>
            </div>
            <div className="chart-container donut-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getCategoryPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getCategoryPieData().map((entry, index) => (
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
              {getCategoryPieData().slice(0, 5).map((item, index) => (
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

        {/* Budget vs Actual Section */}
        <section className="budget-section">
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3 className="chart-title">Budget vs Actual Spending</h3>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBudgetBarData()} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="category" 
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
                      borderRadius: '8px'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="budgeted" name="Budgeted" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Insights Section */}
        <section className="insights-section">
          <div className="insights-card">
            <div className="insights-header">
              <h3 className="section-title">
                <FiInfo size={20} />
                Smart Insights
              </h3>
            </div>
            <div className="insights-grid">
              {insights.map((insight, index) => (
                <div key={index} className={`insight-item ${insight.type}`}>
                  <div className="insight-icon">{insight.icon}</div>
                  <div className="insight-content">
                    <p className="insight-text">{insight.text}</p>
                    <span className="insight-meta">{insight.meta}</span>
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="insight-item info">
                  <div className="insight-icon"><FiInfo /></div>
                  <div className="insight-content">
                    <p className="insight-text">Add transactions to get personalized insights</p>
                    <span className="insight-meta">Get started</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Export & Actions Section */}
        <section className="actions-section">
          <div className="actions-card">
            <h3 className="section-title">Export & Actions</h3>
            <div className="actions-buttons">
              <button className="export-btn" onClick={() => handleExport('pdf')}>
                <FiFileText size={18} />
                <span>Export as PDF</span>
              </button>
              <button className="export-btn" onClick={() => handleExport('csv')}>
                <FiDownload size={18} />
                <span>Export as CSV</span>
              </button>
              <button className="export-btn" onClick={handlePrint}>
                <FiPrinter size={18} />
                <span>Print Report</span>
              </button>
              <button className="export-btn refresh" onClick={fetchData}>
                <FiRefreshCw size={18} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </section>

        {/* Transaction Report Table */}
        <section className="transactions-section">
          <div className="transactions-card">
            <div className="transactions-header">
              <h3 className="section-title">Transaction Details</h3>
              <span className="transaction-count">{transactions.length} transactions</span>
            </div>
            {transactions.length > 0 ? (
              <div className="table-container">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Category</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction._id}>
                        <td>
                          {new Date(transaction.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td>
                          <span className={`type-badge ${transaction.type}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td>
                          <span className={`transaction-amount ${transaction.type}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td>{transaction.category}</td>
                        <td>{transaction.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No transactions found</h3>
                <p>No transactions found for the selected date range</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;
