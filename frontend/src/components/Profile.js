import React, { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { 
  FiUser, FiPhone, FiMapPin, FiGlobe, FiDollarSign, FiCalendar,
  FiCamera, FiEdit2, FiSave, FiX, FiCheck, FiAlertCircle,
  FiWifi, FiMessageCircle, FiMail, FiHeart, FiShield,
  FiTrendingUp, FiTarget, FiAward
} from 'react-icons/fi';

import { FiUser, FiPhone, FiMapPin, FiGlobe, FiDollarSign, FiCalendar,\n  FiCamera, FiEdit2, FiSave, FiX, FiCheck, FiAlertCircle,\n  FiWifi, FiMessageCircle, FiMail, FiHeart, FiShield,\n  FiTrendingUp, FiTarget, FiAward, FiZap } from 'react-icons/fi';\nimport { \n  FaWhatsapp, FaTelegram, FaFacebook, FaInstagram, FaCcVisa \n} from 'react-icons/fa';\nimport { GiPiggyBank, GiWallet } from 'react-icons/gi';
import './Profile.css';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Money personality badges without emojis
const PERSONALITY_BADGES = {
  'Smart Saver': { color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)' },
  'Budget Hero': { color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
  'Money Mindful': { color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
  'Saver Star': { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' },
  'Frugal Fighter': { color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' },
  'Budget Boss': { color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' }
};

// Get available personality options (excluding None)
const getPersonalityOptions = () => Object.keys(PERSONALITY_BADGES);

// Currency symbols
const CURRENCY_SYMBOLS = {
  'ETB': 'Br',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'KES': 'KSh'
};

// Format currency
const formatCurrency = (amount, currency = 'ETB') => {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${new Intl.NumberFormat('en-US').format(amount || 0)}`;
};

// Animated counter component
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

// Progress ring component
const ProgressRing = ({ progress, size = 80, strokeWidth = 8, color = '#10B981' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
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

// Stat card component
const StatCard = ({ icon, label, value, subValue, color, gradient, prefix = '', suffix = '', showProgress = false, progress = 0 }) => (
  <div className="stat-card" style={{ '--card-color': color, '--card-gradient': gradient }}>
    <div className="stat-card-icon">
      {icon}
    </div>
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
  
  // Get currency from user preferences
  const currency = user?.preferences?.currency || 'ETB';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePhoto: user?.profilePhoto || '',
    address: {
      country: user?.address?.country || '',
    },
    preferences: {
      theme: user?.preferences?.theme || 'system',
      currency: user?.preferences?.currency || 'ETB',
      language: user?.preferences?.language || 'en',
    },
    socialLinks: {
      whatsapp: user?.socialLinks?.whatsapp || '',
      telegram: user?.socialLinks?.telegram || '',
      facebook: user?.socialLinks?.facebook || '',
      instagram: user?.socialLinks?.instagram || '',
    },
    emergencyContact: {
      name: user?.emergencyContact?.name || '',
      phone: user?.emergencyContact?.phone || '',
      relationship: user?.emergencyContact?.relationship || '',
    },
    moneyPersonality: user?.moneyPersonality || 'Smart Saver',
    financialStats: {
      monthlyBudget: user?.financialStats?.monthlyBudget || 15000,
      savingsStreak: user?.financialStats?.savingsStreak || 7,
      financialGoal: user?.financialStats?.financialGoal || 100000,
      goalProgress: user?.financialStats?.goalProgress || 35,
    },
    lifestylePreferences: {
      food: user?.lifestylePreferences?.food ?? true,
      transport: user?.lifestylePreferences?.transport ?? true,
      rent: user?.lifestylePreferences?.rent ?? false,
      education: user?.lifestylePreferences?.education ?? false,
      entertainment: user?.lifestylePreferences?.entertainment ?? true,
    },
    moneyStory: user?.moneyStory || '',
  });

  // Sample today's spending (in real app, fetch from API)
  const todaySpending = 1250;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/auth/me');
      const userData = res.data;
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        profilePhoto: userData.profilePhoto || '',
        address: {
          country: userData.address?.country || '',
        },
        preferences: {
          theme: userData.preferences?.theme || 'system',
          currency: userData.preferences?.currency || 'ETB',
          language: userData.preferences?.language || 'en',
        },
        socialLinks: {
          whatsapp: userData.socialLinks?.whatsapp || '',
          telegram: userData.socialLinks?.telegram || '',
          facebook: userData.socialLinks?.facebook || '',
          instagram: userData.socialLinks?.instagram || '',
        },
        emergencyContact: {
          name: userData.emergencyContact?.name || '',
          phone: userData.emergencyContact?.phone || '',
          relationship: userData.emergencyContact?.relationship || '',
        },
        moneyPersonality: userData.moneyPersonality || 'Smart Saver',
        financialStats: {
          monthlyBudget: userData.financialStats?.monthlyBudget || 15000,
          savingsStreak: userData.financialStats?.savingsStreak || 7,
          financialGoal: userData.financialStats?.financialGoal || 100000,
          goalProgress: userData.financialStats?.goalProgress || 35,
        },
        lifestylePreferences: {
          food: userData.lifestylePreferences?.food ?? true,
          transport: userData.lifestylePreferences?.transport ?? true,
          rent: userData.lifestylePreferences?.rent ?? false,
          education: userData.lifestylePreferences?.education ?? false,
          entertainment: userData.lifestylePreferences?.entertainment ?? true,
        },
        moneyStory: userData.moneyStory || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('Failed to load profile', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [field]: value },
      });
    } else if (name.startsWith('preferences.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        preferences: { ...formData.preferences, [field]: value },
      });
    } else if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        socialLinks: { ...formData.socialLinks, [field]: value },
      });
    } else if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: { ...formData.emergencyContact, [field]: value },
      });
    } else if (name.startsWith('financialStats.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        financialStats: { ...formData.financialStats, [field]: Number(value) },
      });
    } else if (name.startsWith('lifestylePreferences.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        lifestylePreferences: { ...formData.lifestylePreferences, [field]: checked },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send all form data to backend
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        profilePhoto: formData.profilePhoto,
        address: formData.address,
        preferences: formData.preferences,
        socialLinks: formData.socialLinks,
        emergencyContact: formData.emergencyContact,
        financialStats: formData.financialStats,
        lifestylePreferences: formData.lifestylePreferences,
        moneyPersonality: formData.moneyPersonality,
        moneyStory: formData.moneyStory,
      };
      
      const res = await API.put('/auth/profile', updateData);
      
      // Update the AuthContext with the new user data
      if (res.data && setUser) {
        setUser(res.data);
      }
      
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.msg || error.response?.data?.message || 'Failed to update profile';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (pref, value) => {
    const newPreferences = { ...formData.preferences, [pref]: value };
    setFormData({ ...formData, preferences: newPreferences });
    
    try {
      await API.put('/auth/profile', { preferences: newPreferences });
      showToast('Preferences saved!', 'success');
      
      if (pref === 'theme') {
        if (value === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else if (value === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast('Failed to save preferences', 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPersonalityBadge = () => {
    const personality = PERSONALITY_BADGES[formData.moneyPersonality];
    if (personality) {
      return personality;
    }
    // Default for 'None' or any other case
    return { color: '#6B7280', gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)' };
  };

  const personality = getPersonalityBadge();

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Hero Header */}
        <div className="profile-hero">
          <div className="hero-background">
            <div className="hero-gradient"></div>
            <div className="hero-pattern"></div>
          </div>
          
          <div className="hero-content">
            <div className="hero-avatar-section">
              <div className="hero-avatar">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" />
                ) : (
                  <span>{getInitials(formData.name)}</span>
                )}
              </div>
              {isEditing && (
                <button 
                  className="avatar-edit-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiCamera />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="hero-info">
              <h1 className="hero-name">{formData.name || 'Your Name'}</h1>
              <p className="hero-email">{formData.email}</p>
              
              {/* Money Personality Badge */}
              <div className="personality-badge" style={{ background: personality.gradient }}>
                <span className="badge-text">{formData.moneyPersonality}</span>
              </div>
            </div>
            
            <div className="hero-actions">
              {!isEditing ? (
                <button 
                  className="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FiEdit2 /> Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => { setIsEditing(false); fetchUserProfile(); }}
                  >
                    <FiX /> Cancel
                  </button>
                  <button 
                    className="save-btn"
                    onClick={handleProfileSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : <><FiSave /> Save</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Stats Cards */}
        <div className="stats-section">
          <StatCard 
            icon={<FiDollarSign />}
            label="Monthly Budget"
            value={formData.financialStats.monthlyBudget}
            currency={formData.preferences.currency}
            color="#10B981"
            gradient="linear-gradient(135deg, #10B981 0%, #34D399 100%)"
          />
          <StatCard 
icon={<FiZap />}
            label="Today's Spending"
            value={todaySpending}
            currency={formData.preferences.currency}
            subValue="of remaining budget"
            color="#F59E0B"
            gradient="linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
          />
          <StatCard 
            icon={<GiPiggyBank />}
            label="Savings Streak"
            value={formData.financialStats.savingsStreak}
            suffix=" days"
            color="#8B5CF6"
            gradient="linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)"
          />
          <StatCard 
            icon={<FiTarget />}
            label="Financial Goal"
            value={formData.financialStats.financialGoal}
            currency={formData.preferences.currency}
            color="#3B82F6"
            gradient="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
            showProgress={true}
            progress={formData.financialStats.goalProgress}
          />
        </div>

        {/* Main Content Grid */}
        <div className="profile-content-grid">
          {/* Personal Info Card */}
          <div className="profile-card glass-card">
            <div className="card-header">
              <FiUser className="card-icon" />
              <h3>Personal Info</h3>
            </div>
            <div className="card-content">
              <div className="info-item">
                <span className="info-label">Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="info-input"
                  />
                ) : (
                  <span className="info-value">{formData.name || 'Not set'}</span>
                )}
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="info-input"
                  />
                ) : (
                  <span className="info-value">{formData.phone || 'Not set'}</span>
                )}
              </div>
              <div className="info-item">
                <span className="info-label">Country</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    placeholder="Your country"
                    className="info-input"
                  />
                ) : (
                  <span className="info-value">{formData.address.country || 'Not set'}</span>
                )}
              </div>
              <div className="info-item">
                <span className="info-label">Currency</span>
                {isEditing ? (
                  <select
                    name="preferences.currency"
                    value={formData.preferences.currency}
                    onChange={handleInputChange}
                    className="info-select"
                  >
                    <option value="ETB">ETB - Ethiopian Birr</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                  </select>
                ) : (
                  <span className="info-value">{formData.preferences.currency} ({CURRENCY_SYMBOLS[formData.preferences.currency]})</span>
                )}
              </div>
            </div>
          </div>

          {/* Lifestyle Preferences Card */}
          <div className="profile-card glass-card">
            <div className="card-header">
              <FiHeart className="card-icon" />
              <h3>Lifestyle Preferences</h3>
            </div>
            <div className="card-content">
              <div className="lifestyle-grid">
                <label className={`lifestyle-item ${formData.lifestylePreferences.food ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="lifestylePreferences.food"
                    checked={formData.lifestylePreferences.food}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <span className="lifestyle-label">Food</span>
                </label>
                <label className={`lifestyle-item ${formData.lifestylePreferences.transport ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="lifestylePreferences.transport"
                    checked={formData.lifestylePreferences.transport}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <span className="lifestyle-label">Transport</span>
                </label>
                <label className={`lifestyle-item ${formData.lifestylePreferences.rent ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="lifestylePreferences.rent"
                    checked={formData.lifestylePreferences.rent}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <span className="lifestyle-label">Rent</span>
                </label>
                <label className={`lifestyle-item ${formData.lifestylePreferences.education ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="lifestylePreferences.education"
                    checked={formData.lifestylePreferences.education}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <span className="lifestyle-label">Education</span>
                </label>
                <label className={`lifestyle-item ${formData.lifestylePreferences.entertainment ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="lifestylePreferences.entertainment"
                    checked={formData.lifestylePreferences.entertainment}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <span className="lifestyle-label">Entertainment</span>
                </label>
              </div>
            </div>
          </div>

          {/* Connect & Backup Card */}
          <div className="profile-card glass-card">
            <div className="card-header">
              <FiWifi className="card-icon" />
              <h3>Connect and Backup</h3>
            </div>
            <div className="card-content">
              <div className="social-grid">
                <div className={`social-item ${formData.socialLinks.whatsapp ? 'connected' : ''}`}>
                  <div className="social-icon whatsapp">
                    <FaWhatsapp />
                  </div>
                  <div className="social-info">
                    <span className="social-name">WhatsApp</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="socialLinks.whatsapp"
                        value={formData.socialLinks.whatsapp}
                        onChange={handleInputChange}
                        placeholder="Phone number"
                        className="social-input"
                      />
                    ) : (
                      <span className="social-status">{formData.socialLinks.whatsapp ? 'Connected' : 'Not connected'}</span>
                    )}
                  </div>
                </div>
                
                <div className={`social-item ${formData.socialLinks.telegram ? 'connected' : ''}`}>
                  <div className="social-icon telegram">
                    <FaTelegram />
                  </div>
                  <div className="social-info">
                    <span className="social-name">Telegram</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="socialLinks.telegram"
                        value={formData.socialLinks.telegram}
                        onChange={handleInputChange}
                        placeholder="Username"
                        className="social-input"
                      />
                    ) : (
                      <span className="social-status">{formData.socialLinks.telegram ? 'Connected' : 'Not connected'}</span>
                    )}
                  </div>
                </div>
                
                <div className={`social-item ${formData.socialLinks.facebook ? 'connected' : ''}`}>
                  <div className="social-icon facebook">
                    <FaFacebook />
                  </div>
                  <div className="social-info">
                    <span className="social-name">Facebook</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="socialLinks.facebook"
                        value={formData.socialLinks.facebook}
                        onChange={handleInputChange}
                        placeholder="Profile link"
                        className="social-input"
                      />
                    ) : (
                      <span className="social-status">{formData.socialLinks.facebook ? 'Connected' : 'Not connected'}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              <div className="emergency-section">
                <div className="emergency-header">
                  <FiShield className="emergency-icon" />
                  <span>Emergency Contact</span>
                </div>
                {isEditing ? (
                  <div className="emergency-inputs">
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleInputChange}
                      placeholder="Contact name"
                      className="emergency-input"
                    />
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleInputChange}
                      placeholder="Phone number"
                      className="emergency-input"
                    />
                    <input
                      type="text"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleInputChange}
                      placeholder="Relationship (e.g., Mom, Dad)"
                      className="emergency-input"
                    />
                  </div>
                ) : (
                  <div className="emergency-display">
                    {formData.emergencyContact.name ? (
                      <>
                        <span className="emergency-name">{formData.emergencyContact.name}</span>
                        <span className="emergency-phone">{formData.emergencyContact.phone}</span>
                        <span className="emergency-rel">{formData.emergencyContact.relationship}</span>
                      </>
                    ) : (
                      <span className="emergency-notset">Not configured</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Money Story Card */}
          <div className="profile-card glass-card full-width">
            <div className="card-header">
              <FiAward className="card-icon" />
              <h3>My Money Story</h3>
            </div>
            <div className="card-content">
              {isEditing ? (
                <textarea
                  name="moneyStory"
                  value={formData.moneyStory}
                  onChange={handleInputChange}
                  placeholder="Share your financial journey... What motivated you to start budgeting? What are your money goals? What lessons have you learned?"
                  className="money-story-input"
                  rows={5}
                />
              ) : (
                <div className="money-story-display">
                  {formData.moneyStory ? (
                    <p>{formData.moneyStory}</p>
                  ) : (
                    <p className="story-placeholder">
                      Share your financial journey! Tell us what motivated you to start budgeting, 
                      your money goals, and the lessons you've learned along the way.
                      <br /><br />
                      <em>Your story can inspire others!</em>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Money Personality Selection (Edit Mode) */}
          {isEditing && (
            <div className="profile-card glass-card full-width">
              <div className="card-header">
                <FiAward className="card-icon" />
                <h3>Choose Your Money Personality</h3>
              </div>
              <div className="card-content">
                <div className="personality-grid">
                  {Object.entries(PERSONALITY_BADGES).map(([name, data]) => (
                    <label 
                      key={name} 
                      className={`personality-option ${formData.moneyPersonality === name ? 'selected' : ''}`}
                      style={{ '--personality-color': data.color }}
                    >
                      <input
                        type="radio"
                        name="moneyPersonality"
                        value={name}
                        checked={formData.moneyPersonality === name}
                        onChange={handleInputChange}
                      />
                      <span className="personality-name">{name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Financial Stats Edit (Edit Mode) */}
          {isEditing && (
            <div className="profile-card glass-card full-width">
              <div className="card-header">
                <FiTrendingUp className="card-icon" />
                <h3>Financial Goals</h3>
              </div>
              <div className="card-content">
                <div className="stats-edit-grid">
                  <div className="stat-edit-item">
                    <label>Monthly Budget</label>
                    <input
                      type="number"
                      name="financialStats.monthlyBudget"
                      value={formData.financialStats.monthlyBudget}
                      onChange={handleInputChange}
                      className="stat-input"
                    />
                  </div>
                  <div className="stat-edit-item">
                    <label>Financial Goal</label>
                    <input
                      type="number"
                      name="financialStats.financialGoal"
                      value={formData.financialStats.financialGoal}
                      onChange={handleInputChange}
                      className="stat-input"
                    />
                  </div>
                  <div className="stat-edit-item">
                    <label>Goal Progress (%)</label>
                    <input
                      type="number"
                      name="financialStats.goalProgress"
                      value={formData.financialStats.goalProgress}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="stat-input"
                    />
                  </div>
                  <div className="stat-edit-item">
                    <label>Savings Streak (days)</label>
                    <input
                      type="number"
                      name="financialStats.savingsStreak"
                      value={formData.financialStats.savingsStreak}
                      onChange={handleInputChange}
                      className="stat-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`profile-toast ${toast.type}`}>
          {toast.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
