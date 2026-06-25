import apiClient from './api';
import { ActivityLog } from '@/types';

export const activityLogService = {
  getAll: () =>
    apiClient.get<ActivityLog[]>('/api/activity-logs').then((r) => r.data),

  getByUser: (userId: number) =>
    apiClient.get<ActivityLog[]>(`/api/activity-logs/user/${userId}`).then((r) => r.data),
};
