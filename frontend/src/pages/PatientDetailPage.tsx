/**
 * Patient detail page for Nena na Daktari.
 *
 * Shows patient information, encounter history, and start consultation action.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Stethoscope,
  CalendarDays,
  ArrowRight,
  Building2,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import patientService from '../services/patientService';
import encounterService from '../services/encounterService';
import departmentService from '../services/departmentService';
import { Department, Patient, Encounter } from '../types';
import '../styles/patient-detail.css';

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Set when we arrive straight after registering a new patient.
  const justRegistered = Boolean(
    (location.state as { created?: boolean } | null)?.created
  );
  // Set when the patient was selected from a department page — the
  // start-consultation form opens with that department preselected.
  const departmentFromState =
    (location.state as { department?: string } | null)?.department ?? '';

  const [patient, setPatient] = useState<Patient | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingEncounter, setStartingEncounter] = useState(false);

  // Department selection when starting a consultation
  const [showStartPanel, setShowStartPanel] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [startError, setStartError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [patientData, encounterData] = await Promise.all([
        patientService.getPatient(id),
        // Backend-filtered longitudinal history — one patient's encounters
        // across every department and doctor.
        encounterService.getEncounters({ patient: id }),
      ]);
      setPatient(patientData);
      setEncounters(encounterData.results);
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When arriving from a department, preload departments and preselect.
  useEffect(() => {
    if (!departmentFromState) return;
    setShowStartPanel(true);
    setSelectedDepartment(departmentFromState);
    let mounted = true;
    departmentService.getDepartments().then((deps) => {
      if (mounted) setDepartments(deps);
    }).catch(() => {
      if (mounted) setStartError('Could not load departments. Please try again.');
    });
    return () => {
      mounted = false;
    };
    // Only run when navigating in from a department page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentFromState]);

  const openStartPanel = async () => {
    setStartError(null);
    setShowStartPanel(true);
    // Load departments on first open so a failure is visible and retryable.
    if (departments.length === 0) {
      try {
        const deps = await departmentService.getDepartments();
        setDepartments(deps);
      } catch {
        setStartError('Could not load departments. Please try again.');
      }
    }
  };

  const handleStartConsultation = async () => {
    if (!id) return;
    if (!selectedDepartment) {
      setStartError('Please select a department to continue.');
      return;
    }
    setStartingEncounter(true);
    setStartError(null);
    try {
      const encounter = await encounterService.createEncounter({
        patient: id,
        department: selectedDepartment,
      });
      navigate(`/encounters/${encounter.id}`);
    } catch (error: any) {
      const data = error.response?.data;
      setStartError(
        data?.department?.[0] ||
          data?.non_field_errors?.[0] ||
          'Failed to start the consultation. Please try again.'
      );
      setStartingEncounter(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  if (loading) {
    return (
      <AppShell>
        <div className="loading-state" style={{ padding: 'var(--space-12)' }}>
          <div className="spinner spinner-lg" />
          <span>Loading patient...</span>
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="page-container">
          <div className="empty-state">
            <p className="empty-state-title">Patient not found</p>
            <p className="empty-state-description">
              This patient may have been removed or you don't have access.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/patients')}>
              <ArrowLeft size={16} />
              Back to patients
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const age = patient.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(patient.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <AppShell>
      <div className="page-container">
        {/* Back nav */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/patients')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <ArrowLeft size={16} />
          All patients
        </button>

        {/* Registration success — shows the generated UHI */}
        {justRegistered && (
          <div
            className="alert alert-success"
            role="status"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            Patient registered. Unique Hospital Identifier (UHI):{' '}
            <strong>{patient.uhi}</strong>
          </div>
        )}

        {/* Patient header */}
        <div className="patient-detail-header card">
          <div className="card-body">
            <div className="patient-detail-header-content">
              <div className="patient-detail-avatar">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div className="patient-detail-info">
                <div className="patient-detail-name-row">
                  <h1 className="patient-detail-name">{patient.full_name}</h1>
                  <span
                    className="patient-detail-uhi"
                    title="Unique Hospital Identifier"
                  >
                    UHI {patient.uhi}
                  </span>
                </div>
                <div className="patient-detail-meta">
                  <span>
                    {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                  </span>
                  {age !== null && <span>· Age {age}</span>}
                  {patient.date_of_birth && (
                    <span>· DOB {formatDate(patient.date_of_birth)}</span>
                  )}
                  {patient.phone && <span>· {patient.phone}</span>}
                </div>
              </div>
              <div className="patient-detail-actions">
                {!showStartPanel && (
                  <button className="btn btn-primary" onClick={openStartPanel}>
                    <Plus size={16} />
                    Start consultation
                  </button>
                )}
              </div>
            </div>

            {/* Department selection before starting the consultation */}
            {showStartPanel && (
              <div className="start-consult-panel">
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="department">
                    Department
                  </label>
                  <select
                    id="department"
                    className="form-select"
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      if (startError) setStartError(null);
                    }}
                    disabled={startingEncounter}
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {startError && (
                    <span className="form-error" role="alert">
                      {startError}
                    </span>
                  )}
                </div>
                <div className="start-consult-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowStartPanel(false);
                      setStartError(null);
                    }}
                    disabled={startingEncounter}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartConsultation}
                    disabled={startingEncounter || !selectedDepartment}
                  >
                    {startingEncounter ? (
                      <>
                        <div className="spinner" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Start consultation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Encounter history */}
        <div className="patient-detail-section" style={{ marginTop: 'var(--space-6)' }}>
          <div className="dashboard-section-header">
            <div className="dashboard-section-title">
              <Stethoscope size={18} strokeWidth={1.8} />
              <h2>Consultation history</h2>
            </div>
          </div>

          {encounters.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <Stethoscope size={36} className="empty-state-icon" strokeWidth={1.2} />
              <p className="empty-state-title">No consultations yet</p>
              <p className="empty-state-description">
                Start a consultation for this patient. Previous consultations will appear here.
              </p>
            </div>
          ) : (
            <div className="encounter-history-list">
              {encounters.map((encounter) => (
                <button
                  key={encounter.id}
                  className="encounter-history-card"
                  onClick={() => navigate(`/encounters/${encounter.id}`)}
                >
                  <div className="encounter-history-info">
                    <div className="encounter-history-top">
                      {getStatusBadge(encounter.status)}
                      <span className="encounter-history-id">
                        #{encounter.id.toString().slice(-6)}
                      </span>
                    </div>
                    <div className="encounter-history-dates">
                      {encounter.department_name && (
                        <span className="dashboard-encounter-date">
                          <Building2 size={12} />
                          {encounter.department_name}
                        </span>
                      )}
                      <span className="dashboard-encounter-date">
                        <CalendarDays size={12} />
                        {formatDateTime(encounter.started_at)}
                      </span>
                      <span className="dashboard-encounter-date">
                        <Stethoscope size={12} />
                        {encounter.doctor_name}
                      </span>
                      {encounter.ended_at && (
                        <span className="dashboard-encounter-date">
                          — {formatDateTime(encounter.ended_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default PatientDetailPage;
