import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, CheckCircle, XCircle, User, Calendar, BookOpen, Clock, MapPin } from 'lucide-react';
import { baptismService } from '@/services/baptismService';
import { lessonService } from '@/services/lessonService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function FCEBaptismRequestsPage() {
  const queryClient = useQueryClient();
  const [candidateProgress, setCandidateProgress] = useState<Record<string, { total: number; completed: number }>>({});

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['fce-baptism-requests'],
    queryFn: () => baptismService.getPendingRequests(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['baptism-events'],
    queryFn: () => baptismService.getEvents(),
  });

  const eventMap = new Map((events as any[]).map((e: any) => [e.id, e]));

  useEffect(() => {
    const loadProgress = async () => {
      const progressMap: Record<string, { total: number; completed: number }> = {};
      for (const req of (pendingRequests as any[])) {
        try {
          const lessons = await lessonService.getByCandidate(String(req.candidateId));
          const total = lessons.length;
          const completed = lessons.filter((l: any) => l.completed).length;
          progressMap[String(req.candidateId)] = { total, completed };
        } catch { /* skip */ }
      }
      setCandidateProgress(progressMap);
    };
    if (pendingRequests.length > 0) loadProgress();
  }, [pendingRequests]);

  const approveMutation = useMutation({
    mutationFn: (req: any) => baptismService.approveRegistration(String(req.eventId), String(req.candidateId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fce-baptism-requests'] });
      queryClient.invalidateQueries({ queryKey: ['baptism-pending'] });
      queryClient.invalidateQueries({ queryKey: ['baptism-events'] });
      toast.success('Baptism request approved');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (req: any) => baptismService.rejectRegistration(String(req.eventId), String(req.candidateId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fce-baptism-requests'] });
      queryClient.invalidateQueries({ queryKey: ['baptism-pending'] });
      queryClient.invalidateQueries({ queryKey: ['baptism-events'] });
      toast.success('Baptism request rejected');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to reject'),
  });

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
        <ClipboardCheck size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Baptism Requests</h1>
          <p className="text-slate-500">Review and approve baptism requests from candidates</p>
        </div>
      </div>

      {(pendingRequests as any[]).length === 0 ? (
        <Card>
          <div className="text-center py-12 text-slate-500">
            <ClipboardCheck size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg">No pending baptism requests</p>
            <p className="text-sm">When candidates request baptism, their requests will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {(pendingRequests as any[]).map((req: any) => {
            const progress = candidateProgress[String(req.candidateId)];
            const progressPct = progress && progress.total > 0
              ? Math.round((progress.completed / progress.total) * 100)
              : 0;
            const event = eventMap.get(req.eventId);

            return (
              <Card key={req.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <User size={24} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {req.candidateName}
                      </h3>
                      <p className="text-sm text-slate-500">{req.candidateEmail}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1 font-medium text-indigo-700 dark:text-indigo-400">
                          <Calendar size={14} /> {event?.eventName || 'Baptism Event'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> {new Date(req.baptismDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {req.location}
                        </span>
                        {req.requestedAt && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> Requested: {new Date(req.requestedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {/* Course Progress */}
                      <div className="mt-3 flex items-center gap-3">
                        <BookOpen size={14} className="text-slate-400" />
                        <div className="flex-1 max-w-xs">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Course Progress</span>
                            <span className="font-medium">
                              {progress ? `${progress.completed}/${progress.total} (${progressPct}%)` : 'Loading...'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          <Clock size={12} /> Pending Approval
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(req)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={16} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => rejectMutation.mutate(req)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <XCircle size={16} /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
