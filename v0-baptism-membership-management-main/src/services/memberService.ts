import apiClient from './api';

export const memberService = {
  getAll: () =>
    apiClient.get<any[]>('/api/members').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<any>(`/api/members/${id}`).then(r => r.data),

  getByChurch: (churchId: number) =>
    apiClient.get<any[]>(`/api/members/by-church/${churchId}`).then(r => r.data),

  getByDepartment: (departmentId: number) =>
    apiClient.get<any[]>(`/api/members/by-department/${departmentId}`).then(r => r.data),

  assignDepartment: (memberId: number, departmentId: number) =>
    apiClient.post<any>(`/api/members/${memberId}/departments/${departmentId}`).then(r => r.data),

  removeDepartment: (memberId: number, departmentId: number) =>
    apiClient.delete<any>(`/api/members/${memberId}/departments/${departmentId}`).then(r => r.data),

  updateDepartments: (memberId: number, departmentIds: number[]) =>
    apiClient.put<any>(`/api/members/${memberId}/departments`, departmentIds).then(r => r.data),
};
