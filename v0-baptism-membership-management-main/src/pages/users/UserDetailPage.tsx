import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${id}`);
      return response.data.data;
    },
  });

  useEffect(() => {
    if (error) toast.error('Failed to load user');
  }, [error]);

  if (isLoading) {
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{user?.fullName || t('common.users')}</h1>
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm mb-2">{t('common.email')}</p>
              <p className="text-xl font-semibold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-2">{t('common.role')}</p>
              <p className="text-xl font-semibold text-gray-900">{user.role}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-2">{t('common.status')}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.status}
              </span>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-2">{t('common.lastLogin')}</p>
              <p className="text-xl font-semibold text-gray-900">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : t('common.never')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          {t('common.edit')}
        </button>
        <button
          onClick={() => navigate('/users')}
          className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}
