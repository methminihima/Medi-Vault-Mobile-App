import { apiClient } from './index';
import { Prescription, CreatePrescriptionDto, UpdatePrescriptionDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const prescriptionsApi = {
  /**
   * Get all prescriptions with pagination
   */
  getPrescriptions: async (params?: {
    page?: number;
    limit?: number;
    patientId?: number;
    status?: string;
  }): Promise<PaginatedResponse<Prescription>> => {
    return apiClient.get('/prescriptions', { params });
  },

  /**
   * Get prescription by ID
   */
  getPrescriptionById: async (id: number): Promise<ApiResponse<Prescription>> => {
    return apiClient.get(`/prescriptions/${id}`);
  },

  /**
   * Create new prescription
   */
  createPrescription: async (data: CreatePrescriptionDto): Promise<ApiResponse<Prescription>> => {
    return apiClient.post('/prescriptions', data);
  },

  /**
   * Update prescription
   */
  updatePrescription: async (
    id: number,
    data: UpdatePrescriptionDto
  ): Promise<ApiResponse<Prescription>> => {
    return apiClient.put(`/prescriptions/${id}`, data);
  },

  /**
   * Delete prescription
   */
  deletePrescription: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/prescriptions/${id}`);
  },

  /**
   * Verify prescription by QR code
   */
  verifyPrescriptionByQR: async (qrCode: string): Promise<ApiResponse<Prescription>> => {
    return apiClient.post('/prescriptions/verify-qr', { qrCode });
  },

  /**
   * Mark prescription as dispensed
   */
  dispensePrescription: async (
    id: number,
    pharmacistId: number
  ): Promise<ApiResponse<Prescription>> => {
    return apiClient.patch(`/prescriptions/${id}/dispense`, { pharmacistId });
  },

  /**
   * Get prescriptions by patient ID
   */
  getPrescriptionsByPatient: async (patientId: number): Promise<ApiResponse<Prescription[]>> => {
    return apiClient.get(`/prescriptions/patient/${patientId}`);
  },

  /**
   * Get prescription QR code data
   */
  getPrescriptionQRCode: async (id: number): Promise<ApiResponse<string>> => {
    return apiClient.get(`/prescriptions/${id}/qr-code`);
  },
};
