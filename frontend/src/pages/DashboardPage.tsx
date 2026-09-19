/**
 * Dashboard page for Nena na Daktari.
 *
 * The doctor's clinical workspace starting point.
 * Shows recent patients, recent encounters, and a prominent start consultation action.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  UsersRound,
  Stethoscope,
  ArrowRight,
  Clock,
  CalendarDays,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import patientService from '../services/patientService';
import encounterService from '../services/encounterService';
import { Patient, Encounter } from '../types';
import '../styles/dashboard.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingEncounters, setLoadingEncounters] = useState(true);

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

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.national_id && p.national_id.includes(searchQuery))
  );

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

            {/* Search */}
            <div className="dashboard-search">
              <Search size={16} className="dashboard-search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search patients by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search patients"
              />
            </div>

            {/* Patient list */}
            {loadingPatients ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>Loading patients...</span>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="empty-state">
                <UsersRound size={40} className="empty-state-icon" strokeWidth={1.2} />
                <p className="empty-state-title">
                  {searchQuery ? 'No patients found' : 'No patients yet'}
                </p>
                <p className="empty-state-description">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Create your first patient to begin a consultation.'}
                </p>
                {!searchQuery && (
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
                {filteredPatients.map((patient) => (
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
                          {patient.national_id && ` · ID: ${patient.national_id}`}
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
      </div>
    </AppShell>
  );
};

export default DashboardPage;
