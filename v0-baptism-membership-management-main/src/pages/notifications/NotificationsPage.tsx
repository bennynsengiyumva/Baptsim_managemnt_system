import { useState, useEffect } from 'react';
import {
  Bell, CheckCheck, Calendar, UserPlus, BookOpen,
  Droplets, FileText, Megaphone, AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { AppNotification } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const iconMap: Record<string, JSX.Element> = {
  INSTRUCTOR_ASSIGNED: <UserPlus className="w-5 h-5 text-blue-500" />,
  NEW_LESSON: <BookOpen className="w-5 h-5 text-green-500" />,
  BAPTISM_EVENT_AVAILABLE: <Droplets className="w-5 h-5 text-cyan-500" />,
  BAPTISM_REGISTERED: <Droplets className="w-5 h-5 text-purple-500" />,
  BAPTISM_CERTIFICATE_READY: <FileText className="w-5 h-5 text-amber-500" />,
  CHURCH_ANNOUNCEMENT: <Megaphone className="w-5 h-5 text-red-500" />,
  BAPTISM_APPROVAL: <Droplets className="w-5 h-5 text-green-600" />,
  BAPTISM_SCHEDULE: <Calendar className="w-5 h-5 text-indigo-500" />,
  SYSTEM: <AlertTriangle className="w-5 h-5 text-gray-500" />,
  PROGRESS_UPDATE: <ArrowLeft className="w-5 h-5 text-teal-500" />,
  LESSON_REMINDER: <BookOpen className="w-5 h-5 text-orange-500" />,
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return t('common.justNow');
    if (diff < 3600000) return t('common.minutesAgo', { count: Math.floor(diff / 60000) });
    if (diff < 86400000) return t('common.hoursAgo', { count: Math.floor(diff / 3600000) });
    return d.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold">{t('common.notifications')}</h1>
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {t('common.unreadCount', { count: unreadCount })}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <CheckCheck className="w-4 h-4" />
            {t('common.markAllRead')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('common.noNotificationsYet')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkAsRead(n.id)}
              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                n.read
                  ? 'bg-white border-gray-200'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="mt-1">{iconMap[n.type] || <Bell className="w-5 h-5 text-gray-400" />}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(n.createdAt)}</p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
