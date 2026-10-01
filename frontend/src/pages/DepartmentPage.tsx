/**
 * Department page for Nena na Daktari.
 *
 * One reusable workspace per department — entered from the dashboard
 * department cards. Lets the doctor search for an existing patient,
 * register a new patient, and review this department's encounters.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Plus,
  Search,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import authService from '../services/authService';
import departmentService from '../services/departmentService';
import encounterService from '../services/encounterService';
import patientService from '../services/patientService';
import { Department, Encounter, Patient, User } from '../types';
import '../styles/dashboard.css';

const DepartmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [doctor, setDoctor] = useState<User | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loadingDepartment, setLoadingDepartment] = useState(true);
  const [loadingEncounters, setLoadingEncounters] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Server-driven patient search — the patient database is never
  // downloaded to the browser.
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    let mounted = true;
    if (id) {
      departmentService
        .getDepartment(id)
        .then((dept) => mounted && setDepartment(dept))
        .catch(() =>
          mounted && setLoadError('Department not found. It may have been removed.')
        )
        .finally(() => mounted && setLoadingDepartment(false));
    }

    encounterService
      .getEncounters(id ? { department: id } : undefined)
      .then((res) => mounted && setEncounters(res.results))
      .catch(() => {
        /* the section shows its own empty state; retry on next visit */
      })
      .finally(() => mounted && setLoadingEncounters(false));

    authService
      .getProfile()
      .then((user) => mounted && setDoctor(user))
      .catch(() => {
        /* header falls back to a generic label */
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Debounced search against the backend.
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

  const openPatient = useCallback(
    (patientId: string) => {
      // Carry the department so the start-consultation form is prefilled.
      navigate(`/patients/${patientId}`, { state: { department: id } });
    },
    [navigate, id]
  );

  const isSearching = searchQuery.trim().length > 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });

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

  if (loadingDepartment) {
    return (
      <AppShell>
        <div className="loading-state" style={{ padding: 'var(--space-12)' }}>
          <div className="spinner spinner-lg" />
          <span>Loading department...</span>
        </div>
      </AppShell>
    );
  }

  if (!department) {
    return (
      <AppShell>
        <div className="page-container">
          <div className="empty-state">
            <p className="empty-state-title">
              {loadError || 'Department not found'}
            </p>
            <p className="empty-state-description">
              This department may have been removed.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              Back to dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-container">
        {/* Back nav */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {/* Department header — name + current doctor */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="page-title">{department.name}</h1>
            <p className="page-subtitle">
              {doctor ? `Dr. ${doctor.full_name}` : 'Department workspace'}
            </p>
          </div>
          <div className="department-header-right">
            {department.is_assigned && (
              <span className="badge badge-neutral">Assigned to you</span>
            )}
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/patients/new?department=${department.id}`)}
            >
              <Plus size={18} />
              New patient
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Search existing patient */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <div className="dashboard-section-title">
                <UsersRound size={18} strokeWidth={1.8} />
                <h2>Find a patient</h2>
              </div>
            </div>

            <div className="dashboard-search">
              <Search size={16} className="dashboard-search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search by name or UHI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search patients by name or UHI"
              />
            </div>

            {searching ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>Searching patients...</span>
              </div>
            ) : isSearching && searchError ? (
              <div className="alert alert-error" role="alert">
                {searchError}
              </div>
            ) : isSearching && searchResults.length === 0 ? (
              <div className="empty-state">
                <UsersRound size={40} className="empty-state-icon" strokeWidth={1.2} />
                <p className="empty-state-title">No patients found</p>
                <p className="empty-state-description">
                  No patient matches that name or UHI. Register them as a new
                  patient instead.
                </p>
                <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              </div>
            ) : isSearching ? (
              <div className="dashboard-patient-list">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    className="dashboard-patient-card"
                    onClick={() => openPatient(patient.id)}
                  >
                    <div className="dashboard-patient-card-main">
                      <div className="dashboard-patient-avatar">
                        {patient.first_name[0]}
                        {patient.last_name[0]}
                      </div>
                      <div className="dashboard-patient-info">
                        <span className="dashboard-patient-name">
                          {patient.full_name}
                        </span>
                        <span className="dashboard-patient-meta">
                          {patient.gender === 'M'
                            ? 'Male'
                            : patient.gender === 'F'
                            ? 'Female'
                            : 'Other'}
                          {patient.date_of_birth &&
                            ` · ${formatDate(patient.date_of_birth)}`}
                          {patient.uhi && ` · UHI ${patient.uhi}`}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={40} className="empty-state-icon" strokeWidth={1.2} />
                <p className="empty-state-title">Search for a returning patient</p>
                <p className="empty-state-description">
                  Existing patients keep their UHI and history across
                  departments. Search before registering someone new.
                </p>
              </div>
            )}
          </div>

          {/* Department encounters */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <div className="dashboard-section-title">
                <Stethoscope size={18} strokeWidth={1.8} />
                <h2>Encounters in this department</h2>
              </div>
            </div>

            {loadingEncounters ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>Loading encounters...</span>
              </div>
            ) : encounters.length === 0 ? (
              <div className="empty-state">
                <Stethoscope size={40} className="empty-state-icon" strokeWidth={1.2} />
                <p className="empty-state-title">No encounters yet</p>
                <p className="empty-state-description">
                  Encounters started in {department.name} will appear here.
                </p>
              </div>
            ) : (
              <div className="dashboard-encounter-list">
                {encounters.map((encounter) => (
                  <button
                    key={encounter.id}
                    className="dashboard-encounter-card"
                    onClick={() => openPatient(encounter.patient)}
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
                        {encounter.patient_uhi && (
                          <span className="dashboard-encounter-date">
                            UHI {encounter.patient_uhi}
                          </span>
                        )}
                        <span className="dashboard-encounter-date">
                          <Stethoscope size={12} />
                          {encounter.doctor_name}
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
      </div>
    </AppShell>
  );
};

export default DepartmentPage;
