import React from 'react';
import './Auth.css';

const TermsOfService = () => {
  return (
    <div className="auth-page legal-page">
      <div className="auth-background">
        <img
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=100"
          alt="Terms background"
        />
      </div>
      <div className="auth-background-overlay"></div>

      <div className="auth-form-section">
        <div className="auth-form-container legal-container">
          <h1 className="auth-title">Terms of Service</h1>
          <p className="auth-subtitle">Last updated: {new Date().getFullYear()}</p>

          <div className="legal-content">
            <p>
              By using Daily Budget Tracker, you agree to these Terms of Service. If you do not
              agree, do not use the app.
            </p>

            <h2>1. Use of the service</h2>
            <ul>
              <li>You must use the app responsibly and lawfully.</li>
              <li>You are responsible for your account activity.</li>
            </ul>

            <h2>2. Your data</h2>
            <p>
              You control the content you enter (transactions, budgets, and other data). We store
              it to provide the service.
            </p>

            <h2>3. Account security</h2>
            <p>
              You should keep your credentials secure and notify us of any unauthorized use.
            </p>

            <h2>4. Changes to these terms</h2>
            <p>
              We may update these Terms from time to time. Your continued use means you accept the
              updated terms.
            </p>

            <h2>5. Contact</h2>
            <p>
              Questions about these Terms can be sent through the Contact page in this app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

