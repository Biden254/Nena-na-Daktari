/**
 * Create patient page for Nena na Daktari.
 *
 * Form to create a new patient with validation and backend error handling.
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import AppShell from '../components/AppShell';
import patientService from '../services/patientService';
import { PatientCreateData } from '../types';

interface FormErrors {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  national_id?: string;
  non_field?: string;
}

const CreatePatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PatientCreateData>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'M',
    phone: '',
    national_id: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required.';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required.';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required.';
    } else {
      const dob = new Date(formData.date_of_birth);
      if (isNaN(dob.getTime()) || dob > new Date()) {
        newErrors.date_of_birth = 'Please enter a valid date of birth.';
      }
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Clean up optional fields
      const payload: PatientCreateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
      };
      if (formData.phone?.trim()) payload.phone = formData.phone.trim();
      if (formData.national_id?.trim()) payload.national_id = formData.national_id.trim();

      const patient = await patientService.createPatient(payload);
      navigate(`/patients/${patient.id}`);
    } catch (error: any) {
      if (error.response?.data) {
        const data = error.response.data;
        const newErrors: FormErrors = {};

        // Map field errors
        ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'national_id'].forEach((field) => {
          if (data[field]) {
            newErrors[field as keyof FormErrors] = Array.isArray(data[field])
              ? data[field][0]
              : data[field];
          }
        });

        // Non-field errors
        if (data.non_field_errors) {
          newErrors.non_field = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          setErrors({ non_field: 'An unexpected error occurred. Please try again.' });
        }
      } else {
        setErrors({ non_field: 'Network error. Please check your connection and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(-1)}
              style={{ marginBottom: 'var(--space-2)' }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="page-title">New patient</h1>
            <p className="page-subtitle">Enter the patient's basic information</p>
          </div>
        </div>

        {errors.non_field && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
            {errors.non_field}
          </div>
        )}

        <form onSubmit={handleSubmit} className="patient-form card card-body">
          <div className="patient-form-grid">
            {/* First name */}
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="first_name">
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className={`form-input ${errors.first_name ? 'form-input-error' : ''}`}
                value={formData.first_name}
                onChange={handleChange}
                placeholder="e.g. Wanjiku"
                autoComplete="given-name"
              />
              {errors.first_name && (
                <span className="form-error">{errors.first_name}</span>
              )}
            </div>

            {/* Last name */}
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="last_name">
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className={`form-input ${errors.last_name ? 'form-input-error' : ''}`}
                value={formData.last_name}
                onChange={handleChange}
                placeholder="e.g. Kamau"
                autoComplete="family-name"
              />
              {errors.last_name && (
                <span className="form-error">{errors.last_name}</span>
              )}
            </div>

            {/* Date of birth */}
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="date_of_birth">
                Date of birth
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                className={`form-input ${errors.date_of_birth ? 'form-input-error' : ''}`}
                value={formData.date_of_birth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date_of_birth && (
                <span className="form-error">{errors.date_of_birth}</span>
              )}
            </div>

            {/* Gender */}
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                className={`form-select ${errors.gender ? 'form-input-error' : ''}`}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              {errors.gender && (
                <span className="form-error">{errors.gender}</span>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +254 712 345 678"
                autoComplete="tel"
              />
              {errors.phone && (
                <span className="form-error">{errors.phone}</span>
              )}
            </div>

            {/* National ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="national_id">
                National ID
              </label>
              <input
                id="national_id"
                name="national_id"
                type="text"
                className={`form-input ${errors.national_id ? 'form-input-error' : ''}`}
                value={formData.national_id}
                onChange={handleChange}
                placeholder="e.g. 12345678"
              />
              {errors.national_id && (
                <span className="form-error">{errors.national_id}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="patient-form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create patient
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
};

export default CreatePatientPage;
