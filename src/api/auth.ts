import { apiClient } from './index';
import { LoginCredentials, RegisterData } from '@types/auth';
import { User } from '@types/models';
import { ApiResponse } from '@types/api';

export const authApi = {
  /**
   * Login user with credentials
   */
  login: async (
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    return apiClient.post('/auth/login', credentials);
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
    return apiClient.post('/auth/register', data);
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/logout');
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get('/auth/me');
  },

  /**
   * Refresh authentication session
   */
  refreshSession: async (): Promise<ApiResponse<{ user: User; token: string }>> => {
    return apiClient.post('/auth/refresh');
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
