import apiClient from './api';
import { SpiritualPreparation, ApiResponse, PaginatedResponse, FilterParams } from '@/types';

export const spiritualPrepService = {
  // Get all spiritual preparations
  getAllSpiritualPreps: async (params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<SpiritualPreparation>>>('/api/spiritual', { params });
    return response.data;
  },

  // Get single spiritual prep by ID
  getSpiritualPrepById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<SpiritualPreparation>>(`/api/spiritual/${id}`);
    return response.data;
  },

  // Create new spiritual preparation
  createSpiritualPrep: async (prep: Omit<SpiritualPreparation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post<ApiResponse<SpiritualPreparation>>('/api/spiritual', prep);
    return response.data;
  },

  // Update spiritual preparation
  updateSpiritualPrep: async (id: string, prep: Partial<SpiritualPreparation>) => {
    const response = await apiClient.put<ApiResponse<SpiritualPreparation>>(`/api/spiritual/${id}`, prep);
    return response.data;
  },

  // Delete spiritual preparation
  deleteSpiritualPrep: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/spiritual/${id}`);
    return response.data;
  },

  // Get preparations by candidate
  getPrepsByCandidate: async (candidateId: string, params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<SpiritualPreparation>>>(`/api/candidates/${candidateId}/spiritual-preparations`, { params });
    return response.data;
  },
};
