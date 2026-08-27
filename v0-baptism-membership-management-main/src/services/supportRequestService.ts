import apiClient from './api';
import { HumanSupportMessage } from '@/types';

export const supportRequestService = {
  async create(data: { subject: string; message: string }): Promise<HumanSupportMessage> {
    const response = await apiClient.post('/api/support-requests', data);
    return response.data;
  },

  async reply(supportRequestId: number, message: string): Promise<HumanSupportMessage> {
    const response = await apiClient.post('/api/support-requests/reply', { supportRequestId, message });
    return response.data;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.put(`/api/support-requests/${id}/read`);
  },

  async closeRequest(id: number): Promise<void> {
    await apiClient.put(`/api/support-requests/${id}/close`);
  },

  async getRecipientRequests(): Promise<HumanSupportMessage[]> {
    const response = await apiClient.get('/api/support-requests/recipient');
    return response.data;
  },

  async getCandidateRequests(): Promise<HumanSupportMessage[]> {
    const response = await apiClient.get('/api/support-requests/candidate');
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/api/support-requests/unread-count');
    return response.data.count;
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get('/api/support-requests/pending-count');
    return response.data.count;
  },
};
