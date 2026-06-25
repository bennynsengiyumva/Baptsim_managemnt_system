import apiClient from './api';
import { AppNotification } from '@/types';

export const notificationService = {
  getMyNotifications: () =>
    apiClient.get<AppNotification[]>('/api/notifications/me').then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<number>('/api/notifications/me/unread-count').then((r) => r.data),

  markAsRead: (id: string) =>
    apiClient.put(`/api/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.put('/api/notifications/me/read-all'),
};
