import apiClient from './api';
import { AiChat, HumanSupportMessage } from '@/types';

export const aiAssistantService = {
  async ask(message: string): Promise<AiChat> {
    const response = await apiClient.post('/api/ai-assistant/ask', { message });
    return response.data;
  },

  async startChat(): Promise<AiChat> {
    const response = await apiClient.post('/api/ai-assistant/chat');
    return response.data;
  },

  async sendMessage(chatId: number | null, message: string): Promise<AiChat> {
    const response = await apiClient.post('/api/ai-assistant/message', { chatId, message });
    return response.data;
  },

  async sendFeedback(chatId: number, satisfied: boolean): Promise<AiChat> {
    const response = await apiClient.post('/api/ai-assistant/feedback', { chatId, satisfied });
    return response.data;
  },

  async escalate(chatId: number, recipientRole: string, subject: string, message: string): Promise<HumanSupportMessage> {
    const response = await apiClient.post('/api/ai-assistant/escalate', { chatId, recipientRole, subject, message });
    return response.data;
  },

  async getChatHistory(): Promise<AiChat[]> {
    const response = await apiClient.get('/api/ai-assistant/history');
    return response.data;
  },

  async getSupportHistory(): Promise<HumanSupportMessage[]> {
    const response = await apiClient.get('/api/ai-assistant/support-history');
    return response.data;
  },
};
