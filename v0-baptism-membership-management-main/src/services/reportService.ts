import apiClient from './api';
import { ReportData, ApiResponse, PaginatedResponse, FilterParams } from '@/types';

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function buildParams(dateFrom?: string, dateTo?: string, status?: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (status) params.status = status;
  return params;
}

const TAB_TO_REPORT_TYPE: Record<string, string> = {
  'my-progress': 'candidate-progress',
  'my-lessons': 'candidate-lessons',
  'my-baptism-status': 'candidate-baptism-status',
  'my-certificates': 'candidate-certificates',
  'my-membership': 'candidate-membership',
  'assigned-candidates': 'assigned-candidates',
  'instructor-progress': 'candidate-progress',
  'lesson-completion': 'lesson-completion',
  'elder-baptism-requests': 'baptism-requests',
  'elder-approved': 'approved-candidates',
  'elder-ready': 'candidates-ready',
  'pastor-events': 'baptism-events',
  'pastor-baptized': 'baptized-candidates',
  'pastor-certificates': 'certificate-signing',
  'pastor-course-completion': 'course-completion',
  'field-district-baptism': 'district-baptism',
  'field-certificate-stats': 'certificate-stats',
  'field-instructor-activity': 'instructor-activity',
  'rum-national': 'national-baptism',
  'rum-district-comparison': 'district-comparison',
  'admin-user-activity': 'user-activity',
  'admin-auth': 'auth-report',
  'admin-cert-downloads': 'certificate-downloads',
  'admin-messaging': 'messaging-report',
  'admin-audit': 'audit-logs',
  'church': 'church',
  'district': 'district',
  'field': 'field',
};

function mapTabToReportType(tab: string): string {
  return TAB_TO_REPORT_TYPE[tab] || tab;
}

export const reportService = {
  getAllReports: async (params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ReportData>>>('/api/reports', { params });
    return response.data;
  },

  getReportById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<ReportData>>(`/api/reports/${id}`);
    return response.data;
  },

  generateReport: async (type: string, filters: any, format: 'PDF' | 'CSV' | 'JSON') => {
    const response = await apiClient.post<ApiResponse<ReportData>>('/api/reports/generate', { type, filters, format });
    return response.data;
  },

  deleteReport: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/reports/${id}`);
    return response.data;
  },

  downloadReport: async (id: string) => {
    const response = await apiClient.get(`/api/reports/${id}/download`, { responseType: 'blob' });
    return response.data;
  },

  generateChurchReport: async (churchId: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/api/churches/${churchId}/detail`);
    return response.data;
  },

  generateDistrictReport: async (districtId: number, dateFrom?: string, dateTo?: string, status?: string) => {
    const params = buildParams(dateFrom, dateTo, status);
    const response = await apiClient.get<ApiResponse<any>>(`/api/reports/district/${districtId}`, { params });
    return response.data;
  },

  generateFieldReport: async (fieldId: number, dateFrom?: string, dateTo?: string, status?: string) => {
    const params = buildParams(dateFrom, dateTo, status);
    const response = await apiClient.get<ApiResponse<any>>(`/api/reports/field/${fieldId}`, { params });
    return response.data;
  },

  downloadChurchReport: async (churchId: number, dateFrom?: string, dateTo?: string, format: string = 'pdf') => {
    const params: any = { format };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get(`/api/reports/church/${churchId}`, { params, responseType: 'blob' });
    const ext = format === 'excel' || format === 'xlsx' ? 'xlsx' : 'pdf';
    triggerDownload(response.data, `church-report-${churchId}.${ext}`);
  },

  downloadDistrictReport: async (districtId: number, dateFrom?: string, dateTo?: string, format: string = 'pdf') => {
    const params: any = { format };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get(`/api/reports/district/${districtId}`, { params, responseType: 'blob' });
    const ext = format === 'excel' || format === 'xlsx' ? 'xlsx' : 'pdf';
    triggerDownload(response.data, `district-report-${districtId}.${ext}`);
  },

  downloadFieldReport: async (fieldId: number, dateFrom?: string, dateTo?: string, format: string = 'pdf') => {
    const params: any = { format };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get(`/api/reports/field/${fieldId}`, { params, responseType: 'blob' });
    const ext = format === 'excel' || format === 'xlsx' ? 'xlsx' : 'pdf';
    triggerDownload(response.data, `field-report-${fieldId}.${ext}`);
  },

  getDashboardStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/dashboard/stats');
    return response.data;
  },

  getCandidateStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/stats/candidates');
    return response.data;
  },

  getMembershipStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/stats/memberships');
    return response.data;
  },

  getBaptismStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/stats/baptisms');
    return response.data;
  },

  // Candidate reports
  getCandidateMyProgress: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/candidate/my-progress', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getCandidateMyLessons: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/candidate/my-lessons', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getCandidateMyBaptismStatus: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/candidate/my-baptism-status', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getCandidateMyCertificates: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/candidate/my-certificates', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getCandidateMyMembership: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/candidate/my-membership', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },

  // Instructor reports
  getInstructorAssignedCandidates: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/instructor/assigned-candidates', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getInstructorCandidateProgress: async (candidateId?: string, dateFrom?: string, dateTo?: string, status?: string) => {
    const params = buildParams(dateFrom, dateTo, status);
    if (candidateId) params.candidateId = candidateId;
    const response = await apiClient.get('/api/reports/instructor/candidate-progress', { params });
    return response.data;
  },
  getInstructorLessonCompletion: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/instructor/lesson-completion', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },

  // Elder reports
  getElderBaptismRequests: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/elder/baptism-requests', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getElderApprovedCandidates: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/elder/approved-candidates', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getElderCandidatesReady: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/elder/candidates-ready', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },

  // Pastor reports
  getPastorBaptismEvents: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/pastor/baptism-events', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getPastorBaptizedCandidates: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/pastor/baptized-candidates', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getPastorCertificateSigning: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/pastor/certificate-signing', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getPastorCourseCompletion: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/pastor/course-completion', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },

  // Field reports
  getFieldDistrictBaptism: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/field/district-baptism', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getFieldCertificateStats: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/field/certificate-stats', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getFieldInstructorActivity: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/field/instructor-activity', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },

  // RUM reports
  getRumNationalBaptism: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/rum/national-baptism', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getRumDistrictComparison: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/rum/district-comparison', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },

  // Admin reports
  getAdminUserActivity: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/admin/user-activity', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getAdminAuthReport: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/admin/auth-report', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getAdminCertificateDownloads: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/admin/certificate-downloads', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getAdminMessagingReport: async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await apiClient.get('/api/reports/admin/messaging-report', { params: buildParams(dateFrom, dateTo, status) });
    return response.data;
  },
  getAdminAuditLogs: async (dateFrom?: string, dateTo?: string) => {
    const response = await apiClient.get('/api/reports/admin/audit-logs', { params: buildParams(dateFrom, dateTo) });
    return response.data;
  },

  // Export PDF/Excel
  exportPdf: async (reportType: string, params?: Record<string, string>) => {
    const backendType = mapTabToReportType(reportType);
    const response = await apiClient.get(`/api/reports/export/pdf/${backendType}`, { params, responseType: 'blob' });
    triggerDownload(response.data, `${backendType}-report.pdf`);
  },
  exportExcel: async (reportType: string, params?: Record<string, string>) => {
    const backendType = mapTabToReportType(reportType);
    const response = await apiClient.get(`/api/reports/export/excel/${backendType}`, { params, responseType: 'blob' });
    triggerDownload(response.data, `${backendType}-report.xlsx`);
  },
};
