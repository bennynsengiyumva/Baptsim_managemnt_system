import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Church as ChurchIcon, Users, BookOpen, Award, Bell, Calendar,
  Loader2, PlusCircle, X, Check, ChevronDown, ChevronRight,
  Globe, TrendingUp, RefreshCw, UserPlus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { selectUser } from '@/store/authStore';
import { unionService } from '@/services/unionService';
import { fieldService } from '@/services/fieldService';
import { districtService } from '@/services/districtService';
import { churchService } from '@/services/churchService';
import { baptismService } from '@/services/baptismService';
import { notificationService } from '@/services/notificationService';
import {
  Union, ChurchField, District, Church, ChurchDetail, ProgressInfo,
  BaptismEvent, AppNotification
} from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function HeadOfRumDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [unions, setUnions] = useState<Union[]>([]);
  const [fields, setFields] = useState<ChurchField[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [churchDetails, setChurchDetails] = useState<Record<number, ChurchDetail>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<BaptismEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedField, setExpandedField] = useState<number | null>(null);

  const [showCreateField, setShowCreateField] = useState(false);
  const [showCreateDistrict, setShowCreateDistrict] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newField, setNewField] = useState({ name: '', code: '', address: '', phone: '', email: '', unionId: 0, createHeadAccount: false, headFullName: '', headEmail: '', headPhone: '', headPassword: '' });
  const [newDistrict, setNewDistrict] = useState({ name: '', code: '', address: '', phone: '', email: '', fieldId: 0, createHead: false, headFullName: '', headEmail: '', headPhone: '', headPassword: '' });

  useEffect(() => {
    loadData();
    const onShow = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [unionsData, fieldsData, districtsData, churchesData] = await Promise.all([
        unionService.getAll().catch(() => []),
        fieldService.getAll().catch(() => []),
        districtService.getAll().catch(() => []),
        churchService.getAllChurches().catch(() => []),
      ]);

      const uList = Array.isArray(unionsData) ? unionsData : [];
      const fList = Array.isArray(fieldsData) ? fieldsData : [];
      const dList = Array.isArray(districtsData) ? districtsData : [];
      const cList = Array.isArray(churchesData) ? churchesData : [];

      setUnions(uList);
      setFields(fList);
      setDistricts(dList);
      setChurches(cList);

      const details: Record<number, ChurchDetail> = {};
      await Promise.all(
        cList.map(async (ch) => {
          try {
            const det = await churchService.getChurchDetail(ch.id);
            details[ch.id] = det;
          } catch { /* skip */ }
        })
      );
      setChurchDetails(details);

      const [eventsData, notifData] = await Promise.all([
        baptismService.getUpcomingEvents().catch(() => []),
        notificationService.getMyNotifications().catch(() => []),
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

  const fieldChartData = fields.map((f) => {
    const chs = churches.filter((c) => c.fieldId === f.id);
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
    return { name: f.name.length > 14 ? f.name.slice(0, 14) + '...' : f.name, ...agg };
  });

  const getUnionFields = (unionId: number) => fields.filter((f) => f.unionId === unionId);
  const getFieldChurches = (fieldId: number) => churches.filter((c) => c.fieldId === fieldId);
  const getFieldDistricts = (fieldId: number) => districts.filter((d) => d.fieldId === fieldId);

  const getUnionCandidateCount = (unionId: number) => {
    const unionFieldIds = getUnionFields(unionId).map((f) => f.id);
    const unionChurches = churches.filter((c) => c.fieldId && unionFieldIds.includes(c.fieldId));
    return unionChurches.reduce((sum, ch) => {
      const det = churchDetails[ch.id];
      return sum + (det ? det.progress.totalCandidates : 0);
    }, 0);
  };

  const getUnionChurchCount = (unionId: number) => {
    const unionFieldIds = getUnionFields(unionId).map((f) => f.id);
    return churches.filter((c) => c.fieldId && unionFieldIds.includes(c.fieldId)).length;
  };

  const topChurches = Object.entries(churchDetails)
    .map(([, det]) => ({ ...det.church, ...det.progress }))
    .sort((a, b) => b.totalCandidates - a.totalCandidates)
    .slice(0, 5);

  const handleCreateField = async () => {
    if (!newField.name || !newField.unionId) {
      toast.error('Field name and union are required');
      return;
    }
    setSaving(true);
    try {
      await fieldService.create({
        name: newField.name,
        unionId: newField.unionId,
        code: newField.code || undefined,
        address: newField.address || undefined,
        phone: newField.phone || undefined,
        email: newField.email || undefined,
        createHeadAccount: newField.createHeadAccount,
        headFullName: newField.headFullName || undefined,
        headEmail: newField.headEmail || undefined,
        headPhone: newField.headPhone || undefined,
        headPassword: newField.headPassword || undefined,
      });
      toast.success('Field created successfully');
      setShowCreateField(false);
      setNewField({ name: '', code: '', address: '', phone: '', email: '', unionId: 0, createHeadAccount: false, headFullName: '', headEmail: '', headPhone: '', headPassword: '' });
      loadData();
    } catch { toast.error('Failed to create field'); }
    setSaving(false);
  };

  const handleCreateDistrict = async () => {
    if (!newDistrict.name || !newDistrict.fieldId) {
      toast.error('District name and field are required');
      return;
    }
    if (newDistrict.createHead && (!newDistrict.headFullName || !newDistrict.headEmail || !newDistrict.headPassword)) {
      toast.error('Head of District account requires full name, email, and password');
      return;
    }
    setSaving(true);
    try {
      await districtService.create({
        name: newDistrict.name,
        fieldId: newDistrict.fieldId,
        code: newDistrict.code || undefined,
        address: newDistrict.address || undefined,
        phone: newDistrict.phone || undefined,
        email: newDistrict.email || undefined,
        createHeadAccount: newDistrict.createHead,
        headFullName: newDistrict.createHead ? newDistrict.headFullName : undefined,
        headEmail: newDistrict.createHead ? newDistrict.headEmail : undefined,
        headPhone: newDistrict.createHead ? newDistrict.headPhone : undefined,
        headPassword: newDistrict.createHead ? newDistrict.headPassword : undefined,
      });
      toast.success('District created successfully');
      setShowCreateDistrict(false);
      setNewDistrict({ name: '', code: '', address: '', phone: '', email: '', fieldId: 0, createHead: false, headFullName: '', headEmail: '', headPhone: '', headPassword: '' });
      loadData();
    } catch { toast.error('Failed to create district'); }
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
              RUM Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Welcome, {user?.fullName || user?.email}! — System-wide Union oversight
            </p>
          </div>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fields</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{fields.length}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <MapPin size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Districts</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{districts.length}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <Building2 size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Churches</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{churches.length}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <ChurchIcon size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Candidates</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registered</p>
              <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{progress.registered}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <BookOpen size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{progress.inProgress}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <TrendingUp size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Baptized</p>
              <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{progress.baptized}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <Award size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart - Candidates by Field */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Candidates by Field</h2>
        {fieldChartData.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fieldChartData}>
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

      {/* Unions Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          Unions ({unions.length})
        </h2>
        {unions.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No unions found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {unions.map((u) => {
              const fieldCount = getUnionFields(u.id).length;
              const churchCount = getUnionChurchCount(u.id);
              const candidateCount = getUnionCandidateCount(u.id);
              return (
                <div
                  key={u.id}
                  className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{u.name}</h3>
                      {u.code && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Code: {u.code}</p>
                      )}
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg py-2">
                      <p className="font-bold text-gray-900 dark:text-white">{fieldCount}</p>
                      <p className="text-gray-500 dark:text-gray-400">Fields</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg py-2">
                      <p className="font-bold text-gray-900 dark:text-white">{churchCount}</p>
                      <p className="text-gray-500 dark:text-gray-400">Churches</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg py-2">
                      <p className="font-bold text-primary">{candidateCount}</p>
                      <p className="text-gray-500 dark:text-gray-400">Candidates</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fields Section with Expandable Districts */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          Fields ({fields.length})
        </h2>
        {fields.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No fields found</p>
        ) : (
          <div className="space-y-3">
            {fields.map((f) => {
              const fieldChurches = getFieldChurches(f.id);
              const fieldDistricts = getFieldDistricts(f.id);
              const isExpanded = expandedField === f.id;
              const fieldCandidates = fieldChurches.reduce((sum, ch) => {
                const det = churchDetails[ch.id];
                return sum + (det ? det.progress.totalCandidates : 0);
              }, 0);
              return (
                <div
                  key={f.id}
                  className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedField(isExpanded ? null : f.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{f.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {f.unionName || `Union #${f.unionId}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {fieldDistricts.length} {fieldDistricts.length === 1 ? 'district' : 'districts'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {fieldChurches.length} {fieldChurches.length === 1 ? 'church' : 'churches'}
                      </span>
                      <span className="font-semibold text-primary">{fieldCandidates} candidates</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-slate-700 px-4 py-3 bg-gray-50/50 dark:bg-slate-700/20">
                      {fieldDistricts.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-2">No districts in this field</p>
                      ) : (
                        <div className="space-y-2">
                          {fieldDistricts.map((d) => {
                            const districtChurches = churches.filter((c) => c.districtId === d.id);
                            const districtCandidates = districtChurches.reduce((sum, ch) => {
                              const det = churchDetails[ch.id];
                              return sum + (det ? det.progress.totalCandidates : 0);
                            }, 0);
                            return (
                              <div
                                key={d.id}
                                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 size={14} className="text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{d.name}</span>
                                  {d.code && (
                                    <span className="text-xs text-gray-400">({d.code})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{districtChurches.length} churches</span>
                                  <span className="font-semibold text-primary">{districtCandidates} candidates</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => { setNewField((p) => ({ ...p, unionId: unions[0]?.id || 0 })); setShowCreateField(true); }}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <PlusCircle size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Field</span>
        </button>
        <button
          onClick={() => { setNewDistrict((p) => ({ ...p, fieldId: fields[0]?.id || 0 })); setShowCreateDistrict(true); }}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <PlusCircle size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create District</span>
        </button>
      </div>

      {/* Two Columns: Top Churches + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Churches */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            Top 5 Churches (Most Candidates)
          </h2>
          {topChurches.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No church data available</p>
          ) : (
            <div className="space-y-3">
              {topChurches.map((ch, idx) => (
                <div
                  key={ch.id}
                  onClick={() => navigate(`/church/${ch.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                    idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-primary/60'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {ch.churchName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {ch.districtName || `District #${ch.districtId}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{ch.totalCandidates}</p>
                    <p className="text-xs text-gray-500">candidates</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{ch.baptized}</p>
                    <p className="text-xs text-gray-500">baptized</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Baptism Events */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Upcoming Baptism Events
            </h2>
            <button onClick={() => navigate('/baptism/view')} className="text-sm text-primary hover:underline">
              View all
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No upcoming events</p>
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
                    <span>{event.registeredCount} registered</span>
                    <span>{event.baptizedCount} baptized</span>
                    {event.officiatingPastor && (
                      <span>Officiant: {event.officiatingPastor}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              Recent Notifications
            </h2>
            <button onClick={() => navigate('/notifications')} className="text-sm text-primary hover:underline">
              View all
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

      {/* Create Field Modal */}
      {showCreateField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Field</h3>
              <button onClick={() => setShowCreateField(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder={t('common.fieldName')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.unionRequired')}</label>
                <select
                  value={newField.unionId}
                  onChange={(e) => setNewField((p) => ({ ...p, unionId: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                >
                  <option value={0} disabled>{t('common.selectUnion')}</option>
                  {unions.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.code')}</label>
                <input
                  type="text"
                  value={newField.code}
                  onChange={(e) => setNewField((p) => ({ ...p, code: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder={t('common.optionalCode')}
                />
              </div>
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.createHeadAccount}
                    onChange={(e) => setNewField((p) => ({ ...p, createHeadAccount: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Head of Field account</span>
                </label>
                {newField.createHeadAccount && (
                  <div className="mt-3 space-y-3 pl-4 border-l-2 border-green-300">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <input type="text" value={newField.headFullName} onChange={(e) => setNewField((p) => ({ ...p, headFullName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" value={newField.headEmail} onChange={(e) => setNewField((p) => ({ ...p, headEmail: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <input type="text" value={newField.headPhone} onChange={(e) => setNewField((p) => ({ ...p, headPhone: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                      <input type="password" value={newField.headPassword} onChange={(e) => setNewField((p) => ({ ...p, headPassword: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateField(false)}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateField}
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

      {/* Create District Modal */}
      {showCreateDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field *</label>
                <select
                  value={newDistrict.fieldId}
                  onChange={(e) => setNewDistrict((p) => ({ ...p, fieldId: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                >
                  <option value={0} disabled>Select field</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
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
    </div>
  );
}
