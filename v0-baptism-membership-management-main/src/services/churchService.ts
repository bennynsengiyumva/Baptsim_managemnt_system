import apiClient from './api';
import { Church, ChurchDetail } from '@/types';

export type { Church };

export const churchService = {
  getAllChurches: async (): Promise<Church[]> => {
    const response = await apiClient.get('/api/churches');
    return response.data;
  },

  getChurchById: async (id: number): Promise<Church> => {
    const response = await apiClient.get(`/api/churches/${id}`);
    return response.data;
  },

  getChurchesByDistrict: async (districtId: number): Promise<Church[]> => {
    const response = await apiClient.get(`/api/churches/by-district/${districtId}`);
    return response.data;
  },

  getChurchDetail: async (id: number, dateFrom?: string, dateTo?: string): Promise<ChurchDetail> => {
    const params: any = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get(`/api/churches/${id}/detail`, { params });
    return response.data;
  },

  createChurch: async (data: {
    churchName: string; districtId: number; address?: string; phone?: string; email?: string;
    createElderAccount?: boolean; elderFullName?: string; elderEmail?: string; elderPhone?: string; elderPassword?: string;
  }): Promise<Church> => {
    const response = await apiClient.post('/api/churches', data);
    return response.data;
  },

  updateChurch: async (id: number, data: { churchName?: string; districtId?: number; address?: string; phone?: string; email?: string }): Promise<Church> => {
    const response = await apiClient.put(`/api/churches/${id}`, data);
    return response.data;
  },

  assignPastor: async (churchId: number, pastorId: number): Promise<Church> => {
    const response = await apiClient.put(`/api/churches/${churchId}/assign-pastor/${pastorId}`);
    return response.data;
  },

  unassignPastor: async (churchId: number): Promise<Church> => {
    const response = await apiClient.put(`/api/churches/${churchId}/unassign-pastor`);
    return response.data;
  },

  deleteChurch: async (id: number) => {
    const response = await apiClient.delete(`/api/churches/${id}`);
    return response.data;
  },
};

export default churchService;
