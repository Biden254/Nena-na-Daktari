/**
 * TypeScript type definitions for Nena na Daktari frontend.
 */

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'doctor' | 'admin';
  /** Departments this doctor works in (admin-managed). */
  departments?: Department[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'admin';
}

// Patient types
export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  /** System-generated Unique Hospital Identifier — read-only. */
  uhi: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PatientCreateData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  phone?: string;
}

// Department types
export interface Department {
  id: string;
  name: string;
  /** Present on detail responses: whether the current doctor is assigned. */
  is_assigned?: boolean;
}

// Encounter types
export interface Encounter {
  id: string;
  patient: string;
  patient_name: string;
  patient_uhi: string;
  doctor: string;
  doctor_name: string;
  department: string;
  department_name: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface EncounterCreateData {
  patient: string;
  department: string;
  notes?: string;
}

// API response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
