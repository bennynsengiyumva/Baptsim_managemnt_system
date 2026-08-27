import api from './api';
import { Cohort, CohortMember } from '@/types';

export const cohortService = {
  getAll: () =>
    api.get<Cohort[]>('/api/cohorts').then((r) => r.data),

  getById: (id: number) =>
    api.get<Cohort>(`/api/cohorts/${id}`).then((r) => r.data),

  getByInstructor: (instructorId: number) =>
    api.get<Cohort[]>(`/api/cohorts/by-instructor/${instructorId}`).then((r) => r.data),

  getByChurch: (churchId: number) =>
    api.get<Cohort[]>(`/api/cohorts/by-church/${churchId}`).then((r) => r.data),

  create: (data: any) =>
    api.post<Cohort>('/api/cohorts', data).then((r) => r.data),

  update: (id: number, data: any) =>
    api.put<Cohort>(`/api/cohorts/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/cohorts/${id}`),

  enrollCandidate: (cohortId: number, candidateId: number) =>
    api.post<CohortMember>(`/api/cohorts/${cohortId}/enroll`, { candidateId }).then((r) => r.data),

  approveEnrollment: (cohortId: number, candidateId: number) =>
    api.post<CohortMember>(`/api/cohorts/${cohortId}/approve/${candidateId}`).then((r) => r.data),

  bulkEnroll: (cohortId: number, candidateIds: number[]) =>
    api.post<CohortMember[]>(`/api/cohorts/${cohortId}/bulk-enroll`, { candidateIds }).then((r) => r.data),

  autoAssign: (cohortId: number) =>
    api.post<CohortMember[]>(`/api/cohorts/${cohortId}/auto-assign`).then((r) => r.data),

  withdraw: (cohortId: number, candidateId: number) =>
    api.delete(`/api/cohorts/${cohortId}/withdraw/${candidateId}`),

  getProgress: (cohortId: number) =>
    api.get(`/api/cohorts/${cohortId}/progress`).then((r) => r.data),

  getReport: (cohortId: number) =>
    api.get(`/api/cohorts/${cohortId}/report`).then((r) => r.data),

  assignCandidate: (candidateId: number, instructorId: number, cohortId: number) =>
    api.post('/api/cohorts/assign', { candidateId, instructorId, cohortId }).then((r) => r.data),

  getActiveByChurch: (churchId: number) =>
    api.get<Cohort[]>(`/api/cohorts/by-church/${churchId}/active`).then((r) => r.data),

  getInstructorStats: (instructorId: number) =>
    api.get(`/api/cohorts/instructor/${instructorId}/stats`).then((r) => r.data),

  getChurchStats: (churchId: number) =>
    api.get(`/api/cohorts/stats/church/${churchId}`).then((r) => r.data),
};
