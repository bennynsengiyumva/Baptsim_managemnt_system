import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, FileDown, ArrowLeft, Upload, Trash2, FileText, GraduationCap, X, Clock, HelpCircle, BarChart3, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { getFileUrl } from '@/services/api';
import { LessonDocument } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function InstructorLessonDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'document'; docId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'questions' | 'documents' | 'grades'>('content');

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      try {
        return await lessonService.getById(id!);
      } catch (e) {
        toast.error('Failed to load lesson details');
        throw e;
      }
    },
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['lesson-documents', id],
    queryFn: () => lessonService.getDocuments(id!),
    enabled: !!id,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['lesson-grades', id],
    queryFn: () => lessonService.getGradesByLesson(id!),
    enabled: !!id,
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => lessonService.deleteDocument(id!, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-documents', id] });
      toast.success('Document deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete document'),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await lessonService.uploadDocument(id, formData);
      queryClient.invalidateQueries({ queryKey: ['lesson-documents', id] });
      toast.success('Document uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center py-12 text-slate-500">{t('common.lessonNotFound')}</div>;
  }

  const grade = grades[0];
  const questionCount = lesson.questions?.length || 0;

  const tabs = [
    { id: 'content' as const, label: 'Course Content', icon: BookOpen },
    { id: 'questions' as const, label: `Questions (${questionCount})`, icon: HelpCircle },
    { id: 'documents' as const, label: `Documents (${documents.length})`, icon: FileText },
    { id: 'grades' as const, label: 'Candidate Grades', icon: BarChart3 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/instructor/lessons')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{lesson.lessonTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Course #{lesson.lessonOrder} · Candidate: {lesson.candidateName}
          </p>
        </div>
        <button
          onClick={() => navigate(`/instructor/grades`)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <GraduationCap size={16} /> {t('common.allGrades')}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              {lesson.completed ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <Clock size={20} className="text-amber-600" />
              )}
            </div>
            <div>
              <div className="text-sm text-slate-500">Status</div>
              <div className={`font-semibold ${lesson.completed ? 'text-green-600' : 'text-amber-600'}`}>
                {lesson.completed ? 'Completed' : 'In Progress'}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Score</div>
              <div className="font-semibold text-slate-900 dark:text-white">{lesson.candidateScore ?? 0}/100</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
              <HelpCircle size={20} className="text-cyan-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Questions</div>
              <div className="font-semibold text-slate-900 dark:text-white">{questionCount}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Pass Score</div>
              <div className="font-semibold text-slate-900 dark:text-white">{lesson.requiredScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {lesson.notes ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                    {lesson.notes}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No course content added yet</p>
                </div>
              )}
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {lesson.questions?.length ? (
                lesson.questions.map((q: any, idx: number) => (
                  <div key={q.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white mb-3">{q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div
                              key={optIdx}
                              className="px-4 py-2.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                            >
                              <span className="font-medium text-slate-400 mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          Correct answer: {q.options[q.correctOptionIndex]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <HelpCircle size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No questions added yet</p>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {documents.map((doc: LessonDocument) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{doc.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {(doc.fileSize / 1024).toFixed(1)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={getFileUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <FileDown size={16} />
                    </a>
                    <button
                      onClick={() => { setDeleteTarget({ type: 'document', docId: doc.id }); setShowDeleteModal(true); }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer text-sm font-medium transition-colors shadow-sm">
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload Document'}
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div>
              {grades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Candidate</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Attempts</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((g: any) => (
                        <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{g.candidateName}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${g.completed ? 'text-green-600' : 'text-amber-600'}`}>
                              {g.score || g.studentScore || g.candidateScore || 0}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{g.attemptsUsed}/{lesson.maxAttempts}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                              g.completed
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {g.completed ? 'Passed' : 'In Progress'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{new Date(g.submittedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <BarChart3 size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No grades recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Document</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.type === 'document') deleteDocMutation.mutate(deleteTarget.docId);
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
