/**
 * Consultations page for Nena na Daktari.
 *
 * Lists all encounters/consultations with search, filter, and status display.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Stethoscope,
  ArrowRight,
  CalendarDays,
  Clock,
  Filter,
  Building2,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import encounterService from '../services/encounterService';
import { Encounter, PaginatedResponse } from '../types';
import '../styles/consultations.css';

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'cancelled';

const ConsultationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [encounterData, setEncounterData] = useState<PaginatedResponse<Encounter> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const loadEncounters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await encounterService.getEncounters();
      setEncounterData(data);
    } catch (error) {
      console.error('Failed to load encounters:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEncounters();
  }, [loadEncounters]);

  const encounters = encounterData?.results || [];

  // Filter by search and status
  const filteredEncounters = encounters.filter((e) => {
    const matchesSearch = searchQuery
      ? e.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-KE', {
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

  const statusCounts = {
    all: encounters.length,
    in_progress: encounters.filter((e) => e.status === 'in_progress').length,
    completed: encounters.filter((e) => e.status === 'completed').length,
    cancelled: encounters.filter((e) => e.status === 'cancelled').length,
  };

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Consultations</h1>
            <p className="page-subtitle">
              {encounterData ? `${encounterData.count} consultation${encounterData.count !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="consultations-filters">
          <div className="consultations-search">
            <Search size={16} className="consultations-search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search consultations"
            />
          </div>

          <div className="consultations-status-filters">
            <Filter size={14} className="text-muted" />
            {(['all', 'in_progress', 'completed', 'cancelled'] as StatusFilter[]).map(
              (status) => (
                <button
                  key={status}
                  className={`consultations-filter-btn ${statusFilter === status ? 'consultations-filter-btn-active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all'
                    ? 'All'
                    : status === 'in_progress'
                    ? 'Active'
                    : status === 'completed'
                    ? 'Completed'
                    : 'Cancelled'}
                  <span className="consultations-filter-count">
                    {statusCounts[status]}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Consultation list */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading consultations...</span>
          </div>
        ) : filteredEncounters.length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={48} className="empty-state-icon" strokeWidth={1.2} />
            <p className="empty-state-title">
              {searchQuery || statusFilter !== 'all'
                ? 'No consultations match your filters'
                : 'No consultations yet'}
            </p>
            <p className="empty-state-description">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Start a consultation from a patient\'s profile.'}
            </p>
          </div>
        ) : (
          <div className="consultations-list">
            {filteredEncounters.map((encounter) => (
              <button
                key={encounter.id}
                className="consultations-card"
                onClick={() => navigate(`/encounters/${encounter.id}`)}
              >
                <div className="consultations-card-left">
                  <div className="consultations-card-patient">
                    {encounter.patient_name}
                  </div>
                  <div className="consultations-card-meta">
                    {encounter.department_name && (
                      <span className="dashboard-encounter-date">
                        <Building2 size={12} />
                        {encounter.department_name}
                      </span>
                    )}
                    <span className="dashboard-encounter-date">
                      <CalendarDays size={12} />
                      {formatDate(encounter.started_at)}
                    </span>
                    <span className="dashboard-encounter-time">
                      <Clock size={12} />
                      {formatTime(encounter.started_at)}
                    </span>
                    {encounter.ended_at && (
                      <span className="text-muted">
                        — {formatTime(encounter.ended_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="consultations-card-right">
                  {getStatusBadge(encounter.status)}
                  <ArrowRight size={16} className="text-muted" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ConsultationsPage;
