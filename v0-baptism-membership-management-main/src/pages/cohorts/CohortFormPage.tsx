import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { cohortService } from '@/services/cohortService';
import { instructorService } from '@/services/instructorService';
import toast from 'react-hot-toast';

export default function CohortFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSelector(selectUser);
  const isEditMode = !!id;

  const [cohortName, setCohortName] = useState('');
  const [cohortCode, setCohortCode] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [status, setStatus] = useState('DRAFT');
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    instructorService.getAllInstructors({ page: 1, pageSize: 100 }).then((res: any) => {
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const me = list.find((i: any) => i.email === user?.email);
      if (me) setInstructorId(me.id);
    }).catch(() => {});

    if (isEditMode && id) {
      cohortService.getById(Number(id)).then((cohort) => {
        setCohortName(cohort.cohortName);
        setCohortCode(cohort.cohortCode);
        setDescription(cohort.description || '');
        setLanguage(cohort.language || 'en');
        setStartDate(cohort.startDate || '');
        setEndDate(cohort.endDate || '');
        setCapacity(cohort.capacity || '');
        setStatus(cohort.status || 'DRAFT');
      }).catch(() => {
        toast.error('Failed to load cohort');
        navigate('/instructor/cohorts');
      });
    }
  }, [id, isEditMode, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortName.trim() || !cohortCode.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setLoading(true);
    try {
      const data: any = {
        cohortName,
        cohortCode,
        description: description || undefined,
        language,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        capacity: capacity || undefined,
        instructorId,
      };
      if (isEditMode && id) {
        data.status = status;
        await cohortService.update(Number(id), data);
        toast.success('Cohort updated');
      } else {
        await cohortService.create(data);
        toast.success('Cohort created');
      }
      navigate('/instructor/cohorts');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save cohort');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/instructor/cohorts')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Cohort' : 'Create Cohort'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cohort Name *</label>
          <input
            value={cohortName}
            onChange={(e) => setCohortName(e.target.value)}
            placeholder="e.g. January 2027 Baptism Class"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cohort Code *</label>
          <input
            value={cohortCode}
            onChange={(e) => setCohortCode(e.target.value)}
            placeholder="e.g. BC-2027-01"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this cohort..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="rw">Kinyarwanda</option>
            </select>
          </div>
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity</label>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 50"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/instructor/cohorts')}
            className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
