import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit, Eye, UserCheck, X, BookOpen, Award, GraduationCap, Mail, Phone, MapPin } from 'lucide-react';
import {
  fetchCandidates,
  deleteCandidate,
  assignInstructor,
  selectCandidates,
  selectCandidateLoading,
} from '@/store/slices/candidateSlice';
import {
  fetchInstructors,
  selectInstructors,
} from '@/store/slices/instructorSlice';
import { selectUser } from '@/store/authStore';
import { lessonService } from '@/services/lessonService';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { Candidate, LessonGrade } from '@/types';
import toast from 'react-hot-toast';

const getFullName = (c: Candidate): string => {
  if ((c as any).fullName) return (c as any).fullName;
  return `${(c as any).firstName ?? ''} ${(c as any).lastName ?? ''}`.trim() || '—';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'REGISTERED':        return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':       return 'bg-yellow-100 text-yellow-800';
    case 'READY_FOR_BAPTISM': return 'bg-green-100 text-green-800';
    case 'BAPTIZED':          return 'bg-purple-100 text-purple-800';
    default:                  return 'bg-gray-100 text-gray-800';
  }
};

export default function CandidatesPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { t }      = useTranslation();

  const candidates   = useSelector(selectCandidates);
  const isLoading    = useSelector(selectCandidateLoading);
  const instructors  = useSelector(selectInstructors);
  const currentUser  = useSelector(selectUser);

  const canAssign    = ['ADMIN', 'PASTOR', 'FIRST_CHURCH_ELDER'].includes(currentUser?.role ?? '');
  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const isFCE        = currentUser?.role === 'FIRST_CHURCH_ELDER';

  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [assigning,    setAssigning]    = useState<string | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [candidateGrades, setCandidateGrades] = useState<LessonGrade[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        await (dispatch(fetchCandidates({} as any) as any) as any).unwrap();
      } catch {
        toast.error('Failed to load candidates');
      }
    };
    loadCandidates();
    if (canAssign) {
      dispatch(fetchInstructors({} as any) as any);
    }
  }, [dispatch, canAssign]);

  const filteredCandidates = candidates.filter((c: Candidate) => {
    const name  = getFullName(c).toLowerCase();
    const email = ((c as any).email ?? '').toLowerCase();
    const term  = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || email.includes(term);
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesChurch = !isFCE || !currentUser?.churchId || Number(c.churchId) === Number(currentUser.churchId);
    return matchesSearch && matchesStatus && matchesChurch;
  });

  const handleDelete = (id: string): void => {
    if (window.confirm('Delete this candidate?')) {
      dispatch(deleteCandidate(id) as any);
      toast.success('Candidate deleted');
    }
  };

  const handleAssign = async (candidateId: string, instructorId: string): Promise<void> => {
    if (!instructorId) return;
    try {
      await (dispatch(assignInstructor({ candidateId, instructorId }) as any) as any).unwrap();
      dispatch(fetchInstructors({} as any) as any);
      toast.success('Instructor assigned');
      setAssigning(null);
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Failed to assign');
    }
  };

  const openDetail = async (candidate: Candidate) => {
    setDetailCandidate(candidate);
    setDetailLoading(true);
    try {
      const lessons = await lessonService.getByCandidate(String(candidate.id));
      const grades: LessonGrade[] = (Array.isArray(lessons) ? lessons : []).map((l: any) => ({
        lessonId: l.id,
        lessonTitle: l.lessonTitle,
        candidateId: l.candidateId,
        candidateName: l.candidateName,
        studentScore: l.studentScore ?? 0,
        requiredScore: l.requiredScore ?? 0,
        completed: l.completed ?? false,
        attemptsUsed: l.attemptsUsed ?? 0,
        bestScore: l.bestScore ?? l.studentScore ?? 0,
      }));
      setCandidateGrades(grades);
    } catch {
      setCandidateGrades([]);
    }
    setDetailLoading(false);
  };

  // ✅ Fix 3: explicit JSX.Element return types on all render functions
  const columns = [
    {
      key: 'fullName' as keyof Candidate,
      label: 'Full Name',
      render: (_v: unknown, row: Candidate): JSX.Element => (
        <button
          onClick={() => openDetail(row)}
          className="text-primary hover:text-primary/80 font-medium text-left hover:underline"
        >
          {getFullName(row)}
        </button>
      ),
    },
    {
      key: 'email' as keyof Candidate,
      label: 'Email',
      render: (v: unknown): string => (v as string) ?? '—',
    },
    {
      key: 'phone' as keyof Candidate,
      label: 'Phone',
      render: (v: unknown): string => (v as string) ?? '—',
    },
    {
      key: 'status' as keyof Candidate,
      label: 'Status',
      render: (v: unknown): JSX.Element => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((v as string) ?? '')}`}>
          {(v as string) ?? '—'}
        </span>
      ),
    },
    // Instructor assign column — ADMIN and PASTOR only
    ...(canAssign ? [{
      key: 'id' as keyof Candidate,
      label: 'Instructor',
      render: (_v: unknown, row: Candidate): JSX.Element => {
        const isOpen       = assigning === String(row.id);
        const assignedName = (row as any).instructorName as string | undefined;

        if (isOpen) {
          return (
            <div className="flex items-center gap-2">
              <select
                autoFocus
                defaultValue={String((row as any).instructorId ?? '')}
                onChange={(e) => handleAssign(String(row.id), e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">— Select instructor —</option>
                {(instructors as any[]).filter((i) => !isFCE || !currentUser?.churchId || Number(i.churchId) === Number(currentUser.churchId)).map((i) => {
                  const count = i.candidateCount ?? 0;
                  const max = 20;
                  const isFull = count >= max;
                  return (
                    <option key={i.id} value={String(i.id)} disabled={isFull}>
                      {i.fullName} ({count}/{max}){isFull ? ' — FULL' : ''}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={() => setAssigning(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">{assignedName ?? '—'}</span>
            <button
              onClick={() => setAssigning(String(row.id))}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
              title="Assign instructor"
            >
              <UserCheck size={15} />
            </button>
          </div>
        );
      },
    }] : []),
    {
      key: 'id' as keyof Candidate,
      label: 'Actions',
      render: (_v: unknown, row: Candidate): JSX.Element => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/candidates/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View"
          >
            <Eye size={18} />
          </button>
          {canAssign && (
            <>
              <button
                onClick={() => navigate(`/candidates/${row.id}/edit`)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(String(row.id))}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('candidate.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {canAssign    ? 'Manage all candidates' : ''}
            {isInstructor ? 'Your assigned candidates' : ''}
          </p>
        </div>
        {canAssign && (
          <Button onClick={() => navigate('/candidates/new')} className="flex items-center gap-2">
            <Plus size={20} />
            {t('candidate.createNew')}
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          >
            <option value="ALL">All Status</option>
            <option value="REGISTERED">Registered</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="READY_FOR_BAPTISM">Ready for Baptism</option>
            <option value="BAPTIZED">Baptized</option>
          </select>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filteredCandidates}
          isLoading={isLoading}
          emptyMessage="No candidates found"
        />
      </Card>

      {/* Candidate Detail Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailCandidate(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <GraduationCap size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {getFullName(detailCandidate)}
                  </h2>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${getStatusColor(detailCandidate.status)}`}>
                    {detailCandidate.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetailCandidate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail size={14} className="shrink-0" />
                    <span>{detailCandidate.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone size={14} className="shrink-0" />
                    <span>{detailCandidate.phone || '—'}</span>
                  </div>
                  {detailCandidate.churchName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={14} className="shrink-0" />
                      <span>{detailCandidate.churchName}</span>
                    </div>
                  )}
                  {detailCandidate.gender && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Gender: {detailCandidate.gender}</span>
                    </div>
                  )}
                  {(detailCandidate as any).instructorName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 col-span-2">
                      <GraduationCap size={14} className="shrink-0" />
                      <span>Instructor: {(detailCandidate as any).instructorName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Course Progress & Grades */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Courses & Grades</h3>
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : candidateGrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No courses assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidateGrades.map((grade) => (
                      <div key={grade.lessonId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{grade.lessonTitle}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Score: {grade.bestScore}/{grade.requiredScore} • {grade.completed ? 'Completed' : 'In Progress'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${grade.completed ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {grade.bestScore}/{grade.requiredScore}
                          </span>
                          {grade.completed && <Award size={16} className="text-green-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}