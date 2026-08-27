import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Users, BookOpen, Calendar, Loader2, Trash2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { selectUser } from '@/store/authStore';
import { cohortService } from '@/services/cohortService';
import { instructorService } from '@/services/instructorService';
import { Cohort } from '@/types';
import toast from 'react-hot-toast';

export default function InstructorCohortsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const instructors = await instructorService.getAllInstructors({ page: 1, pageSize: 100 });
      const list = Array.isArray(instructors) ? instructors : Array.isArray((instructors as any)?.data) ? (instructors as any).data : [];
      const myInstructor = list.find((i: any) => i.email === user?.email);
      if (myInstructor) {
        const data = await cohortService.getByInstructor(myInstructor.id);
        setCohorts(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load cohorts');
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this cohort?')) return;
    try {
      await cohortService.delete(id);
      setCohorts(prev => prev.filter(c => c.id !== id));
      toast.success('Cohort deleted');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete cohort');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('common.cohorts')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your baptism class cohorts</p>
        </div>
        <button
          onClick={() => navigate('/instructor/cohorts/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Create Cohort
        </button>
      </div>

      {cohorts.length === 0 ? (
        <EmptyState
          icon={<Users size={32} className="text-slate-300 dark:text-slate-600" />}
          title={t('common.noCohortsYet')}
          message="Create your first cohort to start organizing candidates."
          action={
            <button
              onClick={() => navigate('/instructor/cohorts/new')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Cohort
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((cohort) => (
            <div
              key={cohort.id}
              onClick={() => navigate(`/instructor/cohorts/${cohort.id}`)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cohort.cohortName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cohort.cohortCode}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  cohort.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  cohort.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                  cohort.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {cohort.status}
                </span>
              </div>

              <div className="space-y-3">
                {cohort.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{cohort.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={14} />
                  <span>{cohort.memberCount} members ({cohort.approvedCount} approved)</span>
                </div>
                {cohort.churchName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen size={14} />
                    <span>{cohort.churchName}</span>
                  </div>
                )}
                {cohort.startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={14} />
                    <span>{cohort.startDate} - {cohort.endDate || 'Ongoing'}</span>
                  </div>
                )}
                {cohort.capacity && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Capacity: {cohort.memberCount}/{cohort.capacity}
                  </div>
                )}
                {cohort.language && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Language: {cohort.language === 'rw' ? 'Kinyarwanda' : 'English'}
                  </div>
                )}
              </div>

              {cohort.status === 'DRAFT' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(cohort.id); }}
                  className="mt-4 flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
