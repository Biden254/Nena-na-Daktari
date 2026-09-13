/**
 * Authentication service for handling login, logout, and user management.
 */

import apiClient from './api';
import {
  AuthTokens,
  LoginCredentials,
  RegisterData,
  User,
} from '../types';

const authService = {
  /**
   * Login user and store tokens.
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post('/auth/token/', credentials);
    const { access, refresh } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    // Get user profile
    const userResponse = await apiClient.get('/auth/profile/');
    return {
      user: userResponse.data,
      tokens: { access, refresh },
    };
  },

  /**
   * Register new user.
   */
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post('/auth/register/', data);
    const { user, tokens } = response.data;

    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);

    return { user, tokens };
  },

  /**
   * Logout user and clear tokens.
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        // Logout even if API call fails
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Get current user profile.
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored access token.
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },
};

export default authService;
