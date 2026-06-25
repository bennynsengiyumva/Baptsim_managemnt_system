import apiClient from './api';
import { ChurchField } from '@/types';

export const fieldService = {
  getAll: () =>
    apiClient.get<ChurchField[]>('/api/fields').then(r => r.data),

  getByUnion: (unionId: number) =>
    apiClient.get<ChurchField[]>(`/api/fields/by-union/${unionId}`).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ChurchField>(`/api/fields/${id}`).then(r => r.data),

  create: (data: {
    name: string; unionId: number; code?: string; address?: string; phone?: string; email?: string;
    createHeadAccount?: boolean; headFullName?: string; headEmail?: string; headPhone?: string; headPassword?: string;
  }) =>
    apiClient.post<ChurchField>('/api/fields', data).then(r => r.data),

  update: (id: number, data: { name: string; unionId?: number; code?: string; address?: string; phone?: string; email?: string }) =>
    apiClient.put<ChurchField>(`/api/fields/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/fields/${id}`),
};
