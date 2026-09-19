/**
 * RegisterForm component for new doctor registration.
 * Handles input, validation, and API submission.
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

interface FormErrors {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  password_confirm?: string;
  general?: string;
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
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
      await authService.register({
        ...formData,
        role: 'doctor',
      });
      navigate('/');
    } catch (error: any) {
      const responseErrors = error.response?.data;
      if (responseErrors) {
        const newErrors: FormErrors = {};
        if (responseErrors.username) newErrors.username = Array.isArray(responseErrors.username) ? responseErrors.username[0] : responseErrors.username;
        if (responseErrors.email) newErrors.email = Array.isArray(responseErrors.email) ? responseErrors.email[0] : responseErrors.email;
        if (responseErrors.first_name) newErrors.first_name = Array.isArray(responseErrors.first_name) ? responseErrors.first_name[0] : responseErrors.first_name;
        if (responseErrors.last_name) newErrors.last_name = Array.isArray(responseErrors.last_name) ? responseErrors.last_name[0] : responseErrors.last_name;
        if (responseErrors.password) newErrors.password = Array.isArray(responseErrors.password) ? responseErrors.password[0] : responseErrors.password;
        if (responseErrors.password_confirm) newErrors.password_confirm = Array.isArray(responseErrors.password_confirm) ? responseErrors.password_confirm[0] : responseErrors.password_confirm;
        if (responseErrors.non_field_errors) newErrors.general = Array.isArray(responseErrors.non_field_errors) ? responseErrors.non_field_errors[0] : responseErrors.non_field_errors;
        if (Object.keys(newErrors).length === 0) {
          newErrors.general = 'Registration failed. Please try again.';
        }
        setErrors(newErrors);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (fieldName: keyof FormErrors) =>
    `form-input ${errors[fieldName] ? 'form-input-error' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {errors.general && (
        <div className="alert alert-error">{errors.general}</div>
      )}

      {/* Name row */}
      <div className="patient-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="form-group">
          <label htmlFor="first_name" className="form-label form-label-required">
            First name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="First name"
            disabled={isLoading}
            className={fieldClass('first_name')}
            autoComplete="given-name"
          />
          {errors.first_name && <span className="form-error">{errors.first_name}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="last_name" className="form-label form-label-required">
            Last name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last name"
            disabled={isLoading}
            className={fieldClass('last_name')}
            autoComplete="family-name"
          />
          {errors.last_name && <span className="form-error">{errors.last_name}</span>}
        </div>
      </div>

      {/* Username */}
      <div className="form-group">
        <label htmlFor="username" className="form-label form-label-required">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Choose a username"
          disabled={isLoading}
          className={fieldClass('username')}
          autoComplete="username"
          autoFocus
        />
        {errors.username && <span className="form-error">{errors.username}</span>}
      </div>

      {/* Email */}
      <div className="form-group">
        <label htmlFor="email" className="form-label form-label-required">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@hospital.com"
          disabled={isLoading}
          className={fieldClass('email')}
          autoComplete="email"
        />
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      {/* Password */}
      <div className="form-group">
        <label htmlFor="password" className="form-label form-label-required">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          disabled={isLoading}
          className={fieldClass('password')}
          autoComplete="new-password"
        />
        {errors.password && <span className="form-error">{errors.password}</span>}
      </div>

      {/* Confirm Password */}
      <div className="form-group">
        <label htmlFor="password_confirm" className="form-label form-label-required">
          Confirm password
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          value={formData.password_confirm}
          onChange={handleChange}
          placeholder="Re-enter your password"
          disabled={isLoading}
          className={fieldClass('password_confirm')}
          autoComplete="new-password"
        />
        {errors.password_confirm && <span className="form-error">{errors.password_confirm}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginTop: 'var(--space-2)' }}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;
