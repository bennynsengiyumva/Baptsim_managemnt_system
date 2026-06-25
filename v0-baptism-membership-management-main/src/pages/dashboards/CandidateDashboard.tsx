import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Award, User as UserIcon, Bell,
  Church, Calendar, Loader2, RefreshCw
} from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { candidateService } from '@/services/candidateService';
import { notificationService } from '@/services/notificationService';
import { Candidate, CandidateDashboardData, AppNotification } from '@/types';

export default function CandidateDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [dashboard, setDashboard] = useState<CandidateDashboardData | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const onShow = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, []);

  const loadData = async () => {
    try {
      const candidatesData = await candidateService.getAllCandidates();
      const candidates = Array.isArray(candidatesData) ? candidatesData : [];
      const myCandidate = candidates[0] || null;
      setCandidate(myCandidate);

      if (myCandidate?.id) {
        const dashData = await candidateService.getDashboard(myCandidate.id);
        setDashboard(dashData);
      }

      const notifData: any = await notificationService.getMyNotifications();
      const notifs = Array.isArray(notifData) ? notifData : (notifData.data || []);
      setNotifications(notifs.map((n: any) => ({ ...n, read: n.read ?? n.isRead ?? false })).slice(0, 5));
    } catch {
      // silent
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const progress = dashboard?.progress || 0;
  const completedLessons = dashboard?.completedLessons || 0;
  const totalLessons = dashboard?.totalLessons || 0;
  const status = candidate?.status || 'REGISTERED';

  const getStatusBadge = () => {
    const colors: Record<string, string> = {
      REGISTERED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      READY_FOR_BAPTISM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      BAPTIZED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('common.welcomeUser', { name: candidate?.fullName || candidate?.firstName || user?.fullName || user?.email })}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('common.journeyOverview')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title={t('common.refresh')}>
              <RefreshCw size={16} />
            </button>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusBadge()}`}>
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/candidate/courses')}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.courseProgress')}</p>
              <p className="text-3xl font-bold mt-2 text-primary">
                {totalLessons > 0 ? `${Math.round(progress)}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('common.lessonsCompleted', { completed: completedLessons, total: totalLessons })}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="text-primary" size={28} />
            </div>
          </div>
          {totalLessons > 0 && (
            <div className="mt-4 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </button>

        <button
          onClick={() => navigate('/candidate/baptism')}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.baptismStatus')}</p>
              <p className="text-xl font-bold mt-2 text-cyan-600 dark:text-cyan-400">
                {status === 'BAPTIZED' ? t('common.baptized') : status === 'READY_FOR_BAPTISM' ? t('common.ready') : t('common.inProgress')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {status === 'BAPTIZED' ? t('common.certificateAvailable') : t('common.trackYourProgress')}
              </p>
            </div>
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
              <Award className="text-cyan-600 dark:text-cyan-400" size={28} />
            </div>
          </div>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.myInstructor')}</p>
              <p className="text-lg font-bold mt-2 text-gray-900 dark:text-white">
                {candidate?.instructorName || t('common.notAssigned')}
              </p>
              {candidate?.instructorName && (
                <div className="mt-2 space-y-1">
                  {candidate?.instructorEmail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span>✉</span> {candidate.instructorEmail}
                    </p>
                  )}
                  {candidate?.instructorPhone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span>📞</span> {candidate.instructorPhone}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <UserIcon className="text-purple-600 dark:text-purple-400" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Church Info */}
      {candidate?.churchName && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Church size={16} />
            <span>{t('common.localChurch')}: <strong className="text-gray-700 dark:text-gray-200">{candidate.churchName}</strong></span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/candidate/courses')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <BookOpen size={20} className="text-primary" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.myCourses')}</span>
        </button>
        <button
          onClick={() => navigate('/candidate/baptism')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Calendar size={20} className="text-cyan-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.baptism')}</span>
        </button>
        <button
          onClick={() => navigate('/help')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <UserIcon size={20} className="text-purple-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.help')}</span>
        </button>
        <button
          onClick={() => navigate('/certificates')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Award size={20} className="text-amber-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.certificates')}</span>
        </button>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              {t('common.recentNotifications')}
            </h2>
            <button
              onClick={() => navigate('/notifications')}
              className="text-sm text-primary hover:underline"
            >
              {t('common.viewAll')}
            </button>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
