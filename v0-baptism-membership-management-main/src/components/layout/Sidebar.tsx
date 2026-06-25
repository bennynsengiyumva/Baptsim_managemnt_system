import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUserRole, selectUser } from '@/store/authStore';
import { selectSidebarOpen, toggleSidebar } from '@/store/slices/uiSlice';
import { Menu, X, HelpCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@/services/notificationService';

const menuItems = [
  // Home (dashboard) - all roles
  { label: 'dashboard', href: '/dashboard', icon: '📊', roles: ['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'] },

  // Admin
  { label: 'users', href: '/users', icon: '👤', roles: ['ADMIN'] },
  { label: 'events', href: '/baptism', icon: '⛪', roles: ['ADMIN', 'PASTOR'] },
  { label: 'reports', href: '/reports', icon: '📈', roles: ['ADMIN', 'HEAD_OF_FIELD', 'HEAD_OF_RUM'] },

  // Candidate
  { label: 'myCourses', href: '/candidate/courses', icon: '📚', roles: ['CANDIDATE'] },
  { label: 'events', href: '/candidate/baptism', icon: '⛪', roles: ['CANDIDATE'] },
  { label: 'certificates', href: '/certificates', icon: '🎖️', roles: ['CANDIDATE', 'PASTOR'] },
  { label: 'help', href: '/help', icon: '❓', roles: ['CANDIDATE'] },

  // Instructor
  { label: 'myCandidates', href: '/candidates', icon: '👥', roles: ['INSTRUCTOR'] },
  { label: 'courses', href: '/instructor/lessons', icon: '📝', roles: ['INSTRUCTOR'] },

  // First Church Elder
  { label: 'instructors', href: '/instructors', icon: '🎓', roles: ['FIRST_CHURCH_ELDER'] },
  { label: 'candidates', href: '/candidates', icon: '👥', roles: ['FIRST_CHURCH_ELDER'] },
  { label: 'events', href: '/baptism/view', icon: '⛪', roles: ['FIRST_CHURCH_ELDER'] },

  // Pastor
  { label: 'church', href: '/church', icon: '🏢', roles: ['PASTOR'] },
  { label: 'event', href: '/baptism', icon: '⛪', roles: ['PASTOR'] },

  // Head of Field
  { label: 'districts', href: '/districts', icon: '📍', roles: ['HEAD_OF_FIELD'] },
  { label: 'events', href: '/baptism/view', icon: '⛪', roles: ['HEAD_OF_FIELD', 'HEAD_OF_RUM'] },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
    const interval = setInterval(() => {
      notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole || ''));

  return (
    <>
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-primary text-white"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-slate-900 text-white transition-all duration-300 overflow-hidden lg:w-64 lg:flex flex-col`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-accent">BMPMS</h1>
          <p className="text-xs text-slate-400 mt-1">Baptist Membership System</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isNotifications = item.label === 'notifications';
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`block px-6 py-3 transition-colors relative ${
                  isActive
                    ? 'bg-primary text-white border-r-4 border-accent'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="text-sm font-medium">{t(`common.${item.label}`)}</span>
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute right-4 top-2.5 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-1">
          <Link to="/help" className="flex items-center text-slate-300 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800">
            <HelpCircle size={16} className="mr-3" />
            <span className="text-sm">{t('common.help')}</span>
          </Link>
          <Link to="/profile" className="flex items-center text-slate-300 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800">
            <User size={16} className="mr-3" />
            <span className="text-sm">{t('common.profile')}</span>
          </Link>
          <Link to="/settings" className="flex items-center text-slate-300 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800">
            <span className="mr-3">⚙️</span>
            <span className="text-sm">{t('common.settings')}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
