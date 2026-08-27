import { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { selectIsAuthenticated, refreshToken } from '@/store/authStore';
import { selectDarkMode } from '@/store/slices/uiSlice';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import Verify2FAPage from '@/pages/auth/Verify2FAPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import CandidatesPage from '@/pages/candidates/CandidatesPage';
import CandidateDetailPage from '@/pages/candidates/CandidateDetailPage';
import CandidateFormPage from '@/pages/candidates/CandidateFormPage';
import AdminBaptismPage from '@/pages/baptism/AdminBaptismPage';
import BaptismEventDetailPage from '@/pages/baptism/BaptismEventDetailPage';
import CandidateBaptismPage from '@/pages/baptism/CandidateBaptismPage';
import InstructorBaptismViewPage from '@/pages/baptism/InstructorBaptismViewPage';
import InstructorsPage from '@/pages/instructors/InstructorsPage';
import ChurchPage from "@/pages/church/ChurchPage";
import ChurchFormPage from "@/pages/church/ChurchFormPage";
import ChurchDetailPage from "@/pages/church/ChurchDetailPage";
import HeadOfDistrictCertificatesPage from '@/pages/certificates/HeadOfDistrictCertificatesPage';
import UsersPage from '@/pages/users/UsersPage';
import UserDetailPage from '@/pages/users/UserDetailPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import SignaturePage from '@/pages/profile/SignaturePage';
import HelpPage from '@/pages/help/HelpPage';
import AiAssistantPage from '@/pages/help/AiAssistantPage';
import CandidateSupportRequestsPage from '@/pages/help/CandidateSupportRequestsPage';
import RecipientSupportPage from '@/pages/help/RecipientSupportPage';
import InstructorLessonsPage from '@/pages/lessons/InstructorLessonsPage';
import InstructorLessonDetailPage from '@/pages/lessons/InstructorLessonDetailPage';
import LessonFormPage from '@/pages/lessons/LessonFormPage';
import InstructorGradesPage from '@/pages/lessons/InstructorGradesPage';
import CandidateCoursesPage from '@/pages/lessons/CandidateCoursesPage';
import LessonAssessmentPage from '@/pages/lessons/LessonAssessmentPage';
import CandidateGradesPage from '@/pages/lessons/CandidateGradesPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import AnalyticsDashboardPage from '@/pages/reports/AnalyticsDashboardPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import AdminMonitoringPage from '@/pages/admin/AdminMonitoringPage';
// Cohort Pages
import InstructorCohortsPage from '@/pages/cohorts/InstructorCohortsPage';
import CohortFormPage from '@/pages/cohorts/CohortFormPage';
import CohortDetailPage from '@/pages/cohorts/CohortDetailPage';
import CandidateCohortsPage from '@/pages/cohorts/CandidateCohortsPage';

// New Hierarchy Pages
import UnionPage from '@/pages/unions/UnionPage';
import FieldPage from '@/pages/fields/FieldPage';
import DistrictPage from '@/pages/districts/DistrictPage';
import DistrictTransferPage from '@/pages/districts/DistrictTransferPage';
import FieldTransferPage from '@/pages/fields/FieldTransferPage';
import LeadershipAuditLogPage from '@/pages/leadership/LeadershipAuditLogPage';
import FirstChurchEldersPage from '@/pages/firstElders/FirstChurchEldersPage';
import HierarchyHomePage from '@/pages/hierarchy/HierarchyHomePage';

// New Module Pages
import FCEBaptismRequestsPage from '@/pages/baptism/FCEBaptismRequestsPage';
import CandidateCertificatesPage from '@/pages/certificates/CandidateCertificatesPage';
import CertificateVerifyPage from '@/pages/certificates/CertificateVerifyPage';

// Components
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import RoleBasedRoute from '@/components/routing/RoleBasedRoute';
import Layout from '@/components/layout/Layout';
import NotFound from '@/pages/NotFound';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const darkMode = useSelector(selectDarkMode);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      dispatch(refreshToken() as any);
    }

    const handleLogout = () => {
      dispatch({ type: 'auth/logout' } as any);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [dispatch]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner fullPage text="Loading..." />}>
        <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-2fa" element={<Verify2FAPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-certificate" element={<CertificateVerifyPage />} />
        <Route path="/verify-certificate/:certNumber" element={<CertificateVerifyPage />} />

        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* PROTECTED AREA */}
        <Route
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout />
            </ProtectedRoute>
          }
        >

          {/* DASHBOARD */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ADMIN DASHBOARD */}
          <Route path="/admin/dashboard" element={<RoleBasedRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleBasedRoute>} />

          {/* HIERARCHY MANAGEMENT */}
          <Route
            path="/unions"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM']}>
                <UnionPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/fields"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM']}>
                <FieldPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/districts"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD']}>
                <DistrictPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/district-transfer"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM']}>
                <DistrictTransferPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/field-transfer"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM']}>
                <FieldTransferPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/leadership-audit-log"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM']}>
                <LeadershipAuditLogPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/first-church-elders"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR']}>
                <FirstChurchEldersPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/hierarchy"
            element={
              <RoleBasedRoute allowedRoles={['HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT']}>
                <HierarchyHomePage />
              </RoleBasedRoute>
            }
          />

          {/* CANDIDATES */}
          <Route
            path="/candidates"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR']}>
                <CandidatesPage />
              </RoleBasedRoute>
            }
          />
          <Route path="/candidates/new" element={<CandidateFormPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="/candidates/:id/edit" element={<CandidateFormPage />} />

          {/* INSTRUCTORS */}
          <Route
            path="/instructors"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER']}>
                <InstructorsPage />
              </RoleBasedRoute>
            }
          />

          {/* INSTRUCTOR LESSONS / COURSES */}
          <Route
            path="/instructor/lessons"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <InstructorLessonsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/instructor/lessons/new"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <LessonFormPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/instructor/lessons/:id/edit"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <LessonFormPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/instructor/lessons/:id"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <InstructorLessonDetailPage />
              </RoleBasedRoute>
            }
          />

          {/* INSTRUCTOR GRADES */}
          <Route
            path="/instructor/grades"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <InstructorGradesPage />
              </RoleBasedRoute>
            }
          />

          {/* INSTRUCTOR COHORTS */}
          <Route
            path="/instructor/cohorts"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <InstructorCohortsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/instructor/cohorts/new"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <CohortFormPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/instructor/cohorts/:id"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <CohortDetailPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/instructor/cohorts/:id/edit"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR']}>
                <CohortFormPage />
              </RoleBasedRoute>
            }
          />

          {/* CANDIDATE COURSES */}
          <Route
            path="/candidate/courses"
            element={
              <RoleBasedRoute allowedRoles={['CANDIDATE']}>
                <CandidateCoursesPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/candidate/courses/:id"
            element={
              <RoleBasedRoute allowedRoles={['CANDIDATE']}>
                <LessonAssessmentPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/candidate/grades"
            element={
              <RoleBasedRoute allowedRoles={['CANDIDATE']}>
                <CandidateGradesPage />
              </RoleBasedRoute>
            }
          />

          {/* CANDIDATE CERTIFICATES */}
          <Route
            path="/candidate/certificates"
            element={
              <RoleBasedRoute allowedRoles={['CANDIDATE']}>
                <CandidateCertificatesPage />
              </RoleBasedRoute>
            }
          />

          {/* CANDIDATE COHORTS */}
          <Route
            path="/candidate/cohorts"
            element={
              <RoleBasedRoute allowedRoles={['CANDIDATE']}>
                <CandidateCohortsPage />
              </RoleBasedRoute>
            }
          />

          {/* FCE BAPTISM REQUESTS */}
          <Route
            path="/fce/baptism-requests"
            element={
              <RoleBasedRoute allowedRoles={['FIRST_CHURCH_ELDER']}>
                <FCEBaptismRequestsPage />
              </RoleBasedRoute>
            }
          />

          {/* BAPTISM — Pastor coordination */}
          <Route
            path="/baptism"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'PASTOR', 'HEAD_OF_DISTRICT']}>
                <AdminBaptismPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/baptism/events/:id"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'PASTOR', 'HEAD_OF_DISTRICT']}>
                <BaptismEventDetailPage />
              </RoleBasedRoute>
            }
          />

          {/* BAPTISM — Instructor/FirstChurchElder view */}
          <Route
            path="/baptism/view"
            element={
              <RoleBasedRoute allowedRoles={['INSTRUCTOR', 'FIRST_CHURCH_ELDER', 'HEAD_OF_DISTRICT']}>
                <InstructorBaptismViewPage />
              </RoleBasedRoute>
            }
          />

          {/* BAPTISM — Candidate registration */}
          <Route
            path="/candidate/baptism"
            element={
              <RoleBasedRoute allowedRoles={['CANDIDATE']}>
                <CandidateBaptismPage />
              </RoleBasedRoute>
            }
          />

          {/* CHURCH */}
          <Route
            path="/church"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR']}>
                <ChurchPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/church/:id"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR']}>
                <ChurchDetailPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/church/create"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT']}>
                <ChurchFormPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/church/:id/edit"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT']}>
                <ChurchFormPage />
              </RoleBasedRoute>
            }
          />

          {/* CERTIFICATES (baptism) */}
          <Route path="/certificates" element={<RoleBasedRoute allowedRoles={['HEAD_OF_DISTRICT', 'HEAD_OF_RUM']}><HeadOfDistrictCertificatesPage /></RoleBasedRoute>} />

          {/* USERS — account creation chain */}
          <Route
            path="/users"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER']}>
                <UsersPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER']}>
                <UserDetailPage />
              </RoleBasedRoute>
            }
          />

          {/* PROFILE */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/signature" element={
            <RoleBasedRoute allowedRoles={['HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN']}>
              <SignaturePage />
            </RoleBasedRoute>
          } />

          {/* HELP */}
          <Route path="/help" element={<HelpPage />} />
          <Route path="/candidate/ai-assistant" element={<RoleBasedRoute allowedRoles={['CANDIDATE']}><AiAssistantPage /></RoleBasedRoute>} />
          <Route path="/candidate/support-requests" element={<RoleBasedRoute allowedRoles={['CANDIDATE']}><CandidateSupportRequestsPage /></RoleBasedRoute>} />
          <Route path="/support-requests" element={<RoleBasedRoute allowedRoles={['INSTRUCTOR', 'FIRST_CHURCH_ELDER', 'PASTOR']}><RecipientSupportPage /></RoleBasedRoute>} />

          {/* SETTINGS */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* NOTIFICATIONS */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* REPORTS — for head of field / head of RUM */}
          <Route
            path="/reports"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR']}>
                <ReportsPage />
              </RoleBasedRoute>
            }
          />

          {/* SYSTEM MONITORING — admin only */}
          <Route
            path="/admin/monitoring"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN']}>
                <AdminMonitoringPage />
              </RoleBasedRoute>
            }
          />

          {/* ANALYTICS — for head of field / head of RUM */}
          <Route
            path="/analytics"
            element={
              <RoleBasedRoute allowedRoles={['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT']}>
                <AnalyticsDashboardPage />
              </RoleBasedRoute>
            }
          />

        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
      </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
