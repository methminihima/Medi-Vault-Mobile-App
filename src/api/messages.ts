import { apiClient } from './index';
import { ChatMessage } from '@types/models';
import { ApiResponse, PaginatedResponse } from '@types/api';

export const messagesApi = {
  /**
   * Get conversations list
   */
  getConversations: async (): Promise<ApiResponse<any[]>> => {
    return apiClient.get('/messages/conversations');
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (
    conversationId: number,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<ChatMessage>> => {
    return apiClient.get(`/messages/conversations/${conversationId}`, { params });
  },

  /**
   * Send a message
   */
  sendMessage: async (recipientId: number, content: string): Promise<ApiResponse<ChatMessage>> => {
    return apiClient.post('/messages', {
      recipientId,
      content,
    });
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (conversationId: number): Promise<ApiResponse<void>> => {
    return apiClient.patch(`/messages/conversations/${conversationId}/read`);
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    return apiClient.get('/messages/unread-count');
  },

  /**
   * Delete message
   */
  deleteMessage: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/messages/${id}`);
  },

  /**
   * Search messages
   */
  searchMessages: async (query: string): Promise<ApiResponse<ChatMessage[]>> => {
    return apiClient.get('/messages/search', { params: { q: query } });
  },
};
