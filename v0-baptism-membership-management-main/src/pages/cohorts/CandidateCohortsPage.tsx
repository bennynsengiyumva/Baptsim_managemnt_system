import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Users, Loader2, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { candidateService } from '@/services/candidateService';
import { cohortService } from '@/services/cohortService';
import { Cohort } from '@/types';
import toast from 'react-hot-toast';

export default function CandidateCohortsPage() {
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user?.email) {
        const candidates = await candidateService.getCandidatesByEmail(user.email);
        const list = Array.isArray(candidates) ? candidates : [];
        if (list.length > 0) {
          const cid = list[0].id;
          setCandidateId(cid);

          // Get only ACTIVE cohorts for candidate's church
          if (list[0].churchId) {
            const churchCohorts = await cohortService.getActiveByChurch(list[0].churchId);
            setCohorts(Array.isArray(churchCohorts) ? churchCohorts : []);
          }

          // Check existing enrollments
          try {
            const allCohorts = await cohortService.getAll();
            const enrolled = (Array.isArray(allCohorts) ? allCohorts : []).filter((c: any) =>
              c.members?.some((m: any) => m.candidateId === cid && ['ENROLLED', 'APPROVED'].includes(m.enrollmentStatus))
            );
            setMyEnrollments(enrolled);
          } catch {}
        }
      }
    } catch {}
    setLoading(false);
  };

  const isEnrolled = (cohortId: number) => myEnrollments.some((c: any) => c.id === cohortId);

  const handleJoin = async (cohortId: number) => {
    if (!candidateId) return;
    try {
      await cohortService.enrollCandidate(cohortId, candidateId);
      toast.success('Enrollment request sent! Waiting for instructor approval.');
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to enroll');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('common.cohorts')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Available baptism class cohorts in your church</p>
      </div>

      {myEnrollments.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium mb-2">
            <CheckCircle size={18} />
            Your Active Enrollments
          </div>
          <div className="space-y-2">
            {myEnrollments.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{c.cohortName}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({c.cohortCode})</span>
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Enrolled</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cohorts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Cohorts Available</h3>
          <p className="text-gray-500 dark:text-gray-400">There are no active cohorts available for your church yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cohort.cohortName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cohort.cohortCode}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  {cohort.status}
                </span>
              </div>

              {cohort.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{cohort.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={14} />
                  <span>{cohort.memberCount} / {cohort.capacity || '∞'} members</span>
                </div>
                {cohort.startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock size={14} />
                    <span>{cohort.startDate} - {cohort.endDate || 'Ongoing'}</span>
                  </div>
                )}
                {cohort.instructorName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen size={14} />
                    <span>Instructor: {cohort.instructorName}</span>
                  </div>
                )}
                {cohort.language && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Language: {cohort.language === 'rw' ? 'Kinyarwanda' : 'English'}
                  </div>
                )}
              </div>

              {isEnrolled(cohort.id) ? (
                <div className="w-full py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium text-center">
                  Already Enrolled
                </div>
              ) : (
                <button
                  onClick={() => handleJoin(cohort.id)}
                  className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Join Cohort
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
