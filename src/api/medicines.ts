import { apiClient } from './index';
import { Medicine, CreateMedicineDto, UpdateMedicineDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const medicinesApi = {
  /**
   * Get all medicines with pagination
   */
  getMedicines: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Medicine>> => {
    return apiClient.get('/medicines', { params });
  },

  /**
   * Get medicine by ID
   */
  getMedicineById: async (id: number): Promise<ApiResponse<Medicine>> => {
    return apiClient.get(`/medicines/${id}`);
  },

  /**
   * Create new medicine
   */
  createMedicine: async (data: CreateMedicineDto): Promise<ApiResponse<Medicine>> => {
    return apiClient.post('/medicines', data);
  },

  /**
   * Update medicine
   */
  updateMedicine: async (id: number, data: UpdateMedicineDto): Promise<ApiResponse<Medicine>> => {
    return apiClient.put(`/medicines/${id}`, data);
  },

  /**
   * Delete medicine
   */
  deleteMedicine: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/medicines/${id}`);
  },

  /**
   * Search medicines by name
   */
  searchMedicines: async (query: string): Promise<ApiResponse<Medicine[]>> => {
    return apiClient.get('/medicines/search', { params: { q: query } });
  },

  /**
   * Get low stock medicines
   */
  getLowStockMedicines: async (): Promise<ApiResponse<Medicine[]>> => {
    return apiClient.get('/medicines/low-stock');
  },

  /**
   * Update medicine stock
   */
  updateMedicineStock: async (
    id: number,
    quantity: number,
    operation: 'add' | 'subtract'
  ): Promise<ApiResponse<Medicine>> => {
    return apiClient.patch(`/medicines/${id}/stock`, { quantity, operation });
  },
};
