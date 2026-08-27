import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Users, Award, MessageSquare, Key, Activity,
  Download, CheckCircle, Clock, BarChart3, FileText
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { apiClient } from '@/services/api';
import { certificateService } from '@/services/certificateService';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type Tab = 'overview' | 'certificates' | 'downloads' | 'messages' | 'baptism' | 'auth' | 'activity';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get('/api/admin/stats').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: () => apiClient.get('/api/admin/certificates').then(r => r.data),
    enabled: activeTab === 'certificates',
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ['admin-downloads'],
    queryFn: () => apiClient.get('/api/admin/certificate-downloads').then(r => r.data),
    enabled: activeTab === 'downloads',
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: () => apiClient.get('/api/admin/conversations').then(r => r.data),
    enabled: activeTab === 'messages',
  });

  const { data: messageLogs = [] } = useQuery({
    queryKey: ['admin-message-logs'],
    queryFn: () => apiClient.get('/api/admin/message-logs').then(r => r.data),
    enabled: activeTab === 'messages',
  });

  const { data: baptismRequests = [] } = useQuery({
    queryKey: ['admin-baptism-requests'],
    queryFn: () => apiClient.get('/api/admin/baptism-requests').then(r => r.data),
    enabled: activeTab === 'baptism',
  });

  const { data: authLogs = [] } = useQuery({
    queryKey: ['admin-auth-logs'],
    queryFn: () => apiClient.get('/api/admin/auth-logs').then(r => r.data),
    enabled: activeTab === 'auth',
  });

  const { data: activityFeed = [] } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => apiClient.get('/api/admin/activity').then(r => r.data),
    enabled: activeTab === 'activity',
    refetchInterval: 15000,
  });

  if (statsLoading) {
    return <LoadingSpinner fullPage />;
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'certificates', label: 'Certificates', icon: Award },
    { key: 'downloads', label: 'Downloads', icon: Download },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'baptism', label: 'Baptism Requests', icon: FileText },
    { key: 'auth', label: 'Auth Logs', icon: Key },
    { key: 'activity', label: 'Activity Feed', icon: Activity },
  ];

  const formatTime = (ts: string) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('APPROVED') || action.includes('SIGNED')) return 'text-green-600 bg-green-50';
    if (action.includes('FAILED') || action.includes('REJECTED')) return 'text-red-600 bg-red-50';
    if (action.includes('SENT') || action.includes('GENERATED')) return 'text-blue-600 bg-blue-50';
    if (action.includes('READ') || action.includes('VERIFIED')) return 'text-purple-600 bg-purple-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'APPROVED' || s === 'CERTIFICATE_SIGNED' || s === 'BAPTIZED') return 'bg-green-100 text-green-700';
    if (s === 'PENDING') return 'bg-amber-100 text-amber-700';
    if (s === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Complete system oversight and audit</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Candidates', value: stats?.totalCandidates || 0, icon: Users, color: 'text-blue-600 bg-blue-100', to: '/candidates' },
                  { label: 'Total Instructors', value: stats?.totalInstructors || 0, icon: Users, color: 'text-green-600 bg-green-100', to: '/instructors' },
                  { label: 'Baptism Events', value: stats?.totalBaptismEvents || 0, icon: FileText, color: 'text-purple-600 bg-purple-100', to: '/baptism' },
                  { label: 'Pending Requests', value: stats?.pendingBaptismRequests || 0, icon: Clock, color: 'text-amber-600 bg-amber-100', to: '/baptism' },
                  { label: 'Certificates Generated', value: stats?.certificatesGenerated || 0, icon: Award, color: 'text-indigo-600 bg-indigo-100', to: '' },
                  { label: 'Certificates Signed', value: stats?.certificatesSigned || 0, icon: CheckCircle, color: 'text-green-600 bg-green-100', to: '' },
                  { label: 'Total Downloads', value: stats?.totalDownloads || 0, icon: Download, color: 'text-cyan-600 bg-cyan-100', to: 'downloads' },
                  { label: 'Total Messages', value: stats?.totalMessagesSent || 0, icon: MessageSquare, color: 'text-pink-600 bg-pink-100', to: 'messages' },
                  { label: 'Successful Logins', value: stats?.totalLogins || 0, icon: Key, color: 'text-emerald-600 bg-emerald-100', to: 'auth' },
                  { label: 'Failed Logins', value: stats?.failedLogins || 0, icon: Shield, color: 'text-red-600 bg-red-100', to: 'auth' },
                  { label: 'Approved Requests', value: stats?.approvedBaptismRequests || 0, icon: CheckCircle, color: 'text-teal-600 bg-teal-100', to: '/baptism' },
                  { label: 'Rejected Requests', value: stats?.rejectedBaptismRequests || 0, icon: Shield, color: 'text-red-600 bg-red-100', to: '/baptism' },
                ].map(({ label, value, icon: Icon, color, to }) => (
                  <Card key={label} className={to ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={() => {
                    if (to && to.startsWith('/')) navigate(to); else if (to) setActiveTab(to as Tab);
                  }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Baptism Requests Pie Chart */}
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Baptism Requests</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: stats?.pendingBaptismRequests || 0 },
                          { name: 'Approved', value: stats?.approvedBaptismRequests || 0 },
                          { name: 'Rejected', value: stats?.rejectedBaptismRequests || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      >
                        <Cell fill="#f59e0b" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* System Activity Bar Chart */}
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Activity</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={[
                      { name: 'Logins', value: stats?.totalLogins || 0, fill: '#6366f1' },
                      { name: 'Failed Logins', value: stats?.failedLogins || 0, fill: '#ef4444' },
                      { name: 'Messages', value: stats?.totalMessagesSent || 0, fill: '#ec4899' },
                      { name: 'Downloads', value: stats?.totalDownloads || 0, fill: '#06b6d4' },
                      { name: 'Certificates', value: stats?.certificatesGenerated || 0, fill: '#8b5cf6' },
                    ]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {[0,1,2,3,4].map((i) => (
                          <Cell key={i} fill={['#6366f1','#ef4444','#ec4899','#06b6d4','#8b5cf6'][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'certificates' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">All Certificates</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4">Certificate No</th>
                  <th className="text-left py-3 px-4">Candidate</th>
                  <th className="text-left py-3 px-4">Baptism Date</th>
                  <th className="text-left py-3 px-4">Pastor</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Downloads</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(certificates as any[]).map((cert: any) => (
                  <tr key={cert.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono text-xs">{cert.certificateNumber || '—'}</td>
                    <td className="py-3 px-4">{cert.candidateName}</td>
                    <td className="py-3 px-4">{cert.baptismDate ? new Date(cert.baptismDate).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4">{cert.officiatingPastor || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(cert.requestStatus)}`}>
                        {cert.requestStatus || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{cert.downloadCount || 0}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => certificateService.downloadCertificateFile(cert.id)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'downloads' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Certificate Download History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4">Certificate</th>
                  <th className="text-left py-3 px-4">Candidate</th>
                  <th className="text-left py-3 px-4">Downloaded By</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {(downloads as any[]).map((dl: any) => (
                  <tr key={dl.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4 font-mono text-xs">{dl.certificateNumber || '—'}</td>
                    <td className="py-3 px-4">{dl.candidateName}</td>
                    <td className="py-3 px-4">{dl.downloadedByName || dl.downloadedBy}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">{dl.role || '—'}</span>
                    </td>
                    <td className="py-3 px-4">{formatTime(dl.createdAt)}</td>
                    <td className="py-3 px-4 text-xs font-mono">{dl.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Conversations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4">Participants</th>
                    <th className="text-left py-3 px-4">Messages</th>
                    <th className="text-left py-3 px-4">Unread</th>
                    <th className="text-left py-3 px-4">Last Message</th>
                    <th className="text-left py-3 px-4">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {(conversations as any[]).map((conv: any) => (
                    <tr key={conv.conversationId} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4">{conv.participant1} ↔ {conv.participant2}</td>
                      <td className="py-3 px-4">{conv.totalMessages}</td>
                      <td className="py-3 px-4">
                        {conv.unreadMessages > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">{conv.unreadMessages}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{formatTime(conv.lastMessageDate)}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{conv.lastMessageContent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Message Logs</h3>
            <div className="space-y-2">
              {(messageLogs as any[]).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                  <span className="text-sm">{log.senderName} → {log.receiverName}</span>
                  <span className="text-xs text-slate-400 ml-auto">{formatTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'baptism' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">All Baptism Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4">Candidate</th>
                  <th className="text-left py-3 px-4">Event</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Requested</th>
                  <th className="text-left py-3 px-4">Baptized</th>
                  <th className="text-left py-3 px-4">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {(baptismRequests as any[]).map((req: any) => (
                  <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4">{req.candidateName}</td>
                    <td className="py-3 px-4">{req.event}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(req.requestStatus)}`}>
                        {req.requestStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatTime(req.requestedAt)}</td>
                    <td className="py-3 px-4">{req.baptized ? '✓' : '—'}</td>
                    <td className="py-3 px-4">{req.certificateSigned ? '✓ Signed' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'auth' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Authentication Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Details</th>
                  <th className="text-left py-3 px-4">Result</th>
                  <th className="text-left py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {(authLogs as any[]).map((log: any) => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{log.userName || log.userEmail}</div>
                        <div className="text-xs text-slate-500">{log.userEmail}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{log.details}</td>
                    <td className="py-3 px-4">
                      {log.success ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <span className="text-red-600 text-xs">Failed</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{formatTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">System Activity Feed</h3>
          <div className="space-y-3">
            {(activityFeed as any[]).map((item: any, idx: number) => (
              <div key={`${item.source}-${item.id}-${idx}`} className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.source === 'AUTH_LOG' ? 'bg-amber-100' :
                  item.source === 'MESSAGE_LOG' ? 'bg-blue-100' :
                  item.source === 'DOWNLOAD_LOG' ? 'bg-green-100' :
                  'bg-slate-100'
                }`}>
                  {item.source === 'AUTH_LOG' ? <Key size={14} className="text-amber-600" /> :
                   item.source === 'MESSAGE_LOG' ? <MessageSquare size={14} className="text-blue-600" /> :
                   item.source === 'DOWNLOAD_LOG' ? <Download size={14} className="text-green-600" /> :
                   <Activity size={14} className="text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.userName || 'System'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(item.action)}`}>{item.action}</span>
                  </div>
                  {item.details && <p className="text-xs text-slate-500 mt-0.5">{item.details}</p>}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{formatTime(item.timestamp)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
