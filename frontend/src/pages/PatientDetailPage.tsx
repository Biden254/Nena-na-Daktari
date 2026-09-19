/**
 * Patient detail page for Nena na Daktari.
 *
 * Shows patient information, encounter history, and start consultation action.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Stethoscope,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import patientService from '../services/patientService';
import encounterService from '../services/encounterService';
import { Patient, Encounter } from '../types';
import '../styles/patient-detail.css';

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingEncounter, setStartingEncounter] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [patientData, encounterData] = await Promise.all([
        patientService.getPatient(id),
        encounterService.getEncounters(),
      ]);
      setPatient(patientData);
      // Filter encounters for this patient
      const patientEncounters = encounterData.results.filter(
        (e) => e.patient === id
      );
      setEncounters(patientEncounters);
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartConsultation = async () => {
    if (!id) return;
    setStartingEncounter(true);
    try {
      const encounter = await encounterService.createEncounter({ patient: id });
      navigate(`/encounters/${encounter.id}`);
    } catch (error) {
      console.error('Failed to start encounter:', error);
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

        {/* Patient header */}
        <div className="patient-detail-header card">
          <div className="card-body">
            <div className="patient-detail-header-content">
              <div className="patient-detail-avatar">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div className="patient-detail-info">
                <h1 className="patient-detail-name">{patient.full_name}</h1>
                <div className="patient-detail-meta">
                  <span>
                    {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                  </span>
                  {age !== null && <span>· Age {age}</span>}
                  {patient.date_of_birth && (
                    <span>· DOB {formatDate(patient.date_of_birth)}</span>
                  )}
                  {patient.national_id && <span>· ID {patient.national_id}</span>}
                  {patient.phone && <span>· {patient.phone}</span>}
                </div>
              </div>
              <div className="patient-detail-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleStartConsultation}
                  disabled={startingEncounter}
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
                      <span className="dashboard-encounter-date">
                        <CalendarDays size={12} />
                        {formatDateTime(encounter.started_at)}
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
