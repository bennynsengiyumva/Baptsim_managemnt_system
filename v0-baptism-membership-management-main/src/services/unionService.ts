import apiClient from './api';
import { Union } from '@/types';

export const unionService = {
  getAll: () =>
    apiClient.get<Union[]>('/api/unions').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<Union>(`/api/unions/${id}`).then(r => r.data),

  create: (data: {
    name: string; code?: string; address?: string; phone?: string; email?: string;
    createHeadAccount?: boolean; headFullName?: string; headEmail?: string; headPhone?: string; headPassword?: string;
  }) =>
    apiClient.post<Union>('/api/unions', data).then(r => r.data),

  update: (id: number, data: { name: string; code?: string; address?: string; phone?: string; email?: string }) =>
    apiClient.put<Union>(`/api/unions/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/unions/${id}`),
};
