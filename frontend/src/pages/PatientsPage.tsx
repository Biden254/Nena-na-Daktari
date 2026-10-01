/**
 * Patients page for Nena na Daktari.
 *
 * Lists all patients, supports search, and provides create patient workflow.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  UsersRound,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import patientService from '../services/patientService';
import { Patient, PaginatedResponse } from '../types';
import '../styles/patients.css';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<PaginatedResponse<Patient> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await patientService.getPatients(searchQuery || undefined);
      setPatientData(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      loadPatients();
    }, 400);
    setSearchTimeout(timeout);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const patients = patientData?.results || [];
  const hasNext = !!patientData?.next;
  const hasPrev = !!patientData?.previous;

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">
              {patientData ? `${patientData.count} patient${patientData.count !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/patients/new')}
          >
            <Plus size={16} />
            New patient
          </button>
        </div>

        {/* Search */}
        <div className="patients-search">
          <Search size={16} className="patients-search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, UHI, or phone..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search patients by name, UHI, or phone"
          />
        </div>

        {/* Patient list */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading patients...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <UsersRound size={48} className="empty-state-icon" strokeWidth={1.2} />
            <p className="empty-state-title">
              {searchQuery ? 'No patients match your search' : 'No patients yet'}
            </p>
            <p className="empty-state-description">
              {searchQuery
                ? 'Try a different search term.'
                : 'Create your first patient to begin consultations.'}
            </p>
            {!searchQuery && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/patients/new')}
              >
                <Plus size={16} />
                Create first patient
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="patients-list">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  className="patients-card"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div className="patients-card-left">
                    <div className="patients-card-avatar">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </div>
                    <div className="patients-card-info">
                      <span className="patients-card-name">{patient.full_name}</span>
                      <span className="patients-card-meta">
                        {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                        {patient.date_of_birth && ` · DOB: ${formatDate(patient.date_of_birth)}`}
                        {patient.uhi && ` · UHI ${patient.uhi}`}
                      </span>
                    </div>
                  </div>
                  <div className="patients-card-right">
                    <span className="patients-card-date">
                      Created {formatDate(patient.created_at)}
                    </span>
                    <ArrowRight size={16} className="text-muted" />
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {(hasNext || hasPrev) && (
              <div className="patients-pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={!hasPrev}
                  onClick={() => loadPatients()}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <span className="text-sm text-secondary">
                  Page {searchQuery ? '1' : '1'}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={!hasNext}
                  onClick={() => loadPatients()}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default PatientsPage;
