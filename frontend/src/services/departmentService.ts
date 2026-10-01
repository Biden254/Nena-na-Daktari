/**
 * Department service for API operations.
 *
 * Departments are reference data seeded by the backend. They are
 * read-only from the frontend's perspective.
 */

import apiClient from './api';
import { Department } from '../types';

const departmentService = {
  /**
   * Get all departments.
   */
  async getDepartments(): Promise<Department[]> {
    const response = await apiClient.get('/departments/');
    return response.data;
  },

  /**
   * Get one department (includes `is_assigned` for the current doctor).
   */
  async getDepartment(id: string): Promise<Department> {
    const response = await apiClient.get(`/departments/${id}/`);
    return response.data;
  },
};

export default departmentService;
