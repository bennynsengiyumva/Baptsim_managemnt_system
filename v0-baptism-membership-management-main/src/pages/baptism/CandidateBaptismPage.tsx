import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Church, Calendar, MapPin, User, CheckCircle, Clock,
  AlertCircle, Download, Loader2
} from 'lucide-react';
import { baptismService } from '@/services/baptismService';
import { candidateService } from '@/services/candidateService';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function CandidateBaptismPage() {
  const queryClient = useQueryClient();
  const currentUser = useSelector(selectUser);
  const { t } = useTranslation();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState<string | null>(null);
  const [witnessName, setWitnessName] = useState('');
  const [sponsorName, setSponsorName] = useState('');

  useEffect(() => {
    if (currentUser?.email) {
      candidateService.getCandidatesByEmail(currentUser.email).then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) {
          const c = list[0];
          setCandidateId(String(c.id));
          if (c.status === 'BAPTIZED') {
            // Already baptized - check for second baptism prevention
          }
        }
      });
    }
  }, [currentUser]);

  const { data: upcoming = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['baptism-upcoming'],
    queryFn: () => baptismService.getUpcomingEvents(),
  });

  const { data: myBaptisms = [], isLoading: myLoading } = useQuery({
    queryKey: ['my-baptisms', candidateId],
    queryFn: () => baptismService.getByCandidate(candidateId!),
    enabled: !!candidateId,
  });

  const registerMutation = useMutation({
    mutationFn: () => baptismService.registerCandidate({
      eventId: showRegister!,
      candidateId: candidateId!,
      witnessName: witnessName || undefined,
      sponsorName: sponsorName || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-baptisms', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['baptism-upcoming'] });
      setShowRegister(null);
      setWitnessName('');
      setSponsorName('');
      toast.success('Registered for baptism');
    },
    onError: (err: any) => toast.error(err.message || 'Registration failed'),
  });

  const registeredEventIds = new Set(myBaptisms.map((b: any) => b.eventId));
  const isAlreadyBaptized = myBaptisms.some((b: any) => b.baptized);

  const getStatusIcon = (b: any) => {
    if (b.baptized) return <CheckCircle size={20} className="text-green-500" />;
    if (b.approved) return <CheckCircle size={20} className="text-blue-500" />;
    return <Clock size={20} className="text-amber-500" />;
  };

  const getStatusText = (b: any) => {
    if (b.baptized) return t('common.baptized');
    if (b.approved) return t('common.approvedAwaitingBaptism');
    return t('common.pendingApproval');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Church size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('common.baptism')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('common.registerForUpcomingEvents')}</p>
        </div>
      </div>

      {/* Already Baptized Warning */}
      {isAlreadyBaptized && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">{t('common.alreadyBaptized')}</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {t('common.secondBaptismNotPermitted')}
            </p>
          </div>
        </div>
      )}

      {/* My Registration Status */}
      {myLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : myBaptisms.length > 0 ? (
        <Card title={t('common.myBaptismStatus')}>
          <div className="space-y-3">
            {myBaptisms.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between border border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  {getStatusIcon(b)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getStatusText(b)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {b.baptismDate ? new Date(b.baptismDate).toLocaleDateString() : t('common.dateTbd')}
                      {b.location ? ` - ${b.location}` : ''}
                    </p>
                    {b.certificateNumber && (
                      <p className="text-xs text-gray-400 mt-0.5">{t('common.cert')} {b.certificateNumber}</p>
                    )}
                  </div>
                </div>
                {b.baptized && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/api/certificates/${b.id}/download`);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `certificate-${b.id}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Certificate downloaded');
                      } catch {
                        toast.error('Failed to download');
                      }
                    }}
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    <Download size={14} />
                    {t('common.certificate')}
                  </button>
                )}
                {b.approved && !b.baptized && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                    {t('common.approved')}
                  </span>
                )}
                {!b.approved && !b.baptized && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
                    {t('common.pending')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Upcoming Events */}
      <Card title={t('common.upcomingBaptismEvents')}>
        {eventsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 py-4 text-center">{t('common.noUpcomingEvents')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((event: any) => {
              const isRegistered = registeredEventIds.has(event.id);
              return (
                <Card key={event.id}>
                  <div className="flex items-start justify-between mb-3">
                    <Calendar size={20} className="text-indigo-500" />
                    {isRegistered && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        {t('common.registered')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <MapPin size={14} /> {event.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <User size={14} /> {event.officiatingPastor}
                    </p>
                    {event.description && (
                      <p className="text-slate-500 dark:text-slate-500 mt-2">{event.description}</p>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {event.registeredCount} {t('common.candidatesRegistered')}
                  </div>
                  {!isRegistered && event.status !== 'CANCELLED' && !isAlreadyBaptized && (
                    <div className="mt-4">
                      {showRegister === event.id ? (
                        <div className="space-y-2">
                          <input
                            placeholder={t('common.witnessNameOptional')}
                            value={witnessName}
                            onChange={(e) => setWitnessName(e.target.value)}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          />
                          <input
                            placeholder={t('common.sponsorNameOptional')}
                            value={sponsorName}
                            onChange={(e) => setSponsorName(e.target.value)}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => registerMutation.mutate()}
                              disabled={registerMutation.isPending}>
                              {registerMutation.isPending ? t('common.registering') : t('common.confirm')}
                            </Button>
                            <Button size="sm" variant="secondary"
                              onClick={() => setShowRegister(null)}>
                              {t('common.cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                          <Button size="sm" onClick={() => setShowRegister(event.id)}>
                          {t('common.registerForBaptism')}
                        </Button>
                      )}
                    </div>
                  )}
                  {isAlreadyBaptized && !isRegistered && (
                    <p className="mt-4 text-xs text-yellow-600 dark:text-yellow-400">{t('common.alreadyBaptized')}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
