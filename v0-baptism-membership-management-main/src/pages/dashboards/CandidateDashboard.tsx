import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Award, User as UserIcon, Bell,
  Church, Calendar, MapPin, Loader2, RefreshCw, CheckCircle,
  Clock, AlertTriangle, GraduationCap, Headphones
} from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { candidateService } from '@/services/candidateService';
import { notificationService } from '@/services/notificationService';
import { baptismService } from '@/services/baptismService';
import { Candidate, CandidateDashboardData, AppNotification, BaptismEvent } from '@/types';

export default function CandidateDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [dashboard, setDashboard] = useState<CandidateDashboardData | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<BaptismEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) loadData();
    const onShow = () => { if (document.visibilityState === 'visible' && user?.email) loadData(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [user?.email]);

  const loadData = async () => {
    try {
      if (!user?.email) { setLoading(false); return; }

      const candidatesData = await candidateService.getCandidatesByEmail(user.email);
      const candidates = Array.isArray(candidatesData) ? candidatesData : [];
      const myCandidate = candidates[0] || null;
      setCandidate(myCandidate);

      if (myCandidate?.id) {
        const dashData = await candidateService.getDashboard(String(myCandidate.id));
        setDashboard(dashData);
      }

      const notifData: any = await notificationService.getMyNotifications();
      const notifs = Array.isArray(notifData) ? notifData : (notifData.data || []);
      setNotifications(notifs.map((n: any) => ({ ...n, read: n.read ?? n.isRead ?? false })).slice(0, 5));

      const events = await baptismService.getUpcomingEvents();
      const eventList = Array.isArray(events) ? events : [];
      if (myCandidate?.createdAt) {
        setUpcomingEvents(eventList.filter((e: any) => {
          if (!e.createdAt) return true;
          return new Date(e.createdAt) >= new Date(myCandidate.createdAt);
        }));
      } else {
        setUpcomingEvents(eventList);
      }
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

  const lessonProgress = dashboard?.lessonProgress ?? dashboard?.progress ?? 0;
  const completedLessons = dashboard?.completedLessons ?? 0;
  const totalLessons = dashboard?.totalLessons ?? 0;
  const status = candidate?.status || 'REGISTERED';
  const baptized = dashboard?.baptized ?? false;
  const approved = dashboard?.approved ?? false;
  const statusMessage = dashboard?.statusMessage || 'In Preparation';

  const allLessonsDone = totalLessons > 0 && completedLessons === totalLessons;
  const hasActiveBaptismRequest = ['BAPTISM_REQUEST_PENDING', 'APPROVED_FOR_BAPTISM'].includes(status);

  const getStatusBadge = () => {
    const colors: Record<string, string> = {
      REGISTERED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      READY_FOR_BAPTISM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      BAPTISM_REQUEST_PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      APPROVED_FOR_BAPTISM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      BAPTIZED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      CERTIFICATE_GENERATED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      CERTIFICATE_SIGNED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      COURSE_COMPLETED: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
      TRANSFERRED_TO_CMS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
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
            <p className="text-gray-500 dark:text-gray-400 mt-1">{statusMessage}</p>
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

      {/* Profile Photo Warning */}
      {baptized && (!candidate?.profilePicturePath || candidate.profilePicturePath === '') && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Profile Photo Required</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Your baptism has been recorded, but you must upload a profile photo before the Head of District can sign your certificate.
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="shrink-0 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Add Photo
          </button>
        </div>
      )}

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Course Progress */}
        <button
          onClick={() => navigate('/candidate/courses')}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.courseProgress')}</p>
              <p className="text-3xl font-bold mt-2 text-primary">
                {totalLessons > 0 ? `${Math.round(lessonProgress)}%` : '—'}
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
                style={{ width: `${Math.min(lessonProgress, 100)}%` }}
              />
            </div>
          )}
        </button>

        {/* Baptism Status */}
        <button
          onClick={() => navigate('/candidate/baptism')}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.baptismStatus')}</p>
              <p className="text-xl font-bold mt-2 text-cyan-600 dark:text-cyan-400">
                {baptized ? t('common.baptized') :
                 status === 'TRANSFERRED_TO_CMS' ? 'Transferred to CMS' :
                 status === 'COURSE_COMPLETED' ? 'Course Completed' :
                 status === 'CERTIFICATE_SIGNED' ? 'Certificate Signed' :
                 status === 'CERTIFICATE_GENERATED' ? 'Certificate Generated' :
                 status === 'APPROVED_FOR_BAPTISM' ? 'Approved' :
                 status === 'BAPTISM_REQUEST_PENDING' ? 'Request Pending' :
                 approved ? 'Approved' : 'Not Yet Requested'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {baptized ? t('common.certificateAvailable') :
                 status === 'BAPTISM_REQUEST_PENDING' ? 'Awaiting FCE approval' :
                 status === 'APPROVED_FOR_BAPTISM' ? 'Approved, waiting for ceremony' :
                 status === 'CERTIFICATE_SIGNED' ? 'Certificate ready for download' :
                 status === 'COURSE_COMPLETED' ? 'Eligible for CMS transfer' :
                 allLessonsDone ? 'All courses done - register for baptism' :
                 'Register for a baptism event'}
              </p>
              {(status === 'CERTIFICATE_SIGNED' || status === 'COURSE_COMPLETED' || status === 'TRANSFERRED_TO_CMS') && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/candidate/certificates'); }}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Certificate →
                </button>
              )}
            </div>
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
              <Award className="text-cyan-600 dark:text-cyan-400" size={28} />
            </div>
          </div>
        </button>

        {/* My Instructor */}
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

      {/* Readiness Checklist */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <GraduationCap size={18} className="text-primary" />
          Baptism Readiness Checklist
        </h2>
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${allLessonsDone ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-slate-700/50'}`}>
            {allLessonsDone ? <CheckCircle size={20} className="text-green-500" /> : <Clock size={20} className="gray-400" />}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Complete All 10 Courses</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{completedLessons}/{totalLessons} lessons completed</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-3 rounded-lg ${baptized ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-slate-700/50'}`}>
            {baptized ? <CheckCircle size={20} className="text-green-500" /> : <Clock size={20} className="text-gray-400" />}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Baptism Completed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{baptized ? 'Baptized' : hasActiveBaptismRequest ? 'Request pending / awaiting ceremony' : 'Register for a baptism event'}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-3 rounded-lg ${allLessonsDone && baptized ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-slate-700/50'}`}>
            {allLessonsDone && baptized ? <CheckCircle size={20} className="text-green-500" /> : <AlertTriangle size={20} className="text-amber-400" />}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Ready for CMS Transfer</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {allLessonsDone && baptized ? 'All requirements met! Transfer available.' :
                 !allLessonsDone ? `Complete ${totalLessons - completedLessons} remaining courses` :
                 'Complete baptism first'}
              </p>
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

      {/* Upcoming Baptism Events - hidden if candidate has an active baptism request or is already baptized */}
      {upcomingEvents.length > 0 && !hasActiveBaptismRequest && !baptized && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-indigo-600" />
            Upcoming Baptism Events
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{event.eventName || 'Baptism Event'}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/candidate/baptism')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Request Baptism
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Need Help? Widget */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              Need Help?
            </h2>
            <p className="text-sm text-indigo-100 mt-1">
              Ask our AI Assistant for instant answers about courses, baptism, certificates, and more.
            </p>
          </div>
          <button
            onClick={() => navigate('/candidate/ai-assistant')}
            className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-medium text-sm hover:bg-indigo-50 transition-colors shadow-sm"
          >
            Start Conversation
          </button>
        </div>
      </div>

      {/* Support Requests Widget */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Headphones size={18} className="text-indigo-600" />
            Support Requests
          </h2>
          <button
            onClick={() => navigate('/candidate/support-requests')}
            className="text-sm text-indigo-600 hover:underline"
          >
            View All
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          View your support conversations and responses from church leaders.
        </p>
        <button
          onClick={() => navigate('/candidate/support-requests')}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          View Support Requests
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => navigate('/candidate/courses')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <BookOpen size={20} className="text-primary" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.myCourses')}</span>
        </button>
        <button
          onClick={() => navigate('/candidate/grades')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Award size={20} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.myGrades')}</span>
        </button>
        <button
          onClick={() => navigate('/candidate/baptism')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Calendar size={20} className="text-cyan-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.baptism')}</span>
        </button>
        <button
          onClick={() => navigate('/candidate/certificates')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Award size={20} className="text-amber-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.certificates')}</span>
        </button>
        <button
          onClick={() => navigate('/candidate/ai-assistant')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <UserIcon size={20} className="text-purple-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.aiAssistant')}</span>
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