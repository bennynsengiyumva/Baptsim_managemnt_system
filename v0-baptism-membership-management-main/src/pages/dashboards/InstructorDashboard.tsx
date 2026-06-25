import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, BookOpen, Clock, Award, Bell, Calendar,
  Loader2, User, GraduationCap, RefreshCw, CheckCircle2
} from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { candidateService } from '@/services/candidateService';
import { instructorService } from '@/services/instructorService';
import { lessonService } from '@/services/lessonService';
import { baptismService } from '@/services/baptismService';
import { notificationService } from '@/services/notificationService';
import { Candidate, AppNotification, LessonGrade } from '@/types';

export default function InstructorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [baptizedCompleted, setBaptizedCompleted] = useState(0);
  const [baptizedIncomplete, setBaptizedIncomplete] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const onShow = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, []);

  const loadData = async () => {
    try {
      const [candData, eventsData, notifData, instructors] = await Promise.all([
        candidateService.getAllCandidates(),
        baptismService.getUpcomingEvents().catch(() => []),
        notificationService.getMyNotifications().catch(() => ({ data: [] })),
        instructorService.getAllInstructors({ page: 1, pageSize: 100 }),
      ]);

      setCandidates(Array.isArray(candData) ? candData : []);
      setUpcomingEvents(Array.isArray(eventsData) ? eventsData : []);

      const notifsRaw = Array.isArray(notifData) ? notifData : (notifData.data || []);
      setNotifications(notifsRaw.map((n: any) => ({ ...n, read: n.read ?? n.isRead ?? false })).slice(0, 5));

      // Determine course completion for BAPTIZED candidates
      const list = Array.isArray(instructors) ? instructors : Array.isArray((instructors as any)?.data) ? (instructors as any).data : [];
      const myInstructor = list.find((i: any) => i.email === user?.email);
      if (myInstructor) {
        const grades: LessonGrade[] = await lessonService.getGradesByInstructor(myInstructor.id).catch(() => []);
        const completedMap = new Map<number, boolean>();
        grades.forEach(g => {
          const cid = Number(g.candidateId);
          if (!completedMap.has(cid)) completedMap.set(cid, true);
          if (!g.completed) completedMap.set(cid, false);
        });
        const baptizedCandidates = (Array.isArray(candData) ? candData : []).filter((c: Candidate) => c.status === 'BAPTIZED');
        let completed = 0;
        let incomplete = 0;
        baptizedCandidates.forEach((c: Candidate) => {
          if (completedMap.get(Number(c.id))) completed++;
          else incomplete++;
        });
        setBaptizedCompleted(completed);
        setBaptizedIncomplete(incomplete);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const inProgress = candidates.filter(c => c.status === 'IN_PROGRESS');
  const readyForBaptism = candidates.filter(c => c.status === 'READY_FOR_BAPTISM');
  const baptized = candidates.filter(c => c.status === 'BAPTIZED');

  const breakdown = [
    { label: t('common.takingCourses'), count: inProgress.length, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: t('common.readyForBaptism'), count: readyForBaptism.length, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: t('common.baptizedCoursesIncomplete'), count: baptizedIncomplete, color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
    { label: t('common.completedBoth'), count: baptizedCompleted, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' },
  ];
  const total = candidates.length || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('common.welcomeUser', { name: user?.fullName || user?.email })}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('common.teachingOverview')}</p>
          </div>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title={t('common.refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.totalCandidates')}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{candidates.length}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users size={24} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.inProgress')}</p>
              <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{inProgress.length}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <BookOpen size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.readyForBaptism')}</p>
              <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{readyForBaptism.length}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <Clock size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.baptized')}</p>
                <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{baptized.length}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <Award size={24} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.cmsReady')}</p>
                <p className="text-3xl font-bold mt-1 text-green-700 dark:text-green-300">{baptizedCompleted}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
                <CheckCircle2 size={24} className="text-green-700 dark:text-green-300" />
              </div>
            </div>
          </div>
      </div>

      {/* Progress Graph */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('common.candidateProgressBreakdown')}</h2>
        <div className="space-y-4">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className={`${item.color} rounded-full h-3 transition-all duration-500`}
                  style={{ width: `${(item.count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {candidates.length === 0 && (
          <p className="text-center text-gray-400 py-4 text-sm">{t('common.noCandidatesAssignedYet')}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/instructor/lessons')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <BookOpen size={20} className="text-primary" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.myLessons')}</span>
        </button>
        <button
          onClick={() => navigate('/instructor/grades')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Award size={20} className="text-amber-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.grades')}</span>
        </button>
        <button
          onClick={() => navigate('/candidates')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Users size={20} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.candidates')}</span>
        </button>
        <button
          onClick={() => navigate('/baptism/view')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Calendar size={20} className="text-purple-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.baptismView')}</span>
        </button>
      </div>

      {/* Two Columns: Candidates + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Candidates */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={18} className="text-primary" />
              {t('common.myCandidates')}
            </h2>
            <button onClick={() => navigate('/candidates')} className="text-sm text-primary hover:underline">{t('common.viewAll')}</button>
          </div>
          {candidates.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noCandidatesAssigned')}</p>
          ) : (
            <div className="space-y-2">
              {candidates.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/candidates/${c.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {c.fullName || `${c.firstName} ${c.lastName}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    c.status === 'BAPTIZED' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                    c.status === 'READY_FOR_BAPTISM' ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' :
                    c.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {t('common.upcomingEvents')}
            </h2>
            <button onClick={() => navigate('/baptism/view')} className="text-sm text-primary hover:underline">{t('common.viewAll')}</button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noUpcomingEvents')}</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{event.location}</p>
                  </div>
                    <span className="text-xs text-gray-500">{event.registeredCount} {t('common.regAbbr')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              {t('common.recentNotifications')}
            </h2>
            <button onClick={() => navigate('/notifications')} className="text-sm text-primary hover:underline">{t('common.viewAll')}</button>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${!n.read ? 'bg-primary/5' : ''}`}>
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
