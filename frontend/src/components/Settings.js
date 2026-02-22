import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { 
  FiUser, FiLock, FiBell, FiGlobe, FiMoon, FiSun, FiCheck, 
  FiAlertCircle, FiSave, FiX, FiTrash2, FiDownload, FiMail,
  FiSmartphone, FiKey, FiShield, FiEye, FiEyeOff
} from 'react-icons/fi';
import './Settings.css';

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

const Settings = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('account');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    theme: user?.preferences?.theme || 'light',
    currency: user?.preferences?.currency || 'ETB',
    language: user?.preferences?.language || 'en',
    dateFormat: user?.preferences?.dateFormat || 'MM/DD/YYYY',
  });

  const [notifications, setNotifications] = useState({
    email: {
      transactionAlerts: true,
      weeklyReport: true,
      budgetAlerts: true,
      promotions: false,
    },
    push: {
      transactionAlerts: true,
      budgetAlerts: true,
      reminders: true,
    },
    sms: {
      transactionAlerts: false,
      budgetAlerts: false,
    },
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showBalance: true,
    showTransactions: true,
    dataExport: false,
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await API.get('/auth/me');
      const userData = res.data;
      setProfileData({
        name: userData.name || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
      });
      setPreferences({
        theme: userData.preferences?.theme || 'light',
        currency: userData.preferences?.currency || 'ETB',
        language: userData.preferences?.language || 'en',
        dateFormat: userData.preferences?.dateFormat || 'MM/DD/YYYY',
      });
      setNotifications({
        email: userData.preferences?.notifications?.email || {
          transactionAlerts: true,
          weeklyReport: true,
          budgetAlerts: true,
          promotions: false,
        },
        push: userData.preferences?.notifications?.push || {
          transactionAlerts: true,
          budgetAlerts: true,
          reminders: true,
        },
        sms: userData.preferences?.notifications?.sms || {
          transactionAlerts: false,
          budgetAlerts: false,
        },
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/auth/profile', profileData);
      setUser(res.data);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await API.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    try {
      await API.put('/auth/profile', { preferences: newPreferences });
      showToast('Preferences saved!', 'success');
      if (key === 'theme') {
        if (value === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else if (value === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    } catch (error) {
      showToast('Failed to save preferences', 'error');
    }
  };

  const handleNotificationChange = async (channel, key, value) => {
    const newNotifications = {
      ...notifications,
      [channel]: { ...notifications[channel], [key]: value },
    };
    setNotifications(newNotifications);
    try {
      await API.put('/auth/profile', { 
        preferences: { ...preferences, notifications: newNotifications } 
      });
      showToast('Notification settings updated!', 'success');
    } catch (error) {
      showToast('Failed to update notifications', 'error');
    }
  };

  const handlePrivacyChange = async (key, value) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);
    showToast('Privacy settings updated!', 'success');
  };

  const handleExportData = () => {
    showToast('Preparing data export...', 'success');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      showToast('Account deletion initiated. Please contact support.', 'error');
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="settings-section">
            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiUser /> Profile Information
              </h3>
              <p className="settings-card-description">Update your personal information</p>
              <form onSubmit={handleProfileUpdate} className="settings-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>
                <button type="submit" className="save-btn" disabled={loading}>
                  <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiLock /> Change Password
              </h3>
              <p className="settings-card-description">Update your password regularly for security</p>
              <form onSubmit={handlePasswordChange} className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button type="submit" className="save-btn" disabled={loading}>
                  <FiKey /> {loading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="settings-section">
            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiGlobe /> Appearance
              </h3>
              <p className="settings-card-description">Customize how the app looks</p>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Theme</label>
                  <p>Choose your preferred color scheme</p>
                </div>
                <div className="theme-buttons">
                  <button
                    className={`theme-btn ${preferences.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handlePreferenceChange('theme', 'light')}
                  >
                    <FiSun /> Light
                  </button>
                  <button
                    className={`theme-btn ${preferences.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handlePreferenceChange('theme', 'dark')}
                  >
                    <FiMoon /> Dark
                  </button>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Currency</label>
                  <p>Select your default currency</p>
                </div>
                <select
                  value={preferences.currency}
                  onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                  className="settings-select"
                >
                  <option value="ETB">ETB - Ethiopian Birr</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                </select>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Language</label>
                  <p>Select your preferred language</p>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className="settings-select"
                >
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Date Format</label>
                  <p>Choose how dates are displayed</p>
                </div>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                  className="settings-select"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiMail /> Email Notifications
              </h3>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Transaction Alerts</label>
                  <p>Get notified for each transaction</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.email.transactionAlerts}
                    onChange={(e) => handleNotificationChange('email', 'transactionAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Weekly Report</label>
                  <p>Receive weekly financial summaries</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.email.weeklyReport}
                    onChange={(e) => handleNotificationChange('email', 'weeklyReport', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Budget Alerts</label>
                  <p>Get alerts when approaching budget limits</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.email.budgetAlerts}
                    onChange={(e) => handleNotificationChange('email', 'budgetAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Promotions</label>
                  <p>Receive promotional emails</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.email.promotions}
                    onChange={(e) => handleNotificationChange('email', 'promotions', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiSmartphone /> Push Notifications
              </h3>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Transaction Alerts</label>
                  <p>Get push notifications for transactions</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.push.transactionAlerts}
                    onChange={(e) => handleNotificationChange('push', 'transactionAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Budget Alerts</label>
                  <p>Get push notifications for budget alerts</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.push.budgetAlerts}
                    onChange={(e) => handleNotificationChange('push', 'budgetAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Reminders</label>
                  <p>Get reminders for scheduled tasks</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.push.reminders}
                    onChange={(e) => handleNotificationChange('push', 'reminders', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiKey /> SMS Notifications
              </h3>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Transaction Alerts</label>
                  <p>Receive SMS for each transaction</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.sms.transactionAlerts}
                    onChange={(e) => handleNotificationChange('sms', 'transactionAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Budget Alerts</label>
                  <p>Receive SMS for budget alerts</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={notifications.sms.budgetAlerts}
                    onChange={(e) => handleNotificationChange('sms', 'budgetAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="settings-section">
            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiShield /> Privacy Settings
              </h3>
              <p className="settings-card-description">Control your privacy and data visibility</p>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Profile Visibility</label>
                  <p>Who can see your profile</p>
                </div>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className="settings-select"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Show Balance</label>
                  <p>Allow others to see your balance</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={privacy.showBalance}
                    onChange={(e) => handlePrivacyChange('showBalance', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Show Transactions</label>
                  <p>Allow others to view your transactions</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={privacy.showTransactions}
                    onChange={(e) => handlePrivacyChange('showTransactions', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-card">
              <h3 className="settings-card-title">
                <FiDownload /> Data Management
              </h3>
              <p className="settings-card-description">Export or delete your data</p>
              <div className="settings-item">
                <div className="settings-item-info">
                  <label>Export Data</label>
                  <p>Download all your data in JSON format</p>
                </div>
                <button className="action-btn-small" onClick={handleExportData}>
                  <FiDownload /> Export
                </button>
              </div>
              <div className="settings-item danger">
                <div className="settings-item-info">
                  <label>Delete Account</label>
                  <p>Permanently delete your account and all data</p>
                </div>
                <button className="action-btn-small danger" onClick={handleDeleteAccount}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and settings</p>
        </div>

        <div className="settings-layout">
          <nav className="settings-nav">
            <button
              className={`settings-nav-item ${activeSection === 'account' ? 'active' : ''}`}
              onClick={() => setActiveSection('account')}
            >
              <FiUser /> Account
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveSection('preferences')}
            >
              <FiGlobe /> Preferences
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <FiBell /> Notifications
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveSection('privacy')}
            >
              <FiShield /> Privacy
            </button>
          </nav>

          <div className="settings-content">
            {renderSection()}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          {toast.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Settings;
