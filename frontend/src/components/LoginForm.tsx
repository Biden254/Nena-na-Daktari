/**
 * LoginForm component for doctor authentication.
 * Handles username/password input, validation, and API submission.
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.login({ username: username.trim(), password });
      navigate('/');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Invalid username or password. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {errors.general && <div style={styles.errorBanner}>{errors.general}</div>}

      <div style={styles.fieldGroup}>
        <label htmlFor="username" style={styles.label}>
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isLoading}
          style={{
            ...styles.input,
            ...(errors.username ? styles.inputError : {}),
          }}
          autoComplete="username"
          autoFocus
        />
        {errors.username && <span style={styles.errorText}>{errors.username}</span>}
      </div>

      <div style={styles.fieldGroup}>
        <label htmlFor="password" style={styles.label}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isLoading}
          style={{
            ...styles.input,
            ...(errors.password ? styles.inputError : {}),
          }}
          autoComplete="current-password"
        />
        {errors.password && <span style={styles.errorText}>{errors.password}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          ...styles.button,
          ...(isLoading ? styles.buttonDisabled : {}),
        }}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    padding: '12px 14px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorBanner: {
    padding: '12px 14px',
    fontSize: '14px',
    color: '#991b1b',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
  },
  errorText: {
    fontSize: '13px',
    color: '#ef4444',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#1976d2',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '4px',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
    cursor: 'not-allowed',
  },
};

export default LoginForm;
