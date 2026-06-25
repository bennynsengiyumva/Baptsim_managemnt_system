import { useSelector } from 'react-redux';
import { selectUserRole } from '@/store/authStore';
import AdminDashboard from './dashboards/AdminDashboard';
import PastorDashboard from './dashboards/PastorDashboard';
import InstructorDashboard from './dashboards/InstructorDashboard';
import CandidateDashboard from './dashboards/CandidateDashboard';
import FirstChurchElderDashboard from './dashboards/FirstChurchElderDashboard';
import HeadOfFieldDashboard from './dashboards/HeadOfFieldDashboard';
import HeadOfRumDashboard from './dashboards/HeadOfRumDashboard';

export default function DashboardPage() {
  const userRole = useSelector(selectUserRole);

  switch (userRole) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'HEAD_OF_RUM':
      return <HeadOfRumDashboard />;
    case 'HEAD_OF_FIELD':
      return <HeadOfFieldDashboard />;
    case 'PASTOR':
    case 'HEAD_OF_DISTRICT':
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
