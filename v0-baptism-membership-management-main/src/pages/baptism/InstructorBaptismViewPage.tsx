import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Church, Calendar, MapPin, User, CheckCircle } from 'lucide-react';
import { baptismService } from '@/services/baptismService';
import Card from '@/components/ui/Card';

export default function InstructorBaptismViewPage() {
  const { t } = useTranslation();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['baptism-events'],
    queryFn: () => baptismService.getEvents(),
  });

  const { data: baptized = [] } = useQuery({
    queryKey: ['baptized-candidates'],
    queryFn: () => baptismService.getBaptizedCandidates(),
  });

  const activeEvents = events.filter(
    (e) => e.status === 'PLANNED' || e.status === 'CONFIRMED'
  );
  const pastEvents = events.filter(
    (e) => e.status === 'COMPLETED' || e.status === 'CANCELLED'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Church size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('common.baptismView')}</h1>
          <p className="text-slate-500">
            {activeEvents.length} {t('common.upcomingEventCount')} &middot; {baptized.length} {t('common.baptizedCandidateCount')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">{t('common.upcomingEvents')}</p>
          <p className="text-2xl font-bold text-indigo-600">{activeEvents.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t('common.totalBaptized')}</p>
          <p className="text-2xl font-bold text-green-600">{baptized.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t('common.pastEvents')}</p>
          <p className="text-2xl font-bold text-slate-600">{pastEvents.length}</p>
        </Card>
      </div>

      {activeEvents.length > 0 && (
        <Card title={t('common.upcomingEvents')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeEvents.map((event) => (
              <div key={event.id} className="border rounded p-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Calendar size={16} />
                  <span className="font-semibold">
                    {new Date(event.eventDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} /> {event.location}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={14} /> {event.officiatingPastor}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {event.registeredCount} {t('common.registeredCount')} &middot; {event.baptizedCount} {t('common.baptizedCount')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {baptized.length > 0 && (
        <Card title={t('common.recentlyBaptized')}>
          <div className="space-y-2">
            {baptized.slice(0, 20).map((b) => (
              <div key={b.id} className="flex items-center gap-3 border-b pb-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="font-medium">{b.candidateName}</span>
                <span className="text-sm text-slate-500">
                  {new Date(b.baptismDate).toLocaleDateString()}
                </span>
                {b.certificateNumber && (
                  <span className="text-xs text-slate-400">{t('common.cert')} {b.certificateNumber}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
