import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, BookOpen, GraduationCap, Bell, Calendar,
  Award, Loader2, UserPlus, UserCheck, UserCog, X, RefreshCw
} from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { candidateService } from '@/services/candidateService';
import { instructorService } from '@/services/instructorService';
import { baptismService } from '@/services/baptismService';
import { notificationService } from '@/services/notificationService';
import apiClient from '@/services/api';
import { Candidate, AppNotification, Instructor } from '@/types';
import toast from 'react-hot-toast';

export default function FirstChurchElderDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [instructorCount, setInstructorCount] = useState(0);
  const [instructorList, setInstructorList] = useState<Instructor[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [assignCandidate, setAssignCandidate] = useState('');
  const [assignInstructorId, setAssignInstructorId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
    const onShow = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, []);

  const loadData = async () => {
    try {
      const [candData, instData, eventsData, notifData] = await Promise.all([
        candidateService.getAllCandidates(),
        instructorService.getAllInstructors().catch(() => ({ data: [] })),
        baptismService.getUpcomingEvents().catch(() => []),
        notificationService.getMyNotifications().catch(() => ({ data: [] })),
      ]);

      setCandidates(Array.isArray(candData) ? candData : []);
      const insts = Array.isArray(instData) ? instData : (instData as any)?.data ?? [];
      setInstructorCount(insts.length);
      setInstructorList(insts);
      setUpcomingEvents(Array.isArray(eventsData) ? eventsData : []);

      const notifsRaw = Array.isArray(notifData) ? notifData : (notifData as any)?.data || [];
      setNotifications(notifsRaw.map((n: any) => ({ ...n, read: n.read ?? n.isRead ?? false })).slice(0, 5));
    } catch { /* silent */ }
    setLoading(false);
  };

  const statusCounts = {
    REGISTERED: candidates.filter(c => c.status === 'REGISTERED').length,
    IN_PROGRESS: candidates.filter(c => c.status === 'IN_PROGRESS').length,
    READY_FOR_BAPTISM: candidates.filter(c => c.status === 'READY_FOR_BAPTISM').length,
    BAPTIZED: candidates.filter(c => c.status === 'BAPTIZED').length,
  };

  const totalWithStatus = candidates.length || 1;

  const handleAssign = async () => {
    if (!assignCandidate || !assignInstructorId) {
      toast.error('Select both a candidate and an instructor');
      return;
    }
    setAssigning(true);
    try {
      await apiClient.patch(`/api/candidates/${assignCandidate}/assign-instructor/${assignInstructorId}`);
      toast.success('Instructor assigned');
      setShowAssign(false);
      setAssignCandidate('');
      setAssignInstructorId('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign instructor');
    } finally {
      setAssigning(false);
    }
  };

  const approveRegistration = async (eventId: string, candidateId: string) => {
    try {
      await baptismService.approveRegistration(eventId, candidateId);
      toast.success('Registration approved');
      loadData();
    } catch {
      toast.error('Failed to approve');
    }
  };

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
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('common.churchManagementOverview')}</p>
          </div>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title={t('common.refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.instructors')}</p>
              <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{instructorCount}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <GraduationCap size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.inProgress')}</p>
              <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{statusCounts.IN_PROGRESS}</p>
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
              <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{statusCounts.READY_FOR_BAPTISM}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <Award size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('common.candidateProgress')}</h2>
        <div className="space-y-3">
          {[
            { label: t('common.registered'), count: statusCounts.REGISTERED, color: 'bg-blue-500' },
            { label: t('common.inProgress'), count: statusCounts.IN_PROGRESS, color: 'bg-amber-500' },
            { label: t('common.readyForBaptism'), count: statusCounts.READY_FOR_BAPTISM, color: 'bg-purple-500' },
            { label: t('common.baptized'), count: statusCounts.BAPTIZED, color: 'bg-green-500' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="font-bold text-gray-900 dark:text-white">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className={`${item.color} rounded-full h-2.5 transition-all`} style={{ width: `${(item.count / totalWithStatus) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => navigate('/instructors')} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
          <UserPlus size={20} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.instructors')}</span>
        </button>
        <button onClick={() => navigate('/candidates')} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
          <Users size={20} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.candidates')}</span>
        </button>
        <button onClick={() => navigate('/baptism/view')} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
          <Calendar size={20} className="text-purple-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.baptismEvents')}</span>
        </button>
        <button onClick={() => navigate('/help')} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
          <UserCheck size={20} className="text-primary" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.messages')}</span>
        </button>
        <button onClick={() => { setShowAssign(true); }} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
          <UserCog size={20} className="text-indigo-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.assignInstructor')}</span>
        </button>
      </div>

      {/* Upcoming Events with Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baptism Events */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {t('common.upcomingBaptismEvents')}
            </h2>
            <button onClick={() => navigate('/baptism/view')} className="text-sm text-primary hover:underline">{t('common.viewAll')}</button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noUpcomingEvents')}</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event: any) => (
                <div key={event.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500">{t('common.registeredCount', { count: event.registeredCount })}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{event.location}</p>
                  {event.registrations?.filter((r: any) => !r.approved && !r.baptized).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-medium text-amber-600 mb-2">{t('common.pendingApprovals')}</p>
                      {event.registrations.filter((r: any) => !r.approved && !r.baptized).slice(0, 3).map((reg: any) => (
                        <div key={reg.id} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{reg.candidateName}</span>
                          <button
                            onClick={() => approveRegistration(event.id, reg.candidateId)}
                            className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          >
                            {t('common.approve')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              {t('common.recentNotifications')}
            </h2>
            <button onClick={() => navigate('/notifications')} className="text-sm text-primary hover:underline">{t('common.viewAll')}</button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noNotifications')}</p>
          ) : (
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
          )}
        </div>
      </div>

      {/* Assign Instructor Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !assigning && setShowAssign(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('common.assignInstructor')}</h2>
              <button onClick={() => !assigning && setShowAssign(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.candidateHeading')}</label>
                <select
                  value={assignCandidate}
                  onChange={(e) => setAssignCandidate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">{t('common.selectACandidate')}</option>
                  {candidates.filter(c => c.status !== 'BAPTIZED').map(c => (
                    <option key={c.id} value={c.id}>{c.fullName || `${(c as any).firstName ?? ''} ${(c as any).lastName ?? ''}`.trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.instructorSection')}</label>
                <select
                  value={assignInstructorId}
                  onChange={(e) => setAssignInstructorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">{t('common.selectAnInstructor')}</option>
                  {instructorList.filter(i => !user?.churchId || Number((i as any).churchId) === Number(user.churchId)).map(i => (
                    <option key={i.id} value={String(i.id)}>
                      {i.fullName} ({(i as any).candidateCount ?? 0}/20)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAssign}
                  disabled={assigning || !assignCandidate || !assignInstructorId}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {assigning ? t('common.assigning') : t('common.assign')}
                </button>
                <button
                  onClick={() => setShowAssign(false)}
                  disabled={assigning}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
