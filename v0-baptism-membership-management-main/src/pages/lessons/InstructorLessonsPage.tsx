import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { instructorService } from '@/services/instructorService';
import { selectUser } from '@/store/authStore';
import { Lesson, LessonGrade } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function InstructorLessonsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.confirmDeleteLesson'))) return;
    setDeletingId(id);
    try {
      await lessonService.deleteLesson(id);
      toast.success('Lesson deleted');
      queryClient.invalidateQueries({ queryKey: ['instructor-lessons'] });
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
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
        const score = grade?.bestScore ?? row.studentScore ?? 0;
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
        <DataTable
          columns={columns}
          data={lessons}
          isLoading={isLoading}
          emptyMessage={t('common.noLessonsCreated')}
        />
      </Card>
    </div>
  );
}
