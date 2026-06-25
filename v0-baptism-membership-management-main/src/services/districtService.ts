import apiClient from './api';
import { District } from '@/types';

export const districtService = {
  getAll: () =>
    apiClient.get<District[]>('/api/districts').then(r => r.data),

  getByField: (fieldId: number) =>
    apiClient.get<District[]>(`/api/districts/by-field/${fieldId}`).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<District>(`/api/districts/${id}`).then(r => r.data),

  create: (data: {
    name: string; fieldId: number; code?: string; address?: string; phone?: string; email?: string;
    createHeadAccount?: boolean; headFullName?: string; headEmail?: string; headPhone?: string; headPassword?: string;
  }) =>
    apiClient.post<District>('/api/districts', data).then(r => r.data),

  update: (id: number, data: { name: string; fieldId?: number; code?: string; address?: string; phone?: string; email?: string }) =>
    apiClient.put<District>(`/api/districts/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/districts/${id}`),
};
