import apiClient from './api';
import { Department } from '@/types';

export const departmentService = {
  getAll: () =>
    apiClient.get<Department[]>('/api/departments').then((r) => r.data),

  getByChurch: (churchId: number) =>
    apiClient.get<Department[]>(`/api/departments/church/${churchId}`).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Department>(`/api/departments/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; churchId: number; headMemberId?: number }) =>
    apiClient.post<Department>('/api/departments', data).then((r) => r.data),

  update: (id: string, data: { name: string; description?: string; headMemberId?: number }) =>
    apiClient.put<Department>(`/api/departments/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/api/departments/${id}`),

  toggleActive: (id: string) =>
    apiClient.put(`/api/departments/${id}/toggle`),

  setHead: (id: string, memberId: number) =>
    apiClient.put(`/api/departments/${id}/head/${memberId}`),

  removeHead: (id: string) =>
    apiClient.delete(`/api/departments/${id}/head`),
};
