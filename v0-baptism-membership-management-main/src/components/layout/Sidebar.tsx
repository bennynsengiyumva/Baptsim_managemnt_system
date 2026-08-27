import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUserRole } from '@/store/authStore';
import { selectSidebarOpen, toggleSidebar } from '@/store/slices/uiSlice';
import { Menu, X, Globe, Map, Crown, Network, Headphones, Settings, LayoutDashboard, Users, Radio, ClipboardList, ArrowLeftRight, GitMerge, Building2, GraduationCap, BookOpen, ClipboardCheck, BarChart3, Church, Medal, TrendingUp, Bot, MessageSquare, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const menuItems = [
  // Dashboard
  { key: 'dashboard', label: 'dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'] },

  // Administration
  { key: 'users', label: 'users', href: '/users', icon: Users, roles: ['ADMIN'] },
  { key: 'monitoring', label: 'monitoring', href: '/admin/monitoring', icon: Radio, roles: ['ADMIN'] },
  { key: 'leadershipAuditLog', label: 'leadershipAuditLog', href: '/leadership-audit-log', icon: ClipboardList, roles: ['ADMIN', 'HEAD_OF_RUM'] },
  { key: 'districtTransfer', label: 'districtTransfer', href: '/district-transfer', icon: ArrowLeftRight, roles: ['ADMIN', 'HEAD_OF_RUM'] },
  { key: 'fieldTransfer', label: 'fieldTransfer', href: '/field-transfer', icon: GitMerge, roles: ['ADMIN', 'HEAD_OF_RUM'] },

  // Hierarchy
  { key: 'unions', label: 'unions', href: '/unions', icon: Globe, roles: ['ADMIN', 'HEAD_OF_RUM'] },
  { key: 'fields', label: 'fields', href: '/fields', icon: Map, roles: ['ADMIN', 'HEAD_OF_RUM'] },
  { key: 'districts', label: 'districts', href: '/districts', icon: Building2, roles: ['HEAD_OF_FIELD'] },
  { key: 'hierarchy', label: 'hierarchy', href: '/hierarchy', icon: Network, roles: ['HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT'] },
  { key: 'church', label: 'church', href: '/church', icon: Church, roles: ['PASTOR'] },
  { key: 'firstChurchElders', label: 'firstChurchElders', href: '/first-church-elders', icon: Crown, roles: ['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR'] },

  // People Management
  { key: 'candidates', label: 'candidates', href: '/candidates', icon: Users, roles: ['INSTRUCTOR', 'FIRST_CHURCH_ELDER', 'HEAD_OF_DISTRICT'] },
  { key: 'instructors', label: 'instructors', href: '/instructors', icon: GraduationCap, roles: ['FIRST_CHURCH_ELDER', 'HEAD_OF_DISTRICT'] },

  // Programs
  { key: 'myCourses', label: 'myCourses', href: '/candidate/courses', icon: BookOpen, roles: ['CANDIDATE'] },
  { key: 'courses', label: 'courses', href: '/instructor/lessons', icon: BookOpen, roles: ['INSTRUCTOR'] },
  { key: 'instructorCohorts', label: 'cohorts', href: '/instructor/cohorts', icon: ClipboardCheck, roles: ['INSTRUCTOR'] },
  { key: 'candidateCohorts', label: 'cohorts', href: '/candidate/cohorts', icon: ClipboardCheck, roles: ['CANDIDATE'] },
  { key: 'myGrades', label: 'myGrades', href: '/candidate/grades', icon: BarChart3, roles: ['CANDIDATE'] },

  // Baptism Events
  { key: 'baptismEvents', label: 'events', href: '/baptism', icon: Calendar, roles: ['ADMIN', 'PASTOR', 'HEAD_OF_DISTRICT'] },
  { key: 'baptismEventsView', label: 'events', href: '/baptism/view', icon: Calendar, roles: ['FIRST_CHURCH_ELDER', 'HEAD_OF_FIELD'] },
  { key: 'candidateBaptism', label: 'events', href: '/candidate/baptism', icon: Calendar, roles: ['CANDIDATE'] },
  { key: 'baptismRequests', label: 'baptismRequests', href: '/fce/baptism-requests', icon: ClipboardList, roles: ['FIRST_CHURCH_ELDER'] },

  // Certificates
  { key: 'certificates', label: 'certificates', href: '/certificates', icon: Medal, roles: ['HEAD_OF_DISTRICT', 'HEAD_OF_RUM'] },
  { key: 'myCertificates', label: 'myCertificates', href: '/candidate/certificates', icon: Medal, roles: ['CANDIDATE'] },

  // Reports
  { key: 'reports', label: 'reports', href: '/reports', icon: TrendingUp, roles: ['ADMIN', 'HEAD_OF_FIELD', 'HEAD_OF_RUM', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR'] },
  { key: 'analytics', label: 'analytics', href: '/analytics', icon: BarChart3, roles: ['HEAD_OF_DISTRICT'] },

  // Support
  { key: 'candidateSupport', label: 'supportRequests', href: '/candidate/support-requests', icon: Headphones, roles: ['CANDIDATE'] },
  { key: 'staffSupport', label: 'supportRequests', href: '/support-requests', icon: MessageSquare, roles: ['INSTRUCTOR', 'FIRST_CHURCH_ELDER', 'PASTOR'] },

  // AI Assistant
  { key: 'aiAssistant', label: 'aiAssistant', href: '/candidate/ai-assistant', icon: Bot, roles: ['CANDIDATE'] },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const userRole = useSelector(selectUserRole);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const { t } = useTranslation();

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
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">BMPMS</h1>
              <p className="text-[10px] text-slate-400 leading-tight">{t('common.appName')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.key}
                to={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'bg-primary/20 text-white border-l-4 border-accent'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-accent' : 'text-slate-400'} />
                <span>{t(`common.${item.label}`)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <Link to="/settings" className="flex items-center gap-3 text-slate-300 hover:text-white transition-all duration-200 px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-slate-800">
            <Settings size={18} className="text-slate-400" />
            <span>{t('common.settings')}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
