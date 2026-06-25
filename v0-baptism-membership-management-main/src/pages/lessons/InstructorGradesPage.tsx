import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { instructorService } from '@/services/instructorService';
import { selectUser } from '@/store/authStore';
import { LessonGrade } from '@/types';
import Card from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function InstructorGradesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);

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

  const { data: grades = [] } = useQuery({
    queryKey: ['instructor-grades', instructorId],
    queryFn: async () => {
      try {
        return await lessonService.getGradesByInstructor(instructorId);
      } catch (e) {
        toast.error('Failed to load grades');
        throw e;
      }
    },
    enabled: !!instructorId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('common.grades')}</h1>
          <p className="text-slate-500">{t('common.viewAllGradesDesc')}</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4 font-medium">{t('common.course')}</th>
                <th className="pb-3 pr-4 font-medium">{t('common.candidate')}</th>
                <th className="pb-3 pr-4 font-medium">{t('common.bestScore')}</th>
                <th className="pb-3 pr-4 font-medium">{t('common.passing')}</th>
                <th className="pb-3 pr-4 font-medium">{t('common.attempts')}</th>
                <th className="pb-3 pr-4 font-medium">{t('common.status')}</th>
                <th className="pb-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">{t('common.noGradesAvailable')}</td></tr>
              ) : (
                grades.map((row: LessonGrade) => (
                  <tr key={row.lessonId} className="border-b last:border-0">
                    <td className="py-3 pr-4">{row.lessonTitle}</td>
                    <td className="py-3 pr-4">{row.candidateName}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-medium ${row.completed ? 'text-green-600' : 'text-amber-600'}`}>{row.bestScore}%</span>
                    </td>
                    <td className="py-3 pr-4"><span className="text-slate-500">{row.requiredScore}%</span></td>
                    <td className="py-3 pr-4"><span className="font-mono">{row.attemptsUsed}</span></td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {row.completed ? t('common.passed') : t('common.inProgress')}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/instructor/lessons/${row.lessonId}`)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title={t('common.view')}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
