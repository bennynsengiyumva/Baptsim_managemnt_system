import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, loginWithGoogle, selectError, selectIsLoading, selectRoleChangeMessage, clearRoleChangeMessage } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle, Loader, ChevronLeft, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    google?: any;
  }
}

const bibleVerses = [
  {
    text: "Go then and make disciples of all the nations, baptizing them into the name of the Father and of the Son and of the Holy Spirit.",
    reference: "Matthew 28:19",
  },
  {
    text: "We were buried therefore with Him by the baptism into death, so that just as Christ was raised from the dead, so we also might walk habitually in newness of life.",
    reference: "Romans 6:4",
  },
  {
    text: "Repent, and be baptized, every one of you, in the name of Jesus Christ for the forgiveness of your sins, and you shall receive the gift of the Holy Spirit.",
    reference: "Acts 2:38",
  },
  {
    text: "Having been buried with Him in baptism, in which you were also raised with Him through faith in the working of God.",
    reference: "Colossians 2:12",
  },
  {
    text: "And now why do you delay? Arise and be baptized, and wash away your sins, calling on His name.",
    reference: "Acts 22:16",
  },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const error = useSelector(selectError);
  const isLoading = useSelector(selectIsLoading);
  const roleChangeMessage = useSelector(selectRoleChangeMessage);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [isVerseTransitioning, setIsVerseTransitioning] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVerseTransitioning(true);
      setTimeout(() => {
        setCurrentVerse((prev) => (prev + 1) % bibleVerses.length);
        setIsVerseTransitioning(false);
      }, 500);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Show role change modal after successful login
  useEffect(() => {
    if (roleChangeMessage) {
      setShowRoleChangeModal(true);
    }
  }, [roleChangeMessage]);

  const goToPrevVerse = () => {
    setIsVerseTransitioning(true);
    setTimeout(() => {
      setCurrentVerse((prev) => (prev - 1 + bibleVerses.length) % bibleVerses.length);
      setIsVerseTransitioning(false);
    }, 300);
  };

  const goToNextVerse = () => {
    setIsVerseTransitioning(true);
    setTimeout(() => {
      setCurrentVerse((prev) => (prev + 1) % bibleVerses.length);
      setIsVerseTransitioning(false);
    }, 300);
  };

  const handleGoogleCredentialResponse = useCallback(async (response: any) => {
    setGoogleLoading(true);
    try {
      const result = await dispatch(loginWithGoogle(response.credential) as any);
      if (result.type === 'auth/loginWithGoogle/fulfilled') {
        toast.success('Welcome!');
        navigate('/dashboard');
      } else {
        toast.error(result.payload || 'Google login failed');
      }
    } catch {
      toast.error('Google login failed');
    }
    setGoogleLoading(false);
  }, [dispatch, navigate]);

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
      );
    }
  }, [handleGoogleCredentialResponse]);

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

        // Check if there's a role change message - if so, show modal instead of navigating
        if (result.payload?.roleChangeMessage) {
          // Modal will handle navigation after user acknowledges
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
    <div className="min-h-screen flex">
      {/* Left Panel — Church branding + Bible verse */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0c4a6e]">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Church Logo */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
              <img
                src="/images.png"
                alt="Seventh-day Adventist Church"
                className="h-24 w-24 object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Church Name */}
          <h1 className="text-4xl font-bold text-white text-center mb-2 tracking-tight">
            BMPMS
          </h1>
          <p className="text-blue-200/80 text-center text-lg mb-12 max-w-md">
            Baptism & Membership Preparation Management System
          </p>

          {/* Bible Verse Card */}
          <div className="w-full max-w-lg">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
              {/* Cross icon */}
              <div className="flex justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-amber-400/80">
                  <path d="M12 2v20M5 7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Verse */}
              <div className={`text-center transition-all duration-500 ${isVerseTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                <p className="text-white/90 text-lg leading-relaxed italic mb-4">
                  "{bibleVerses[currentVerse].text}"
                </p>
                <p className="text-amber-400/90 font-semibold text-sm tracking-wide">
                  — {bibleVerses[currentVerse].reference}
                </p>
              </div>

              {/* Navigation dots + arrows */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={goToPrevVerse}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex gap-2">
                  {bibleVerses.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setIsVerseTransitioning(true);
                        setTimeout(() => {
                          setCurrentVerse(i);
                          setIsVerseTransitioning(false);
                        }, 300);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === currentVerse
                          ? 'bg-amber-400 w-6'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={goToNextVerse}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Bottom tagline */}
            <p className="text-center text-blue-200/50 text-sm mt-6">
              "Because the love of Christ compels us" — 2 Corinthians 5:14
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile logo (shown only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/images.png"
              alt="SDA Church"
              className="h-16 w-16 mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">BMPMS</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0f172a] dark:text-white">
                {t('login.welcomeBack', 'Welcome Back')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {t('login.signIn', 'Sign in to your account')}
              </p>
            </div>

            {/* Google Sign In */}
            <div className="mb-6">
              <div id="google-signin-btn" className="w-full"></div>
              {googleLoading && (
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                  <Loader className="animate-spin" size={16} />
                  Signing in with Google...
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
              <span className="text-xs text-slate-400 uppercase font-medium">{t('common.or', 'or')}</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {(error || validationError) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{error || validationError}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('common.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400 transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('common.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
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
              <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                {t('common.forgotPassword')}
              </Link>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
              <span className="text-xs text-slate-400">•</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('login.noAccount', "Don't have an account?")}{' '}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  {t('common.register')}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            © {new Date().getFullYear()} Seventh-day Adventist Church. All rights reserved.
          </p>
        </div>
      </div>

      {/* Role Change Notification Modal */}
      {showRoleChangeModal && roleChangeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-blue-500 dark:border-cyan-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <AlertTriangle className="text-blue-600 dark:text-cyan-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Role Changed</h3>
                <p className="text-xs text-blue-600 dark:text-cyan-400 font-medium">Your account has been updated</p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                Your role has been changed. Please login again.
              </p>
            </div>
            <button
              onClick={() => {
                dispatch(clearRoleChangeMessage());
                setShowRoleChangeModal(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
