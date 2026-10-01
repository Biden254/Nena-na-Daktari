/**
 * Encounter workspace for Nena na Daktari.
 *
 * The consultation page where a doctor works with a patient encounter.
 * Shows patient context, encounter status, and room for future audio/transcription.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  Square,
  FileText,
  Building2,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import encounterService from '../services/encounterService';
import { Encounter } from '../types';
import '../styles/encounter.css';

const EncounterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [notes, setNotes] = useState('');

  const loadEncounter = useCallback(async () => {
    if (!id) return;
    try {
      const data = await encounterService.getEncounter(id);
      setEncounter(data);
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Failed to load encounter:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEncounter();
  }, [loadEncounter]);

  const handleEndEncounter = async () => {
    if (!id) return;
    setEnding(true);
    try {
      const updated = await encounterService.endEncounter(id);
      setEncounter(updated);
    } catch (error) {
      console.error('Failed to end encounter:', error);
      setEnding(false);
    }
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
        return <span className="badge badge-success"><span className="badge-dot" /> Active</span>;
      case 'completed':
        return <span className="badge badge-neutral">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return null;
    }
  };

  const getElapsed = () => {
    if (!encounter) return '';
    const start = new Date(encounter.started_at).getTime();
    const end = encounter.ended_at
      ? new Date(encounter.ended_at).getTime()
      : Date.now();
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (hours > 0) return `${hours}h ${remainingMins}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <AppShell>
        <div className="loading-state" style={{ padding: 'var(--space-12)' }}>
          <div className="spinner spinner-lg" />
          <span>Loading consultation...</span>
        </div>
      </AppShell>
    );
  }

  if (!encounter) {
    return (
      <AppShell>
        <div className="page-container">
          <div className="empty-state">
            <p className="empty-state-title">Consultation not found</p>
            <p className="empty-state-description">
              This consultation may have been removed or you don't have access.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/consultations')}>
              <ArrowLeft size={16} />
              Back to consultations
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const isActive = encounter.status === 'in_progress';

  return (
    <AppShell>
      <div className="encounter-workspace">
        {/* Encounter header bar */}
        <div className="encounter-header">
          <div className="encounter-header-left">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/patients/${encounter.patient}`)}
            >
              <ArrowLeft size={16} />
              {encounter.patient_name}
            </button>
          </div>

          <div className="encounter-header-center">
            {getStatusBadge(encounter.status)}
            <span className="encounter-duration">
              <Clock size={14} />
              {getElapsed()}
            </span>
          </div>

          <div className="encounter-header-right">
            {isActive && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleEndEncounter}
                disabled={ending}
              >
                {ending ? (
                  <>
                    <div className="spinner" />
                    Ending...
                  </>
                ) : (
                  <>
                    <Square size={14} />
                    End consultation
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="encounter-body">
          {/* Patient context sidebar */}
          <aside className="encounter-sidebar">
            <div className="encounter-sidebar-section">
              <div className="encounter-sidebar-label">
                <User size={14} />
                Patient
              </div>
              <button
                className="encounter-patient-link"
                onClick={() => navigate(`/patients/${encounter.patient}`)}
              >
                {encounter.patient_name}
              </button>
            </div>

            <div className="encounter-sidebar-section">
              <div className="encounter-sidebar-label">
                <Building2 size={14} />
                Department
              </div>
              <span className="encounter-sidebar-value">
                {encounter.department_name || '—'}
              </span>
            </div>

            <div className="encounter-sidebar-section">
              <div className="encounter-sidebar-label">
                <CalendarDays size={14} />
                Started
              </div>
              <span className="encounter-sidebar-value">
                {formatDateTime(encounter.started_at)}
              </span>
            </div>

            {encounter.ended_at && (
              <div className="encounter-sidebar-section">
                <div className="encounter-sidebar-label">
                  <Clock size={14} />
                  Ended
                </div>
                <span className="encounter-sidebar-value">
                  {formatDateTime(encounter.ended_at)}
                </span>
              </div>
            )}

            <div className="encounter-sidebar-section">
              <div className="encounter-sidebar-label">
                <Stethoscope size={14} />
                Doctor
              </div>
              <span className="encounter-sidebar-value">
                {encounter.doctor_name}
              </span>
            </div>
          </aside>

          {/* Main workspace */}
          <div className="encounter-main">
            {isActive && (
              <div className="encounter-placeholder">
                <div className="encounter-placeholder-icon">
                  <Stethoscope size={40} strokeWidth={1} />
                </div>
                <h3>Consultation in progress</h3>
                <p>
                  Use this space to document the consultation. In future updates,
                  audio recording and transcription will appear here.
                </p>
              </div>
            )}

            {!isActive && (
              <div className="encounter-placeholder">
                <div className="encounter-placeholder-icon">
                  <FileText size={40} strokeWidth={1} />
                </div>
                <h3>Consultation completed</h3>
                <p>
                  This consultation ended on{' '}
                  {encounter.ended_at ? formatDateTime(encounter.ended_at) : '—'}.
                </p>
              </div>
            )}

            {/* Notes section */}
            <div className="encounter-notes">
              <div className="encounter-notes-header">
                <FileText size={16} />
                <h3>Clinical notes</h3>
              </div>
              <textarea
                className="form-input encounter-notes-input"
                placeholder={
                  isActive
                    ? 'Enter clinical notes for this consultation...'
                    : 'No notes recorded.'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isActive}
                rows={8}
                aria-label="Clinical notes"
              />
              {isActive && (
                <div className="encounter-notes-actions">
                  <span className="text-sm text-muted">
                    Notes are saved locally. Auto-save will be added in a future update.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default EncounterPage;
