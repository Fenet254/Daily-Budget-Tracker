import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { 
  FiGrid, 
  FiList, 
  FiPieChart, 
  FiBarChart, 
  FiBell, 
  FiUser, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiTrendingUp,
  FiMessageCircle
} from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

const navLinks = [
    { path: '/', label: 'Dashboard', icon: <FiGrid /> },
    { path: '/transactions', label: 'Transactions', icon: <FiList /> },
    { path: '/budgets', label: 'Budgets', icon: <FiPieChart /> },
    { path: '/reports', label: 'Reports', icon: <FiBarChart /> },
    { path: '/sms-import', label: 'SMS Import', icon: <FiMessageCircle /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Left Section - Logo */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">
              <FiTrendingUp />
            </div>
            <span className="brand-name">Daily Budget Tracker</span>
          </Link>
        </div>

        {/* Center Section - Desktop Navigation */}
        <div className="navbar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'nav-link-active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Section - Notifications & User */}
        <div className="navbar-actions">
          {/* Notification Bell */}
          <button className="notification-btn">
            <FiBell />
            <span className="notification-badge">3</span>
          </button>

          {/* User Avatar Dropdown */}
          <div className="user-dropdown" ref={dropdownRef}>
            <button 
              className="user-avatar-btn"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              <div className="user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="user-name">{user?.name || 'User'}</span>
            </button>
            
            {isUserDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="dropdown-user-details">
                      <span className="dropdown-user-name">{user?.name || 'User'}</span>
                      <span className="dropdown-user-email">{user?.email || 'user@example.com'}</span>
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item">
                  <FiUser />
                  <span>Profile</span>
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <FiSettings />
                  <span>Settings</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item dropdown-item-logout">
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
        <div className="mobile-nav-content">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav-link ${isActive(link.path) ? 'mobile-nav-link-active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mobile-nav-icon">{link.icon}</span>
              <span className="mobile-nav-label">{link.label}</span>
            </Link>
          ))}
          <div className="mobile-nav-divider"></div>
          <Link 
            to="/profile" 
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiUser />
            <span>Profile</span>
          </Link>
          <Link 
            to="/settings" 
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiSettings />
            <span>Settings</span>
          </Link>
          <button onClick={handleLogout} className="mobile-nav-link mobile-nav-link-logout">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
