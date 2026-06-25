import apiClient from './api';
import { Candidate, CandidateDetail, FilterParams } from '@/types';

export const candidateService = {

  getAllCandidates: async (params?: FilterParams) => {
    const response = await apiClient.get('/api/candidates', { params });
    return response.data;
  },

  getCandidateById: async (id: string) => {
    const response = await apiClient.get(`/api/candidates/${id}`);
    return response.data.data ?? response.data;
  },

  createCandidate: async (candidate: Partial<Candidate>) => {
    const response = await apiClient.post('/api/candidates', candidate);
    return response.data.data ?? response.data;
  },

  updateCandidate: async (id: string, candidate: Partial<Candidate>) => {
    const response = await apiClient.put(`/api/candidates/${id}`, candidate);
    return response.data.data ?? response.data;
  },

  deleteCandidate: async (id: string) => {
    await apiClient.delete(`/api/candidates/${id}`);
  },

  // ✅ Assign instructor to a single candidate
  assignInstructor: async (candidateId: string, instructorId: string) => {
    const response = await apiClient.patch(
      `/api/candidates/${candidateId}/assign-instructor/${instructorId}`
    );
    return response.data.data ?? response.data;
  },

  // ✅ Remove instructor from a candidate
  unassignInstructor: async (candidateId: string) => {
    const response = await apiClient.patch(`/api/candidates/${candidateId}/unassign-instructor`);
    return response.data.data ?? response.data;
  },

  // ✅ Get all candidates assigned to an instructor
  getCandidatesByInstructor: async (instructorId: string) => {
    const response = await apiClient.get(`/api/candidates/by-instructor/${instructorId}`);
    return response.data.data ?? response.data;
  },

  // ✅ Get candidates with no instructor assigned
  getUnassignedCandidates: async (churchId?: string) => {
    const response = await apiClient.get('/api/candidates/unassigned', {
      params: churchId ? { churchId } : undefined,
    });
    return response.data.data ?? response.data;
  },

  getCandidatesByEmail: async (email: string) => {
    const response = await apiClient.get(`/api/candidates/by-email/${encodeURIComponent(email)}`);
    return response.data.data ?? response.data;
  },

  getDashboard: async (candidateId: string) => {
    const response = await apiClient.get(`/api/candidates/dashboard/${candidateId}`);
    return response.data.data ?? response.data;
  },

  getCandidateDetail: async (candidateId: string) => {
    const response = await apiClient.get<CandidateDetail>(`/api/candidates/${candidateId}/detail`);
    return response.data;
  },
};
