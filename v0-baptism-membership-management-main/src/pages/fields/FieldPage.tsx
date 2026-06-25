import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Edit, Trash2, Building2, X, UserPlus } from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { fieldService } from '@/services/fieldService';
import { unionService } from '@/services/unionService';
import { ChurchField, Union } from '@/types';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function FieldPage() {
  const { t } = useTranslation();
  const currentUser = useSelector(selectUser);
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'HEAD_OF_RUM';

  const [fields, setFields] = useState<ChurchField[]>([]);
  const [unions, setUnions] = useState<Union[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChurchField | null>(null);
  const [form, setForm] = useState({ name: '', unionId: 0, code: '', address: '', phone: '', email: '' });
  const [createHead, setCreateHead] = useState(false);
  const [headForm, setHeadForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      fieldService.getAll(),
      unionService.getAll(),
    ]).then(([f, u]) => {
      setFields(f);
      setUnions(u);
    }).catch(() => toast.error('Failed to load fields'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', unionId: unions[0]?.id || 0, code: '', address: '', phone: '', email: '' });
    setCreateHead(false);
    setHeadForm({ fullName: '', email: '', phone: '', password: '' });
    setModalOpen(true);
  };

  const openEdit = (f: ChurchField) => {
    setEditing(f);
    setForm({ name: f.name, unionId: f.unionId, code: f.code || '', address: f.address || '', phone: f.phone || '', email: f.email || '' });
    setCreateHead(false);
    setHeadForm({ fullName: '', email: '', phone: '', password: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.unionId) { toast.error('Name and Union are required'); return; }
    try {
      if (editing) {
        await fieldService.update(editing.id, form);
        toast.success('Field updated');
      } else {
        await fieldService.create({
          ...form,
          createHeadAccount: createHead,
          headFullName: headForm.fullName,
          headEmail: headForm.email,
          headPhone: headForm.phone,
          headPassword: headForm.password,
        });
        toast.success(createHead ? 'Field created with Head of Field account' : 'Field created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Failed to save field'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.deleteThisField'))) return;
    try {
      await fieldService.delete(id);
      toast.success('Field deleted');
      load();
    } catch { toast.error('Failed to delete field'); }
  };

  const columns = [
    { key: 'name', label: t('common.name') },
    { key: 'unionName', label: t('common.unions'), render: (v: any) => v || '—' },
    { key: 'code', label: t('common.code'), render: (v: any) => v || '—' },
    { key: 'phone', label: t('common.phone'), render: (v: any) => v || '—' },
    {
      key: 'id',
      label: t('common.actions'),
      render: (value: number, record: ChurchField) => canEdit ? (
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
          <h1 className="text-3xl font-bold flex items-center gap-2"><Building2 /> {t('common.fields')}</h1>
          <p className="text-gray-500">{t('common.fieldsManagement')}</p>
        </div>
        {canEdit && <Button onClick={openCreate}><Plus /> {t('common.newField')}</Button>}
      </div>

      <Card>
        <DataTable columns={columns} data={fields} isLoading={loading} emptyMessage={t('common.noFieldsFound')} />
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg w-[540px] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{editing ? t('common.editField') : t('common.newField')}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.nameRequired')}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.unionRequired')}</label>
                <select value={form.unionId} onChange={(e) => setForm({ ...form, unionId: Number(e.target.value) })} className="w-full border p-2 rounded">
                  <option value={0}>{t('common.selectUnion')}</option>
                  {unions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
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
                  <span className="text-sm font-medium flex items-center gap-1"><UserPlus size={16} /> {t('common.createHeadOfFieldAccount')}</span>
                </label>
                {createHead && (
                  <div className="mt-3 pl-4 border-l-2 border-primary space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('common.fullNameRequired')}</label>
                      <input value={headForm.fullName} onChange={(e) => setHeadForm({ ...headForm, fullName: e.target.value })} className="w-full border p-2 rounded" placeholder={t('common.fieldHeadNamePlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('common.emailRequired')}</label>
                      <input type="email" value={headForm.email} onChange={(e) => setHeadForm({ ...headForm, email: e.target.value })} className="w-full border p-2 rounded" placeholder={t('common.fieldHeadEmailPlaceholder')} />
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
    </div>
  );
}
