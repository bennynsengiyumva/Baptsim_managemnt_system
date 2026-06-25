import apiClient from './api';
import { Certificate, ApiResponse, PaginatedResponse, FilterParams, BaptismRegistration } from '@/types';

export const certificateService = {
  // Get unsigned certificates (baptized but not yet signed by pastor)
  getUnsigned: async () => {
    const response = await apiClient.get<BaptismRegistration[]>('/api/certificates/unsigned');
    return response.data;
  },

  // Sign a certificate (pastor signs it)
  signCertificate: async (baptismId: string) => {
    await apiClient.put(`/api/certificates/${baptismId}/sign`);
  },

  // Get all certificates
  getAllCertificates: async (params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Certificate>>>('/api/certificates', { params });
    return response.data;
  },

  // Get single certificate by ID
  getCertificateById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Certificate>>(`/api/certificates/${id}`);
    return response.data;
  },

  // Create new certificate
  createCertificate: async (certificate: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post<ApiResponse<Certificate>>('/api/certificates', certificate);
    return response.data;
  },

  // Update certificate
  updateCertificate: async (id: string, certificate: Partial<Certificate>) => {
    const response = await apiClient.put<ApiResponse<Certificate>>(`/api/certificates/${id}`, certificate);
    return response.data;
  },

  // Delete certificate
  deleteCertificate: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/certificates/${id}`);
    return response.data;
  },

  // Get certificates by candidate
  getCertificatesByCandidate: async (candidateId: string, params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Certificate>>>(`/api/candidates/${candidateId}/certificates`, { params });
    return response.data;
  },

  // Download certificate (returns PDF)
  downloadCertificate: async (id: string) => {
    const response = await apiClient.get(`/api/certificates/${id}/download`, { responseType: 'blob' });
    return response.data;
  },
};
