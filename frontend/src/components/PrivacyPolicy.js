import React from 'react';
import './Auth.css';

const PrivacyPolicy = () => {
  return (
    <div className="auth-page legal-page">
      <div className="auth-background">
        <img
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=100"
          alt="Privacy background"
        />
      </div>
      <div className="auth-background-overlay"></div>

      <div className="auth-form-section">
        <div className="auth-form-container legal-container">
          <h1 className="auth-title">Privacy Policy</h1>
          <p className="auth-subtitle">Last updated: {new Date().getFullYear()}</p>

          <div className="legal-content">
            <p>
              Daily Budget Tracker (“we”, “us”, “our”) respects your privacy. This Privacy Policy
              explains how we collect, use, and protect your information when you use our web app.
            </p>

            <h2>1. Information we collect</h2>
            <ul>
              <li>Account information (e.g., name, email)</li>
              <li>Profile information you choose to add</li>
              <li>Financial data you enter (transactions, budgets, reports)</li>
            </ul>

            <h2>2. How we use your information</h2>
            <ul>
              <li>To provide and maintain the service</li>
              <li>To personalize your experience</li>
              <li>To secure accounts and prevent fraud</li>
            </ul>

            <h2>3. Data sharing</h2>
            <p>
              We do not sell your personal information. We may share information when required by law
              or with trusted service providers who help us run the app.
            </p>

            <h2>4. Security</h2>
            <p>
              We use reasonable security measures to protect your data. However, no method of
              transmission or storage is 100% secure.
            </p>

            <h2>5. Contact</h2>
            <p>
              If you have questions, contact us via the Contact page in this app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

