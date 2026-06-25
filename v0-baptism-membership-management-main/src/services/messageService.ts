import apiClient from './api';
import { ApiResponse } from '@/types';

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  receiverId: number;
  receiverName: string;
  receiverEmail: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export const messageService = {
  send: async (receiverId: number, subject: string, content: string) => {
    const res = await apiClient.post<ApiResponse<Message>>('/api/messages', { receiverId, subject, content });
    return res.data;
  },

  getInbox: async () => {
    const res = await apiClient.get<Message[]>('/api/messages/inbox');
    return res.data;
  },

  getSent: async () => {
    const res = await apiClient.get<Message[]>('/api/messages/sent');
    return res.data;
  },

  getConversation: async (userId: number) => {
    const res = await apiClient.get<Message[]>(`/api/messages/conversation/${userId}`);
    return res.data;
  },

  markAsRead: async (id: number) => {
    const res = await apiClient.put(`/api/messages/${id}/read`);
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await apiClient.get<{ count: number }>('/api/messages/unread-count');
    return res.data.count;
  },
};
