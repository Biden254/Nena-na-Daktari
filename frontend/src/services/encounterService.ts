/**
 * Encounter service for API operations.
 */

import apiClient from './api';
import { Encounter, EncounterCreateData, PaginatedResponse } from '../types';

const encounterService = {
  /**
   * Get list of encounters.
   */
  async getEncounters(): Promise<PaginatedResponse<Encounter>> {
    const response = await apiClient.get('/encounters/');
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
