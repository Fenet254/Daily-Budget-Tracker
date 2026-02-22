import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './Auth.css';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [inputValues, setInputValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: '' });
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    let strength = 0;
    let text = '';

    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    switch (strength) {
      case 0:
      case 1:
        text = 'Weak';
        break;
      case 2:
        text = 'Medium';
        break;
      case 3:
      case 4:
        text = 'Strong';
        break;
      default:
        text = '';
    }

    setPasswordStrength({ level: strength, text });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    setInputValues({
      ...inputValues,
      [name]: value
    });

    if (name === 'password') {
      checkPasswordStrength(value);
    }

    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Please agree to the Privacy Policy and Terms of Service.');
      return;
    }

    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password
      });
      setShowToast(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <img 
          src="https://images.unsplash.com/photo-1563013544b704d3-824ae1?w=1920&q=80" 
          alt="Budget tracking background" 
        />
      </div>
      <div className="auth-background-overlay"></div>

      <div className="auth-form-section">
        <div className="auth-form-container">
          <h1 className="auth-title">Join Daily Budget Tracker</h1>
          <p className="auth-subtitle">Start your journey to financial freedom.</p>

          {error && (
            <div className="auth-error">
              <AlertCircleIcon />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group floating-label">
                <input
                  type="text"
                  name="firstName"
                  className={`form-input ${inputValues.firstName ? 'has-value' : ''}`}
                  placeholder=" "
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  id="firstName"
                />
                <label htmlFor="firstName">First Name</label>
              </div>
              <div className="form-group floating-label">
                <input
                  type="text"
                  name="lastName"
                  className={`form-input ${inputValues.lastName ? 'has-value' : ''}`}
                  placeholder=" "
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  id="lastName"
                />
                <label htmlFor="lastName">Last Name</label>
              </div>
            </div>

            <div className="form-group floating-label">
              <input
                type="email"
                name="email"
                className={`form-input ${inputValues.email ? 'has-value' : ''}`}
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                id="email"
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className="form-group floating-label">
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`form-input ${inputValues.password ? 'has-value' : ''}`}
                  placeholder=" "
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  id="password"
                />
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {formData.password && (
                <>
                  <div className="password-strength">
                    <div className={`password-strength-bar ${passwordStrength.level >= 1 ? (passwordStrength.text === 'Weak' ? 'weak' : passwordStrength.text === 'Medium' ? 'medium' : 'strong') : ''}`}></div>
                    <div className={`password-strength-bar ${passwordStrength.level >= 2 ? (passwordStrength.text === 'Medium' ? 'medium' : 'strong') : ''}`}></div>
                    <div className={`password-strength-bar ${passwordStrength.level >= 3 ? 'strong' : ''}`}></div>
                    <div className={`password-strength-bar ${passwordStrength.level >= 4 ? 'strong' : ''}`}></div>
                  </div>
                  <p className={`password-strength-text ${passwordStrength.text.toLowerCase()}`}>
                    Password strength: {passwordStrength.text}
                  </p>
                </>
              )}
            </div>

            <div className="form-group floating-label">
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`form-input ${inputValues.confirmPassword ? 'has-value' : ''}`}
                  placeholder=" "
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  id="confirmPassword"
                />
                <label htmlFor="confirmPassword">Confirm Password</label>
              </div>
            </div>

            <label className="terms-checkbox">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                required
              />
              <span>
                I agree to the <a href="/privacy-policy">Privacy Policy</a> and <a href="/terms-of-service">Terms of Service</a>
              </span>
            </label>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="social-login">
            <button type="button" className="social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.18 4.45 1.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button type="button" className="social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <p className="auth-switch">
            Already have an account?
            <Link to="/login">Login</Link>
          </p>
        </div>

        <footer className="auth-footer">
          <p>&copy; 2026 Daily Budget Tracker. All rights reserved.</p>
          <div className="auth-footer-links">
            <a href="/privacy">Privacy Policy</a>
            <span>•</span>
            <a href="/terms">Terms of Service</a>
            <span>•</span>
            <a href="/contact">Contact</a>
          </div>
        </footer>
      </div>

      {showToast && (
        <div className="toast">
          <CheckCircleIcon />
          <span>Account created successfully! Redirecting...</span>
        </div>
      )}
    </div>
  );
};

export default Register;
