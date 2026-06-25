import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Church, User, CheckCircle,
  Download, Trash2
} from 'lucide-react';
import { baptismService } from '@/services/baptismService';
import { candidateService } from '@/services/candidateService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function BaptismEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const { data: event, isLoading } = useQuery({
    queryKey: ['baptism-event', id],
    queryFn: () => baptismService.getEventById(id!),
    enabled: !!id,
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates-all'],
    queryFn: () => candidateService.getAllCandidates({ page: 1, pageSize: 500 })
      .then((r: any) => r.data?.data ?? r.data ?? []),
  });

  const confirmMutation = useMutation({
    mutationFn: (baptismId: string) => baptismService.confirmBaptism(baptismId, photos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baptism-event', id] });
      setPhotos([]);
      toast.success('Baptism confirmed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to confirm'),
  });

  const registerMutation = useMutation({
    mutationFn: () => baptismService.registerCandidate({
      eventId: id!,
      candidateId: selectedCandidate,
      witnessName: witnessName || undefined,
      sponsorName: sponsorName || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baptism-event', id] });
      setShowRegisterForm(false);
      setSelectedCandidate('');
      setWitnessName('');
      setSponsorName('');
      toast.success('Candidate registered');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to register'),
  });

  const unregisterMutation = useMutation({
    mutationFn: (baptismId: string) => baptismService.unregisterCandidate(baptismId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baptism-event', id] });
      toast.success('Candidate unregistered');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to unregister'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => baptismService.updateEventStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baptism-event', id] });
      toast.success('Status updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update status'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-12 text-slate-500">{t('common.eventNotFound')}</div>;
  }

  const registeredIds = new Set(event.registrations.map((r) => r.candidateId));
  const availableCandidates = (Array.isArray(candidates) ? candidates : []).filter(
    (c: any) => !registeredIds.has(String(c.id))
  );

  const notBaptized = event.registrations.filter((r) => !r.baptized);
  const baptized = event.registrations.filter((r) => r.baptized);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/baptism')} className="p-2 hover:bg-slate-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <Church size={28} className="text-indigo-600" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {t('common.baptismEvent')} &mdash; {new Date(event.eventDate).toLocaleDateString()}
          </h1>
          <p className="text-sm text-slate-500">
            {event.location} &middot; {t('common.officiant', { name: event.officiatingPastor })}
          </p>
        </div>
        <div className="flex gap-2">
          {event.status === 'PLANNED' && (
            <Button onClick={() => statusMutation.mutate('CONFIRMED')}>{t('common.confirmEvent')}</Button>
          )}
          {event.status === 'CONFIRMED' && (
            <Button onClick={() => statusMutation.mutate('COMPLETED')}>{t('common.markCompleted')}</Button>
          )}
          {event.status !== 'CANCELLED' && event.status !== 'COMPLETED' && (
            <Button variant="secondary" onClick={() => statusMutation.mutate('CANCELLED')}>
              {t('common.cancelEvent')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-slate-500">{t('common.status')}</p>
          <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
            event.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
            event.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
            event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
          }`}>{event.status}</span>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t('common.registered')}</p>
          <p className="text-2xl font-bold">{event.registeredCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t('common.baptized')}</p>
          <p className="text-2xl font-bold text-green-600">{event.baptizedCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t('common.pending')}</p>
          <p className="text-2xl font-bold text-amber-600">{notBaptized.length}</p>
        </Card>
      </div>

      {/* Register Candidate */}
      {event.status !== 'COMPLETED' && event.status !== 'CANCELLED' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{t('common.registerCandidates')}</h3>
            <Button size="sm" onClick={() => setShowRegisterForm(!showRegisterForm)}>
              {showRegisterForm ? t('common.cancel') : t('common.addCandidate')}
            </Button>
          </div>
          {showRegisterForm && (
            <div className="grid grid-cols-3 gap-4">
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">{t('common.selectCandidate')}</option>
                {availableCandidates.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || `${c.firstName ?? ''} ${c.lastName ?? ''}`}
                  </option>
                ))}
              </select>
              <input
                placeholder={t('common.witnessNameOptional')}
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                placeholder={t('common.sponsorNameOptional')}
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <Button
                onClick={() => registerMutation.mutate()}
                disabled={!selectedCandidate || registerMutation.isPending}
              >
                {t('common.register')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Pending (not yet baptized) */}
      {notBaptized.length > 0 && (
        <Card title={`${t('common.pendingBaptism')} (${notBaptized.length})`}>
          <div className="space-y-3">
            {notBaptized.map((reg) => (
              <div key={reg.id} className="flex items-center justify-between border rounded p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-400">#{reg.baptismOrder}</span>
                  <User size={18} className="text-slate-400" />
                  <div>
                    <p className="font-medium">{reg.candidateName}</p>
                    <p className="text-xs text-slate-500">
                      {t('common.witness')} {reg.witnessName || '—'} &middot; {t('common.sponsor')} {reg.sponsorName || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block">{t('common.photos')}</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                      className="text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => confirmMutation.mutate(reg.id)}
                    disabled={confirmMutation.isPending}
                  >
                    <CheckCircle size={16} /> {t('common.confirmBaptism')}
                  </Button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Unregister ${reg.candidateName}?`))
                        unregisterMutation.mutate(reg.id);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Baptized */}
      {baptized.length > 0 && (
        <Card title={`${t('common.baptized')} (${baptized.length})`}>
          <div className="space-y-2">
            {baptized.map((reg) => (
              <div key={reg.id} className="flex items-center justify-between border rounded p-3 bg-green-50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-400">#{reg.baptismOrder}</span>
                  <CheckCircle size={18} className="text-green-500" />
                  <div>
                    <p className="font-medium">{reg.candidateName}</p>
                    <p className="text-xs text-slate-500">
                      {t('common.cert')} {reg.certificateNumber}
                      {reg.confirmedAt && ` · ${new Date(reg.confirmedAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/certificates/${reg.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 p-1"
                    title={t('common.downloadCertificate')}
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
