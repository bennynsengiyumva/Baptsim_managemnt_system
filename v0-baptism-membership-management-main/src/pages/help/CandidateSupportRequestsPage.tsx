import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Send, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportRequestService } from '@/services/supportRequestService';
import { HumanSupportMessage } from '@/types';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function CandidateSupportRequestsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['candidate-support-requests'],
    queryFn: () => supportRequestService.getCandidateRequests(),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      supportRequestService.reply(id, message),
    onSuccess: () => {
      toast.success('Reply sent!');
      setReplyText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['candidate-support-requests'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => supportRequestService.closeRequest(id),
    onSuccess: () => {
      toast.success('Request closed');
      queryClient.invalidateQueries({ queryKey: ['candidate-support-requests'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_RESPONSE':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full"><Clock size={12} /> Waiting for Response</span>;
      case 'RESPONDED':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full"><CheckCircle size={12} /> Responded</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full"><XCircle size={12} /> Closed</span>;
      default:
        return <span className="text-xs px-2 py-1 rounded-full bg-slate-100">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      INSTRUCTOR: 'bg-blue-100 text-blue-800',
      FIRST_CHURCH_ELDER: 'bg-green-100 text-green-800',
      PASTOR: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Headphones size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Support Requests</h1>
          <p className="text-slate-500">View and reply to your support conversations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border p-6 space-y-3">
              <div className="flex gap-3">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Headphones size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No support requests yet</p>
            <button onClick={() => navigate('/candidate/ai-assistant')} className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Ask the AI Assistant
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req: HumanSupportMessage) => (
            <Card key={req.id}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{req.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(req.recipientRole)}`}>
                        {req.recipientRole.replace('FIRST_CHURCH_', '')}
                      </span>
                      <span className="text-sm text-slate-500">to {req.recipientName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(req.status)}
                    <button
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                      {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-slate-400">Sent: {formatDate(req.createdAt)}</p>

                {/* Expanded thread */}
                {expandedId === req.id && (
                  <div className="border-t pt-3 space-y-3">
                    {/* Original message */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Your message:</p>
                      <p className="text-sm">{req.message}</p>
                    </div>

                    {/* Replies */}
                    {req.replies && req.replies.length > 0 && (
                      <div className="space-y-2">
                        {req.replies.map((reply: HumanSupportMessage) => (
                          <div key={reply.id} className={`rounded-lg p-3 ${reply.senderName ? 'bg-indigo-50 dark:bg-indigo-900/20 ml-4' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              {reply.senderName || reply.candidateName} replied:
                            </p>
                            <p className="text-sm">{reply.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatDate(reply.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                )}

                    {/* Reply form */}
                    {req.status !== 'CLOSED' && (
                      <div className="flex gap-2">
                        <input
                          value={replyingTo === req.id ? replyText : ''}
                          onChange={(e) => { setReplyingTo(req.id); setReplyText(e.target.value); }}
                          onFocus={() => setReplyingTo(req.id)}
                          placeholder="Type a reply..."
                          className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && replyText.trim() && replyingTo === req.id) {
                              replyMutation.mutate({ id: req.id, message: replyText.trim() });
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (replyText.trim() && replyingTo === req.id) {
                              replyMutation.mutate({ id: req.id, message: replyText.trim() });
                            }
                          }}
                          disabled={!replyText.trim() || replyingTo !== req.id || replyMutation.isPending}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          onClick={() => closeMutation.mutate(req.id)}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
