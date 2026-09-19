/**
 * RegisterPage for Nena na Daktari.
 * Full-page registration screen with branding and RegisterForm.
 */

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import RegisterForm from '../components/RegisterForm';
import authService from '../services/authService';
import '../styles/auth.css';

const RegisterPage: React.FC = () => {
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
          <p className="auth-subtitle">Create your doctor account</p>
        </div>

        {/* Register Form */}
        <RegisterForm />

        {/* Login link */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
