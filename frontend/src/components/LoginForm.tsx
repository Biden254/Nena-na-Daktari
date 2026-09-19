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
    <form onSubmit={handleSubmit} className="auth-form">
      {errors.general && (
        <div className="alert alert-error">{errors.general}</div>
      )}

      <div className="form-group">
        <label htmlFor="username" className="form-label form-label-required">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isLoading}
          className={`form-input ${errors.username ? 'form-input-error' : ''}`}
          autoComplete="username"
          autoFocus
        />
        {errors.username && <span className="form-error">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label form-label-required">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isLoading}
          className={`form-input ${errors.password ? 'form-input-error' : ''}`}
          autoComplete="current-password"
        />
        {errors.password && <span className="form-error">{errors.password}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginTop: 'var(--space-2)' }}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;
