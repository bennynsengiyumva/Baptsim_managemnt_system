import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';
import { selectUser } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface CandidateForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  churchId: string;
  instructorId: string;
}

interface Church {
  id: number;
  name: string;
}

interface Instructor {
  id: number;
  fullName: string;
}

export default function CandidateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = useSelector(selectUser);
  const isFCE = currentUser?.role === 'FIRST_CHURCH_ELDER';
  const isEditing = !!id;

  const [formData, setFormData] = useState<CandidateForm>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    churchId: '',
    instructorId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Auto-set church for FCE
  if (!isEditing && isFCE && currentUser?.churchId && !formData.churchId) {
    setFormData(prev => ({ ...prev, churchId: String(currentUser.churchId) }));
  }

  // ✅ Fetch churches for dropdown
  const { data: churches = [] } = useQuery<Church[]>({
    queryKey: ['churches'],
    queryFn: async () => {
      const response = await apiClient.get('/api/churches');
      return Array.isArray(response.data) ? response.data : response.data.data ?? [];
    },
  });

  // ✅ Fetch instructors for dropdown
  const { data: instructors = [] } = useQuery<Instructor[]>({
    queryKey: ['instructors'],
    queryFn: async () => {
      const response = await apiClient.get('/api/instructors');
      const data = Array.isArray(response.data) ? response.data : response.data.data ?? [];
      return Array.isArray(data) ? data : [];
    },
  });

  const { isLoading: isFetching, error: candidateError } = useQuery({
    queryKey: ['candidate', id],
    enabled: isEditing,
    queryFn: async () => {
      const response = await apiClient.get(`/api/candidates/${id}`);
      const data = response.data.data;
      setFormData({
        fullName: data.fullName || '',
        email: data.email || '',
        password: '',
        confirmPassword: '',
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth || '',
        gender: data.gender || 'MALE',
        address: data.address || '',
        churchId: data.churchId ? String(data.churchId) : '',
        instructorId: data.instructorId ? String(data.instructorId) : '',
      });
      return data;
    },
  });

  useEffect(() => {
    if (candidateError) {
      toast.error('Failed to load candidate');
    }
  }, [candidateError]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        address: formData.address,
        churchId: formData.churchId ? Number(formData.churchId) : null,
        instructorId: formData.instructorId ? Number(formData.instructorId) : null,
      };
      if (!isEditing) {
        payload.password = formData.password;
      }
      if (isEditing) {
        return await apiClient.put(`/api/candidates/${id}`, payload);
      } else {
        return await apiClient.post('/api/candidates', payload);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? t('common.candidateUpdated') : t('common.candidateCreated'));
      navigate('/candidates');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (isEditing ? t('common.updateFailed') : t('common.createFailed')));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    if (!formData.churchId) {
      toast.error('Please select a church');
      return;
    }
    if (!isEditing) {
      if (!formData.password) {
        toast.error('Password is required');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }
    mutation.mutate();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500";

  if (isFetching) {
    return <div className="flex items-center justify-center min-h-screen">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/candidates')} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? t('common.editCandidate') : t('common.addCandidate')}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.fullName')} *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} placeholder="John Doe" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.email')} *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="john@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.phone')} *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+250..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.dateOfBirth')}</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.gender')}</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="MALE">{t('common.male')}</option>
                <option value="FEMALE">{t('common.female')}</option>
                <option value="OTHER">{t('common.other')}</option>
              </select>
            </div>

            {/* ✅ Church selector — filtered for FCE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Church *</label>
              {isFCE ? (
                <input
                  type="text"
                  value={currentUser?.churchName || 'Your church'}
                  disabled
                  className={inputClass + ' opacity-70'}
                />
              ) : (
                <select name="churchId" value={formData.churchId} onChange={handleChange} className={inputClass}>
                  <option value="">Select a church</option>
                  {churches.map((church) => (
                    <option key={church.id} value={church.id}>
                      {church.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ✅ Instructor selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
              <select name="instructorId" value={formData.instructorId} onChange={handleChange} className={inputClass}>
                <option value="">No instructor (assign later)</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Password fields — create mode only */}
            {!isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Re-enter password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.address')}</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="Kigali, Rwanda" />
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={20} />
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" onClick={() => navigate('/candidates')} className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}