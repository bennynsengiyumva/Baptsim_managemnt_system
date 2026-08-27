import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUserRole, selectUser, setUser, clearRoleChangeMessage } from '@/store/authStore';
import AdminDashboard from './dashboards/AdminDashboard';
import PastorDashboard from './dashboards/PastorDashboard';
import InstructorDashboard from './dashboards/InstructorDashboard';
import CandidateDashboard from './dashboards/CandidateDashboard';
import FirstChurchElderDashboard from './dashboards/FirstChurchElderDashboard';
import HeadOfFieldDashboard from './dashboards/HeadOfFieldDashboard';
import HeadOfRumDashboard from './dashboards/HeadOfRumDashboard';
import HeadOfDistrictDashboard from './dashboards/HeadOfDistrictDashboard';
import { AlertTriangle } from 'lucide-react';
import api from '@/services/api';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);
  const [roleChangeMessage, setRoleChangeMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Check for role change message on mount
  useEffect(() => {
    const checkRoleChange = async () => {
      try {
        // Re-fetch user data to check for roleChangeMessage
        const response = await api.get('/api/auth/me');
        const userData = response.data;
        
        if (userData.roleChangeMessage) {
          setRoleChangeMessage(userData.roleChangeMessage);
          // Don't navigate away - just show the modal
        }
      } catch (error) {
        // If the request fails, the token might be invalid
        // The user will be redirected to login by the auth interceptor
      } finally {
        setChecking(false);
      }
    };

    if (currentUser) {
      checkRoleChange();
    }
  }, [currentUser]);

  const handleLogout = () => {
    dispatch(clearRoleChangeMessage());
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Show loading while checking
  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Show role change warning modal
  if (roleChangeMessage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-blue-500 dark:border-cyan-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <AlertTriangle className="text-blue-600 dark:text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Role Changed</h3>
              <p className="text-xs text-blue-600 dark:text-cyan-400 font-medium">Your account has been updated</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              Your role has been changed. Please login again.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  switch (userRole) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'HEAD_OF_RUM':
      return <HeadOfRumDashboard />;
    case 'HEAD_OF_FIELD':
      return <HeadOfFieldDashboard />;
    case 'HEAD_OF_DISTRICT':
      return <HeadOfDistrictDashboard />;
    case 'PASTOR':
      return <PastorDashboard />;
    case 'FIRST_CHURCH_ELDER':
      return <FirstChurchElderDashboard />;
    case 'INSTRUCTOR':
      return <InstructorDashboard />;
    case 'CANDIDATE':
      return <CandidateDashboard />;
    default:
      return <AdminDashboard />;
  }
}
