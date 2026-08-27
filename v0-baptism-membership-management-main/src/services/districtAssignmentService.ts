import apiClient from './api';

export interface DistrictAssignment {
  id: number;
  districtId: number;
  districtName: string;
  pastorId: number;
  pastorName: string;
  pastorEmail: string;
  startDate: string;
  endDate: string | null;
  status: string;
  reason?: string;
  performedBy?: string;
}

export interface TransferRequest {
  districtId: number;
  newHeadPastorId: number;
  effectiveDate: string;
  reason?: string;
}

export const districtAssignmentService = {
  transferHead: async (data: TransferRequest) => {
    const response = await apiClient.post('/api/district-assignments/transfer', data);
    return response.data;
  },

  reassignHead: async (data: TransferRequest) => {
    const response = await apiClient.post('/api/district-assignments/reassign', data);
    return response.data;
  },

  getActiveForDistrict: async (districtId: string) => {
    const response = await apiClient.get(`/api/district-assignments/district/${districtId}`);
    return response.data;
  },

  getActiveForPastor: async (pastorId: string) => {
    const response = await apiClient.get(`/api/district-assignments/pastor/${pastorId}`);
    return response.data;
  },

  getHistory: async (districtId: string) => {
    const response = await apiClient.get(`/api/district-assignments/district/${districtId}/history`);
    return response.data;
  },

  getHistoryForPastor: async (pastorId: string) => {
    const response = await apiClient.get(`/api/district-assignments/pastor/${pastorId}/history`);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/api/district-assignments');
    return response.data;
  },
};
