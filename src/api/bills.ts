import { apiClient } from './index';
import { Bill, CreateBillDto, UpdateBillDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const billsApi = {
  /**
   * Get all bills with pagination
   */
  getBills: async (params?: {
    page?: number;
    limit?: number;
    patientId?: number;
    status?: string;
  }): Promise<PaginatedResponse<Bill>> => {
    return apiClient.get('/bills', { params });
  },

  /**
   * Get bill by ID
   */
  getBillById: async (id: number): Promise<ApiResponse<Bill>> => {
    return apiClient.get(`/bills/${id}`);
  },

  /**
   * Create new bill
   */
  createBill: async (data: CreateBillDto): Promise<ApiResponse<Bill>> => {
    return apiClient.post('/bills', data);
  },

  /**
   * Update bill
   */
  updateBill: async (id: number, data: UpdateBillDto): Promise<ApiResponse<Bill>> => {
    return apiClient.put(`/bills/${id}`, data);
  },

  /**
   * Delete bill
   */
  deleteBill: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/bills/${id}`);
  },

  /**
   * Get bills by patient ID
   */
  getBillsByPatient: async (patientId: number): Promise<ApiResponse<Bill[]>> => {
    return apiClient.get(`/bills/patient/${patientId}`);
  },

  /**
   * Get unpaid bills
   */
  getUnpaidBills: async (): Promise<ApiResponse<Bill[]>> => {
    return apiClient.get('/bills/unpaid');
  },

  /**
   * Mark bill as paid
   */
  markBillAsPaid: async (id: number): Promise<ApiResponse<Bill>> => {
    return apiClient.patch(`/bills/${id}/paid`);
  },
};
