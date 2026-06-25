import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, AlertCircle, FileDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { candidateService } from '@/services/candidateService';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Lesson } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function CandidateCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);

  const [candidateId, setCandidateId] = useState<string | null>(null);

  // Find candidate by email
  useEffect(() => {
    if (currentUser?.email) {
      candidateService.getCandidatesByEmail(currentUser.email).then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) setCandidateId(String(list[0].id));
      });
    }
  }, [currentUser]);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['candidate-courses', candidateId],
    queryFn: async () => {
      try {
        return await lessonService.getByCandidate(candidateId!);
      } catch (e) {
        toast.error('Failed to load courses');
        throw e;
      }
    },
    enabled: !!candidateId,
  });

  const { data: progress = 0 } = useQuery({
    queryKey: ['candidate-progress', candidateId],
    queryFn: () => lessonService.getProgress(candidateId!),
    enabled: !!candidateId,
  });

  const completedCount = lessons.filter((l: Lesson) => l.completed).length;
  const totalCount = lessons.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('common.myCourses')}</h1>
          <p className="text-slate-500">
            {totalCount > 0
              ? `${completedCount} ${t('common.of')} ${totalCount} ${t('common.coursesCompleted')} (${Math.round(progress)}%)`
              : t('common.noCoursesAssigned')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson: Lesson) => {
          const isLocked =
            lesson.lessonOrder > 1 &&
            !lessons.find(
              (l: Lesson) => l.lessonOrder === lesson.lessonOrder - 1 && l.completed
            );

          return (
            <Card key={lesson.id}>
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    #{lesson.lessonOrder}
                  </span>
                  {lesson.completed ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : isLocked ? (
                    <Clock size={20} className="text-slate-400" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-500" />
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2">{lesson.lessonTitle}</h3>

                {lesson.notes && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{lesson.notes}</p>
                )}

                <div className="mt-auto space-y-2">
                  {lesson.completed ? (
                    <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                      <CheckCircle size={16} />
                      {t('common.passed')} ({lesson.studentScore}%)
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      {t('common.passingScore')}: {lesson.requiredScore}%
                    </div>
                  )}

                  <div className="flex gap-2">
                    {lesson.documentUrl && (
                      <a
                        href={lesson.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <FileDown size={14} /> {t('common.file')}
                      </a>
                    )}

                    {isLocked ? (
                      <span className="text-xs text-slate-400">{t('common.completePreviousCourse')}</span>
                    ) : lesson.completed ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/candidate/courses/${lesson.id}`)}
                      >
                        {t('common.viewResult')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/candidate/courses/${lesson.id}`)}
                      >
                        {lesson.questions?.length ? t('common.startAssessment') : t('common.viewCourse')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {lessons.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg">{t('common.noCoursesAssigned')}</p>
            <p className="text-sm">{t('common.instructorAssignCourses')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
