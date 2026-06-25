import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Mail, Phone, MapPin, Church, Shield, LogOut,
  Camera, Save, Globe, Moon, ChevronRight, Building2,
  AlertTriangle, Send
} from 'lucide-react';
import { logoutUser, selectUser, setUser } from '@/store/authStore';
import { toggleDarkMode, selectDarkMode, setLanguage, selectLanguage } from '@/store/slices/uiSlice';
import { userService } from '@/services/userService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '@/services/api';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const darkMode = useSelector(selectDarkMode);
  const language = useSelector(selectLanguage);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success(t('common.loggedOutSuccessfully'));
    navigate('/login');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(formData);
      const updated = res.data || res;
      dispatch(setUser({ ...user, ...updated }));
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await userService.updateProfile({ avatar: dataUrl });
        const updated = res.data || res;
        dispatch(setUser({ ...user, ...updated }));
        toast.success('Avatar updated');
      } catch {
        toast.error('Failed to update avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLanguageChange = (lang: 'en' | 'rw' | 'fr') => {
    dispatch(setLanguage(lang));
    i18n.changeLanguage(lang);
  };

  const [resending, setResending] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      await apiClient.post('/api/auth/resend-verification', { email: user.email });
      toast.success('Verification email sent!');
    } catch {
      toast.error('Failed to send verification email');
    }
    setResending(false);
  };

  const initial = (user?.fullName || user?.email || 'U').charAt(0).toUpperCase();

  const hierarchy = [
    { label: 'Rwanda Union Mission', value: user?.unionName, icon: Building2 },
    { label: 'Field', value: user?.fieldName, icon: MapPin },
    { label: 'District', value: user?.districtName, icon: MapPin },
    { label: 'Local Church', value: user?.churchName, icon: Church },
  ].filter(h => h.value);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Email Verification Banner */}
      {user?.emailVerified === false && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={20} />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Your email is not verified
            </p>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Send size={14} />
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-primary/20">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.fullName || 'User'}
              </h1>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2">
              <Mail size={14} /> {user?.email}
            </p>
            {user?.phone && (
              <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Phone size={14} /> {user.phone}
              </p>
            )}
          </div>

          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {editing ? (saving ? t('common.loading') : t('common.save')) : t('common.edit')}
          </button>
        </div>

        {/* Editable Fields */}
        {editing && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.fullName')}</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.phone')}</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Church Hierarchy */}
      {hierarchy.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Church size={20} className="text-primary" />
            Church Hierarchy
          </h2>
          <div className="space-y-1">
            {hierarchy.map((item, idx) => (
              <div key={item.label} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                {idx > 0 && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />}
                <item.icon size={16} className="text-primary/60" />
                <span className="text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('common.preferences')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{t('common.language')}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value as 'en' | 'rw' | 'fr')}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="rw">Kinyarwanda</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{t('common.darkMode')}</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          {t('common.security')}
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-full px-4 py-2.5 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-900 dark:text-white font-medium text-sm"
          >
            {t('common.changePassword')}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full px-4 py-2.5 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-900 dark:text-white font-medium text-sm"
          >
            Two-Factor Authentication
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
      >
        <LogOut size={18} />
        {t('common.logout')}
      </button>
    </div>
  );
}
