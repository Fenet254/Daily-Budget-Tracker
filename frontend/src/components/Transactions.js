import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    date: ''
  });
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/transactions');
      setTransactions(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/transactions/${editing}`, formData);
        setEditing(null);
      } else {
        await axios.post('http://localhost:5000/transactions', formData);
      }
      setFormData({ type: 'income', amount: '', category: '', description: '', date: '' });
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
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
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    return (
      (!filters.type || transaction.type === filters.type) &&
      (!filters.category || transaction.category.toLowerCase().includes(filters.category.toLowerCase())) &&
      (!filters.startDate || new Date(transaction.date) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(transaction.date) <= new Date(filters.endDate))
    );
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="transactions">
      <h1>Transactions</h1>
      <form onSubmit={handleSubmit} className="transaction-form">
        <select name="type" value={formData.type} onChange={handleChange} required>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />
        <button type="submit">{editing ? 'Update' : 'Add'} Transaction</button>
        {editing && <button type="button" onClick={() => setEditing(null)}>Cancel</button>}
      </form>
      <div className="filters">
        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="text"
          name="category"
          placeholder="Filter by category"
          value={filters.category}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
      </div>
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
              <td>{new Date(transaction.date).toLocaleDateString()}</td>
              <td className={transaction.type}>{transaction.type}</td>
              <td>{transaction.amount} ETB</td>
              <td>{transaction.category}</td>
              <td>{transaction.description}</td>
              <td>
                <button onClick={() => handleEdit(transaction)} className="edit-btn">Edit</button>
                <button onClick={() => handleDelete(transaction._id)} className="delete-btn">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Transactions;
