import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Moon, Sun, Globe } from 'lucide-react';
import { logoutUser, selectUser } from '@/store/authStore';
import { toggleDarkMode, selectDarkMode, setLanguage, selectLanguage } from '@/store/slices/uiSlice';
import { selectUnreadCount } from '@/store/slices/notificationSlice';
import { notificationService } from '@/services/notificationService';
import { AppNotification } from '@/types';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const darkMode = useSelector(selectDarkMode);
  const language = useSelector(selectLanguage);
  const unreadCount = useSelector(selectUnreadCount);
  const { t, i18n } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifications) return;
    notificationService.getMyNotifications().then((res: any) => {
      const data = Array.isArray(res) ? res : (res.data || []);
      setNotifications(data.map((n: any) => ({
        ...n,
        read: n.read ?? n.isRead ?? false,
      })));
    }).catch(() => {});
  }, [showNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser() as any);
    navigate('/login');
  };

  const toggleLanguage = () => {
    const langs: Record<string, string> = { en: 'fr', fr: 'rw', rw: 'en' };
    const newLanguage = langs[language] || 'en';
    dispatch(setLanguage(newLanguage as 'en' | 'rw' | 'fr'));
    i18n.changeLanguage(newLanguage);
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const displayName = user?.fullName || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'BAPTISM_CERTIFICATE_READY': return '🎖️';
      case 'BAPTISM_APPROVAL': return '✅';
      case 'BAPTISM_REGISTERED': return '⛪';
      case 'BAPTISM_EVENT_AVAILABLE': return '📅';
      case 'NEW_LESSON': return '📝';
      case 'INSTRUCTOR_ASSIGNED': return '🎓';
      case 'LESSON_REMINDER': return '🔔';
      case 'PROGRESS_UPDATE': return '📈';
      default: return '🔔';
    }
  };

  return (
    <header className="bg-white shadow-sm dark:bg-slate-800 dark:text-white sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left Section */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {t('common.appName')}
          </h2>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={language === 'en' ? 'English' : language === 'fr' ? 'Français' : 'Kinyarwanda'}
          >
            <Globe size={18} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => dispatch(toggleDarkMode() as any)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-8">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 border-b border-gray-100 dark:border-slate-600 last:border-0 transition-colors ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotifIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-primary/20" />
              ) : (
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {initial}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">{displayName}</span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-600">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={16} />
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  {t('common.settings')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 border-t border-gray-200 dark:border-slate-600"
                >
                  <LogOut size={16} />
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
