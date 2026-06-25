import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Church, Users, BookOpen, Award, Calendar, Bell, Loader2,
  CheckCircle, FileSignature, UserPlus, MapPin, Phone, Mail,
  ArrowRight, ExternalLink, X, User, Shield, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { selectUser } from '@/store/authStore';
import { churchService } from '@/services/churchService';
import { baptismService } from '@/services/baptismService';
import { certificateService } from '@/services/certificateService';
import { notificationService } from '@/services/notificationService';
import {
  Church as ChurchType, ChurchDetail, BaptismEvent, BaptismRegistration,
  ProgressInfo, AppNotification
} from '@/types';
import apiClient from '@/services/api';
import toast from 'react-hot-toast';

export default function PastorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [churchDetails, setChurchDetails] = useState<Record<number, ChurchDetail>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<BaptismEvent[]>([]);
  const [unsignedCerts, setUnsignedCerts] = useState<BaptismRegistration[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingIds, setSigningIds] = useState<Set<string>>(new Set());
  const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);
  const [showChurchModal, setShowChurchModal] = useState(false);
  const [showFceForm, setShowFceForm] = useState(false);
  const [fceFullName, setFceFullName] = useState('');
  const [fceEmail, setFceEmail] = useState('');
  const [fcePhone, setFcePhone] = useState('');
  const [fcePassword, setFcePassword] = useState('');
  const [creatingFce, setCreatingFce] = useState(false);

  const districtId = user?.districtId;

  useEffect(() => {
    if (districtId) loadData();
    else setLoading(false);
    const onShow = () => { if (document.visibilityState === 'visible' && districtId) loadData(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [districtId]);

  const loadData = async () => {
    try {
      const [churchesData, eventsData, certsData, notifData] = await Promise.all([
        churchService.getChurchesByDistrict(districtId!),
        baptismService.getUpcomingEvents().catch(() => [] as BaptismEvent[]),
        certificateService.getUnsigned().catch(() => [] as BaptismRegistration[]),
        notificationService.getMyNotifications().catch(() => [] as AppNotification[]),
      ]);

      const churchList = Array.isArray(churchesData) ? churchesData : [];
      setChurches(churchList);

      const details: Record<number, ChurchDetail> = {};
      await Promise.all(
        churchList.map(async (ch) => {
          try {
            const detail = await churchService.getChurchDetail(ch.id);
            details[ch.id] = detail;
          } catch { /* skip */ }
        })
      );
      setChurchDetails(details);

      setUpcomingEvents(Array.isArray(eventsData) ? eventsData : []);
      setUnsignedCerts(Array.isArray(certsData) ? certsData : []);

      const notifsRaw = Array.isArray(notifData) ? notifData : (notifData as any)?.data || [];
      setNotifications(
        notifsRaw.map((n: any) => ({ ...n, read: n.read ?? n.isRead ?? false })).slice(0, 5)
      );
    } catch { /* silent */ }
    setLoading(false);
  };

  const aggregateProgress = (): ProgressInfo => {
    const acc: ProgressInfo = {
      totalCandidates: 0, registered: 0, inProgress: 0,
      readyForBaptism: 0, baptized: 0, futureDated: 0,
    };
    Object.values(churchDetails).forEach((d) => {
      acc.totalCandidates += d.progress.totalCandidates;
      acc.registered += d.progress.registered;
      acc.inProgress += d.progress.inProgress;
      acc.readyForBaptism += d.progress.readyForBaptism;
      acc.baptized += d.progress.baptized;
    });
    return acc;
  };

  const progress = aggregateProgress();
  const total = progress.totalCandidates || 1;

  const openChurchModal = (church: ChurchType) => {
    setSelectedChurch(church);
    setShowFceForm(false);
    setFceFullName('');
    setFceEmail('');
    setFcePhone('');
    setFcePassword('');
    setShowChurchModal(true);
  };

  const handleCreateFceAccount = async () => {
    if (!selectedChurch) return;
    setCreatingFce(true);
    try {
      await apiClient.post('/api/auth/create-user', {
        fullName: fceFullName,
        email: fceEmail,
        phone: fcePhone,
        password: fcePassword,
        role: 'FIRST_CHURCH_ELDER',
        churchId: selectedChurch.id,
      });
      toast.success('First Church Elder account created successfully');
      setShowFceForm(false);
      setFceFullName('');
      setFceEmail('');
      setFcePhone('');
      setFcePassword('');
    } catch {
      toast.error('Failed to create FCE account');
    }
    setCreatingFce(false);
  };

  const handleSignCertificate = async (baptismId: string) => {
    setSigningIds((prev) => new Set(prev).add(baptismId));
    try {
      await certificateService.signCertificate(baptismId);
      toast.success('Certificate signed successfully');
      setUnsignedCerts((prev) => prev.filter((c) => c.id !== baptismId));
    } catch {
      toast.error('Failed to sign certificate');
    }
    setSigningIds((prev) => {
      const next = new Set(prev);
      next.delete(baptismId);
      return next;
    });
  };

  const chartData = [
    { name: t('common.registered'), value: progress.registered },
    { name: t('common.inProgress'), value: progress.inProgress },
    { name: t('common.ready'), value: progress.readyForBaptism },
    { name: t('common.baptized'), value: progress.baptized },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('common.welcomeUser', { name: user?.fullName || user?.email })}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {user?.districtName ? `${user.districtName} ${t('common.districtName')}` : t('common.districtName')} {t('common.managementOverview')}
            </p>
          </div>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title={t('common.refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.totalCandidates')}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{progress.totalCandidates}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users size={24} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.registered')}</p>
              <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{progress.registered}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <UserPlus size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.inProgress')}</p>
              <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{progress.inProgress}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <BookOpen size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.readyForBaptism')}</p>
              <p className="text-3xl font-bold mt-1 text-purple-600 dark:text-purple-400">{progress.readyForBaptism}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <Award size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.baptized')}</p>
              <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{progress.baptized}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('common.candidatePipeline')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('common.progressBreakdown')}</h2>
          <div className="space-y-4">
            {[
              { label: t('common.registered'), count: progress.registered, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
              { label: t('common.inProgress'), count: progress.inProgress, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
              { label: t('common.readyForBaptism'), count: progress.readyForBaptism, color: 'bg-purple-500', textColor: 'text-purple-600 dark:text-purple-400' },
              { label: t('common.baptized'), count: progress.baptized, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className={`${item.color} rounded-full h-3 transition-all duration-500`}
                    style={{ width: `${(item.count / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/certificates')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <FileSignature size={20} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('common.signCertificates')} {unsignedCerts.length > 0 && `(${unsignedCerts.length})`}
          </span>
        </button>
        <button
          onClick={() => navigate('/baptism')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Calendar size={20} className="text-primary" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.createBaptismEvent')}</span>
        </button>
        <button
          onClick={() => navigate('/church')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Church size={20} className="text-purple-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.viewAllChurches')}</span>
        </button>
        <button
          onClick={() => navigate('/baptism/view')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <ExternalLink size={20} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.allBaptisms')}</span>
        </button>
      </div>

      {/* Churches List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Church size={18} className="text-primary" />
            {t('common.churchesInDistrict', { count: churches.length })}
          </h2>
          <button onClick={() => navigate('/church')} className="text-sm text-primary hover:underline">
            {t('common.viewAll')}
          </button>
        </div>
        {churches.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No churches found in this district</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {churches.map((ch) => {
              const detail = churchDetails[ch.id];
              const p = detail?.progress;
              return (
                <div
                  key={ch.id}
                  onClick={() => navigate(`/church/${ch.id}`)}
                  className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{ch.churchName}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin size={12} />
                        <span className="truncate">{ch.address || 'N/A'}</span>
                      </div>
                    </div>
                    <Church size={20} className="text-primary shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ch.phone && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Phone size={11} /> {ch.phone}
                      </span>
                    )}
                    {ch.email && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Mail size={11} /> {ch.email}
                      </span>
                    )}
                  </div>
                  {p ? (
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg py-2">
                        <p className="font-bold text-blue-600 dark:text-blue-400">{p.totalCandidates}</p>
                        <p className="text-gray-500">{t('common.totalShort')}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg py-2">
                        <p className="font-bold text-amber-600 dark:text-amber-400">{p.readyForBaptism}</p>
                        <p className="text-gray-500">{t('common.ready')}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg py-2">
                        <p className="font-bold text-green-600 dark:text-green-400">{p.baptized}</p>
                        <p className="text-gray-500">{t('common.baptized')}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg py-2">
                        <p className="font-bold text-purple-600 dark:text-purple-400">{p.inProgress}</p>
                        <p className="text-gray-500">{t('common.inProgShort')}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">{t('common.loadingStats')}</p>
                  )}
                  <button
                    onClick={() => openChurchModal(ch)}
                    className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg py-2 transition-colors"
                  >
                    {t('common.viewDetails')} <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Columns: Upcoming Events + Unsigned Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Baptism Events */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {t('common.upcomingBaptismEvents')}
            </h2>
            <button onClick={() => navigate('/baptism/view')} className="text-sm text-primary hover:underline">
              {t('common.viewAll')}
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noUpcomingEvents')}</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 dark:border-slate-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === 'CONFIRMED'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : event.status === 'COMPLETED'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{event.location}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{t('common.registeredCount', { count: event.registeredCount })}</span>
                    <span>{t('common.baptizedCount', { count: event.baptizedCount })}</span>
                    {event.officiatingPastor && (
                      <span>{t('common.pastorLabel', { name: event.officiatingPastor })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unsigned Certificates */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSignature size={18} className="text-primary" />
              {t('common.certificatesAwaitingSignature')}
            </h2>
            <button onClick={() => navigate('/certificates')} className="text-sm text-primary hover:underline">
              {t('common.viewAll')}
            </button>
          </div>
          {unsignedCerts.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.allCertificatesSigned')}</p>
          ) : (
            <div className="space-y-2">
              {unsignedCerts.slice(0, 5).map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {cert.candidateName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {new Date(cert.baptismDate).toLocaleDateString()} | {cert.location}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSignCertificate(cert.id)}
                    disabled={signingIds.has(cert.id)}
                    className="shrink-0 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full font-medium hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {signingIds.has(cert.id) ? (
                      <Loader2 size={12} className="animate-spin inline mr-1" />
                    ) : null}
                    {t('common.sign')}
                  </button>
                </div>
              ))}
              {unsignedCerts.length > 5 && (
                <p className="text-xs text-center text-gray-400 pt-2">
                  {t('common.moreCount', { count: unsignedCerts.length - 5 })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              {t('common.recentNotifications')}
            </h2>
            <button onClick={() => navigate('/notifications')} className="text-sm text-primary hover:underline">
              {t('common.viewAll')}
            </button>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Church Detail Modal */}
      {showChurchModal && selectedChurch && (() => {
        const detail = churchDetails[selectedChurch.id];
        const baptizedList = detail?.candidates.filter(c => c.status === 'BAPTIZED') || [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowChurchModal(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedChurch.churchName}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedChurch.address && <span className="flex items-center gap-1"><MapPin size={12} /> {selectedChurch.address}</span>}
                    {selectedChurch.districtName && <span className="ml-3 text-xs">{selectedChurch.districtName} {t('common.districtName')}</span>}
                  </p>
                </div>
                <button onClick={() => setShowChurchModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Church Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.phone')}</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{selectedChurch.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.email')}</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{selectedChurch.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Instructor Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                    <User size={16} className="text-primary" />
                    {t('common.instructorSection')}
                  </h3>
                  {detail?.instructor ? (
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                      <p className="font-medium text-gray-900 dark:text-white">{detail.instructor.fullName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{detail.instructor.email}</p>
                      {detail.instructor.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{detail.instructor.phone}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">{t('common.noInstructorAssigned')}</p>
                  )}
                </div>

                {/* Candidates List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                    <Users size={16} className="text-primary" />
                    {t('common.candidatesCount', { count: detail?.candidates?.length || 0 })}
                  </h3>
                  {detail?.candidates && detail.candidates.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {detail.candidates.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-lg px-4 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{c.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            c.status === 'BAPTIZED' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            c.status === 'READY_FOR_BAPTISM' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                            c.status === 'IN_PROGRESS' ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' :
                            'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          }`}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">{t('common.noCandidatesRegistered')}</p>
                  )}
                </div>

                {/* Ready for CMS Transfer (BAPTIZED) */}
                {baptizedList.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                      <Shield size={16} className="text-green-600" />
                      {t('common.readyForCMS', { count: baptizedList.length })}
                    </h3>
                    <div className="space-y-2">
                      {baptizedList.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2.5">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{c.fullName}</p>
                          <CheckCircle size={16} className="text-green-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create FCE Account */}
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                  {!showFceForm ? (
                    <button
                      onClick={() => setShowFceForm(true)}
                      className="flex items-center justify-center gap-2 w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <UserPlus size={18} />
                      {t('common.createFCEAccount')}
                    </button>
                  ) : (
                    <div className="space-y-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('common.newFirstChurchElderAccount')}</h4>
                      <input
                        type="text"
                        placeholder={t('common.fullName')}
                        value={fceFullName}
                        onChange={e => setFceFullName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="email"
                        placeholder={t('common.email')}
                        value={fceEmail}
                        onChange={e => setFceEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="tel"
                        placeholder={t('common.phone')}
                        value={fcePhone}
                        onChange={e => setFcePhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="password"
                        placeholder={t('common.password')}
                        value={fcePassword}
                        onChange={e => setFcePassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateFceAccount}
                          disabled={creatingFce || !fceFullName || !fceEmail || !fcePassword}
                          className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {creatingFce ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('common.createAccount')}
                        </button>
                        <button
                          onClick={() => setShowFceForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
