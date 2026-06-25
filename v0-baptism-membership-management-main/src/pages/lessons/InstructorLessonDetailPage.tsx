import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, FileDown, ArrowLeft, RefreshCw, Upload, Trash2, FileText, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { LessonDocument } from '@/types';
import Card from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function InstructorLessonDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center py-12 text-slate-500">{t('common.lessonNotFound')}</div>;
  }

  const grade = grades[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/instructor/lessons')} className="p-2 hover:bg-slate-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <BookOpen size={28} className="text-indigo-600" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lesson.lessonTitle}</h1>
          <p className="text-sm text-slate-500">
            Course #{lesson.lessonOrder} &middot; Candidate: {lesson.candidateName}
            &middot; {lesson.questions?.length || 0} questions &middot; Passing: {lesson.requiredScore}%
          </p>
        </div>
        <button
          onClick={() => navigate(`/instructor/grades`)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
        >
          <GraduationCap size={16} /> {t('common.allGrades')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{t('common.status')}</h3>
          <div className="flex items-center gap-2">
            {lesson.completed ? (
              <>
                <CheckCircle size={18} className="text-green-500" />
                <span className="font-medium text-green-700">{t('common.completed')}</span>
              </>
            ) : (
              <>
                <RefreshCw size={18} className="text-amber-500" />
                <span className="font-medium text-amber-700">{t('common.inProgress')}</span>
              </>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{t('common.score')}</h3>
          <p className="text-xl font-bold">{lesson.studentScore}/{100}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{t('common.maxAttempts')}</h3>
          <p className="text-xl font-bold">{lesson.maxAttempts}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{grade ? t('common.attemptsUsed') : t('common.attempts')}</h3>
          <p className="text-xl font-bold">{grade ? grade.attemptsUsed : 0}</p>
        </Card>
      </div>

      {lesson.notes && (
        <Card title={t('common.courseContent')}>
          <p className="whitespace-pre-wrap text-sm">{lesson.notes}</p>
        </Card>
      )}

      {/* DOCUMENTS SECTION */}
      <Card title={`${t('common.documents')} (${documents.length})`}>
        <div className="space-y-3">
          {documents.map((doc: LessonDocument) => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-indigo-500" />
                <div>
                  <p className="text-sm font-medium">{doc.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {(doc.fileSize / 1024).toFixed(1)} KB &middot; {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                >
                  <FileDown size={16} />
                </a>
                <button
                  onClick={() => deleteDocMutation.mutate(doc.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-sm text-slate-500 py-2">{t('common.noDocumentsUploaded')}</p>
          )}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer text-sm">
              <Upload size={16} />
              {uploading ? t('common.uploading') : t('common.uploadDocument')}
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </Card>

      <Card title={`${t('common.assessmentQuestions')} (${lesson.questions?.length || 0})`}>
        {lesson.questions?.length ? (
          <div className="space-y-4">
            {lesson.questions.map((q, idx) => (
              <div key={q.id} className="border rounded p-4">
                <p className="font-medium mb-2">
                  {idx + 1}. {q.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="px-3 py-2 rounded text-sm border"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">{t('common.noQuestionsAdded')}</p>
        )}
      </Card>
    </div>
  );
}
