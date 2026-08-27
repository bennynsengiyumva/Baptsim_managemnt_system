import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, selectError, selectIsLoading } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Phone, AlertCircle, Loader, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/services/api';

interface Church {
  id: number;
  churchName: string;
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

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const error = useSelector(selectError);
  const isLoading = useSelector(selectIsLoading);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [address, setAddress] = useState('');
  const [churchId, setChurchId] = useState('');

  const [churches, setChurches] = useState<Church[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [currentVerse, setCurrentVerse] = useState(0);
  const [isVerseTransitioning, setIsVerseTransitioning] = useState(false);

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

  useEffect(() => {
    setLoadingChurches(true);
    apiClient.get('/api/churches')
      .then((res) => {
        const data = res.data;
        setChurches(Array.isArray(data) ? data : data?.data ?? []);
      })
      .catch(() => setChurches([]))
      .finally(() => setLoadingChurches(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setValidationError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (!churchId) {
      setValidationError('Please select a church');
      return;
    }

    const payload: any = {
      fullName,
      email,
      phone,
      password,
      churchId: Number(churchId),
      dateOfBirth: dateOfBirth || null,
      gender,
      address,
    };

    try {
      const result = await dispatch(registerUser(payload) as any);
      if (result.type === 'auth/register/fulfilled') {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400 transition-all duration-200";

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
                  type="button"
                  onClick={goToPrevVerse}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex gap-2">
                  {bibleVerses.map((_, i) => (
                    <button
                      key={i}
                      type="button"
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
                  type="button"
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

      {/* Right Panel — Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <img src="/images.png" alt="SDA Church" className="h-16 w-16 mx-auto mb-3 object-contain" />
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">BMPMS</h1>
          </div>

          {/* Registration Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0f172a] dark:text-white">
                {t('register.createAccount', 'Create Account')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {t('register.joinUs', 'Join our baptism preparation community')}
              </p>
            </div>

            {/* Badge */}
            <div className="text-center mb-5">
              <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                {t('register.registerAs', 'Register as Candidate')}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Errors */}
              {(error || validationError) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{error || validationError}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Benny" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="your@email.com" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+250..." />
                </div>
              </div>

              {/* Church */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Church *</label>
                <select
                  value={churchId}
                  onChange={(e) => setChurchId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                  disabled={loadingChurches}
                >
                  <option value="">{loadingChurches ? 'Loading...' : 'Select your church'}</option>
                  {churches.map((c) => (
                    <option key={c.id} value={c.id}>{c.churchName}</option>
                  ))}
                </select>
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400 transition-all duration-200" placeholder="Kigali, Rwanda" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Re-enter password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    {t('register.creating', 'Creating account...')}
                  </>
                ) : (
                  t('register.registerButton', 'Register as Candidate')
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
              <span className="text-xs text-slate-400">•</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('register.hasAccount', 'Already have an account?')}{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  {t('common.login')}
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
    </div>
  );
}
