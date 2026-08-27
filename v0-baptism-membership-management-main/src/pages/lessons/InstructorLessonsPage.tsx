import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Eye, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { instructorService } from '@/services/instructorService';
import { selectUser } from '@/store/authStore';
import { Lesson, LessonGrade } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function InstructorLessonsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant: 'danger' | 'warning' }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

  const { data: instructors = [] } = useQuery({
    queryKey: ['current-instructor'],
    queryFn: async () => {
      const res = await instructorService.getAllInstructors({ page: 1, pageSize: 100 });
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return list.find((i: any) => i.email === currentUser?.email);
    },
    enabled: !!currentUser,
  });

  const instructorId = (instructors as any)?.id;

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['instructor-lessons', instructorId],
    queryFn: async () => {
      try {
        return await lessonService.getByInstructor(instructorId);
      } catch (e) {
        toast.error('Failed to load lessons');
        throw e;
      }
    },
    enabled: !!instructorId,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['instructor-grades', instructorId],
    queryFn: () => lessonService.getGradesByInstructor(instructorId),
    enabled: !!instructorId,
  });

  const gradeMap = new Map<string, LessonGrade>(
    (Array.isArray(grades) ? grades : []).map((g) => [g.lessonId, g])
  );

  const filteredLessons = lessons.filter((l: Lesson) => {
    const matchesSearch = !searchQuery || l.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) || (l.candidateName && l.candidateName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'completed' && l.completed) ||
      (statusFilter === 'in_progress' && l.status === 'IN_PROGRESS') ||
      (statusFilter === 'not_started' && !l.completed && l.status !== 'IN_PROGRESS');
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Lesson',
      message: 'Are you sure you want to delete this lesson? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await lessonService.deleteLesson(id);
          toast.success('Lesson deleted');
          queryClient.invalidateQueries({ queryKey: ['instructor-lessons'] });
        } catch {
          toast.error('Failed to delete');
        } finally {
          setDeletingId(null);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const columns = [
    { key: 'lessonTitle' as keyof Lesson, label: t('common.title') },
    {
      key: 'lessonOrder' as keyof Lesson,
      label: t('common.order'),
      render: (v: any) => <span className="font-mono">#{v ?? '-'}</span>,
    },
    { key: 'candidateName' as keyof Lesson, label: t('common.candidate') },
    {
      key: 'completed' as keyof Lesson,
      label: t('common.status'),
      render: (v: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          v ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {v ? t('common.completed') : t('common.inProgress')}
        </span>
      ),
    },
    {
      key: 'id' as keyof Lesson,
      label: t('common.score'),
      render: (_v: any, row: Lesson) => {
        const grade = gradeMap.get(row.id);
        const score = grade?.bestScore ?? row.candidateScore ?? 0;
        return <span className="font-medium">{score}% (pass: {row.requiredScore ?? 70}%)</span>;
      },
    },
    {
      key: 'id' as keyof Lesson,
      label: t('common.actions'),
      render: (_v: any, row: Lesson) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/instructor/lessons/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title={t('common.view')}
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => navigate(`/instructor/lessons/${row.id}/edit`)}
            className="p-1 text-amber-600 hover:bg-amber-50 rounded"
            title={t('common.edit')}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold">{t('common.myLessons')}</h1>
            <p className="text-slate-500">{t('common.manageLessonsAndAssessments')}</p>
          </div>
        </div>
        <Button onClick={() => navigate('/instructor/lessons/new')}>
          <Plus size={20} /> {t('common.createLesson')}
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border rounded-lg px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filteredLessons}
          isLoading={isLoading}
          renderEmpty={
            <EmptyState
              icon={<BookOpen size={32} className="text-slate-300 dark:text-slate-600" />}
              title={lessons.length === 0 ? t('common.noLessonsCreated') : 'No lessons match your search'}
              message={lessons.length === 0 ? 'Create your first lesson to get started.' : 'Try adjusting your search or filter criteria.'}
            />
          }
        />
      </Card>
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} variant={confirmDialog.variant} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}
