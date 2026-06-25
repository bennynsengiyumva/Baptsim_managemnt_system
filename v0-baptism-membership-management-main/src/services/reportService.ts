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

export const reportService = {
  // Get all reports
  getAllReports: async (params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ReportData>>>('/api/reports', { params });
    return response.data;
  },

  // Get single report by ID
  getReportById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<ReportData>>(`/api/reports/${id}`);
    return response.data;
  },

  // Generate new report
  generateReport: async (type: string, filters: any, format: 'PDF' | 'CSV' | 'JSON') => {
    const response = await apiClient.post<ApiResponse<ReportData>>('/api/reports/generate', {
      type,
      filters,
      format,
    });
    return response.data;
  },

  // Delete report
  deleteReport: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/reports/${id}`);
    return response.data;
  },

  // Download report
  downloadReport: async (id: string) => {
    const response = await apiClient.get(`/api/reports/${id}/download`, { responseType: 'blob' });
    return response.data;
  },

  // Generate church report (fetches church detail & progress)
  generateChurchReport: async (churchId: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/api/churches/${churchId}/detail`);
    return response.data;
  },

  // Generate district report (fetches all churches in district with details)
  generateDistrictReport: async (districtId: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/api/reports/district/${districtId}`);
    return response.data;
  },

  // Generate field report (fetches all districts & churches in field)
  generateFieldReport: async (fieldId: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/api/reports/field/${fieldId}`);
    return response.data;
  },

  // Download church report as PDF/Excel
  downloadChurchReport: async (churchId: number, dateFrom?: string, dateTo?: string, format: string = 'pdf') => {
    const params: any = { format };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get(`/api/reports/church/${churchId}`, {
      params,
      responseType: 'blob',
    });
    const ext = format === 'excel' || format === 'xlsx' ? 'xlsx' : 'pdf';
    triggerDownload(response.data, `church-report-${churchId}.${ext}`);
  },

  // Download district report as PDF/Excel
  downloadDistrictReport: async (districtId: number, dateFrom?: string, dateTo?: string, format: string = 'pdf') => {
    const params: any = { format };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get(`/api/reports/district/${districtId}`, {
      params,
      responseType: 'blob',
    });
    const ext = format === 'excel' || format === 'xlsx' ? 'xlsx' : 'pdf';
    triggerDownload(response.data, `district-report-${districtId}.${ext}`);
  },

  // Download field report as PDF/Excel
  downloadFieldReport: async (fieldId: number, dateFrom?: string, dateTo?: string, format: string = 'pdf') => {
    const params: any = { format };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get(`/api/reports/field/${fieldId}`, {
      params,
      responseType: 'blob',
    });
    const ext = format === 'excel' || format === 'xlsx' ? 'xlsx' : 'pdf';
    triggerDownload(response.data, `field-report-${fieldId}.${ext}`);
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/dashboard/stats');
    return response.data;
  },

  // Get candidate statistics
  getCandidateStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/stats/candidates');
    return response.data;
  },

  // Get membership statistics
  getMembershipStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/stats/memberships');
    return response.data;
  },

  // Get baptism statistics
  getBaptismStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/reports/stats/baptisms');
    return response.data;
  },
};
