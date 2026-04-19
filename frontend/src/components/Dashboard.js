import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-placeholder">
      <div className="dashboard-coming-soon">
        <div className="coming-soon-icon">🚀</div>
        <h1>Dashboard</h1>
        <p>Advanced dashboard coming soon!</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Check your detailed analytics on the{' '}
          <a href="/reports" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Reports page
          </a>
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
