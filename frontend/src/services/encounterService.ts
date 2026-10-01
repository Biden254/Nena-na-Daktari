/**
 * Encounter service for API operations.
 */

import apiClient from './api';
import { Encounter, EncounterCreateData, PaginatedResponse } from '../types';

interface EncounterFilters {
  /** Only encounters for one department. */
  department?: string;
  /** The longitudinal history of one patient. */
  patient?: string;
}

const encounterService = {
  /**
   * Get list of encounters, optionally filtered by department or patient.
   */
  async getEncounters(filters?: EncounterFilters): Promise<PaginatedResponse<Encounter>> {
    const response = await apiClient.get('/encounters/', { params: filters });
    return response.data;
  },

  /**
   * Get encounter by ID.
   */
  async getEncounter(id: string): Promise<Encounter> {
    const response = await apiClient.get(`/encounters/${id}/`);
    return response.data;
  },

  /**
   * Create new encounter.
   */
  async createEncounter(data: EncounterCreateData): Promise<Encounter> {
    const response = await apiClient.post('/encounters/', data);
    return response.data;
  },

  /**
   * End an encounter.
   */
  async endEncounter(id: string): Promise<Encounter> {
    const response = await apiClient.post(`/encounters/${id}/end/`);
    return response.data;
  },
};

export default encounterService;
