import React, { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiCamera, 
  FiEdit2, FiSave, FiX, FiLock, FiBell, FiGlobe, FiMoon,
  FiSun, FiCheck, FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';
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

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    profilePhoto: user?.profilePhoto || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
    },
    preferences: {
      theme: user?.preferences?.theme || 'system',
      currency: user?.preferences?.currency || 'ETB',
      language: user?.preferences?.language || 'en',
      notifications: {
        email: user?.preferences?.notifications?.email ?? true,
        push: user?.preferences?.notifications?.push ?? true,
        sms: user?.preferences?.notifications?.sms ?? false,
      },
    },
    socialLinks: {
      twitter: user?.socialLinks?.twitter || '',
      linkedin: user?.socialLinks?.linkedin || '',
      github: user?.socialLinks?.github || '',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
        bio: userData.bio || '',
        profilePhoto: userData.profilePhoto || '',
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
        address: {
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          zipCode: userData.address?.zipCode || '',
          country: userData.address?.country || '',
        },
        preferences: {
          theme: userData.preferences?.theme || 'system',
          currency: userData.preferences?.currency || 'ETB',
          language: userData.preferences?.language || 'en',
          notifications: {
            email: userData.preferences?.notifications?.email ?? true,
            push: userData.preferences?.notifications?.push ?? true,
            sms: userData.preferences?.notifications?.sms ?? false,
          },
        },
        socialLinks: {
          twitter: userData.socialLinks?.twitter || '',
          linkedin: userData.socialLinks?.linkedin || '',
          github: userData.socialLinks?.github || '',
        },
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
      if (field === 'notifications') {
        const notifField = e.target.dataset.notif;
        setFormData({
          ...formData,
          preferences: {
            ...formData.preferences,
            notifications: { ...formData.preferences.notifications, [notifField]: checked },
          },
        });
      } else {
        setFormData({
          ...formData,
          preferences: { ...formData.preferences, [field]: value },
        });
      }
    } else if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        socialLinks: { ...formData.socialLinks, [field]: value },
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
      const res = await API.put('/auth/profile', formData);
      setUser(res.data);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(error.response?.data?.msg || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
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
      console.error('Error changing password:', error);
      showToast(error.response?.data?.msg || 'Failed to change password', 'error');
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
      
      // Apply theme change
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

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-cover">
            <div className="profile-cover-gradient"></div>
          </div>
          <div className="profile-header-content">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" />
                ) : (
                  <span>{getInitials(formData.name)}</span>
                )}
              </div>
              {isEditing && (
                <button 
                  className="profile-avatar-edit"
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
            <div className="profile-header-info">
              <h1>{formData.name || 'User'}</h1>
              <p className="profile-email">{formData.email}</p>
              <p className="profile-joined">
                <FiCalendar /> Member since {formatDate(user?.createdAt)}
              </p>
            </div>
            <div className="profile-header-actions">
              {!isEditing ? (
                <button 
                  className="profile-edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FiEdit2 /> Edit Profile
                </button>
              ) : (
                <div className="profile-edit-actions">
                  <button 
                    className="profile-cancel-btn"
                    onClick={() => { setIsEditing(false); fetchUserProfile(); }}
                  >
                    <FiX /> Cancel
                  </button>
                  <button 
                    className="profile-save-btn"
                    onClick={handleProfileSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile
          </button>
          <button 
            className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock /> Security
          </button>
          <button 
            className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <FiBell /> Preferences
          </button>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-card">
                <h3 className="profile-card-title">Personal Information</h3>
                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label><FiUser /> Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label><FiMail /> Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="disabled-input"
                    />
                    <span className="input-hint">Email cannot be changed</span>
                  </div>
                  <div className="profile-form-group">
                    <label><FiPhone /> Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label><FiCalendar /> Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="profile-form-group full-width">
                    <label><FiUser /> Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <h3 className="profile-card-title">Address</h3>
                <div className="profile-form-grid">
                  <div className="profile-form-group full-width">
                    <label><FiMapPin /> Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label><FiMapPin /> City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="City"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label><FiMapPin /> State/Province</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="State"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label><FiMapPin /> ZIP/Postal Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="ZIP Code"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label><FiMapPin /> Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <h3 className="profile-card-title">Social Links</h3>
                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label>Twitter</label>
                    <input
                      type="text"
                      name="socialLinks.twitter"
                      value={formData.socialLinks.twitter}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="@username"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>LinkedIn</label>
                    <input
                      type="text"
                      name="socialLinks.linkedin"
                      value={formData.socialLinks.linkedin}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="LinkedIn profile"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>GitHub</label>
                    <input
                      type="text"
                      name="socialLinks.github"
                      value={formData.socialLinks.github}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="GitHub username"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="profile-section">
              <div className="profile-card">
                <h3 className="profile-card-title">
                  <FiLock /> Change Password
                </h3>
                <p className="profile-card-description">
                  Update your password to keep your account secure
                </p>
                <form onSubmit={handlePasswordSubmit} className="password-form">
                  <div className="profile-form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <button type="submit" className="password-submit-btn" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              <div className="profile-card security-info">
                <h3 className="profile-card-title">Security Tips</h3>
                <ul className="security-tips">
                  <li>
                    <FiCheck /> Use a strong, unique password
                  </li>
                  <li>
                    <FiCheck /> Change your password regularly
                  </li>
                  <li>
                    <FiCheck /> Don't share your password with anyone
                  </li>
                  <li>
                    <FiCheck /> Enable two-factor authentication (coming soon)
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="profile-section">
              <div className="profile-card">
                <h3 className="profile-card-title">
                  <FiGlobe /> Appearance
                </h3>
                <div className="preference-item">
                  <div className="preference-info">
                    <label>Theme</label>
                    <p>Choose your preferred color theme</p>
                  </div>
                  <div className="theme-selector">
                    <button
                      className={`theme-option ${formData.preferences.theme === 'light' ? 'active' : ''}`}
                      onClick={() => handlePreferenceChange('theme', 'light')}
                    >
                      <FiSun /> Light
                    </button>
                    <button
                      className={`theme-option ${formData.preferences.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handlePreferenceChange('theme', 'dark')}
                    >
                      <FiMoon /> Dark
                    </button>
                    <button
                      className={`theme-option ${formData.preferences.theme === 'system' ? 'active' : ''}`}
                      onClick={() => handlePreferenceChange('theme', 'system')}
                    >
                      <FiGlobe /> System
                    </button>
                  </div>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <label>Currency</label>
                    <p>Select your preferred currency</p>
                  </div>
                  <select
                    value={formData.preferences.currency}
                    onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                    className="preference-select"
                  >
                    <option value="ETB">ETB - Ethiopian Birr</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                  </select>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <label>Language</label>
                    <p>Select your preferred language</p>
                  </div>
                  <select
                    value={formData.preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="preference-select"
                  >
                    <option value="en">English</option>
                    <option value="am">Amharic</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>

              <div className="profile-card">
                <h3 className="profile-card-title">
                  <FiBell /> Notifications
                </h3>
                <div className="preference-item">
                  <div className="preference-info">
                    <label>Email Notifications</label>
                    <p>Receive updates via email</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notifications.email}
                      data-notif="email"
                      onChange={(e) => {
                        const newNotifs = { ...formData.preferences.notifications, email: e.target.checked };
                        handlePreferenceChange('notifications', newNotifs);
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <label>Push Notifications</label>
                    <p>Receive push notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notifications.push}
                      data-notif="push"
                      onChange={(e) => {
                        const newNotifs = { ...formData.preferences.notifications, push: e.target.checked };
                        handlePreferenceChange('notifications', newNotifs);
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <label>SMS Notifications</label>
                    <p>Receive updates via SMS</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notifications.sms}
                      data-notif="sms"
                      onChange={(e) => {
                        const newNotifs = { ...formData.preferences.notifications, sms: e.target.checked };
                        handlePreferenceChange('notifications', newNotifs);
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="profile-card account-stats">
                <h3 className="profile-card-title">
                  <FiTrendingUp /> Account Statistics
                </h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Member Since</span>
                    <span className="stat-value">{formatDate(user?.createdAt)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Updated</span>
                    <span className="stat-value">{formatDate(user?.updatedAt)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Profile Completion</span>
                    <span className="stat-value">
                      {Math.round(
                        ((formData.name ? 10 : 0) +
                        (formData.phone ? 10 : 0) +
                        (formData.bio ? 10 : 0) +
                        (formData.address?.city ? 10 : 0) +
                        (formData.dateOfBirth ? 10 : 0) +
                        (formData.profilePhoto ? 10 : 0) +
                        (formData.socialLinks?.twitter || formData.socialLinks?.linkedin ? 10 : 0)) / 70 * 100
                      )}%
                    </span>
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
