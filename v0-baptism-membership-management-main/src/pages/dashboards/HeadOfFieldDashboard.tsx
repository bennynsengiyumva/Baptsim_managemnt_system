import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Church as ChurchIcon, Users, Award, Bell, Calendar,
  Loader2, UserPlus, PlusCircle, Building2, ArrowRight, X, Check, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { selectUser } from '@/store/authStore';
import { districtService } from '@/services/districtService';
import { churchService } from '@/services/churchService';
import { userService } from '@/services/userService';
import { baptismService } from '@/services/baptismService';
import { notificationService } from '@/services/notificationService';
import { District, Church, ChurchDetail, ProgressInfo, BaptismEvent, AppNotification } from '@/types';
import toast from 'react-hot-toast';

export default function HeadOfFieldDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [districts, setDistricts] = useState<District[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [districtChurches, setDistrictChurches] = useState<Record<number, Church[]>>({});
  const [churchDetails, setChurchDetails] = useState<Record<number, ChurchDetail>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<BaptismEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateDistrict, setShowCreateDistrict] = useState(false);
  const [showCreateChurch, setShowCreateChurch] = useState(false);
  const [showCreatePastor, setShowCreatePastor] = useState(false);

  const [newDistrict, setNewDistrict] = useState({ name: '', code: '', address: '', createHead: false, headFullName: '', headEmail: '', headPhone: '', headPassword: '' });
  const [newChurch, setNewChurch] = useState({ churchName: '', districtId: 0, address: '' });
  const [newPastor, setNewPastor] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.fieldId) loadData();
    else setLoading(false);
    const onShow = () => { if (document.visibilityState === 'visible' && user?.fieldId) loadData(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [user?.fieldId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const districtsData = await districtService.getByField(user!.fieldId!);
      setDistricts(districtsData);

      const allChurches: Church[] = [];
      const dChurches: Record<number, Church[]> = {};

      await Promise.all(
        districtsData.map(async (d) => {
          try {
            const chs = await churchService.getChurchesByDistrict(d.id);
            dChurches[d.id] = chs;
            allChurches.push(...chs);
          } catch { /* skip */ }
        })
      );
      setChurches(allChurches);
      setDistrictChurches(dChurches);

      const details: Record<number, ChurchDetail> = {};
      await Promise.all(
        allChurches.map(async (ch) => {
          try {
            const det = await churchService.getChurchDetail(ch.id);
            details[ch.id] = det;
          } catch { /* skip */ }
        })
      );
      setChurchDetails(details);

      const [eventsData, notifData] = await Promise.all([
        baptismService.getUpcomingEvents().catch(() => [] as BaptismEvent[]),
        notificationService.getMyNotifications().catch(() => [] as AppNotification[]),
      ]);

      setUpcomingEvents(Array.isArray(eventsData) ? eventsData : []);
      const notifsRaw = Array.isArray(notifData) ? notifData : (notifData as any)?.data || [];
      setNotifications(notifsRaw.map((n: any) => ({ ...n, read: n.read ?? n.isRead ?? false })).slice(0, 5));
    } catch { /* silent */ }
    setLoading(false);
  };

  const aggregateProgress = (): ProgressInfo => {
    const acc: ProgressInfo = {
      totalCandidates: 0, registered: 0, inProgress: 0, readyForBaptism: 0, baptized: 0, futureDated: 0,
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

  const districtChartData = districts.map((d) => {
    const chs = districtChurches[d.id] || [];
    const agg = { candidates: 0, baptized: 0, inProgress: 0, ready: 0 };
    chs.forEach((ch) => {
      const det = churchDetails[ch.id];
      if (det) {
        agg.candidates += det.progress.totalCandidates;
        agg.baptized += det.progress.baptized;
        agg.inProgress += det.progress.inProgress;
        agg.ready += det.progress.readyForBaptism;
      }
    });
    return { name: d.name.length > 14 ? d.name.slice(0, 14) + '...' : d.name, ...agg };
  });

  const handleCreateDistrict = async () => {
    if (!newDistrict.name) { toast.error('District name is required'); return; }
    if (newDistrict.createHead && (!newDistrict.headEmail || !newDistrict.headPassword)) {
      toast.error('Head email and password are required when creating head account');
      return;
    }
    setSaving(true);
    try {
      await districtService.create({
        name: newDistrict.name,
        fieldId: user!.fieldId!,
        code: newDistrict.code || undefined,
        address: newDistrict.address || undefined,
        createHeadAccount: newDistrict.createHead,
        headFullName: newDistrict.headFullName,
        headEmail: newDistrict.headEmail,
        headPhone: newDistrict.headPhone,
        headPassword: newDistrict.headPassword,
      });
      toast.success(newDistrict.createHead ? 'District created with Head of District account' : 'District created successfully');
      setShowCreateDistrict(false);
      setNewDistrict({ name: '', code: '', address: '', createHead: false, headFullName: '', headEmail: '', headPhone: '', headPassword: '' });
      loadData();
    } catch { toast.error('Failed to create district'); }
    setSaving(false);
  };

  const handleCreateChurch = async () => {
    if (!newChurch.churchName || !newChurch.districtId) {
      toast.error('Church name and district are required');
      return;
    }
    setSaving(true);
    try {
      await churchService.createChurch({
        churchName: newChurch.churchName,
        districtId: newChurch.districtId,
        address: newChurch.address || undefined,
      });
      toast.success('Church created successfully');
      setShowCreateChurch(false);
      setNewChurch({ churchName: '', districtId: 0, address: '' });
      loadData();
    } catch { toast.error('Failed to create church'); }
    setSaving(false);
  };

  const handleCreatePastor = async () => {
    if (!newPastor.fullName || !newPastor.email || !newPastor.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setSaving(true);
    try {
      await userService.createUser({
        fullName: newPastor.fullName,
        email: newPastor.email,
        role: 'HEAD_OF_DISTRICT',
        phone: newPastor.phone || undefined,
        fieldId: user!.fieldId,
        createdAt: '',
      } as any);
      toast.success('Pastor account (HEAD_OF_DISTRICT) created');
      setShowCreatePastor(false);
      setNewPastor({ fullName: '', email: '', password: '', phone: '' });
    } catch { toast.error('Failed to create pastor account'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('common.fieldDashboard', { fieldName: user?.fieldName || t('common.fieldName') })}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('common.fieldLevelOversight', { name: user?.fullName || user?.email })}
            </p>
          </div>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title={t('common.refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.totalDistricts')}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{districts.length}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <MapPin size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.totalChurches')}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{churches.length}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <ChurchIcon size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.totalBaptized')}</p>
              <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{progress.baptized}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <Award size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Districts Section + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            {t('common.districtsCount', { count: districts.length })}
          </h2>
          {districts.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noDistrictsFound')}</p>
          ) : (
            <div className="space-y-3">
              {districts.map((d) => {
                const chs = districtChurches[d.id] || [];
                return (
                  <div
                    key={d.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{d.name}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                        {chs.length} {chs.length === 1 ? t('common.churchSingular') : t('common.churchesPlural')}
                      </span>
                    </div>
                    {d.code && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.codePrefix', { code: d.code })}</p>
                    )}
                    <button
                      onClick={() => navigate(`/church?districtId=${d.id}`)}
                      className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {t('common.viewChurches')} <ArrowRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('common.candidatesByField')}</h2>
          {districtChartData.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noDataAvailable')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="candidates" name="Candidates" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="baptized" name="Baptized" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setShowCreateDistrict(true)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <PlusCircle size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.createDistrict')}</span>
        </button>
        <button
          onClick={() => { setNewChurch((p) => ({ ...p, districtId: districts[0]?.id || 0 })); setShowCreateChurch(true); }}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <PlusCircle size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.createChurch')}</span>
        </button>
        <button
          onClick={() => setShowCreatePastor(true)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <UserPlus size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.createPastorAccount')}</span>
        </button>
      </div>

      {/* Churches Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 overflow-hidden">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChurchIcon size={18} className="text-primary" />
          {t('common.churchesInField', { count: churches.length })}
        </h2>
        {churches.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">{t('common.noChurchesFound')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.churchColumn')}</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.districtColumn')}</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.totalColumn')}</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.inProgressColumn')}</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.readyColumn')}</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.baptizedColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {churches.map((ch) => {
                  const p = churchDetails[ch.id]?.progress;
                  return (
                    <tr
                      key={ch.id}
                      onClick={() => navigate(`/church/${ch.id}`)}
                      className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{ch.churchName}</td>
                      <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{ch.districtName || '-'}</td>
                      <td className="py-3 px-2 text-center font-semibold text-gray-900 dark:text-white">
                        {p?.totalCandidates ?? '-'}
                      </td>
                      <td className="py-3 px-2 text-center text-blue-600 dark:text-blue-400">
                        {p?.inProgress ?? '-'}
                      </td>
                      <td className="py-3 px-2 text-center text-amber-600 dark:text-amber-400">
                        {p?.readyForBaptism ?? '-'}
                      </td>
                      <td className="py-3 px-2 text-center text-green-600 dark:text-green-400">
                        {p?.baptized ?? '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Columns: Upcoming Events + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <span>{t('common.officiant', { name: event.officiatingPastor })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('common.noNotifications')}</p>
          ) : (
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
          )}
        </div>
      </div>

      {/* Create District Modal */}
      {showCreateDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create District</h3>
              <button onClick={() => setShowCreateDistrict(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={newDistrict.name}
                  onChange={(e) => setNewDistrict((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="District name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <input
                  type="text"
                  value={newDistrict.code}
                  onChange={(e) => setNewDistrict((p) => ({ ...p, code: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Optional code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={newDistrict.address}
                  onChange={(e) => setNewDistrict((p) => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Optional address"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDistrict.createHead}
                    onChange={(e) => setNewDistrict((p) => ({ ...p, createHead: e.target.checked }))}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <UserPlus size={16} /> Create Head of District account
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">One pastor per district</p>

                {newDistrict.createHead && (
                  <div className="mt-3 pl-4 border-l-2 border-primary space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name *</label>
                      <input
                        type="text"
                        value={newDistrict.headFullName}
                        onChange={(e) => setNewDistrict((p) => ({ ...p, headFullName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="Pastor full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                      <input
                        type="email"
                        value={newDistrict.headEmail}
                        onChange={(e) => setNewDistrict((p) => ({ ...p, headEmail: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="pastor@district.org"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <input
                        type="text"
                        value={newDistrict.headPhone}
                        onChange={(e) => setNewDistrict((p) => ({ ...p, headPhone: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="Optional phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                      <input
                        type="password"
                        value={newDistrict.headPassword}
                        onChange={(e) => setNewDistrict((p) => ({ ...p, headPassword: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="Min 6 characters"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateDistrict(false)}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDistrict}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Church Modal */}
      {showCreateChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Church</h3>
              <button onClick={() => setShowCreateChurch(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Church Name *</label>
                <input
                  type="text"
                  value={newChurch.churchName}
                  onChange={(e) => setNewChurch((p) => ({ ...p, churchName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Church name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District *</label>
                <select
                  value={newChurch.districtId}
                  onChange={(e) => setNewChurch((p) => ({ ...p, districtId: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                >
                  <option value={0} disabled>Select district</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={newChurch.address}
                  onChange={(e) => setNewChurch((p) => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Optional address"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateChurch(false)}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChurch}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Pastor Account Modal */}
      {showCreatePastor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Pastor Account</h3>
              <button onClick={() => setShowCreatePastor(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-2">
              Creates a user with the HEAD_OF_DISTRICT role
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newPastor.fullName}
                  onChange={(e) => setNewPastor((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={newPastor.email}
                  onChange={(e) => setNewPastor((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="pastor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                <input
                  type="password"
                  value={newPastor.password}
                  onChange={(e) => setNewPastor((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={newPastor.phone}
                  onChange={(e) => setNewPastor((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Optional phone"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreatePastor(false)}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePastor}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
