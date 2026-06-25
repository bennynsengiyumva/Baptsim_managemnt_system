import apiClient from './api';

export const transferService = {
  getAll: () =>
    apiClient.get<any[]>('/api/transfers').then(r => r.data),

  requestByMember: (memberId: number, toChurchId: number, reason: string) =>
    apiClient.post<any>('/api/transfers/request-by-member', { memberId, toChurchId, reason }).then(r => r.data),

  requestByChurch: (memberId: number, toChurchId: number, reason: string) =>
    apiClient.post<any>('/api/transfers/request-by-church', { memberId, toChurchId, reason }).then(r => r.data),

  approveFromChurch: (id: number) =>
    apiClient.post<any>(`/api/transfers/${id}/approve-from`).then(r => r.data),

  approveToChurch: (id: number) =>
    apiClient.post<any>(`/api/transfers/${id}/approve-to`).then(r => r.data),

  rejectTransfer: (id: number) =>
    apiClient.post<any>(`/api/transfers/${id}/reject`).then(r => r.data),

  getByFromChurch: (churchId: number) =>
    apiClient.get<any[]>(`/api/transfers/by-from-church/${churchId}`).then(r => r.data),

  getByToChurch: (churchId: number) =>
    apiClient.get<any[]>(`/api/transfers/by-to-church/${churchId}`).then(r => r.data),

  getByMember: (memberId: number) =>
    apiClient.get<any[]>(`/api/transfers/by-member/${memberId}`).then(r => r.data),

  getAnalytics: () =>
    apiClient.get<any>('/api/transfers/analytics').then(r => r.data),
};
