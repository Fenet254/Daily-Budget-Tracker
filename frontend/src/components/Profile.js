import React, { useState, useContext, useRef, useEffect } from 'react';
import API from '../api';
import { AuthContext } from '../AuthContext';
import { FiUser, FiPhone, FiMapPin, FiGlobe, FiDollarSign, FiCalendar, FiCamera, FiEdit2, FiSave, FiX, FiCheck, FiAlertCircle, FiWifi, FiMessageCircle, FiMail, FiHeart, FiShield, FiTrendingUp, FiTarget, FiAward } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaFacebook, FaInstagram, FaCcVisa } from 'react-icons/fa';
import { FiZap } from 'react-icons/fi';
import { GiPiggyBank, GiWallet } from 'react-icons/gi';
import './Profile.css';

// Money personality badges
const PERSONALITY_BADGES = {
  'Smart Saver': { color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)' },
  'Budget Hero': { color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
  'Money Mindful': { color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
  'Saver Star': { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' },
  'Frugal Fighter': { color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' },
  'Budget Boss': { color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' }
};

const getPersonalityOptions = () => Object.keys(PERSONALITY_BADGES);

const CURRENCY_SYMBOLS = {
  'ETB': 'Br',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'KES': 'KSh'
};

const formatCurrency = (amount, currency = 'ETB') => {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${new Intl.NumberFormat('en-US').format(amount || 0)}`;
};

const AnimatedCounter = ({ value, currency = 'ETB', prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
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

  return <span>{prefix}{formatCurrency(displayValue, currency)}{suffix}</span>;
};

const ProgressRing = ({ progress, size = 80, strokeWidth = 8, color = '#10B981' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress / 100 * circumference;

  return (
    <div className="progress-ring-container">
      <svg width={size} height={size} className="progress-ring">
        <circle
          className="progress-ring-bg"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-progress"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="progress-ring-text">
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color, gradient, prefix = '', suffix = '', showProgress = false, progress = 0 }) => (
  <div className="stat-card" style={{ '--card-color': color, '--card-gradient': gradient }}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-content">
      <span className="stat-card-label">{label}</span>
      <div className="stat-card-value">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
      {subValue && <span className="stat-card-sub">{subValue}</span>}
    </div>
    {showProgress && (
      <div className="stat-card-progress">
        <ProgressRing progress={progress} color={color} />
      </div>
    )}
  </div>
);

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const currency = user?.preferences?.currency || 'ETB';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePhoto: user?.profilePhoto || '',
    address: { country: user?.address?.country || '' },
    preferences: {
      theme: user?.preferences?.theme || 'system',
      currency: user?.preferences?.currency || 'ETB',
      language: user?.preferences?.language || 'en'
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await API.put('/users/profile', formData);
      setUser(res.data);
      setIsEditing(false);
      setToast({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to update profile' });
    }
    setLoading(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle photo upload logic
    }
  };

  if (!user) return <div className="profile-empty">Please log in to view your profile</div>;

  return (
    <div className="profile-container">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <img src={formData.profilePhoto || '/default-avatar.png'} alt="Profile" />
            <button className="avatar-edit" onClick={() => fileInputRef.current?.click()}>
              <FiCamera />
            </button>
            <input ref={fileInputRef} type="file" onChange={handlePhotoUpload} accept="image/*" hidden />
          </div>
          <div className="profile-info">
            <h1>{formData.name || 'User'}</h1>
            <div className="profile-badges">
              {user.personality && (
                <span className="personality-badge" style={{ 
                  background: PERSONALITY_BADGES[user.personality]?.gradient || '#64748B'
                }}>
                  {user.personality}
                </span>
              )}
              {user.isVerified && <span className="verified-badge">Verified</span>}
            </div>
          </div>
        </div>
        <button className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="edit-form">
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Country</label>
            <input name="address.country" value={formData.address.country} onChange={handleInputChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Currency</label>
              <select name="preferences.currency" value={formData.preferences.currency} onChange={handleInputChange}>
                <option value="ETB">Br (ETB)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Theme</label>
              <select name="preferences.theme" value={formData.preferences.theme} onChange={handleInputChange}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<FiDollarSign />}
          label="Monthly Income"
          value={user.financialStats?.monthlyIncome || 0}
          currency={currency}
          color="#10B981"
        />
        <StatCard
          icon={<GiPiggyBank />}
          label="Total Savings"
          value={user.financialStats?.totalSavings || 0}
          currency={currency}
          color="#3B82F6"
          showProgress={true}
          progress={user.savingsProgress || 75}
        />
        <StatCard
          icon={<GiWallet />}
          label="Current Balance"
          value={user.financialStats?.currentBalance || 0}
          currency={currency}
          color="#F59E0B"
        />
        <StatCard
          icon={<FiTrendingUp />}
          label="Avg Savings Rate"
          value={user.financialStats?.savingsRate || 0}
          suffix="%"
          color="#8B5CF6"
          progress={65}
        />
      </div>

      {/* Personality Test CTA */}
      {(!user.personality || user.personality === 'None') && (
        <div className="personality-cta">
          <FiZap className="cta-icon" />
          <h3>Discover Your Money Personality!</h3>
          <p>Take our 2-minute quiz to unlock personalized insights and badges</p>
          <button className="btn btn-primary">Start Quiz</button>
        </div>
      )}
    </div>
  );
};

export default Profile;

