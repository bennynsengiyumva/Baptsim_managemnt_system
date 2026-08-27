import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Edit, Trash2, MapPin, X, UserPlus, User, ArrowRight } from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { districtService } from '@/services/districtService';
import { fieldService } from '@/services/fieldService';
import { districtAssignmentService } from '@/services/districtAssignmentService';
import { userService } from '@/services/userService';
import { District, ChurchField } from '@/types';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function DistrictPage() {
  const { t } = useTranslation();
  const currentUser = useSelector(selectUser);
  const canEdit = ['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT'].includes(currentUser?.role || '');

  const [districts, setDistricts] = useState<District[]>([]);
  const [fields, setFields] = useState<ChurchField[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<District | null>(null);
  const [form, setForm] = useState({ name: '', fieldId: 0, code: '', address: '', phone: '', email: '' });
  const [createHead, setCreateHead] = useState(false);
  const [headForm, setHeadForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  // Leadership modals
  const [showAssignHead, setShowAssignHead] = useState(false);
  const [showReplaceHead, setShowReplaceHead] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [assignForm, setAssignForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [replaceUserId, setReplaceUserId] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      districtService.getAll(),
      fieldService.getAll(),
    ]).then(([d, f]) => {
      setDistricts(d);
      setFields(f);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', fieldId: fields[0]?.id || 0, code: '', address: '', phone: '', email: '' });
    setCreateHead(false);
    setHeadForm({ fullName: '', email: '', phone: '', password: '' });
    setModalOpen(true);
  };

  const openEdit = (d: District) => {
    setEditing(d);
    setForm({ name: d.name, fieldId: d.fieldId, code: d.code || '', address: d.address || '', phone: d.phone || '', email: d.email || '' });
    setCreateHead(false);
    setHeadForm({ fullName: '', email: '', phone: '', password: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.fieldId) { toast.error('Name and Field are required'); return; }
    try {
      if (editing) {
        await districtService.update(editing.id, form);
        toast.success('District updated');
      } else {
        await districtService.create({
          ...form,
          createHeadAccount: createHead,
          headFullName: headForm.fullName,
          headEmail: headForm.email,
          headPhone: headForm.phone,
          headPassword: headForm.password,
        });
        toast.success(createHead ? 'District created with Head of District account' : 'District created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Operation failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.deleteThisDistrict'))) return;
    try {
      await districtService.delete(id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  // Leadership handlers
  const openAssignHead = (district: District) => {
    setSelectedDistrict(district);
    setAssignForm({ fullName: '', email: '', phone: '', password: '' });
    setShowAssignHead(true);
  };

  const openReplaceHead = async (district: District) => {
    setSelectedDistrict(district);
    setReplaceUserId(0);
    setUsersLoading(true);
    setShowReplaceHead(true);
    try {
      const res = await userService.getAllUsers({ pageSize: 1000 });
      const allUsers: any[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setUsers(allUsers.filter((u: any) => u.role === 'HEAD_OF_DISTRICT'));
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAssignHead = async () => {
    if (!selectedDistrict || !assignForm.fullName || !assignForm.email || !assignForm.password) {
      toast.error('Name, email and password are required');
      return;
    }
    try {
      let userId: number | null = null;

      try {
        const res = await userService.createUser({
          fullName: assignForm.fullName,
          email: assignForm.email,
          phone: assignForm.phone,
          password: assignForm.password,
          role: 'HEAD_OF_DISTRICT',
        } as any);
        userId = (res as any)?.id;
      } catch (createErr: any) {
        if (createErr?.response?.data?.message?.includes('already exists')) {
          const res = await userService.getAllUsers({ pageSize: 1000 });
          const allUsers: any[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
          const existing = allUsers.find((u: any) => u.email === assignForm.email);
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

      await districtAssignmentService.reassignHead({
        districtId: selectedDistrict.id,
        newHeadPastorId: userId,
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      toast.success('Head of District assigned successfully');
      setShowAssignHead(false);
      load();
    } catch { toast.error('Failed to assign head'); }
  };

  const handleReplaceHead = async () => {
    if (!selectedDistrict || !replaceUserId) {
      toast.error('Please select a user');
      return;
    }
    try {
      await districtAssignmentService.transferHead({
        districtId: selectedDistrict.id,
        newHeadPastorId: replaceUserId,
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      toast.success('Head of District replaced successfully');
      setShowReplaceHead(false);
      load();
    } catch { toast.error('Failed to replace head'); }
  };

  const columns = [
    { key: 'name', label: t('common.name') },
    { key: 'fieldName', label: t('common.fields'), render: (v: any) => v || '—' },
    { key: 'headUserName', label: 'Head of District', render: (v: any, record: District) => {
      if (v) return (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">{v.charAt(0)}</div>
          <div>
            <p className="text-sm font-medium">{v}</p>
            <p className="text-xs text-gray-400">{record.headUserEmail}</p>
          </div>
        </div>
      );
      return <span className="text-amber-600 text-sm font-medium">No leader</span>;
    }},
    { key: 'code', label: t('common.code'), render: (v: any) => v || '—' },
    {
      key: 'id',
      label: t('common.actions'),
      render: (value: number, record: District) => canEdit ? (
        <div className="flex gap-2">
          <button onClick={() => openEdit(record)} className="text-green-600"><Edit size={18} /></button>
          <button onClick={() => handleDelete(value)} className="text-red-600"><Trash2 size={18} /></button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><MapPin /> {t('common.districts')}</h1>
          <p className="text-gray-500">{t('common.districtsManagement')}</p>
        </div>
        {canEdit && <Button onClick={openCreate}><Plus /> {t('common.newDistrict')}</Button>}
      </div>

      <Card>
        <DataTable columns={columns} data={districts} isLoading={loading} renderEmpty={
          <EmptyState
            icon={<MapPin size={32} className="text-slate-300 dark:text-slate-600" />}
            title={t('common.noDistrictsFound')}
            message="No districts have been created yet."
          />
        } />
      </Card>

      {/* Leadership Section */}
      {canEdit && districts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <User size={18} className="text-green-600" /> Leadership
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {districts.map(district => (
              <div key={district.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{district.name}</h3>
                  {district.headUserId ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Vacant</span>
                  )}
                </div>
                {district.headUserId ? (
                  <div className="space-y-1 mb-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{district.headUserName}</p>
                    <p className="text-xs text-gray-500">{district.headUserEmail}</p>
                    {district.headUserPhone && <p className="text-xs text-gray-500">{district.headUserPhone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-3 italic">No leader assigned</p>
                )}
                <div className="flex gap-2">
                  {!district.headUserId ? (
                    <Button variant="primary" onClick={() => openAssignHead(district)} className="text-xs px-3 py-1.5">
                      <UserPlus size={14} /> Assign Head
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => openReplaceHead(district)} className="text-xs px-3 py-1.5">
                      Replace
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg w-[540px] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{editing ? t('common.editDistrict') : t('common.newDistrict')}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.nameRequired')}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.fieldRequired')}</label>
                <select value={form.fieldId} onChange={(e) => setForm({ ...form, fieldId: Number(e.target.value) })} className="w-full border p-2 rounded">
                  <option value={0}>{t('common.selectField')}</option>
                  {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.code')}</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.address')}</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('common.phone')}</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('common.email')}</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border p-2 rounded" />
                </div>
              </div>
            </div>

            {!editing && (
              <div className="border-t pt-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={createHead} onChange={(e) => setCreateHead(e.target.checked)} className="rounded" />
                  <span className="text-sm font-medium flex items-center gap-1"><UserPlus size={16} /> {t('common.createHeadOfDistrictAccount')}</span>
                </label>
                {createHead && (
                  <div className="mt-3 pl-4 border-l-2 border-primary space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('common.fullNameRequired')}</label>
                      <input value={headForm.fullName} onChange={(e) => setHeadForm({ ...headForm, fullName: e.target.value })} className="w-full border p-2 rounded" placeholder={t('common.districtHeadNamePlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('common.emailRequired')}</label>
                      <input type="email" value={headForm.email} onChange={(e) => setHeadForm({ ...headForm, email: e.target.value })} className="w-full border p-2 rounded" placeholder={t('common.districtHeadEmailPlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('common.phone')}</label>
                      <input value={headForm.phone} onChange={(e) => setHeadForm({ ...headForm, phone: e.target.value })} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('common.passwordRequired')}</label>
                      <input type="password" value={headForm.password} onChange={(e) => setHeadForm({ ...headForm, password: e.target.value })} className="w-full border p-2 rounded" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded">{t('common.cancel')}</button>
              <Button onClick={handleSave}>{editing ? t('common.update') : t('common.create')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Head Modal */}
      {showAssignHead && selectedDistrict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Head of District</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedDistrict.name}</p>
              </div>
              <button onClick={() => setShowAssignHead(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm text-green-700 dark:text-green-300">
                Create a new user account with the Head of District role for this district.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input value={assignForm.fullName} onChange={(e) => setAssignForm({ ...assignForm, fullName: e.target.value })} className="w-full border p-2 rounded" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={assignForm.email} onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })} className="w-full border p-2 rounded" placeholder="Enter email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input value={assignForm.phone} onChange={(e) => setAssignForm({ ...assignForm, phone: e.target.value })} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input type="password" value={assignForm.password} onChange={(e) => setAssignForm({ ...assignForm, password: e.target.value })} className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowAssignHead(false)}>Cancel</Button>
              <Button variant="success" onClick={handleAssignHead}>Assign Head</Button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Head Modal */}
      {showReplaceHead && selectedDistrict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Replace Head of District</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedDistrict.name}</p>
              </div>
              <button onClick={() => setShowReplaceHead(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Current Head</p>
                  <p className="font-semibold text-sm">{selectedDistrict.headUserName || 'Vacant'}</p>
                </div>
                <ArrowRight size={20} className="text-green-500" />
                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border-2 border-dashed border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 mb-1">New Head</p>
                  <p className="font-semibold text-sm">{replaceUserId ? users.find(u => u.id === replaceUserId)?.fullName : 'Select below'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select New Head of District *</label>
                {usersLoading ? (
                  <p className="text-sm text-gray-400">Loading users...</p>
                ) : (
                  <select value={replaceUserId} onChange={(e) => setReplaceUserId(Number(e.target.value))} className="w-full border p-2 rounded">
                    <option value={0}>Choose a person...</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowReplaceHead(false)}>Cancel</Button>
              <Button variant="success" onClick={handleReplaceHead} disabled={!replaceUserId}>Confirm Replace</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
