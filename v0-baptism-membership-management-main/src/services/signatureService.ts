import apiClient from './api';

const signatureService = {
  getMySignature: async () => {
    const response = await apiClient.get('/api/signature/me');
    return response.data;
  },

  uploadSignature: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/signature/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  saveDrawnSignature: async (signatureData: string) => {
    const response = await apiClient.post('/api/signature/save-drawn', { signature: signatureData });
    return response.data;
  },

  deleteSignature: async () => {
    const response = await apiClient.delete('/api/signature/me');
    return response.data;
  },
};

export default signatureService;
