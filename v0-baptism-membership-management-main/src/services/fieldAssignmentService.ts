import apiClient from './api';

export interface FieldAssignment {
  id: number;
  fieldId: number;
  fieldName: string;
  headId: number;
  headName: string;
  headEmail: string;
  startDate: string;
  endDate: string | null;
  status: string;
  reason?: string;
  performedBy?: string;
}

export interface FieldTransferRequest {
  fieldId: number;
  newHeadId: number;
  effectiveDate: string;
  reason?: string;
}

export const fieldAssignmentService = {
  changeHead: async (data: FieldTransferRequest) => {
    const response = await apiClient.post('/api/field-assignments/change-head', data);
    return response.data;
  },

  appointHead: async (data: FieldTransferRequest) => {
    const response = await apiClient.post('/api/field-assignments/appoint-head', data);
    return response.data;
  },

  getActiveForField: async (fieldId: string) => {
    const response = await apiClient.get(`/api/field-assignments/field/${fieldId}`);
    return response.data;
  },

  getActiveForHead: async (headId: string) => {
    const response = await apiClient.get(`/api/field-assignments/head/${headId}`);
    return response.data;
  },

  getHistory: async (fieldId: string) => {
    const response = await apiClient.get(`/api/field-assignments/field/${fieldId}/history`);
    return response.data;
  },

  getHistoryForHead: async (headId: string) => {
    const response = await apiClient.get(`/api/field-assignments/head/${headId}/history`);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/api/field-assignments');
    return response.data;
  },
};
