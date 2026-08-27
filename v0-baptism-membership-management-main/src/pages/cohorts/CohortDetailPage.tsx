import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Loader2, UserPlus, Play } from 'lucide-react';
import { cohortService } from '@/services/cohortService';
import { Cohort } from '@/types';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function CohortDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'progress'>('members');
  const [progress, setProgress] = useState<any>(null);
  const [report, setReport] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant: 'danger' | 'warning' }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

  useEffect(() => {
    if (id) loadCohort();
  }, [id]);

  const loadCohort = async () => {
    try {
      const data = await cohortService.getById(Number(id));
      setCohort(data);
    } catch {
      toast.error('Failed to load cohort');
      navigate('/instructor/cohorts');
    }
    setLoading(false);
  };

  const loadProgress = async () => {
    try {
      const [prog, rep] = await Promise.all([
        cohortService.getProgress(Number(id)),
        cohortService.getReport(Number(id)),
      ]);
      setProgress(prog);
      setReport(Array.isArray(rep) ? rep : []);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'progress') loadProgress();
  }, [activeTab]);

  const handleApprove = async (candidateId: number) => {
    try {
      await cohortService.approveEnrollment(Number(id), candidateId);
      toast.success('Enrollment approved');
      loadCohort();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to approve');
    }
  };

  const handleWithdraw = async (candidateId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Withdraw Candidate',
      message: 'Are you sure you want to withdraw this candidate from the cohort?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await cohortService.withdraw(Number(id), candidateId);
          toast.success('Candidate withdrawn');
          loadCohort();
        } catch (e: any) {
          toast.error(e?.response?.data?.message || 'Failed to withdraw');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAutoAssign = async () => {
    if (!window.confirm('Auto-assign all eligible unassigned candidates from the same church?')) return;
    try {
      const results = await cohortService.autoAssign(Number(id));
      toast.success(`${results.length} candidates enrolled`);
      loadCohort();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Auto-assign failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!cohort) return null;

  const members = cohort.members || [];
  const approved = members.filter(m => m.enrollmentStatus === 'APPROVED');
  const pending = members.filter(m => m.enrollmentStatus === 'ENROLLED');

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/instructor/cohorts')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cohort.cohortName}</h1>
          <p className="text-gray-500 dark:text-gray-400">{cohort.cohortCode} &middot; {cohort.status}</p>
          {cohort.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{cohort.description}</p>
          )}
          {cohort.language && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 inline-block">
              Language: {cohort.language === 'rw' ? 'Kinyarwanda' : 'English'}
            </span>
          )}
        </div>
        <button
          onClick={handleAutoAssign}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          <UserPlus size={16} />
          Auto-Assign Eligible
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</div>
          <div className="text-sm text-gray-500">Total Members</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{approved.length}</div>
          <div className="text-sm text-gray-500">Approved</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-indigo-600">{cohort.capacity || '∞'}</div>
          <div className="text-sm text-gray-500">Capacity</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'members' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700'}`}
        >
          <Users size={14} className="inline mr-1" /> Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'progress' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700'}`}
        >
          <Play size={14} className="inline mr-1" /> Progress
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No members enrolled yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Enrolled</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{member.candidateName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{member.candidateEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.enrollmentStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        member.enrollmentStatus === 'ENROLLED' ? 'bg-amber-100 text-amber-700' :
                        member.enrollmentStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {member.enrollmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {member.enrolledAt ? new Date(member.enrolledAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.enrollmentStatus === 'ENROLLED' && (
                        <button
                          onClick={() => handleApprove(member.candidateId)}
                          className="text-sm text-green-600 hover:text-green-700 mr-3"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleWithdraw(member.candidateId)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Withdraw
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {progress && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{progress.totalMembers}</div>
                <div className="text-sm text-gray-500">Active Members</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{progress.completedMembers}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-amber-600">{progress.activeMembers}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">{Math.round(progress.completionRate)}%</div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {report.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No progress data available.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lessons</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Baptism Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {report.map((r: any) => (
                    <tr key={r.candidateId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{r.candidateName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${r.progressPercentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(r.progressPercentage)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.completedLessons}/{r.totalLessons}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          r.baptismStatus === 'BAPTIZED' ? 'bg-green-100 text-green-700' :
                          r.baptismStatus === 'READY_FOR_BAPTISM' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.baptismStatus?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} variant={confirmDialog.variant} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
    </>
  );
}
