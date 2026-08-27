import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshCw, HardDrive, Cpu, Activity, Database, Clock, Download } from 'lucide-react';
import { apiClient } from '@/services/api';
import toast from 'react-hot-toast';

interface SystemStats {
  uptime: number;
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  availableProcessors: number;
  activeThreads: number;
  dbPoolActive: number;
  dbPoolIdle: number;
  dbPoolMax: number;
  timestamp: string;
}

interface BackupFile {
  name: string;
  size: number;
  lastModified: string;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function AdminMonitoringPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ['systemStats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/system/stats');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: backups = [], isLoading: backupsLoading } = useQuery<BackupFile[]>({
    queryKey: ['backupHistory'],
    queryFn: async () => {
      const res = await apiClient.get('/api/system/backup/history');
      return res.data;
    },
  });

  const backupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/system/backup');
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('monitoring.backupSuccess'));
      queryClient.invalidateQueries({ queryKey: ['backupHistory'] });
    },
    onError: () => {
      toast.error(t('monitoring.backupError'));
    },
  });

  const memoryPercent = stats
    ? Math.round((stats.usedMemory / stats.totalMemory) * 100)
    : 0;

  const memoryBarColor =
    memoryPercent >= 90 ? 'bg-red-500' : memoryPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          {t('monitoring.title')}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => backupMutation.mutate()}
            disabled={backupMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download size={16} />
            {t('monitoring.performBackup')}
          </button>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['systemStats'] })}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-white"
          >
            <RefreshCw size={16} />
            {t('monitoring.refresh')}
          </button>
        </div>
      </div>

      {statsLoading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CPU */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Cpu size={20} className="text-blue-500" />
              <h3 className="font-semibold text-slate-700 dark:text-white">{t('monitoring.cpu')}</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.availableProcessors}</p>
          </div>

          {/* Active Threads */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Activity size={20} className="text-green-500" />
              <h3 className="font-semibold text-slate-700 dark:text-white">{t('monitoring.threads')}</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeThreads}</p>
          </div>

          {/* DB Pool */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Database size={20} className="text-purple-500" />
              <h3 className="font-semibold text-slate-700 dark:text-white">{t('monitoring.dbPool')}</h3>
            </div>
            <div className="flex gap-4 mt-2">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('monitoring.active')}</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.dbPoolActive}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('monitoring.idle')}</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.dbPoolIdle}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('monitoring.max')}</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.dbPoolMax}</p>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive size={20} className="text-orange-500" />
              <h3 className="font-semibold text-slate-700 dark:text-white">{t('monitoring.memory')}</h3>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-1">
                <span>{formatBytes(stats.usedMemory)}</span>
                <span>{formatBytes(stats.totalMemory)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${memoryBarColor}`}
                  style={{ width: `${memoryPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{memoryPercent}%</p>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-teal-500" />
              <h3 className="font-semibold text-slate-700 dark:text-white">{t('monitoring.uptime')}</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
              {formatUptime(stats.uptime)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Backup History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t('monitoring.backups')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Size</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {backupsLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.name} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">{b.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">{formatBytes(b.size)}</td>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {new Date(b.lastModified).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
