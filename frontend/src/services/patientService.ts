/**
 * Patient service for API operations.
 */

import apiClient from './api';
import { PaginatedResponse, Patient, PatientCreateData } from '../types';

const patientService = {
  /**
   * Get list of patients.
   */
  async getPatients(search?: string): Promise<PaginatedResponse<Patient>> {
    const params = search ? { search } : {};
    const response = await apiClient.get('/patients/', { params });
    return response.data;
  },

  /**
   * Get patient by ID.
   */
  async getPatient(id: string): Promise<Patient> {
    const response = await apiClient.get(`/patients/${id}/`);
    return response.data;
  },

  /**
   * Create new patient.
   */
  async createPatient(data: PatientCreateData): Promise<Patient> {
    const response = await apiClient.post('/patients/', data);
    return response.data;
  },

  /**
   * Update patient.
   */
  async updatePatient(id: string, data: Partial<PatientCreateData>): Promise<Patient> {
    const response = await apiClient.patch(`/patients/${id}/`, data);
    return response.data;
  },

  /**
   * Delete patient.
   */
  async deletePatient(id: string): Promise<void> {
    await apiClient.delete(`/patients/${id}/`);
  },
};

export default patientService;
