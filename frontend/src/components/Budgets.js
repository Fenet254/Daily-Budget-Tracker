import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Budgets.css';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/budgets');
      setBudgets(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/budgets/${editing}`, formData);
        setEditing(null);
      } else {
        await axios.post('http://localhost:5000/budgets', formData);
      }
      setFormData({ category: '', amount: '', period: 'monthly' });
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleEdit = (budget) => {
    setFormData({
      category: budget.category,
      amount: budget.amount,
      period: budget.period
    });
    setEditing(budget._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/budgets/${id}`);
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="budgets">
      <h1>Budgets</h1>
      <form onSubmit={handleSubmit} className="budget-form">
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
        <select name="period" value={formData.period} onChange={handleChange} required>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button type="submit">{editing ? 'Update' : 'Add'} Budget</button>
        {editing && <button type="button" onClick={() => setEditing(null)}>Cancel</button>}
      </form>
      <table className="budget-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Budgeted</th>
            <th>Spent</th>
            <th>Remaining</th>
            <th>Period</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget) => (
            <tr key={budget._id}>
              <td>{budget.category}</td>
              <td>{budget.amount} ETB</td>
              <td>{budget.spent} ETB</td>
              <td>{budget.amount - budget.spent} ETB</td>
              <td>{budget.period}</td>
              <td>
                <button onClick={() => handleEdit(budget)}>Edit</button>
                <button onClick={() => handleDelete(budget._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Budgets;
