import apiClient from './api';
import { BaptismEvent, BaptismRegistration } from '@/types';

export const baptismService = {
  // Events
  getEvents: () =>
    apiClient.get<BaptismEvent[]>('/api/baptisms/events').then((r) => r.data),

  getUpcomingEvents: () =>
    apiClient.get<BaptismEvent[]>('/api/baptisms/events/upcoming').then((r) => r.data),

  getEventById: (id: string) =>
    apiClient.get<BaptismEvent>(`/api/baptisms/events/${id}`).then((r) => r.data),

  createEvent: (data: {
    eventDate: string;
    location: string;
    officiatingPastor: string;
    description?: string;
  }) => apiClient.post<BaptismEvent>('/api/baptisms/events', data).then((r) => r.data),

  updateEventStatus: (eventId: string, status: string) =>
    apiClient.put<BaptismEvent>(`/api/baptisms/events/${eventId}/status`, null, {
      params: { status },
    }).then((r) => r.data),

  // Registration
  registerCandidate: (data: {
    eventId: string;
    candidateId: string;
    witnessName?: string;
    sponsorName?: string;
  }) => apiClient.post<BaptismRegistration>('/api/baptisms/register', data).then((r) => r.data),

  unregisterCandidate: (baptismId: string) =>
    apiClient.delete(`/api/baptisms/${baptismId}/unregister`),

  // Approval
  approveRegistration: (eventId: string, candidateId: string) =>
    apiClient.put('/api/baptisms/approve', null, { params: { eventId, candidateId } }).then((r) => r.data),

  // Confirmation
  confirmBaptism: (baptismId: string, photos?: File[]) => {
    const formData = new FormData();
    if (photos) {
      photos.forEach((p) => formData.append('photos', p));
    }
    return apiClient.post<BaptismRegistration>(
      `/api/baptisms/${baptismId}/confirm`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then((r) => r.data);
  },

  updateOrder: (baptismId: string, order: number) =>
    apiClient.put(`/api/baptisms/${baptismId}/order`, null, { params: { order } }),

  // History
  getAllBaptisms: () =>
    apiClient.get<BaptismRegistration[]>('/api/baptisms').then((r) => r.data),

  getBaptizedCandidates: () =>
    apiClient.get<BaptismRegistration[]>('/api/baptisms/baptized').then((r) => r.data),

  getByCandidate: (candidateId: string) =>
    apiClient.get<BaptismRegistration[]>(`/api/baptisms/by-candidate/${candidateId}`).then((r) => r.data),

  // Export
  exportRecords: () =>
    apiClient.get('/api/baptisms/export', { responseType: 'blob' }).then((r) => r.data),
};
