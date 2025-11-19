import { apiClient } from './index';
import { Doctor, UpdateDoctorDto } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const doctorsApi = {
  /**
   * Get all doctors with pagination
   */
  getDoctors: async (params?: {
    page?: number;
    limit?: number;
    specialization?: string;
    search?: string;
  }): Promise<PaginatedResponse<Doctor>> => {
    return apiClient.get('/doctors', { params });
  },

  /**
   * Get doctor by ID
   */
  getDoctorById: async (id: number): Promise<ApiResponse<Doctor>> => {
    return apiClient.get(`/doctors/${id}`);
  },

  /**
   * Get doctor by user ID
   */
  getDoctorByUserId: async (userId: number): Promise<ApiResponse<Doctor>> => {
    return apiClient.get(`/doctors/user/${userId}`);
  },

  /**
   * Update doctor profile
   */
  updateDoctor: async (id: number, data: UpdateDoctorDto): Promise<ApiResponse<Doctor>> => {
    return apiClient.put(`/doctors/${id}`, data);
  },

  /**
   * Get doctor's appointments
   */
  getDoctorAppointments: async (doctorId: number, date?: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/doctors/${doctorId}/appointments`, {
      params: { date },
    });
  },

  /**
   * Get doctor's schedule
   */
  getDoctorSchedule: async (doctorId: number): Promise<ApiResponse<any>> => {
    return apiClient.get(`/doctors/${doctorId}/schedule`);
  },

  /**
   * Update doctor availability
   */
  updateDoctorAvailability: async (
    doctorId: number,
    availability: any
  ): Promise<ApiResponse<any>> => {
    return apiClient.put(`/doctors/${doctorId}/availability`, availability);
  },

  /**
   * Get doctors by specialization
   */
  getDoctorsBySpecialization: async (specialization: string): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get('/doctors/specialization', {
      params: { specialization },
    });
  },
};
