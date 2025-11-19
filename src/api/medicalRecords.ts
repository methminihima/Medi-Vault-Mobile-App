import { apiClient } from './index';
import { MedicalRecord, CreateMedicalRecordDto, UpdateMedicalRecordDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const medicalRecordsApi = {
  /**
   * Get all medical records with pagination
   */
  getMedicalRecords: async (params?: {
    page?: number;
    limit?: number;
    patientId?: number;
  }): Promise<PaginatedResponse<MedicalRecord>> => {
    return apiClient.get('/medical-records', { params });
  },

  /**
   * Get medical record by ID
   */
  getMedicalRecordById: async (id: number): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.get(`/medical-records/${id}`);
  },

  /**
   * Create new medical record
   */
  createMedicalRecord: async (
    data: CreateMedicalRecordDto
  ): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.post('/medical-records', data);
  },

  /**
   * Update medical record
   */
  updateMedicalRecord: async (
    id: number,
    data: UpdateMedicalRecordDto
  ): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.put(`/medical-records/${id}`, data);
  },

  /**
   * Delete medical record
   */
  deleteMedicalRecord: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/medical-records/${id}`);
  },

  /**
   * Get medical records by patient ID
   */
  getMedicalRecordsByPatient: async (patientId: number): Promise<ApiResponse<MedicalRecord[]>> => {
    return apiClient.get(`/medical-records/patient/${patientId}`);
  },

  /**
   * Get patient vital signs history
   */
  getVitalSignsHistory: async (patientId: number): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/medical-records/patient/${patientId}/vital-signs`);
  },

  /**
   * Add vital signs to record
   */
  addVitalSigns: async (recordId: number, vitalSigns: any): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.post(`/medical-records/${recordId}/vital-signs`, vitalSigns);
  },
};
