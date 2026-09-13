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
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  phone: string;
  national_id: string | null;
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
  national_id?: string;
}

// Encounter types
export interface Encounter {
  id: string;
  patient: string;
  patient_name: string;
  doctor: string;
  doctor_name: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface EncounterCreateData {
  patient: string;
  notes?: string;
}

// API response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
