import apiClient from './api';

export interface BackupFile {
  name: string;
  size: number;
  lastModified: string;
}

export const backupService = {
  performBackup: async (): Promise<any> => {
    const response = await apiClient.post('/api/system/backup');
    return response.data;
  },
  getBackupHistory: async (): Promise<BackupFile[]> => {
    const response = await apiClient.get('/api/system/backup/history');
    return response.data;
  },
  deleteBackup: async (filename: string): Promise<void> => {
    await apiClient.delete(`/api/system/backup/${filename}`);
  }
};
