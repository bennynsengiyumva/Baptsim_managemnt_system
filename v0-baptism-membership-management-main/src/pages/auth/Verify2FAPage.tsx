import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyTwoFactor, resendTwoFactorCode, selectIsLoading, selectError, clearError } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { Shield, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Verify2FAPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const email = localStorage.getItem('2fa_email');

  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
    return () => { dispatch(clearError()); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!code || code.length !== 6) {
      setValidationError(t('twoFactor.invalidCode'));
      return;
    }

    try {
      const result = await dispatch(verifyTwoFactor({ email: email!, code }) as any);

      if (result.type === 'auth/verifyTwoFactor/fulfilled') {
        toast.success('Two-factor authentication verified!');
        localStorage.removeItem('2fa_email');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Verification failed');
    }
  };

  const handleResend = async () => {
    setResending(true);
    await dispatch(resendTwoFactorCode(email!) as any);
    setResending(false);
  };

  const handleBack = () => {
    localStorage.removeItem('2fa_email');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="text-primary" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('twoFactor.title')}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t('twoFactor.description')} <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || validationError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-red-800">{error || validationError}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                {t('twoFactor.enterCode')}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {t('common.loading')}
                </>
              ) : (
                t('twoFactor.verify')
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
            >
              {resending ? t('common.loading') : t('twoFactor.resend')}
            </button>
            <div>
              <button
                onClick={handleBack}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={16} />
                {t('twoFactor.backToLogin')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
