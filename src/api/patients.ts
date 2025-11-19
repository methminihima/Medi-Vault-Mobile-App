import { apiClient } from './index';
import { Patient, CreatePatientDto, UpdatePatientDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const patientsApi = {
  /**
   * Get all patients with pagination
   */
  getPatients: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Patient>> => {
    return apiClient.get('/patients', { params });
  },

  /**
   * Get patient by ID
   */
  getPatientById: async (id: number): Promise<ApiResponse<Patient>> => {
    return apiClient.get(`/patients/${id}`);
  },

  /**
   * Get patient by NIC (National Identity Card)
   */
  getPatientByNIC: async (nic: string): Promise<ApiResponse<Patient>> => {
    return apiClient.get(`/patients/nic/${nic}`);
  },

  /**
   * Create new patient
   */
  createPatient: async (data: CreatePatientDto): Promise<ApiResponse<Patient>> => {
    return apiClient.post('/patients', data);
  },

  /**
   * Update patient
   */
  updatePatient: async (id: number, data: UpdatePatientDto): Promise<ApiResponse<Patient>> => {
    return apiClient.put(`/patients/${id}`, data);
  },

  /**
   * Delete patient
   */
  deletePatient: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/patients/${id}`);
  },

  /**
   * Get patient's medical history
   */
  getPatientMedicalHistory: async (patientId: number): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/patients/${patientId}/medical-history`);
  },

  /**
   * Get patient's appointments
   */
  getPatientAppointments: async (patientId: number): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/patients/${patientId}/appointments`);
  },
};
