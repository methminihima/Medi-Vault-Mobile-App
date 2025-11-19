import { apiClient } from './index';
import { Payment, CreatePaymentDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const paymentsApi = {
  /**
   * Get all payments with pagination
   */
  getPayments: async (params?: {
    page?: number;
    limit?: number;
    billId?: number;
    patientId?: number;
  }): Promise<PaginatedResponse<Payment>> => {
    return apiClient.get('/payments', { params });
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (id: number): Promise<ApiResponse<Payment>> => {
    return apiClient.get(`/payments/${id}`);
  },

  /**
   * Create new payment
   */
  createPayment: async (data: CreatePaymentDto): Promise<ApiResponse<Payment>> => {
    return apiClient.post('/payments', data);
  },

  /**
   * Get payments by bill ID
   */
  getPaymentsByBill: async (billId: number): Promise<ApiResponse<Payment[]>> => {
    return apiClient.get(`/payments/bill/${billId}`);
  },

  /**
   * Get payments by patient ID
   */
  getPaymentsByPatient: async (patientId: number): Promise<ApiResponse<Payment[]>> => {
    return apiClient.get(`/payments/patient/${patientId}`);
  },

  /**
   * Process payment
   */
  processPayment: async (paymentData: any): Promise<ApiResponse<Payment>> => {
    return apiClient.post('/payments/process', paymentData);
  },

  /**
   * Refund payment
   */
  refundPayment: async (id: number, reason?: string): Promise<ApiResponse<Payment>> => {
    return apiClient.post(`/payments/${id}/refund`, { reason });
  },
};
