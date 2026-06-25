import apiClient from './api';
import { User, ApiResponse, PaginatedResponse, FilterParams } from '@/types';

export const userService = {
  // Get all users
  getAllUsers: async (params?: FilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/api/users', { params });
    return response.data;
  },

  // Get single user by ID
  getUserById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<User>>(`/api/users/${id}`);
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<User>>('/api/users/profile');
    return response.data;
  },
  getPastors: async () => {
  const response = await apiClient.get('/api/users/pastors');
  return response.data; // ✅ backend already returns List<User>
},

  // Create new user
  createUser: async (user: Omit<User, 'id' | 'createdAt'>) => {
    const response = await apiClient.post<ApiResponse<User>>('/api/users', user);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, user: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>(`/api/users/${id}`, user);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/users/${id}`);
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/api/users/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Update profile
  updateProfile: async (user: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>('/api/users/profile', user);
    return response.data;
  },

  // Get users by field
  getByField: async (fieldId: number) => {
    const response = await apiClient.get<User[]>(`/api/users/by-field/${fieldId}`);
    return response.data;
  },

  // Get user statistics
  getStatistics: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/users/stats');
    return response.data;
  },
};
