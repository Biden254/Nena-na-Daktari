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
    // Clear field error on change
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
        // Map backend field errors to form errors
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

  const fieldStyle = (fieldName: keyof FormErrors): React.CSSProperties => ({
    ...styles.input,
    ...(errors[fieldName] ? styles.inputError : {}),
  });

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {errors.general && <div style={styles.errorBanner}>{errors.general}</div>}

      {/* Name row */}
      <div style={styles.row}>
        <div style={styles.halfField}>
          <label htmlFor="first_name" style={styles.label}>First Name</label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="First name"
            disabled={isLoading}
            style={fieldStyle('first_name')}
            autoComplete="given-name"
          />
          {errors.first_name && <span style={styles.errorText}>{errors.first_name}</span>}
        </div>
        <div style={styles.halfField}>
          <label htmlFor="last_name" style={styles.label}>Last Name</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last name"
            disabled={isLoading}
            style={fieldStyle('last_name')}
            autoComplete="family-name"
          />
          {errors.last_name && <span style={styles.errorText}>{errors.last_name}</span>}
        </div>
      </div>

      {/* Username */}
      <div style={styles.fieldGroup}>
        <label htmlFor="username" style={styles.label}>Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Choose a username"
          disabled={isLoading}
          style={fieldStyle('username')}
          autoComplete="username"
          autoFocus
        />
        {errors.username && <span style={styles.errorText}>{errors.username}</span>}
      </div>

      {/* Email */}
      <div style={styles.fieldGroup}>
        <label htmlFor="email" style={styles.label}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@hospital.com"
          disabled={isLoading}
          style={fieldStyle('email')}
          autoComplete="email"
        />
        {errors.email && <span style={styles.errorText}>{errors.email}</span>}
      </div>

      {/* Password */}
      <div style={styles.fieldGroup}>
        <label htmlFor="password" style={styles.label}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          disabled={isLoading}
          style={fieldStyle('password')}
          autoComplete="new-password"
        />
        {errors.password && <span style={styles.errorText}>{errors.password}</span>}
      </div>

      {/* Confirm Password */}
      <div style={styles.fieldGroup}>
        <label htmlFor="password_confirm" style={styles.label}>Confirm Password</label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          value={formData.password_confirm}
          onChange={handleChange}
          placeholder="Re-enter your password"
          disabled={isLoading}
          style={fieldStyle('password_confirm')}
          autoComplete="new-password"
        />
        {errors.password_confirm && <span style={styles.errorText}>{errors.password_confirm}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          ...styles.button,
          ...(isLoading ? styles.buttonDisabled : {}),
        }}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  halfField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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

export default RegisterForm;
