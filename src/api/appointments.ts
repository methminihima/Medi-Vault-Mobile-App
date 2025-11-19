import { apiClient } from './index';
import { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const appointmentsApi = {
  /**
   * Get all appointments with pagination
   */
  getAppointments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    doctorId?: number;
    patientId?: number;
  }): Promise<PaginatedResponse<Appointment>> => {
    return apiClient.get('/appointments', { params });
  },

  /**
   * Get appointment by ID
   */
  getAppointmentById: async (id: number): Promise<ApiResponse<Appointment>> => {
    return apiClient.get(`/appointments/${id}`);
  },

  /**
   * Create new appointment
   */
  createAppointment: async (data: CreateAppointmentDto): Promise<ApiResponse<Appointment>> => {
    return apiClient.post('/appointments', data);
  },

  /**
   * Update appointment
   */
  updateAppointment: async (
    id: number,
    data: UpdateAppointmentDto
  ): Promise<ApiResponse<Appointment>> => {
    return apiClient.put(`/appointments/${id}`, data);
  },

  /**
   * Cancel appointment
   */
  cancelAppointment: async (id: number, reason?: string): Promise<ApiResponse<Appointment>> => {
    return apiClient.patch(`/appointments/${id}/cancel`, { reason });
  },

  /**
   * Complete appointment
   */
  completeAppointment: async (id: number): Promise<ApiResponse<Appointment>> => {
    return apiClient.patch(`/appointments/${id}/complete`);
  },

  /**
   * Get appointments by date range
   */
  getAppointmentsByDateRange: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Appointment[]>> => {
    return apiClient.get('/appointments/date-range', {
      params: { startDate, endDate },
    });
  },

  /**
   * Get available time slots for a doctor
   */
  getAvailableSlots: async (doctorId: number, date: string): Promise<ApiResponse<string[]>> => {
    return apiClient.get(`/appointments/available-slots`, {
      params: { doctorId, date },
    });
  },
};
