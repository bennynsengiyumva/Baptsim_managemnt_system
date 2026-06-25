import apiClient from './api';
import { Membership, ApiResponse, PaginatedResponse, FilterParams } from '@/types';

export const membershipService = {
  // Get all memberships
  getAllMemberships: async (params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Membership>>>('/api/memberships', { params });
    return response.data;
  },

  // Get single membership by ID
  getMembershipById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Membership>>(`/api/memberships/${id}`);
    return response.data;
  },

  // Create new membership
  createMembership: async (membership: Omit<Membership, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post<ApiResponse<Membership>>('/api/memberships', membership);
    return response.data;
  },

  // Update membership
  updateMembership: async (id: string, membership: Partial<Membership>) => {
    const response = await apiClient.put<ApiResponse<Membership>>(`/api/memberships/${id}`, membership);
    return response.data;
  },

  // Delete membership
  deleteMembership: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/memberships/${id}`);
    return response.data;
  },

  // Get membership statistics
  getStatistics: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/memberships/stats');
    return response.data;
  },

  // Approve membership
  approveMembership: async (id: string, approverId: string) => {
    const response = await apiClient.post<ApiResponse<Membership>>(`/api/memberships/${id}/approve`, { approverId });
    return response.data;
  },
};
