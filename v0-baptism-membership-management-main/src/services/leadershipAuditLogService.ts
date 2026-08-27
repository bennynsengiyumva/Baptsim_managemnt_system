import apiClient from './api';

export interface LeadershipAuditLog {
  id: number;
  eventType: string;
  leaderId: number;
  leaderName: string;
  previousAssignmentId?: number;
  previousAssignmentSummary?: string;
  newAssignmentId?: number;
  newAssignmentSummary?: string;
  districtId?: number;
  districtName?: string;
  fieldId?: number;
  fieldName?: string;
  performedBy?: string;
  reason?: string;
  eventDate: string;
}

export const leadershipAuditLogService = {
  getAll: async () => {
    const response = await apiClient.get('/api/leadership-audit-logs');
    return response.data;
  },

  getByLeader: async (leaderId: string) => {
    const response = await apiClient.get(`/api/leadership-audit-logs/leader/${leaderId}`);
    return response.data;
  },

  getByDistrict: async (districtId: string) => {
    const response = await apiClient.get(`/api/leadership-audit-logs/district/${districtId}`);
    return response.data;
  },

  getByField: async (fieldId: string) => {
    const response = await apiClient.get(`/api/leadership-audit-logs/field/${fieldId}`);
    return response.data;
  },

  getByEventType: async (eventType: string) => {
    const response = await apiClient.get(`/api/leadership-audit-logs/event-type/${eventType}`);
    return response.data;
  },
};
