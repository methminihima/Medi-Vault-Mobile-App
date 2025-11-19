import { apiClient } from './index';
import { LabTest, CreateLabTestDto, UpdateLabTestDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const labTestsApi = {
  /**
   * Get all lab tests with pagination
   */
  getLabTests: async (params?: {
    page?: number;
    limit?: number;
    patientId?: number;
    status?: string;
  }): Promise<PaginatedResponse<LabTest>> => {
    return apiClient.get('/lab-tests', { params });
  },

  /**
   * Get lab test by ID
   */
  getLabTestById: async (id: number): Promise<ApiResponse<LabTest>> => {
    return apiClient.get(`/lab-tests/${id}`);
  },

  /**
   * Create new lab test order
   */
  createLabTest: async (data: CreateLabTestDto): Promise<ApiResponse<LabTest>> => {
    return apiClient.post('/lab-tests', data);
  },

  /**
   * Update lab test
   */
  updateLabTest: async (id: number, data: UpdateLabTestDto): Promise<ApiResponse<LabTest>> => {
    return apiClient.put(`/lab-tests/${id}`, data);
  },

  /**
   * Delete lab test
   */
  deleteLabTest: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/lab-tests/${id}`);
  },

  /**
   * Upload lab test results
   */
  uploadLabTestResults: async (
    id: number,
    results: any,
    files?: FormData
  ): Promise<ApiResponse<LabTest>> => {
    return apiClient.post(`/lab-tests/${id}/results`, files || results, {
      headers: files ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  /**
   * Get lab tests by patient ID
   */
  getLabTestsByPatient: async (patientId: number): Promise<ApiResponse<LabTest[]>> => {
    return apiClient.get(`/lab-tests/patient/${patientId}`);
  },

  /**
   * Mark lab test as completed
   */
  completeLabTest: async (id: number): Promise<ApiResponse<LabTest>> => {
    return apiClient.patch(`/lab-tests/${id}/complete`);
  },
};
