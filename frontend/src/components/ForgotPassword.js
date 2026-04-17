import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiCheck, FiAlertCircle } from 'react-icons/fi';
import API from '../api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await API.post('/auth/forgot-password', { email });
      setMessage('Password reset link sent to your email. Check your inbox/spam folder.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <img 
          src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=80" 
          alt="Budget tracking background" 
        />
      </div>
      <div className="auth-background-overlay"></div>

      <div className="auth-form-section">
        <div className="auth-form-container">
          <Link to="/login" className="back-link">
            <FiArrowLeft /> Back to Login
          </Link>

          <h1 className="auth-title">Forgot Password?</h1>
          <p className="auth-subtitle">
            No worries, we'll send you reset instructions
          </p>

          {error && (
            <div className="auth-error">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="auth-success">
              <FiCheck />
              <span>{message}</span>
            </div>
          )}

          {!message && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label form-label-required">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {message && (
            <button 
              type="button" 
              className="auth-submit-btn"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          )}
        </div>

        <footer className="auth-footer">
          <p>&copy; 2026 Daily Budget Tracker. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;

