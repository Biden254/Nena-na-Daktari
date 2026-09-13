/**
 * LoginPage for Nena na Daktari.
 * Full-page login screen with branding and LoginForm.
 */

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import authService from '../services/authService';

const LoginPage: React.FC = () => {
  // Redirect to dashboard if already authenticated
  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo / Branding */}
        <div style={styles.header}>
          <div style={styles.logo}>🏥</div>
          <h1 style={styles.title}>Nena na Daktari</h1>
          <p style={styles.subtitle}>Healthcare Consultation Assistant</p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>Sign up</Link>
          </p>
          <p style={{...styles.footerText, marginTop: '12px'}}>
            Secure access for authorized healthcare providers only.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    padding: '40px 32px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  link: {
    color: '#1976d2',
    textDecoration: 'none',
    fontWeight: 500,
  },
};

export default LoginPage;
