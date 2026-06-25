import apiClient from './api';
import { FirstChurchElder } from '@/types';

export const firstChurchElderService = {
  getAll: () =>
    apiClient.get<FirstChurchElder[]>('/api/first-church-elders').then(r => r.data),

  getByChurch: (churchId: number) =>
    apiClient.get<FirstChurchElder[]>(`/api/first-church-elders/by-church/${churchId}`).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<FirstChurchElder>(`/api/first-church-elders/${id}`).then(r => r.data),

  create: (data: { fullName: string; email: string; phone?: string; churchId: number }) =>
    apiClient.post<FirstChurchElder>('/api/first-church-elders', data).then(r => r.data),

  update: (id: number, data: { fullName?: string; phone?: string; churchId?: number }) =>
    apiClient.put<FirstChurchElder>(`/api/first-church-elders/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/first-church-elders/${id}`),
};
