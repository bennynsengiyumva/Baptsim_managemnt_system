import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, selectError, selectIsLoading } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const error = useSelector(selectError);
  const isLoading = useSelector(selectIsLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError(t('validation.required'));
      return;
    }

    try {
      const result = await dispatch(loginUser({ email, password }) as any);

      if (result.type === 'auth/login/fulfilled') {
        if (result.payload?.requiresTwoFactor) {
          navigate('/verify-2fa');
          return;
        }

        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">BMPMS</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Baptism & Membership Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || validationError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-red-800">{error || validationError}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
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
                t('common.login')
              )}
            </button>
          </form>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
              {t('common.forgotPassword')}
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                {t('common.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}