import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, selectError, selectIsLoading } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Phone, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/services/api';

interface Church {
  id: number;
  churchName: string;
}

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

  // Candidate fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [address, setAddress] = useState('');
  const [churchId, setChurchId] = useState('');

  const [churches, setChurches] = useState<Church[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(false);
  const [validationError, setValidationError] = useState('');

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

  const inputClass = "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-700 dark:text-white dark:placeholder-gray-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-1">BMPMS</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Create your account</p>
          </div>

          <div className="text-center mb-4">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">
              Register as Candidate
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Errors */}
            {(error || validationError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-sm font-medium text-red-800">{error || validationError}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="John Doe" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="your@email.com" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+250..." />
              </div>
            </div>

            {/* Church */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Church *</label>
              <select
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
                disabled={loadingChurches}
              >
                <option value="">{loadingChurches ? 'Loading...' : 'Select your church'}</option>
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>{c.churchName}</option>
                ))}
              </select>
            </div>

            {/* Candidate-specific fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white dark:placeholder-gray-500" placeholder="Kigali, Rwanda" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Re-enter password"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <><Loader className="animate-spin" size={20} /> Creating account...</>
              ) : (
                'Register as Candidate'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t('common.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}