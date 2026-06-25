import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Building2, ArrowLeft, UserPlus } from 'lucide-react';
import { churchService } from '@/services/churchService';
import { unionService } from '@/services/unionService';
import { fieldService } from '@/services/fieldService';
import { districtService } from '@/services/districtService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ChurchFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUnionId, setSelectedUnionId] = useState<number | ''>('');
  const [selectedFieldId, setSelectedFieldId] = useState<number | ''>('');
  const [form, setForm] = useState({
    churchName: '',
    districtId: '' as number | '',
    address: '',
    phone: '',
    email: '',
  });
  const [createElder, setCreateElder] = useState(false);
  const [elderForm, setElderForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  const { data: unions } = useQuery({ queryKey: ['unions'], queryFn: unionService.getAll });
  const { data: fields } = useQuery({
    queryKey: ['fields', selectedUnionId],
    queryFn: () => fieldService.getByUnion(selectedUnionId as number),
    enabled: !!selectedUnionId,
  });
  const { data: districts } = useQuery({
    queryKey: ['districts', selectedFieldId],
    queryFn: () => districtService.getByField(selectedFieldId as number),
    enabled: !!selectedFieldId,
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      churchService.getChurchById(Number(id))
        .then((church) => {
          setForm({
            churchName: church.churchName || '',
            districtId: church.districtId || '',
            address: church.address || '',
            phone: church.phone || '',
            email: church.email || '',
          });
          if (church.unionId) setSelectedUnionId(church.unionId);
          if (church.fieldId) setSelectedFieldId(church.fieldId);
        })
        .catch(() => toast.error('Failed to load church'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.churchName.trim()) {
      toast.error('Church name is required');
      return;
    }
    if (!form.districtId) {
      toast.error('Please select a district');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await churchService.updateChurch(Number(id), {
          churchName: form.churchName,
          districtId: Number(form.districtId),
          address: form.address,
          phone: form.phone,
          email: form.email,
        } as any);
        toast.success('Church updated successfully');
      } else {
        await churchService.createChurch({
          churchName: form.churchName,
          districtId: Number(form.districtId),
          address: form.address,
          phone: form.phone,
          email: form.email,
          createElderAccount: createElder,
          elderFullName: elderForm.fullName,
          elderEmail: elderForm.email,
          elderPhone: elderForm.phone,
          elderPassword: elderForm.password,
        } as any);
        toast.success(createElder ? 'Church created with First Church Elder account' : 'Church created successfully');
      }
      navigate('/church');
    } catch {
      toast.error(isEdit ? 'Failed to update church' : 'Failed to create church');
    }
    setSaving(false);
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent";
  const selectClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/church')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <Building2 className="text-gray-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? t('common.editChurch') : t('common.newChurch')}
        </h1>
      </div>

      <Card>
        {loading ? (
          <p className="text-gray-500">{t('common.loading')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.churchNameRequired')}</label>
                <input
                  type="text"
                  value={form.churchName}
                  onChange={(e) => setForm({ ...form, churchName: e.target.value })}
                  className={inputClass}
                  placeholder={t('common.churchNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.union')}</label>
                <select
                  value={selectedUnionId}
                  onChange={(e) => {
                    setSelectedUnionId(e.target.value ? Number(e.target.value) : '');
                    setSelectedFieldId('');
                    setForm({ ...form, districtId: '' });
                  }}
                  className={selectClass}
                >
                  <option value="">{t('common.selectUnion')}</option>
                  {unions?.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.field')}</label>
                <select
                  value={selectedFieldId}
                  onChange={(e) => {
                    setSelectedFieldId(e.target.value ? Number(e.target.value) : '');
                    setForm({ ...form, districtId: '' });
                  }}
                  className={selectClass}
                  disabled={!selectedUnionId}
                >
                  <option value="">{t('common.selectField')}</option>
                  {fields?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.districtRequired')}</label>
                <select
                  value={form.districtId}
                  onChange={(e) => setForm({ ...form, districtId: e.target.value ? Number(e.target.value) : '' })}
                  className={selectClass}
                  disabled={!selectedFieldId}
                >
                  <option value="">{t('common.selectDistrict')}</option>
                  {districts?.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.address')}</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClass}
                  placeholder={t('common.churchAddressPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder={t('common.phonePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder={t('common.emailPlaceholder')}
                />
              </div>
            </div>

            {!isEdit && (
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={createElder} onChange={(e) => setCreateElder(e.target.checked)} className="rounded" />
                  <span className="text-sm font-medium flex items-center gap-1"><UserPlus size={16} /> {t('common.createElderAccount')}</span>
                </label>
                {createElder && (
                  <div className="mt-3 pl-4 border-l-2 border-primary space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.fullNameRequired')}</label>
                      <input value={elderForm.fullName} onChange={(e) => setElderForm({ ...elderForm, fullName: e.target.value })} className={inputClass} placeholder={t('common.elderNamePlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.emailRequired')}</label>
                      <input type="email" value={elderForm.email} onChange={(e) => setElderForm({ ...elderForm, email: e.target.value })} className={inputClass} placeholder={t('common.elderEmailPlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label>
                      <input value={elderForm.phone} onChange={(e) => setElderForm({ ...elderForm, phone: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.passwordRequired')}</label>
                      <input type="password" value={elderForm.password} onChange={(e) => setElderForm({ ...elderForm, password: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : isEdit ? t('common.updateChurch') : t('common.createChurch')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/church')}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
