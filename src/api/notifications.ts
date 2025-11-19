import { apiClient } from './index';
import { Notification } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const notificationsApi = {
  /**
   * Get all notifications with pagination
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<PaginatedResponse<Notification>> => {
    return apiClient.get('/notifications', { params });
  },

  /**
   * Get notification by ID
   */
  getNotificationById: async (id: number): Promise<ApiResponse<Notification>> => {
    return apiClient.get(`/notifications/${id}`);
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: number): Promise<ApiResponse<Notification>> => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    return apiClient.patch('/notifications/read-all');
  },

  /**
   * Delete notification
   */
  deleteNotification: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    return apiClient.get('/notifications/unread-count');
  },

  /**
   * Register device for push notifications
   */
  registerDevice: async (
    deviceToken: string,
    platform: 'ios' | 'android'
  ): Promise<ApiResponse<void>> => {
    return apiClient.post('/notifications/register-device', {
      deviceToken,
      platform,
    });
  },

  /**
   * Unregister device from push notifications
   */
  unregisterDevice: async (deviceToken: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/notifications/unregister-device', { deviceToken });
  },
};
