/**
 * LoginPage for Nena na Daktari.
 * Full-page login screen with branding and LoginForm.
 */

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import authService from '../services/authService';
import '../styles/auth.css';

const LoginPage: React.FC = () => {
  // Redirect to dashboard if already authenticated
  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo / Branding */}
        <div className="auth-header">
          <div className="auth-logo">
            <Stethoscope size={28} strokeWidth={1.8} />
          </div>
          <h1 className="auth-title">Nena na Daktari</h1>
          <p className="auth-subtitle">Healthcare Consultation Assistant</p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Sign up</Link>
          </p>
          <p className="auth-footer-text" style={{ marginTop: 12 }}>
            Secure access for authorized healthcare providers only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
