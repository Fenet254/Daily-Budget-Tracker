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
  FiArrowUp, FiArrowDown, FiRefreshCw, FiTarget, FiActivity
} from 'react-icons/fi';
import { GiLightningBolt } from 'react-icons/gi';
import { 
  GiMoneyStack, GiExpense, GiPiggyBank, GiWallet, GiTakeMyMoney,
  GiCircularArrows, GiUpgrade
} from 'react-icons/gi';
import './Reports.css';

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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatPercent = (value) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};
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
        axios.get('http://localhost:5000/api/reports/summary', { 
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/reports/transactions', { 
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
  const getLineChartData = () => {

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

  // Calculate budget overview data
  const getBudgetOverviewData = () => {
    if (!summary.budgetStatus || summary.budgetStatus.length === 0) {
      return { status: 'none', overBudget: [], totalBudget: 0, totalSpent: 0, percentage: 0 };
    }
    const overBudget = summary.budgetStatus.filter(b => b.spent > b.budgeted);
    const totalBudget = summary.budgetStatus.reduce((sum, b) => sum + b.budgeted, 0);
    const totalSpent = summary.budgetStatus.reduce((sum, b) => sum + b.spent, 0);
    const percentage = (totalSpent / totalBudget) * 100;
    
    let status = 'neutral';
    if (overBudget.length === 0 && percentage <= 70) status = 'excellent';
    else if (overBudget.length === 0 && percentage <= 90) status = 'good';
    else if (overBudget.length > 0) status = 'warning';
    
    return { status, overBudget, totalBudget, totalSpent, percentage };
  };
  
  const budgetOverview = getBudgetOverviewData();

  // Calculate budget progress for the circular progress bar
  const budgetProgress = (() => {
    if (!summary.budgetStatus || summary.budgetStatus.length === 0) return 0;
    const totalSpent = summary.budgetStatus.reduce((sum, b) => sum + b.spent, 0);
    const totalBudgeted = summary.budgetStatus.reduce((sum, b) => sum + b.budgeted, 0);
    if (totalBudgeted === 0) return 0;
    return Math.min((totalSpent / totalBudgeted) * 326.7, 326.7);
  })();

  const handleExport = (format) => {
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

        <section className="kpi-section">
          <div className="kpi-grid">
        
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

        {/* Beautiful Budget Executive Summary Section */}
        <section className="budget-overview-section">
          <div className="budget-overview-header">
            <div className="budget-overview-title">
              <GiCircularArrows size={28} className="overview-icon" />
              <div>
                <h2>Budget Executive Summary</h2>
                <p>Your complete budget overview at a glance</p>
              </div>
            </div>
            <div className="budget-health-badge">
              {summary.budgetStatus && summary.budgetStatus.length > 0 ? (
                budgetOverview.status === 'excellent' ? (
                  <span className="health-badge excellent"><FiCheckCircle /> Excellent</span>
                ) : budgetOverview.status === 'good' ? (
                  <span className="health-badge good"><FiInfo /> On Track</span>
                ) : budgetOverview.status === 'warning' ? (
                  <span className="health-badge warning"><FiAlertCircle /> Needs Attention</span>
                ) : (
                  <span className="health-badge neutral"><FiActivity /> Normal</span>
                )
              ) : (
                <span className="health-badge neutral"><FiTarget /> No Budgets</span>
              )}
            </div>
          </div>
          
          <div className="budget-overview-grid">
            {/* Main Circular Progress Card */}
            <div className="budget-progress-card">
              <div className="circular-progress-container">
                <svg className="circular-progress" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="budgetProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <circle className="progress-bg" cx="60" cy="60" r="52" />
                  <circle 
                    className="progress-bar" 
                    cx="60" 
                    cy="60" 
                    r="52"
                    style={{
                      strokeDasharray: `${budgetProgress} 326.7`,
                      stroke: 'url(#budgetProgressGradient)'
                    }}                 />
                </svg>
                <div className="progress-center-content">
                  <span className="progress-percentage">
                    {summary.budgetStatus ? Math.round((summary.budgetStatus.reduce((sum, b) => sum + b.spent, 0) / (summary.budgetStatus.reduce((sum, b) => sum + b.budgeted, 1)) * 100)) : 0}%
                  </span>
                  <span className="progress-label">Used</span>
                </div>
              </div>
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Budget</span>
                  <span className="stat-value budget">
                    {formatCurrency(summary.budgetStatus?.reduce((sum, b) => sum + b.budgeted, 0) || 0)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Spent</span>
                  <span className="stat-value spent">
                    {formatCurrency(summary.budgetStatus?.reduce((sum, b) => sum + b.spent, 0) || 0)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Remaining</span>
                  <span className="stat-value remaining">
                    {formatCurrency((summary.budgetStatus?.reduce((sum, b) => sum + b.budgeted, 0) || 0) - (summary.budgetStatus?.reduce((sum, b) => sum + b.spent, 0) || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Budget Categories Overview */}
            <div className="budget-categories-card">
              <h3><FiTarget size={18} /> Category Breakdown</h3>
              <div className="budget-categories-list">
                {summary.budgetStatus && summary.budgetStatus.length > 0 ? (
                  summary.budgetStatus.slice(0, 4).map((budget, index) => {
                    const percentage = (budget.spent / budget.budgeted) * 100;
                    const isOverBudget = percentage > 100;
                    const isWarning = percentage > 70 && percentage <= 100;
                    
                    return (
                      <div key={index} className={`category-budget-item ${isOverBudget ? 'over' : isWarning ? 'warning' : 'good'}`}>
                        <div className="category-info">
                          <span className="category-name">{budget.category}</span>
                          <span className={`category-status ${isOverBudget ? 'over' : isWarning ? 'warning' : 'good'}`}>
                            {isOverBudget ? <FiAlertCircle /> : isWarning ? <FiZap /> : <FiCheckCircle />}
                          </span>
                        </div>
                        <div className="category-progress-wrapper">
                          <div className="category-progress-bar">
                            <div 
                              className={`category-progress-fill ${isOverBudget ? 'over' : isWarning ? 'warning' : 'good'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="category-percentage">{Math.round(percentage)}%</span>
                        </div>
                        <div className="category-amounts">
                          <span className="spent-amount">{formatCurrency(budget.spent)}</span>
                          <span className="budget-amount">of {formatCurrency(budget.budgeted)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-budgets-message">
                    <FiTarget size={32} />
                    <p>No budgets set up yet</p>
                    <span>Create budgets to track your spending</span>
                  </div>
                )}
              </div>
              {summary.budgetStatus && summary.budgetStatus.length > 4 && (
                <button className="view-all-btn">
                  View All {summary.budgetStatus.length} Categories <FiArrowDown size={14} />
                </button>
              )}
            </div>

            {/* Quick Insights Card */}
            <div className="budget-insights-card">
              <h3><GiUpgrade size={18} /> Quick Insights</h3>
              <div className="insights-list">
                {summary.budgetStatus && summary.budgetStatus.length > 0 ? (
                  <>
                    <div className="insight-item success">
                      <div className="insight-icon"><FiCheckCircle /></div>
                      <div className="insight-content">
                        <span className="insight-value">{budgetOverview.overBudget ? summary.budgetStatus.length - budgetOverview.overBudget.length : 0}</span>
                        <span className="insight-label">Categories on track</span>
                      </div>
                    </div>
                    {budgetOverview.overBudget.length > 0 && (
                      <div className="insight-item danger">
                        <div className="insight-icon"><FiAlertCircle /></div>
                        <div className="insight-content">
                          <span className="insight-value">{budgetOverview.overBudget.length}</span>
                          <span className="insight-label">Over budget</span>
                        </div>
                      </div>
                    )}
                    <div className="insight-item info">
                      <div className="insight-icon"><FiTrendingUp /></div>
                      <div className="insight-content">
                        <span className="insight-value">{formatCurrency(budgetOverview.totalBudget - budgetOverview.totalSpent)}</span>
                        <span className="insight-label">Potential savings</span>
                      </div>
                    </div>
                    {summary.totalExpense > 0 && (
                      <div className="insight-item primary">
                        <div className="insight-icon"><FiDollarSign /></div>
                        <div className="insight-content">
                          <span className="insight-value">{Math.round((budgetOverview.totalSpent / summary.totalExpense) * 100)}%</span>
                          <span className="insight-label">Of total expenses</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-insights">
                    <p>Set up budgets to see insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        
        <section className="charts-section">
        
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

       
        <section className="actions-section">
          <div className="actions-grid">
            <button className="action-btn" onClick={() => handleExport('pdf')}>
              <FiFileText size={18} />
              <span>Export as PDF</span>
            </button>
            <button className="action-btn" onClick={() => handleExport('csv')}>
              <FiDownload size={18} />
              <span>Export as CSV</span>
            </button>
            <button className="action-btn" onClick={handlePrint}>
              <FiPrinter size={18} />
              <span>Print Report</span>
            </button>
            <button className="action-btn" onClick={fetchData}>
              <FiRefreshCw size={18} />
              <span>Refresh Data</span>
            </button>
          </div>
        </section>


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
                <div className="empty-state-icon">R</div>
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
