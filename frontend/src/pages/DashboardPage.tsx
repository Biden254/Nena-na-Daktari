/**
 * Dashboard page for Nena na Daktari.
 *
 * The doctor's clinical workspace starting point.
 * Shows recent patients, recent encounters, and a prominent start consultation action.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  UsersRound,
  Stethoscope,
  ArrowRight,
  Clock,
  CalendarDays,
  Building2,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import patientService from '../services/patientService';
import encounterService from '../services/encounterService';
import departmentService from '../services/departmentService';
import { Department, Patient, Encounter } from '../types';
import '../styles/dashboard.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingEncounters, setLoadingEncounters] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  // Server-driven patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  const loadData = useCallback(async () => {
    try {
      const [patientRes, encounterRes] = await Promise.all([
        patientService.getPatients(),
        encounterService.getEncounters(),
      ]);
      setPatients(patientRes.results.slice(0, 6));
      setEncounters(encounterRes.results.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoadingPatients(false);
      setLoadingEncounters(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Departments are reference data — loaded independently so a failure
  // here does not break the rest of the dashboard.
  useEffect(() => {
    let mounted = true;
    departmentService
      .getDepartments()
      .then((deps) => {
        if (mounted) setDepartments(deps);
      })
      .catch(() => {
        if (mounted) setDepartmentError('Could not load departments. Please try again later.');
      })
      .finally(() => {
        if (mounted) setLoadingDepartments(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced search against the backend — the patient database is never
  // downloaded to the browser.
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) {
      searchSeq.current += 1;
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const seq = ++searchSeq.current;
      try {
        const res = await patientService.getPatients(term);
        if (seq !== searchSeq.current) return;
        setSearchResults(res.results);
        setSearchError(null);
      } catch {
        if (seq !== searchSeq.current) return;
        setSearchResults([]);
        setSearchError('Search failed. Please try again.');
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const patientList = isSearching ? searchResults : patients;
  const patientsLoading = isSearching ? searching : loadingPatients;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: Encounter['status']) => {
    switch (status) {
      case 'in_progress':
        return <span className="badge badge-success">In Progress</span>;
      case 'completed':
        return <span className="badge badge-neutral">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Your clinical workspace</p>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/patients/new')}
          >
            <Plus size={18} />
            Start consultation
          </button>
        </div>

        <div className="dashboard-grid">
          {/* Patients Section */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <div className="dashboard-section-title">
                <UsersRound size={18} strokeWidth={1.8} />
                <h2>Patients</h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/patients')}
              >
                View all
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Search — queries the backend by name or UHI */}
            <div className="dashboard-search">
              <Search size={16} className="dashboard-search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search patients by name or UHI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search patients by name or UHI"
              />
            </div>

            {/* Patient list */}
            {patientsLoading ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>{isSearching ? 'Searching patients...' : 'Loading patients...'}</span>
              </div>
            ) : isSearching && searchError ? (
              <div className="alert alert-error" role="alert">
                {searchError}
              </div>
            ) : patientList.length === 0 ? (
              <div className="empty-state">
                <UsersRound size={40} className="empty-state-icon" strokeWidth={1.2} />
                <p className="empty-state-title">
                  {isSearching ? 'No patients found' : 'No patients yet'}
                </p>
                <p className="empty-state-description">
                  {isSearching
                    ? 'No patient matches that name or UHI. You can register them as a new patient.'
                    : 'Create your first patient to begin a consultation.'}
                </p>
                {isSearching ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/patients/new')}
                  >
                    <Plus size={16} />
                    Create patient
                  </button>
                )}
              </div>
            ) : (
              <div className="dashboard-patient-list">
                {patientList.map((patient) => (
                  <button
                    key={patient.id}
                    className="dashboard-patient-card"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <div className="dashboard-patient-card-main">
                      <div className="dashboard-patient-avatar">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div className="dashboard-patient-info">
                        <span className="dashboard-patient-name">
                          {patient.full_name}
                        </span>
                        <span className="dashboard-patient-meta">
                          {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                          {patient.date_of_birth && ` · ${formatDate(patient.date_of_birth)}`}
                          {patient.uhi && ` · UHI ${patient.uhi}`}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Consultations Section */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <div className="dashboard-section-title">
                <Stethoscope size={18} strokeWidth={1.8} />
                <h2>Recent consultations</h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/consultations')}
              >
                View all
                <ArrowRight size={14} />
              </button>
            </div>

            {loadingEncounters ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>Loading consultations...</span>
              </div>
            ) : encounters.length === 0 ? (
              <div className="empty-state">
                <Stethoscope size={40} className="empty-state-icon" strokeWidth={1.2} />
                <p className="empty-state-title">No consultations yet</p>
                <p className="empty-state-description">
                  Start a consultation from a patient's profile to see it here.
                </p>
              </div>
            ) : (
              <div className="dashboard-encounter-list">
                {encounters.map((encounter) => (
                  <button
                    key={encounter.id}
                    className="dashboard-encounter-card"
                    onClick={() => navigate(`/encounters/${encounter.id}`)}
                  >
                    <div className="dashboard-encounter-info">
                      <span className="dashboard-encounter-patient">
                        {encounter.patient_name}
                      </span>
                      <div className="dashboard-encounter-meta">
                        <span className="dashboard-encounter-date">
                          <CalendarDays size={12} />
                          {formatDate(encounter.started_at)}
                        </span>
                        <span className="dashboard-encounter-time">
                          <Clock size={12} />
                          {formatTime(encounter.started_at)}
                        </span>
                      </div>
                    </div>
                    <div className="dashboard-encounter-right">
                      {getStatusBadge(encounter.status)}
                      <ArrowRight size={14} className="text-muted" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departments — real backend data, ready for encounter association */}
        <div className="dashboard-section" style={{ marginTop: 'var(--space-8)' }}>
          <div className="dashboard-section-header">
            <div className="dashboard-section-title">
              <Building2 size={18} strokeWidth={1.8} />
              <h2>Departments</h2>
            </div>
          </div>

          {loadingDepartments ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading departments...</span>
            </div>
          ) : departmentError ? (
            <div className="alert alert-error" role="alert">
              {departmentError}
            </div>
          ) : departments.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <p className="empty-state-title">No departments available</p>
            </div>
          ) : (
            <ul className="department-grid">
              {departments.map((dept) => (
                <li key={dept.id}>
                  <button
                    type="button"
                    className="department-card department-card-link"
                    onClick={() => navigate(`/departments/${dept.id}`)}
                    aria-label={`Open ${dept.name} department`}
                  >
                    <Building2 size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span className="department-card-name">{dept.name}</span>
                    <ArrowRight size={14} className="text-muted" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default DashboardPage;
