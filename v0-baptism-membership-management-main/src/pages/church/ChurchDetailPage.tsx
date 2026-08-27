import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, User,
  Users, GraduationCap, Edit, Trash2, Loader2,
  UserPlus, X, ArrowRight
} from 'lucide-react';
import { churchService } from '@/services/churchService';
import { userService } from '@/services/userService';
import { firstChurchElderService } from '@/services/firstChurchElderService';
import { selectUser } from '@/store/authStore';
import { ChurchDetail } from '@/types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ChurchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useQuery<ChurchDetail>({
    queryKey: ['church-detail', id],
    queryFn: () => churchService.getChurchDetail(Number(id)),
    enabled: !!id,
  });

  // Leadership modals
  const [showAssignPastor, setShowAssignPastor] = useState(false);
  const [showReplacePastor, setShowReplacePastor] = useState(false);
  const [showAssignElder, setShowAssignElder] = useState(false);
  const [showReplaceElder, setShowReplaceElder] = useState(false);
  const [assignPastorForm, setAssignPastorForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [replacePastorId, setReplacePastorId] = useState<number>(0);
  const [assignElderForm, setAssignElderForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [replaceElderId, setReplaceElderId] = useState<number>(0);
  const [pastors, setPastors] = useState<any[]>([]);
  const [elders, setEldersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const assignPastorMutation = useMutation({
    mutationFn: async (pastorId: number) => {
      return churchService.assignPastor(Number(id), pastorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-detail', id] });
      toast.success('Pastor assigned successfully');
      setShowAssignPastor(false);
      setShowReplacePastor(false);
    },
    onError: () => toast.error('Failed to assign pastor'),
  });

  const unassignPastorMutation = useMutation({
    mutationFn: async () => {
      return churchService.unassignPastor(Number(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-detail', id] });
      toast.success('Pastor unassigned');
    },
    onError: () => toast.error('Failed to unassign pastor'),
  });

  const openAssignPastor = async () => {
    setAssignPastorForm({ fullName: '', email: '', phone: '', password: '' });
    setUsersLoading(true);
    setShowAssignPastor(true);
    try {
      const res = await userService.getAllUsers({ pageSize: 1000 });
      const allUsers: any[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setPastors(allUsers.filter((u: any) => u.role === 'PASTOR'));
    } catch { toast.error('Failed to load users'); }
    finally { setUsersLoading(false); }
  };

  const openReplacePastor = async () => {
    setReplacePastorId(0);
    setUsersLoading(true);
    setShowReplacePastor(true);
    try {
      const res = await userService.getAllUsers({ pageSize: 1000 });
      const allUsers: any[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setPastors(allUsers.filter((u: any) => u.role === 'PASTOR'));
    } catch { toast.error('Failed to load users'); }
    finally { setUsersLoading(false); }
  };

  const handleCreateAndAssignPastor = async () => {
    if (!assignPastorForm.fullName || !assignPastorForm.email || !assignPastorForm.password) {
      toast.error('Name, email and password are required');
      return;
    }
    try {
      let userId: number | null = null;

      try {
        const res = await userService.createUser({
          fullName: assignPastorForm.fullName,
          email: assignPastorForm.email,
          phone: assignPastorForm.phone,
          password: assignPastorForm.password,
          role: 'PASTOR',
        } as any);
        userId = (res as any)?.id;
      } catch (createErr: any) {
        if (createErr?.response?.data?.message?.includes('already exists')) {
          const res = await userService.getAllUsers({ pageSize: 1000 });
          const allUsers: any[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
          const existing = allUsers.find((u: any) => u.email === assignPastorForm.email);
          if (existing) {
            userId = existing.id;
            toast('User already exists, using existing account', { icon: 'ℹ️' });
          }
        }
        if (!userId) {
          toast.error(createErr?.response?.data?.message || 'Failed to create user');
          return;
        }
      }

      if (!userId) { toast.error('Failed to create user'); return; }
      assignPastorMutation.mutate(userId);
    } catch { toast.error('Failed to create user'); }
  };

  const openAssignElder = () => {
    setAssignElderForm({ fullName: '', email: '', phone: '', password: '' });
    setShowAssignElder(true);
  };

  const openReplaceElder = async () => {
    setReplaceElderId(0);
    setUsersLoading(true);
    setShowReplaceElder(true);
    try {
      const res = await firstChurchElderService.getAll();
      setEldersList(Array.isArray(res) ? res : []);
    } catch { toast.error('Failed to load elders'); }
    finally { setUsersLoading(false); }
  };

  const handleCreateAndAssignElder = async () => {
    if (!assignElderForm.fullName || !assignElderForm.email || !assignElderForm.password) {
      toast.error('Name, email and password are required');
      return;
    }
    try {
      await firstChurchElderService.create({
        fullName: assignElderForm.fullName,
        email: assignElderForm.email,
        phone: assignElderForm.phone,
        password: assignElderForm.password,
        churchId: Number(id),
      } as any);
      toast.success('First Church Elder assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['church-detail', id] });
      setShowAssignElder(false);
    } catch { toast.error('Failed to assign elder'); }
  };

  const handleReplaceElder = async () => {
    if (!replaceElderId) { toast.error('Please select an elder'); return; }
    try {
      // Delete old elders and assign new one
      if (detail?.elders) {
        for (const elder of detail.elders) {
          await firstChurchElderService.delete(elder.id);
        }
      }
      await firstChurchElderService.create({
        userId: replaceElderId,
        churchId: Number(id),
      } as any);
      toast.success('First Church Elder replaced');
      queryClient.invalidateQueries({ queryKey: ['church-detail', id] });
      setShowReplaceElder(false);
    } catch { toast.error('Failed to replace elder'); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-16">
        <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">{t('common.churchNotFound')}</h2>
        <button onClick={() => navigate('/church')} className="mt-4 text-primary hover:underline">{t('common.backToChurches')}</button>
      </div>
    );
  }

  const { church, elders: elderList, instructor, candidates, progress } = detail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <button onClick={() => navigate('/church')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          <ArrowLeft size={16} /> {t('common.backToChurches')}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={24} className="text-primary" />
              {church.churchName}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {church.districtName && <span className="flex items-center gap-1"><MapPin size={14} /> {church.districtName} District</span>}
              {church.fieldName && <span>{church.fieldName} Field</span>}
              {church.unionName && <span>{church.unionName} Union</span>}
              {church.phone && <span className="flex items-center gap-1"><Phone size={14} /> {church.phone}</span>}
              {church.email && <span className="flex items-center gap-1"><Mail size={14} /> {church.email}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button onClick={() => navigate(`/church/${id}/edit`)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title={t('common.edit')}>
                  <Edit size={18} />
                </button>
                <button onClick={async () => { if (!window.confirm('Are you sure you want to delete this church? This action cannot be undone.')) return; try { await churchService.deleteChurch(Number(id)); toast.success('Church deleted'); navigate('/church'); } catch { toast.error('Failed to delete church'); } }} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={t('common.delete')}>
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Leadership Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <User size={18} className="text-primary" /> Leadership
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pastor */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Pastor</h3>
              {church.pastor ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Assigned</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Vacant</span>
              )}
            </div>
            {church.pastor ? (
              <div className="space-y-1 mb-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{church.pastor.fullName}</p>
                <p className="text-xs text-gray-500">{church.pastor.email}</p>
                {church.pastor.phone && <p className="text-xs text-gray-500">{church.pastor.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3 italic">No pastor assigned</p>
            )}
            <div className="flex gap-2">
              {!church.pastor ? (
                <Button variant="primary" onClick={openAssignPastor} className="text-xs px-3 py-1.5">
                  <UserPlus size={14} /> Assign Pastor
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={openReplacePastor} className="text-xs px-3 py-1.5">
                    Replace
                  </Button>
                  {isAdmin && (
                    <Button variant="danger" onClick={() => unassignPastorMutation.mutate()} className="text-xs px-3 py-1.5">
                      Unassign
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* First Church Elder */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">First Church Elder</h3>
              {elderList.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Assigned</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Vacant</span>
              )}
            </div>
            {elderList.length > 0 ? (
              <div className="space-y-2 mb-3">
                {elderList.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{e.fullName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{e.fullName}</p>
                      <p className="text-xs text-gray-500">{e.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3 italic">No elder assigned</p>
            )}
            <div className="flex gap-2">
              {elderList.length === 0 ? (
                <Button variant="primary" onClick={openAssignElder} className="text-xs px-3 py-1.5">
                  <UserPlus size={14} /> Assign Elder
                </Button>
              ) : (
                <Button variant="secondary" onClick={openReplaceElder} className="text-xs px-3 py-1.5">
                  Replace
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{progress.totalCandidates}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.totalShort')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{progress.registered}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.registered')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{progress.inProgress}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.inProgress')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{progress.readyForBaptism}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.ready')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{progress.baptized}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.baptized')}</div>
        </div>
      </div>

      {/* Instructor */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <GraduationCap size={18} className="text-primary" /> {t('common.instructor')}
        </h2>
        {!instructor ? (
          <p className="text-gray-400 text-sm">{t('common.noInstructorAssigned')}</p>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/30">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {instructor.fullName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{instructor.fullName}</p>
              <p className="text-xs text-gray-500">{instructor.email}{instructor.phone ? ` | ${instructor.phone}` : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Candidates */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Users size={18} className="text-primary" /> {t('common.candidates')} ({candidates.length})
        </h2>
        {candidates.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">{t('common.noCandidatesRegistered')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.name')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.email')}</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{c.fullName}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{c.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'BAPTIZED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        c.status === 'READY_FOR_BAPTISM' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        c.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{c.status.replace(/_/g, ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Pastor Modal */}
      {showAssignPastor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Pastor</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{church.churchName}</p>
              </div>
              <button onClick={() => setShowAssignPastor(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
                Select an existing Pastor or create a new account.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Existing Pastor</label>
                {usersLoading ? (
                  <p className="text-sm text-gray-400">Loading pastors...</p>
                ) : (
                  <select onChange={(e) => {
                    if (e.target.value) assignPastorMutation.mutate(Number(e.target.value));
                  }} className="w-full border p-2 rounded" defaultValue="">
                    <option value="">Choose a pastor...</option>
                    {pastors.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Or create a new Pastor account:</p>
                <div className="space-y-3">
                  <input value={assignPastorForm.fullName} onChange={(e) => setAssignPastorForm({ ...assignPastorForm, fullName: e.target.value })} className="w-full border p-2 rounded" placeholder="Full Name *" />
                  <input type="email" value={assignPastorForm.email} onChange={(e) => setAssignPastorForm({ ...assignPastorForm, email: e.target.value })} className="w-full border p-2 rounded" placeholder="Email *" />
                  <input value={assignPastorForm.phone} onChange={(e) => setAssignPastorForm({ ...assignPastorForm, phone: e.target.value })} className="w-full border p-2 rounded" placeholder="Phone" />
                  <input type="password" value={assignPastorForm.password} onChange={(e) => setAssignPastorForm({ ...assignPastorForm, password: e.target.value })} className="w-full border p-2 rounded" placeholder="Password *" />
                  <Button variant="primary" onClick={handleCreateAndAssignPastor} className="w-full">Create & Assign</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replace Pastor Modal */}
      {showReplacePastor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Replace Pastor</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{church.churchName}</p>
              </div>
              <button onClick={() => setShowReplacePastor(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Current Pastor</p>
                  <p className="font-semibold text-sm">{church.pastor?.fullName || 'Vacant'}</p>
                </div>
                <ArrowRight size={20} className="text-primary" />
                <div className="flex-1 bg-primary/5 rounded-xl p-4 text-center border-2 border-dashed border-primary/30">
                  <p className="text-xs text-primary mb-1">New Pastor</p>
                  <p className="font-semibold text-sm">{replacePastorId ? pastors.find(u => u.id === replacePastorId)?.fullName : 'Select below'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select New Pastor *</label>
                {usersLoading ? (
                  <p className="text-sm text-gray-400">Loading pastors...</p>
                ) : (
                  <select value={replacePastorId} onChange={(e) => setReplacePastorId(Number(e.target.value))} className="w-full border p-2 rounded">
                    <option value={0}>Choose a person...</option>
                    {pastors.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowReplacePastor(false)}>Cancel</Button>
              <Button variant="success" onClick={() => { if (replacePastorId) assignPastorMutation.mutate(replacePastorId); }} disabled={!replacePastorId}>Confirm Replace</Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Elder Modal */}
      {showAssignElder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign First Church Elder</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{church.churchName}</p>
              </div>
              <button onClick={() => setShowAssignElder(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
                Create a new user account with the First Church Elder role for this church.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input value={assignElderForm.fullName} onChange={(e) => setAssignElderForm({ ...assignElderForm, fullName: e.target.value })} className="w-full border p-2 rounded" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={assignElderForm.email} onChange={(e) => setAssignElderForm({ ...assignElderForm, email: e.target.value })} className="w-full border p-2 rounded" placeholder="Enter email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input value={assignElderForm.phone} onChange={(e) => setAssignElderForm({ ...assignElderForm, phone: e.target.value })} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input type="password" value={assignElderForm.password} onChange={(e) => setAssignElderForm({ ...assignElderForm, password: e.target.value })} className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowAssignElder(false)}>Cancel</Button>
              <Button variant="success" onClick={handleCreateAndAssignElder}>Assign Elder</Button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Elder Modal */}
      {showReplaceElder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Replace First Church Elder</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{church.churchName}</p>
              </div>
              <button onClick={() => setShowReplaceElder(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Current Elder</p>
                  <p className="font-semibold text-sm">{elderList[0]?.fullName || 'Vacant'}</p>
                </div>
                <ArrowRight size={20} className="text-amber-500" />
                <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center border-2 border-dashed border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-600 mb-1">New Elder</p>
                  <p className="font-semibold text-sm">{replaceElderId ? elders.find(e => e.id === replaceElderId)?.fullName : 'Select below'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select New Elder *</label>
                {usersLoading ? (
                  <p className="text-sm text-gray-400">Loading elders...</p>
                ) : (
                  <select value={replaceElderId} onChange={(e) => setReplaceElderId(Number(e.target.value))} className="w-full border p-2 rounded">
                    <option value={0}>Choose an elder...</option>
                    {elders.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.fullName} — {e.email}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowReplaceElder(false)}>Cancel</Button>
              <Button variant="success" onClick={handleReplaceElder} disabled={!replaceElderId}>Confirm Replace</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
