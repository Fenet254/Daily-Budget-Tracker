import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [summary, setSummary] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    fetchRecentTransactions();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/reports/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/transactions?limit=5');
      setRecentTransactions(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Main Dashboard</h1>
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
      <div className="recent-transactions">
        <h2>Recent Transactions</h2>
        <ul>
          {recentTransactions.map((transaction) => (
            <li key={transaction._id}>
              {transaction.type === 'income' ? '+' : '-'}{transaction.amount} ETB - {transaction.category} - {new Date(transaction.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
