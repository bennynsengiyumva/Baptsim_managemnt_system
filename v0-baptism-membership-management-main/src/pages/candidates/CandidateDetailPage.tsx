import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Candidate {
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
  enrollmentDate: string;
  joinDate?: string;
  bibleStudies: any[];
  baptismInfo?: any;
  membershipStatus?: any;
}

// Support both { fullName } and { firstName, lastName } from the API
const resolveFullName = (c: Candidate): string => {
  if (c.fullName) return c.fullName;
  return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '—';
};

// Safely format a date string; return '—' if invalid/missing
const formatDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: candidate, isLoading, error } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/candidates/${id}`);
      // Handle both response.data.data and response.data shapes
      return (response.data.data ?? response.data) as Candidate;
    },
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load candidate');
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{t('common.errorLoadingCandidate')}</p>
      </div>
    );
  }

  const fullName = resolveFullName(candidate);

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-gray-600 mt-1">{t('common.candidateDetails')}</p>
        </div>
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
              <p className="font-medium text-gray-900">{candidate.email ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Phone className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">{t('common.phone')}</p>
              <p className="font-medium text-gray-900">{candidate.phone ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Calendar className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">{t('common.dateOfBirth')}</p>
              <p className="font-medium text-gray-900">{formatDate(candidate.dateOfBirth)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">{t('common.gender')}</p>
            <p className="font-medium text-gray-900">{candidate.gender ?? '—'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">{t('common.address')}</p>
            <p className="font-medium text-gray-900">{candidate.address || t('common.notProvided')}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">{t('common.status')}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {candidate.status ?? '—'}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">{t('common.enrollmentDate')}</p>
            <p className="font-medium text-gray-900">
              {formatDate(candidate.enrollmentDate ?? candidate.joinDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Bible Studies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.bibleStudies')}</h2>
        {candidate.bibleStudies && candidate.bibleStudies.length > 0 ? (
          <div className="space-y-3">
            {candidate.bibleStudies.map((study: any) => (
              <div key={study.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900">{study.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Status: {study.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">{t('common.noBibleStudiesFound')}</p>
        )}
      </div>

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