import type { ApiResponse } from '@/types/api';
import { apiClient } from './index';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  readAt?: string | null;
  metadata?: any;
}

export const notificationsApi = {
  list: async (): Promise<ApiResponse<AppNotification[]>> => {
    return apiClient.get('/notifications');
  },

  markRead: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`/notifications/${encodeURIComponent(id)}/read`);
  },

  markAllRead: async (): Promise<ApiResponse<{ updated: number }>> => {
    return apiClient.post('/notifications/mark-all-read');
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/notifications/${encodeURIComponent(id)}`);
  },
};
