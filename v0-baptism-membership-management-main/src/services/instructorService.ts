import apiClient from './api';
import { Instructor, FilterParams } from '@/types';

export const instructorService = {

  getAllInstructors: async (params?: FilterParams) => {
    const response = await apiClient.get('/api/instructors', { params });
    return response.data;
  },

  getInstructorById: async (id: string) => {
    const response = await apiClient.get(`/api/instructors/${id}`);
    return response.data.data ?? response.data;
  },

  createInstructor: async (instructor: Partial<Instructor>) => {
    const response = await apiClient.post('/api/instructors', instructor);
    return response.data.data ?? response.data;
  },

  updateInstructor: async (id: string, instructor: Partial<Instructor>) => {
    const response = await apiClient.put(`/api/instructors/${id}`, instructor);
    return response.data.data ?? response.data;
  },

  deleteInstructor: async (id: string) => {
    await apiClient.delete(`/api/instructors/${id}`);
  },

  // ✅ Bulk assign candidates from instructor side
  assignCandidates: async (instructorId: string, candidateIds: string[]) => {
    const response = await apiClient.post(
      `/api/instructors/${instructorId}/assign-candidates`,
      candidateIds.map(Number) // backend expects List<Long>
    );
    return response.data.data ?? response.data;
  },

  getStatistics: async () => {
    const response = await apiClient.get('/api/instructors/stats');
    return response.data.data ?? response.data;
  },
};