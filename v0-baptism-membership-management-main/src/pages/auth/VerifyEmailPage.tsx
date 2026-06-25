import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const res = await apiClient.get('/api/auth/verify-email', { params: { token } });
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully!');
        toast.success('Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
        toast.error('Email verification failed');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader className="animate-spin text-primary" size={40} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying your email...</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="text-green-600" size={40} />
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email verified successfully!</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <XCircle className="text-red-600" size={40} />
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification failed</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
