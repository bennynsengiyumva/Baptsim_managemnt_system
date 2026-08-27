import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api';
import { candidateService } from '@/services/candidateService';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ArrowLeft, Mail, Phone, Calendar, User, CheckCircle, Award, BookOpen, GraduationCap } from 'lucide-react';
import { selectUser } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface CandidateDetail {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  status: string;
  instructorApproved?: boolean;
  churchId?: number;
  churchName?: string;
  instructorId?: number;
  instructorName?: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  grades: any[];
  baptized?: boolean;
  approved?: boolean;
  certificateSigned?: boolean;
  baptismId?: number;
}

const resolveFullName = (c: CandidateDetail): string => {
  if (c.fullName) return c.fullName;
  return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '—';
};

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = useSelector(selectUser);
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<CandidateDetail | null>(null);

  const { data: candidate, isLoading, error } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/candidates/${id}`);
      return (response.data.data ?? response.data) as CandidateDetail;
    },
  });

  useEffect(() => {
    if (candidate) setDetail(candidate);
  }, [candidate]);

  useEffect(() => {
    if (error) toast.error('Failed to load candidate');
  }, [error]);

  const approveMutation = useMutation({
    mutationFn: () => candidateService.approveReady(id!),
    onSuccess: (data: any) => {
      setDetail((prev) => prev ? { ...prev, ...data, instructorApproved: true, status: 'READY_FOR_BAPTISM' } : prev);
      toast.success('Candidate approved for baptism!');
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err.message || 'Failed to approve';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (error || !detail) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{t('common.errorLoadingCandidate')}</p>
      </div>
    );
  }

  const fullName = resolveFullName(detail);
  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const allLessonsDone = detail.totalLessons > 0 && detail.completedLessons === detail.totalLessons;
  const canApprove = isInstructor && allLessonsDone && detail.approved && !detail.instructorApproved;
  const isAlreadyApproved = detail.instructorApproved;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/candidates')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-gray-600 mt-1">{t('common.candidateDetails')}</p>
        </div>
        {canApprove && (
          <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
            <GraduationCap size={16} />
            {approveMutation.isPending ? 'Approving...' : 'Approve for Baptism'}
          </Button>
        )}
        {isAlreadyApproved && (
          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <CheckCircle size={16} /> Approved for Baptism
          </span>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Course Progress</p>
              <p className="text-2xl font-bold">{detail.totalLessons > 0 ? `${Math.round(detail.progress)}%` : '—'}</p>
              <p className="text-xs text-gray-400">{detail.completedLessons}/{detail.totalLessons} lessons</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <Award className="text-cyan-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Baptism</p>
              <p className="text-lg font-bold">{detail.baptized ? 'Baptized' : detail.approved ? 'Approved' : 'Not Registered'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <GraduationCap className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Instructor Approval</p>
              <p className="text-lg font-bold">{isAlreadyApproved ? 'Approved' : 'Pending'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${detail.status === 'BAPTIZED' ? 'bg-green-100' : 'bg-gray-100'}`}>
              <User className={detail.status === 'BAPTIZED' ? 'text-green-600' : 'text-gray-600'} size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-bold">{detail.status?.replace(/_/g, ' ') || '—'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.personalInformation')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <User className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">{t('common.fullName')}</p>
              <p className="font-medium text-gray-900">{fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">{t('common.email')}</p>
              <p className="font-medium text-gray-900">{detail.email ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Phone className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">{t('common.phone')}</p>
              <p className="font-medium text-gray-900">{detail.phone ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Calendar className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">{t('common.dateOfBirth')}</p>
              <p className="font-medium text-gray-900">{formatDate(detail.dateOfBirth)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('common.gender')}</p>
            <p className="font-medium text-gray-900">{detail.gender ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('common.address')}</p>
            <p className="font-medium text-gray-900">{detail.address || t('common.notProvided')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('common.status')}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {detail.status?.replace(/_/g, ' ') ?? '—'}
            </span>
          </div>
          {detail.churchName && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Church</p>
              <p className="font-medium text-gray-900">{detail.churchName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Grades */}
      {detail.grades && detail.grades.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Grades</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Course</th>
                  <th className="text-center py-2">Best Score</th>
                  <th className="text-center py-2">Passing</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {detail.grades.map((g: any) => (
                  <tr key={g.lessonId} className="border-b border-gray-100">
                    <td className="py-2">{g.lessonTitle}</td>
                    <td className="text-center py-2 font-bold">{g.bestScore}%</td>
                    <td className="text-center py-2">{g.requiredScore}%</td>
                    <td className="text-center py-2">
                      {g.completed ? (
                        <span className="text-green-600 font-medium">Passed</span>
                      ) : (
                        <span className="text-amber-600">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate(`/candidates/${id}/edit`)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {t('common.edit')}
        </button>
        <button
          onClick={() => navigate('/candidates')}
          className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}