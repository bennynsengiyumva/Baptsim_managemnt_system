import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, CheckCircle, Clock, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { candidateService } from '@/services/candidateService';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LessonGrade } from '@/types';
import { useTranslation } from 'react-i18next';

export default function CandidateGradesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      candidateService.getCandidatesByEmail(currentUser.email).then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) setCandidateId(String(list[0].id));
      });
    }
  }, [currentUser]);

  const { data: grades = [], isLoading, refetch } = useQuery({
    queryKey: ['candidate-grades', candidateId],
    queryFn: () => lessonService.getGradesByCandidate(candidateId!),
    enabled: !!candidateId,
  });

  const gradeList = grades as LessonGrade[];
  const passedCount = gradeList.filter((g) => g.completed).length;
  const totalCount = gradeList.length;
  const averageScore = totalCount > 0
    ? Math.round(gradeList.reduce((sum, g) => sum + g.bestScore, 0) / totalCount)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('common.myGrades')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('common.trackYourProgress')}</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Passed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{passedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Award className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{averageScore}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grades Table */}
      {gradeList.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No courses assigned yet</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/candidate/courses')}>
              Go to My Courses
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Course</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Best Score</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Passing</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Attempts</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {gradeList.map((grade) => (
                  <tr key={grade.lessonId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{grade.lessonTitle}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${grade.bestScore >= grade.requiredScore ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {grade.bestScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {grade.requiredScore}%
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {grade.attemptsUsed}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {grade.completed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle size={12} /> Passed
                        </span>
                      ) : grade.attemptsUsed > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Clock size={12} /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          Not Started
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/candidate/courses/${grade.lessonId}`)}
                      >
                        {grade.completed ? 'Review' : 'View'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
