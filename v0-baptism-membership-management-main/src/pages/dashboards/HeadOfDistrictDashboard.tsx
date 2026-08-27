import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Church, Users, Calendar, Award, Bell, Loader2, PlusCircle, UserPlus,
  CheckCircle, FileSignature, MapPin, X, RefreshCw,
  Shield, Clock
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { selectUser } from '@/store/authStore';
import { churchService } from '@/services/churchService';
import { baptismService } from '@/services/baptismService';
import { certificateService } from '@/services/certificateService';
import { notificationService } from '@/services/notificationService';
import { candidateService } from '@/services/candidateService';
import { userService } from '@/services/userService';
import { Church as ChurchType, ChurchDetail, BaptismEvent, BaptismRegistration, AppNotification } from '@/types';
import toast from 'react-hot-toast';

export default function HeadOfDistrictDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [churchDetails, setChurchDetails] = useState<Record<number, ChurchDetail>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<BaptismEvent[]>([]);
  const [unsignedCerts, setUnsignedCerts] = useState<BaptismRegistration[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingIds, setSigningIds] = useState<Set<string>>(new Set());

  // Create Event Modal
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ eventName: '', eventDate: '', eventTime: '', location: '', officiatingPastor: '', description: '' });
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Create FCE Modal
  const [showCreateFce, setShowCreateFce] = useState(false);
  const [fceForm, setFceForm] = useState({ fullName: '', email: '', phone: '', password: '', churchId: 0 });
  const [creatingFce, setCreatingFce] = useState(false);

  // Create Instructor Modal
  const [showCreateInstructor, setShowCreateInstructor] = useState(false);
  const [instructorForm, setInstructorForm] = useState({ fullName: '', email: '', phone: '', password: '', qualification: '', churchId: 0 });
  const [creatingInstructor, setCreatingInstructor] = useState(false);

  // CMS Transfer
  const [transferingIds, setTransferingIds] = useState<Set<string>>(new Set());

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
      const [churchesData, eventsData, certsData, notifData, candidatesData] = await Promise.all([
        churchService.getChurchesByDistrict(districtId!),
        baptismService.getUpcomingEvents().catch(() => []),
        certificateService.getUnsigned().catch(() => []),
        notificationService.getMyNotifications().catch(() => []),
        candidateService.getAllCandidates().catch(() => []),
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

      const candList = Array.isArray(candidatesData) ? candidatesData : (candidatesData as any)?.data || [];
      setCandidates(candList);
    } catch { /* silent */ }
    setLoading(false);
  };

  const aggregateProgress = () => {
    let totalCandidates = 0, registered = 0, inProgress = 0, readyForBaptism = 0, baptized = 0;
    Object.values(churchDetails).forEach((d) => {
      totalCandidates += d.progress.totalCandidates;
      registered += d.progress.registered;
      inProgress += d.progress.inProgress;
      readyForBaptism += d.progress.readyForBaptism;
      baptized += d.progress.baptized;
    });
    return { totalCandidates, registered, inProgress, readyForBaptism, baptized };
  };

  const progress = aggregateProgress();

  // ===================== CREATE BAPTISM EVENT =====================
  const handleCreateEvent = async () => {
    if (!newEvent.eventDate || !newEvent.location || !newEvent.officiatingPastor) {
      toast.error('Date, location, and officiating pastor are required');
      return;
    }
    setCreatingEvent(true);
    try {
      await baptismService.createEvent(newEvent);
      toast.success('Baptism event created! Notifications sent to candidates and church leaders.');
      setShowCreateEvent(false);
      setNewEvent({ eventName: '', eventDate: '', eventTime: '', location: '', officiatingPastor: '', description: '' });
      loadData();
    } catch {
      toast.error('Failed to create baptism event');
    }
    setCreatingEvent(false);
  };

  // ===================== CREATE FCE =====================
  const handleCreateFce = async () => {
    if (!fceForm.fullName || !fceForm.email || !fceForm.password || !fceForm.churchId) {
      toast.error('Name, email, password and church are required');
      return;
    }
    setCreatingFce(true);
    try {
      await userService.createUser({
        fullName: fceForm.fullName,
        email: fceForm.email,
        password: fceForm.password,
        phone: fceForm.phone || undefined,
        role: 'FIRST_CHURCH_ELDER',
        churchId: fceForm.churchId,
        createdAt: '',
      } as any);
      toast.success('First Church Elder account created');
      setShowCreateFce(false);
      setFceForm({ fullName: '', email: '', phone: '', password: '', churchId: 0 });
      loadData();
    } catch {
      toast.error('Failed to create FCE account');
    }
    setCreatingFce(false);
  };

  // ===================== CREATE INSTRUCTOR =====================
  const handleCreateInstructor = async () => {
    if (!instructorForm.fullName || !instructorForm.email || !instructorForm.password || !instructorForm.churchId) {
      toast.error('Name, email, password and church are required');
      return;
    }
    setCreatingInstructor(true);
    try {
      await userService.createUser({
        fullName: instructorForm.fullName,
        email: instructorForm.email,
        password: instructorForm.password,
        phone: instructorForm.phone || undefined,
        role: 'INSTRUCTOR',
        churchId: instructorForm.churchId,
        qualification: instructorForm.qualification || undefined,
        createdAt: '',
      } as any);
      toast.success('Instructor account created');
      setShowCreateInstructor(false);
      setInstructorForm({ fullName: '', email: '', phone: '', password: '', qualification: '', churchId: 0 });
      loadData();
    } catch {
      toast.error('Failed to create instructor account');
    }
    setCreatingInstructor(false);
  };

  // ===================== SIGN CERTIFICATE =====================
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

  // ===================== APPROVE REGISTRATION =====================
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  const handleApprove = async (eventId: string, candidateId: string) => {
    const key = `${eventId}-${candidateId}`;
    setApprovingIds((prev) => new Set(prev).add(key));
    try {
      await baptismService.approveRegistration(eventId, candidateId);
      toast.success('Registration approved');
      loadData();
    } catch {
      toast.error('Failed to approve registration');
    }
    setApprovingIds((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // ===================== CMS TRANSFER =====================
  const handleCmsTransfer = async (candidateId: string) => {
    setTransferingIds((prev) => new Set(prev).add(candidateId));
    try {
      await baptismService.cmsTransfer(candidateId);
      toast.success('Candidate transferred to CMS');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to transfer to CMS');
    }
    setTransferingIds((prev) => {
      const next = new Set(prev);
      next.delete(candidateId);
      return next;
    });
  };

  // ===================== GET CANDIDATES BY STATUS =====================
  const baptizedCandidates = candidates.filter((c: any) => ['BAPTIZED', 'CERTIFICATE_GENERATED', 'CERTIFICATE_SIGNED', 'COURSE_COMPLETED', 'TRANSFERRED_TO_CMS'].includes(c.status));

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
              {t('common.welcomeUser', { name: user?.fullName || user?.email })}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {user?.districtName ? `${user.districtName} - District Management` : 'District Management Overview'}
            </p>
          </div>
          <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title={t('common.refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div onClick={() => navigate('/church')} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Churches</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{churches.length}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <Church size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div onClick={() => navigate('/candidates')} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
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
        <div onClick={() => navigate('/candidates')} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{progress.inProgress}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Clock size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div onClick={() => navigate('/candidates')} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ready for Baptism</p>
              <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{progress.readyForBaptism}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <Award size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div onClick={() => navigate('/candidates')} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Baptized</p>
              <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{progress.baptized}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baptism Status Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Baptism Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Registered', value: progress.registered },
                  { name: 'In Progress', value: progress.inProgress },
                  { name: 'Ready for Baptism', value: progress.readyForBaptism },
                  { name: 'Baptized', value: progress.baptized },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
              >
                <Cell fill="#94a3b8" />
                <Cell fill="#f59e0b" />
                <Cell fill="#8b5cf6" />
                <Cell fill="#22c55e" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Church Candidate Counts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Candidates by Church</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={Object.values(churchDetails).map((d) => ({
                name: d.church.churchName.length > 14 ? d.church.churchName.slice(0, 14) + '...' : d.church.churchName,
                value: d.progress.totalCandidates,
              }))}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setShowCreateEvent(true)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar size={20} className="text-primary" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Baptism Event</span>
        </button>
        <button
          onClick={() => setShowCreateFce(true)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <UserPlus size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create First Elder</span>
        </button>
        <button
          onClick={() => setShowCreateInstructor(true)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Instructor</span>
        </button>
        <button
          onClick={() => navigate('/certificates')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <FileSignature size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sign Certificates {unsignedCerts.length > 0 && `(${unsignedCerts.length})`}
          </span>
        </button>
      </div>

      {/* Two Columns: Events + Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Baptism Events
            </h2>
            <button onClick={() => setShowCreateEvent(true)} className="text-sm text-primary hover:underline flex items-center gap-1">
              <PlusCircle size={14} /> Create New
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.eventName || new Date(event.eventDate).toLocaleDateString()}
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
                  {event.eventTime && <p className="text-xs text-gray-500 dark:text-gray-400">Time: {event.eventTime}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{event.registeredCount} registered</span>
                    <span>{event.baptizedCount} baptized</span>
                    {event.officiatingPastor && <span>Pastor: {event.officiatingPastor}</span>}
                  </div>
                  {/* Pending Approvals */}
                  {event.registrations?.filter((r: any) => !r.approved && !r.baptized).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-medium text-amber-600 mb-2">Pending Approvals ({event.registrations.filter((r: any) => !r.approved && !r.baptized).length})</p>
                      {event.registrations.filter((r: any) => !r.approved && !r.baptized).slice(0, 3).map((reg: any) => (
                        <div key={reg.id} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{reg.candidateName}</span>
                          <button
                            onClick={() => handleApprove(event.id, reg.candidateId)}
                            disabled={approvingIds.has(`${event.id}-${reg.candidateId}`)}
                            className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {approvingIds.has(`${event.id}-${reg.candidateId}`) ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : null}
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              Certificates Awaiting Signature
            </h2>
            <button onClick={() => navigate('/certificates')} className="text-sm text-primary hover:underline">View All</button>
          </div>
          {unsignedCerts.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">All certificates signed</p>
          ) : (
            <div className="space-y-2">
              {unsignedCerts.slice(0, 5).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cert.candidateName}</p>
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
                    {signingIds.has(cert.id) ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                    Sign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CMS Transfer Section - Baptized Candidates */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield size={18} className="text-green-600" />
            CMS Transfer ({baptizedCandidates.length})
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Baptized, certificate signed, course complete</p>
        </div>
        {baptizedCandidates.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No baptized candidates yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Baptized</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Certificate</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Course</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {baptizedCandidates.map((c: any) => {
                  const isBaptized = ['BAPTIZED', 'CERTIFICATE_GENERATED', 'CERTIFICATE_SIGNED', 'COURSE_COMPLETED', 'TRANSFERRED_TO_CMS'].includes(c.status);
                  const hasCertificate = ['CERTIFICATE_GENERATED', 'CERTIFICATE_SIGNED', 'COURSE_COMPLETED', 'TRANSFERRED_TO_CMS'].includes(c.status);
                  const isCourseComplete = ['COURSE_COMPLETED', 'TRANSFERRED_TO_CMS'].includes(c.status);
                  const isTransferred = c.status === 'TRANSFERRED_TO_CMS';
                  const allRequirementsMet = isBaptized && hasCertificate && isCourseComplete;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{c.fullName}</td>
                      <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{c.email}</td>
                      <td className="py-3 px-2 text-center">
                        {isBaptized ? (
                          <CheckCircle size={16} className="text-green-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {hasCertificate ? (
                          <CheckCircle size={16} className="text-green-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isCourseComplete ? (
                          <CheckCircle size={16} className="text-green-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isTransferred ? (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                            TRANSFERRED
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCmsTransfer(c.id)}
                            disabled={transferingIds.has(c.id) || !allRequirementsMet}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-1 mx-auto ${
                              allRequirementsMet
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {transferingIds.has(c.id) ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                            {allRequirementsMet ? 'Transfer to CMS' : 'Incomplete'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Churches */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Church size={18} className="text-primary" />
            Churches in District ({churches.length})
          </h2>
          <button onClick={() => navigate('/church')} className="text-sm text-primary hover:underline">View All</button>
        </div>
        {churches.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No churches in this district</p>
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
                  {p ? (
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg py-2">
                        <p className="font-bold text-blue-600 dark:text-blue-400">{p.totalCandidates}</p>
                        <p className="text-gray-500">Total</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg py-2">
                        <p className="font-bold text-amber-600 dark:text-amber-400">{p.readyForBaptism}</p>
                        <p className="text-gray-500">Ready</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg py-2">
                        <p className="font-bold text-green-600 dark:text-green-400">{p.baptized}</p>
                        <p className="text-gray-500">Baptized</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg py-2">
                        <p className="font-bold text-purple-600 dark:text-purple-400">{p.inProgress}</p>
                        <p className="text-gray-500">In Progress</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">Loading stats...</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              Recent Notifications
            </h2>
            <button onClick={() => navigate('/notifications')} className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${!n.read ? 'bg-primary/5' : ''}`}>
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

      {/* ===================== CREATE EVENT MODAL ===================== */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Baptism Event</h3>
              <button onClick={() => setShowCreateEvent(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Name</label>
                <input
                  type="text"
                  value={newEvent.eventName}
                  onChange={(e) => setNewEvent((p) => ({ ...p, eventName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="e.g. July 2026 Baptism Ceremony"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date *</label>
                <input
                  type="date"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent((p) => ({ ...p, eventDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Time</label>
                <input
                  type="time"
                  value={newEvent.eventTime}
                  onChange={(e) => setNewEvent((p) => ({ ...p, eventTime: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Church or venue name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Officiating Pastor *</label>
                <input
                  type="text"
                  value={newEvent.officiatingPastor}
                  onChange={(e) => setNewEvent((p) => ({ ...p, officiatingPastor: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Pastor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateEvent(false)} className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={creatingEvent}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingEvent ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                  {creatingEvent ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CREATE FCE MODAL ===================== */}
      {showCreateFce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create First Church Elder</h3>
              <button onClick={() => setShowCreateFce(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input type="text" value={fceForm.fullName} onChange={(e) => setFceForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={fceForm.email} onChange={(e) => setFceForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="elder@church.org" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input type="tel" value={fceForm.phone} onChange={(e) => setFceForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="Optional phone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                <input type="password" value={fceForm.password} onChange={(e) => setFceForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Church *</label>
                <select value={fceForm.churchId} onChange={(e) => setFceForm((p) => ({ ...p, churchId: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none">
                  <option value={0} disabled>Select church</option>
                  {churches.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.churchName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateFce(false)} className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={handleCreateFce} disabled={creatingFce}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {creatingFce ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {creatingFce ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CREATE INSTRUCTOR MODAL ===================== */}
      {showCreateInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Instructor</h3>
              <button onClick={() => setShowCreateInstructor(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input type="text" value={instructorForm.fullName} onChange={(e) => setInstructorForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={instructorForm.email} onChange={(e) => setInstructorForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="instructor@church.org" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input type="tel" value={instructorForm.phone} onChange={(e) => setInstructorForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="Optional phone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                <input type="password" value={instructorForm.password} onChange={(e) => setInstructorForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qualification</label>
                <input type="text" value={instructorForm.qualification} onChange={(e) => setInstructorForm((p) => ({ ...p, qualification: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="Optional qualification" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Church *</label>
                <select value={instructorForm.churchId} onChange={(e) => setInstructorForm((p) => ({ ...p, churchId: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none">
                  <option value={0} disabled>Select church</option>
                  {churches.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.churchName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateInstructor(false)} className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={handleCreateInstructor} disabled={creatingInstructor}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {creatingInstructor ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                  {creatingInstructor ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
