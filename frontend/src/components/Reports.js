import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import './Reports.css';

const Reports = () => {
  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/reports/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/reports/transactions');
      setTransactions(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await axios.get('http://localhost:5000/reports/summary', { params });
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching filtered summary:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  const categoryData = Object.entries(summary.categoryBreakdown || {}).map(([category, data]) => ({
    category,
    income: data.income,
    expense: data.expense,
  }));

  const budgetData = summary.budgetStatus?.map(budget => ({
    category: budget.category,
    budgeted: budget.budgeted,
    spent: budget.spent,
    remaining: budget.remaining,
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="reports">
      <h1>Reports</h1>
      <div className="summary-cards">
        <div className="card">
          <h3>Total Income</h3>
          <p>{summary.totalIncome || 0} ETB</p>
        </div>
        <div className="card">
          <h3>Total Expenses</h3>
          <p>{summary.totalExpense || 0} ETB</p>
        </div>
        <div className="card">
          <h3>Balance</h3>
          <p>{summary.balance || 0} ETB</p>
        </div>
      </div>
      <div className="filters">
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          placeholder="Start Date"
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          placeholder="End Date"
        />
        <button onClick={applyFilters}>Apply Filters</button>
      </div>
      <div className="charts-container">
        <div className="chart">
          <h2>Income vs Expenses by Category</h2>
          <BarChart width={500} height={300} data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#28a745" />
            <Bar dataKey="expense" fill="#dc3545" />
          </BarChart>
        </div>
        <div className="chart">
          <h2>Budget Status</h2>
          <BarChart width={500} height={300} data={budgetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budgeted" fill="#007bff" />
            <Bar dataKey="spent" fill="#ffc107" />
            <Bar dataKey="remaining" fill="#28a745" />
          </BarChart>
        </div>
      </div>
      <div className="transaction-report">
        <h2>Transaction Report</h2>
        <table>
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
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                <td className={transaction.type}>{transaction.type}</td>
                <td>{transaction.amount} ETB</td>
                <td>{transaction.category}</td>
                <td>{transaction.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
