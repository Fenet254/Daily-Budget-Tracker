import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import './App.css';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Reports = React.lazy(() => import('./components/Reports'));
const Transactions = React.lazy(() => import('./components/Transactions'));
const Budgets = React.lazy(() => import('./components/Budgets'));
const SMSImport = React.lazy(() => import('./components/SMSImport'));
const Settings = React.lazy(() => import('./components/Settings'));
const Contact = React.lazy(() => import('./components/Contact'));
const Help = React.lazy(() => import('./components/Help'));
const Navbar = React.lazy(() => import('./components/Navbar'));
const Footer = React.lazy(() => import('./components/Footer'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  const location = useLocation();
  const { user } = React.useContext(AuthContext);
  
  const hideNavAndFooter = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
  
  return (
    <div className="App">
      {!hideNavAndFooter && user && <Navbar />}
      
      <div className="main-content">
        <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
            <Route path="/sms-import" element={<ProtectedRoute><SMSImport /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
      
      {!hideNavAndFooter && user && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
