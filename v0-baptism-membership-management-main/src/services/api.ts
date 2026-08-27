import axios, { AxiosInstance, AxiosError } from 'axios';
import { handleApiError } from '@/utils/apiErrorInterceptor';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8084';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Convert absolute file path to API file URL
export function getFileUrl(fileUrl: string | null | undefined): string {
  if (!fileUrl) return '';
  // Already an API URL or relative URL
  if (fileUrl.startsWith('/api/') || fileUrl.startsWith('http')) return fileUrl;
  // Extract filename from absolute path (e.g. /Users/macbook/uploads/uuid_file.pdf -> uuid_file.pdf)
  const parts = fileUrl.split('/');
  const filename = parts[parts.length - 1];
  return `${API_BASE_URL}/api/files/${filename}`;
}

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
