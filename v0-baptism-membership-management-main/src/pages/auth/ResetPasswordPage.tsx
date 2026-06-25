import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, AlertCircle, Loader, CheckCircle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/services/api';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const [token, setToken] = useState(urlToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !newPassword) {
      setError(t('validation.required'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('validation.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('validation.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/reset-password', { token, newPassword });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('resetPassword.title')}</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{t('resetPassword.success')}</p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('common.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <KeyRound className="text-primary" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('resetPassword.title')}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t('resetPassword.description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {urlToken ? (
              <input type="hidden" value={token} readOnly />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('resetPassword.token')}</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
                    placeholder={t('resetPassword.tokenPlaceholder')}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.newPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {t('common.loading')}
                </>
              ) : (
                t('resetPassword.resetButton')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary font-medium hover:underline">
              {t('common.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
