import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Settings, LogOut, Moon, Globe, Shield, ShieldOff } from 'lucide-react';
import { logoutUser, selectUser, sendTwoFactorSetupCode, enableTwoFactor, disableTwoFactor } from '@/store/authStore';
import { toggleDarkMode, selectDarkMode, setLanguage as setUILanguage } from '@/store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const darkMode = useSelector(selectDarkMode);
  const [language, setLanguage] = useState(i18n.language);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorStep, setTwoFactorStep] = useState<'send' | 'verify'>('send');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success(t('common.loggedOutSuccessfully'));
    navigate('/login');
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    dispatch(setUILanguage(lang as 'en' | 'rw' | 'fr'));
    toast.success(t('common.languageChanged'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-gray-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">{t('common.settings')}</h1>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.profileSettings')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.fullName')}</label>
            <input
              type="text"
              value={user?.fullName || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.email')}</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.role')}</label>
            <input
              type="text"
              value={user?.role || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.preferences')}</h2>
        <div className="space-y-4">
          {/* Language Selection */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <Globe size={24} className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">{t('common.language')}</p>
                <p className="text-sm text-gray-600">{t('common.selectLanguage')}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="rw">Kinyarwanda</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={24} className="text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">{t('common.darkMode')}</p>
                <p className="text-sm text-gray-600">{t('common.toggleDarkMode')}</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                darkMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.security')}</h2>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900 font-medium">
            {t('common.changePassword')}
          </button>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg">
            <div className="flex items-center gap-3">
              {twoFactorEnabled ? (
                <Shield className="text-green-600" size={24} />
              ) : (
                <ShieldOff className="text-gray-400" size={24} />
              )}
              <div>
                <p className="font-medium text-gray-900">{t('common.twoFactorAuth')}</p>
                <p className="text-sm text-gray-600">
                  {twoFactorEnabled ? t('twoFactor.enabled') : t('twoFactor.disabled')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowTwoFactorModal(true);
                setTwoFactorStep(twoFactorEnabled ? 'verify' : 'send');
                setTwoFactorCode('');
                setTwoFactorPassword('');
              }}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  twoFactorEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {twoFactorEnabled ? t('twoFactor.disableTitle') : t('twoFactor.enableTitle')}
            </h3>

            {twoFactorStep === 'send' && !twoFactorEnabled && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{t('twoFactor.setupDescription')}</p>
                <button
                  onClick={async () => {
                    setTwoFactorLoading(true);
                    try {
                      await dispatch(sendTwoFactorSetupCode()).unwrap();
                      setTwoFactorStep('verify');
                      toast.success(t('twoFactor.codeSent'));
                    } catch (err: any) {
                      toast.error(err || t('twoFactor.sendFailed'));
                    }
                    setTwoFactorLoading(false);
                  }}
                  disabled={twoFactorLoading}
                  className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {twoFactorLoading ? t('common.loading') : t('twoFactor.sendCode')}
                </button>
              </div>
            )}

            {twoFactorStep === 'verify' && !twoFactorEnabled && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{t('twoFactor.enterSetupCode')}</p>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-2xl tracking-[0.5em] px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="000000"
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTwoFactorModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={async () => {
                      if (twoFactorCode.length !== 6) return;
                      setTwoFactorLoading(true);
                      try {
                        await dispatch(enableTwoFactor(twoFactorCode)).unwrap();
                        setTwoFactorEnabled(true);
                        setShowTwoFactorModal(false);
                        toast.success(t('twoFactor.enabledSuccess'));
                      } catch (err: any) {
                        toast.error(err || t('twoFactor.enableFailed'));
                      }
                      setTwoFactorLoading(false);
                    }}
                    disabled={twoFactorLoading || twoFactorCode.length !== 6}
                    className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {twoFactorLoading ? t('common.loading') : t('twoFactor.verify')}
                  </button>
                </div>
              </div>
            )}

            {twoFactorEnabled && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{t('twoFactor.disableDescription')}</p>
                <input
                  type="password"
                  value={twoFactorPassword}
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder={t('common.password')}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTwoFactorModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={async () => {
                      if (!twoFactorPassword) return;
                      setTwoFactorLoading(true);
                      try {
                        await dispatch(disableTwoFactor(twoFactorPassword)).unwrap();
                        setTwoFactorEnabled(false);
                        setShowTwoFactorModal(false);
                        toast.success(t('twoFactor.disabledSuccess'));
                      } catch (err: any) {
                        toast.error(err || t('twoFactor.disableFailed'));
                      }
                      setTwoFactorLoading(false);
                    }}
                    disabled={twoFactorLoading || !twoFactorPassword}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {twoFactorLoading ? t('common.loading') : t('twoFactor.disable')}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowTwoFactorModal(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">{t('common.dangerZone')}</h2>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          <LogOut size={20} />
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
}
