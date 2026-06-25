import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Church, Plus, CheckCircle, XCircle,
  Download, Eye
} from 'lucide-react';
import { baptismService } from '@/services/baptismService';
import { BaptismEvent } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

export default function AdminBaptismPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    eventDate: '',
    location: '',
    officiatingPastor: '',
    description: '',
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['baptism-events'],
    queryFn: () => baptismService.getEvents(),
  });

  const createMutation = useMutation({
    mutationFn: () => baptismService.createEvent({
      ...form,
      eventDate: form.eventDate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baptism-events'] });
      setShowCreateForm(false);
      setForm({ eventDate: '', location: '', officiatingPastor: '', description: '' });
      toast.success('Baptism event created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create event'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      baptismService.updateEventStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baptism-events'] });
      toast.success('Status updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update status'),
  });

  const handleExport = async () => {
    try {
      const blob = await baptismService.exportRecords();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'baptism-records.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Records exported');
    } catch {
      toast.error('Failed to export');
    }
  };

  const columns = [
    {
      key: 'eventDate' as keyof BaptismEvent,
      label: t('common.date'),
      render: (v: any) => new Date(v).toLocaleDateString(),
    },
    { key: 'location' as keyof BaptismEvent, label: t('common.location') },
    { key: 'officiatingPastor' as keyof BaptismEvent, label: t('common.pastor') },
    {
      key: 'registeredCount' as keyof BaptismEvent,
      label: t('common.registered'),
      render: (v: any) => <span className="font-medium">{v ?? 0}</span>,
    },
    {
      key: 'baptizedCount' as keyof BaptismEvent,
      label: t('common.baptized'),
      render: (v: any) => <span className="font-medium text-green-600">{v ?? 0}</span>,
    },
    {
      key: 'status' as keyof BaptismEvent,
      label: t('common.status'),
      render: (v: string) => {
        const colors: Record<string, string> = {
          PLANNED: 'bg-blue-100 text-blue-800',
          CONFIRMED: 'bg-green-100 text-green-800',
          COMPLETED: 'bg-gray-100 text-gray-800',
          CANCELLED: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[v] || 'bg-gray-100'}`}>
            {v}
          </span>
        );
      },
    },
    {
      key: 'id' as keyof BaptismEvent,
      label: t('common.actions'),
      render: (_v: any, row: BaptismEvent) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/baptism/events/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title={t('common.viewDetails')}
          >
            <Eye size={16} />
          </button>
          {row.status === 'PLANNED' && (
            <button
              onClick={() => statusMutation.mutate({ id: row.id, status: 'CONFIRMED' })}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title={t('common.confirmEvent')}
            >
              <CheckCircle size={16} />
            </button>
          )}
          {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
            <button
              onClick={() => statusMutation.mutate({ id: row.id, status: 'CANCELLED' })}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title={t('common.cancelEvent')}
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Church size={32} className="text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold">{t('common.baptismCoordination')}</h1>
            <p className="text-slate-500">{t('common.scheduleManageEvents')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} /> {t('common.exportRecords')}
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus size={20} /> {t('common.newEvent')}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card title={t('common.scheduleNewBaptismEvent')}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.date')}</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.location')}</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.officiatingPastor')}</label>
              <input
                value={form.officiatingPastor}
                onChange={(e) => setForm({ ...form, officiatingPastor: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.descriptionOptional')}</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? t('common.creating') : t('common.createEvent')}
            </Button>
            <Button variant="secondary" onClick={() => setShowCreateForm(false)}>{t('common.cancel')}</Button>
          </div>
        </Card>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={events}
          isLoading={isLoading}
          emptyMessage={t('common.noBaptismEventsScheduled')}
        />
      </Card>
    </div>
  );
}
