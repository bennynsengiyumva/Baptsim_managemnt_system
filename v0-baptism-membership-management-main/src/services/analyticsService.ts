import apiClient from './api';

export const analyticsService = {
  getKpiCards: () =>
    apiClient.get<any>('/api/analytics/kpi-cards').then((r) => r.data),

  getBaptismStats: (period = 'MONTHLY', year?: number) =>
    apiClient.get<any>('/api/analytics/baptism-stats', { params: { period, year } }).then((r) => r.data),

  getCandidateProgress: () =>
    apiClient.get<any[]>('/api/analytics/candidate-progress').then((r) => r.data),

  getLessonCompletion: () =>
    apiClient.get<any>('/api/analytics/lesson-completion').then((r) => r.data),

  getInstructorPerformance: () =>
    apiClient.get<any[]>('/api/analytics/instructor-performance').then((r) => r.data),

  getChurchTrends: () =>
    apiClient.get<any[]>('/api/analytics/church-trends').then((r) => r.data),

  getDemographics: () =>
    apiClient.get<any>('/api/analytics/demographics').then((r) => r.data),

  getRetentionAndGrowth: () =>
    apiClient.get<any>('/api/analytics/retention-growth').then((r) => r.data),
};
