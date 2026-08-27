import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Church, Calendar, MapPin, User, CheckCircle, Clock,
  AlertCircle, Download, Loader2, X
} from 'lucide-react';
import { baptismService } from '@/services/baptismService';
import { candidateService } from '@/services/candidateService';
import { certificateService } from '@/services/certificateService';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function CandidateBaptismPage() {
  const queryClient = useQueryClient();
  const currentUser = useSelector(selectUser);
  const { t } = useTranslation();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [candidateCreatedAt, setCandidateCreatedAt] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState<string | null>(null);
  const [witnessName, setWitnessName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmEventId, setConfirmEventId] = useState<string | null>(null);
  const [confirmFullName, setConfirmFullName] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      candidateService.getCandidatesByEmail(currentUser.email).then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) {
          const c = list[0];
          setCandidateId(String(c.id));
          setCandidateCreatedAt(c.createdAt);
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
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
      setShowRegister(null);
      setWitnessName('');
      setSponsorName('');
      toast.success('Request submitted! Waiting for Elder approval.');
    },
    onError: (err: any) => toast.error(err.message || 'Registration failed'),
  });

  const registeredEventIds = new Set(myBaptisms.map((b: any) => b.eventId));
  const isAlreadyBaptized = myBaptisms.some((b: any) => b.baptized);
  const hasActiveRequest = myBaptisms.some((b: any) => ['PENDING', 'APPROVED'].includes(b.requestStatus));

  // Filter: only show non-approved, non-baptized registrations in "My Status"
  const myActiveBaptisms = myBaptisms.filter((b: any) => !b.baptized && b.requestStatus !== 'APPROVED');

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
            {myActiveBaptisms.map((b: any) => (
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
                    onClick={() => setShowSummaryModal(b)}
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
            {upcoming
              .filter((event: any) => {
                if (!candidateCreatedAt || !event.createdAt) return true;
                return new Date(event.createdAt) >= new Date(candidateCreatedAt);
              })
              .map((event: any) => {
              const isRegistered = registeredEventIds.has(event.id);
              const myBaptism = myBaptisms.find((b: any) => b.eventId === event.id);
              const statusLabel = myBaptism?.requestStatus;
              const hasActiveRequestForEvent = myBaptisms.some((b: any) => b.eventId === event.id && ['PENDING', 'APPROVED'].includes(b.requestStatus));
              const wasRejected = myBaptism && myBaptism.requestStatus === 'REJECTED';
              return (
                <Card key={event.id}>
                  <div className="flex items-start justify-between mb-3">
                    <Calendar size={20} className="text-indigo-500" />
                    {isRegistered && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        statusLabel === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        statusLabel === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                        statusLabel === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        statusLabel === 'BAPTIZED' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' :
                        statusLabel === 'CERTIFICATE_GENERATED' || statusLabel === 'CERTIFICATE_SIGNED' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {statusLabel || t('common.registered')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {event.eventName || new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </h3>
                  {event.eventName && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(event.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                      {event.eventTime && (
                        <span className="ml-2">at {event.eventTime}</span>
                      )}
                    </p>
                  )}
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
                  {!hasActiveRequestForEvent && event.status !== 'CANCELLED' && !isAlreadyBaptized && (
                    <div className="mt-4">
                      {showRegister === event.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => {
                              setConfirmEventId(showRegister);
                              setShowConfirmModal(true);
                              setConfirmFullName('');
                            }}>
                              {t('common.confirm')}
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
                  {wasRejected && !hasActiveRequestForEvent && (
                    <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">Your previous request was rejected. You may submit a new request.</p>
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

      {/* Baptism Request Confirmation Modal */}
      {showConfirmModal && confirmEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Baptism Request</h3>
              <button onClick={() => { setShowConfirmModal(false); setConfirmEventId(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Once submitted, your baptism request will be reviewed by church leadership. You will be notified of the decision.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type your full name to confirm: <span className="font-bold">{currentUser?.fullName || ''}</span>
                </label>
                <input
                  type="text"
                  value={confirmFullName}
                  onChange={(e) => setConfirmFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-slate-700">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setShowConfirmModal(false); setConfirmEventId(null); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConfirmEventId(null);
                  setShowConfirmModal(false);
                  registerMutation.mutate();
                }}
                disabled={registerMutation.isPending || confirmFullName.trim() !== (currentUser?.fullName || '').trim()}
              >
                {registerMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Baptism Certificate Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Download size={18} className="text-indigo-600" />
                Baptism Certificate Summary
              </h3>
              <button onClick={() => { setShowSummaryModal(null); setDownloadingId(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Candidate</p>
                    <p className="font-medium text-gray-900 dark:text-white">{showSummaryModal.candidateName || currentUser?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Certificate No</p>
                    <p className="font-medium text-gray-900 dark:text-white">{showSummaryModal.certificateNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Baptism Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {showSummaryModal.baptismDate ? new Date(showSummaryModal.baptismDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-white">{showSummaryModal.location || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Officiating Pastor</p>
                    <p className="font-medium text-gray-900 dark:text-white">{showSummaryModal.officiatingPastor || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-green-600 dark:text-green-400">Baptized &amp; Signed</p>
                  </div>
                  {showSummaryModal.witnessName && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Witness</p>
                      <p className="font-medium text-gray-900 dark:text-white">{showSummaryModal.witnessName}</p>
                    </div>
                  )}
                  {showSummaryModal.sponsorName && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Sponsor</p>
                      <p className="font-medium text-gray-900 dark:text-white">{showSummaryModal.sponsorName}</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your certificate has been digitally signed by the Head of District and is ready for download.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-slate-700">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setShowSummaryModal(null); setDownloadingId(null); }}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setDownloadingId(showSummaryModal.id);
                  try {
                    await certificateService.downloadCertificateFile(showSummaryModal.id);
                    toast.success('Certificate downloaded');
                    setShowSummaryModal(null);
                  } catch {
                    toast.error('Failed to download');
                  }
                  setDownloadingId(null);
                }}
                disabled={downloadingId === showSummaryModal.id}
              >
                {downloadingId === showSummaryModal.id ? (
                  <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Downloading...</span>
                ) : (
                  <span className="flex items-center gap-1"><Download size={14} /> Download Certificate</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
