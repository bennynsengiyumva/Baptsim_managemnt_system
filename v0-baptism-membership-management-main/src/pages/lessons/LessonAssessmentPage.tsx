import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, XCircle, AlertTriangle, RefreshCw, FileDown, FileText, ChevronDown, ChevronUp, History, Clock, ArrowLeft, Award, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { candidateService } from '@/services/candidateService';
import { getFileUrl } from '@/services/api';
import { selectUser } from '@/store/authStore';
import { LessonAttempt, LessonDocument } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function LessonAssessmentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useSelector(selectUser);

  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAttempt, setCurrentAttempt] = useState<LessonAttempt | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [contentRead, setContentRead] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [showAttemptHistory, setShowAttemptHistory] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      candidateService.getCandidatesByEmail(currentUser.email).then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) setCandidateId(String(list[0].id));
      });
    }
  }, [currentUser]);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      try {
        return await lessonService.getById(id!);
      } catch (e) {
        toast.error('Failed to load assessment');
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

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', id, candidateId],
    queryFn: () => lessonService.getAttempts(id!, candidateId!),
    enabled: !!id && !!candidateId,
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ['candidate-lessons', candidateId],
    queryFn: () => lessonService.getByCandidate(candidateId!),
    enabled: !!candidateId,
  });

  const isLocked = lesson && lesson.lessonOrder > 1 && candidateId
    ? !allLessons.find((l: any) => l.lessonOrder === lesson.lessonOrder - 1 && l.completed)
    : false;

  useEffect(() => {
    if (isLocked) {
      toast.error('Complete the previous lesson first');
      navigate('/candidate/courses');
    }
  }, [isLocked, navigate]);

  const previousAttempts = attempts as LessonAttempt[];
  const lastAttempt = previousAttempts[previousAttempts.length - 1];
  const hasRemainingAttempts =
    !lesson?.completed && (lastAttempt ? lastAttempt.attemptsRemaining > 0 : true);

  const startMutation = useMutation({
    mutationFn: () => lessonService.startAttempt(id!, candidateId!),
    onSuccess: (data) => {
      setCurrentAttempt(data);
      setShowResult(false);
      setAnswers({});
      setShowContent(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to start attempt'),
  });

  const contentCompleteMutation = useMutation({
    mutationFn: () => lessonService.contentComplete(id!, candidateId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const questionIds = lesson!.questions.map((q) => q.id);
      const answerList = questionIds.map((qid) => answers[qid] || '');
      return lessonService.submitAttempt(id!, candidateId!, questionIds, answerList);
    },
    onSuccess: (data) => {
      setCurrentAttempt(data);
      setShowResult(true);
      toast.success('Assessment submitted! Score: ' + data.score);
      queryClient.invalidateQueries({ queryKey: ['lesson', id] });
      queryClient.invalidateQueries({ queryKey: ['attempts', id, candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidate-progress', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidate-courses', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidate-progress-detail', candidateId] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit assessment'),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center py-12 text-slate-500">{t('common.lessonNotFound')}</div>;
  }

  const lessonDocs = (documents as LessonDocument[]).filter(
    (doc) => String(doc.lessonId) === String(id)
  );

  // ── RESULT SCREEN ──
  if (showResult && currentAttempt) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => navigate('/candidate/courses')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft size={18} /> Back to Courses
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          {/* Result Header */}
          <div className={`p-10 text-center ${currentAttempt.passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              {currentAttempt.passed ? (
                <CheckCircle size={48} className="text-white" />
              ) : (
                <XCircle size={48} className="text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentAttempt.passed ? 'Congratulations!' : 'Not This Time'}
            </h2>
            <p className="text-white/80 text-lg">
              {currentAttempt.passed ? 'You passed the assessment!' : 'Keep studying and try again.'}
            </p>
          </div>

          {/* Score Cards */}
          <div className="p-8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className={`text-4xl font-bold ${currentAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {currentAttempt.score}%
                </div>
                <div className="text-sm text-slate-500 mt-1">Your Score</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-4xl font-bold text-slate-900 dark:text-white">{lesson.requiredScore}%</div>
                <div className="text-sm text-slate-500 mt-1">Passing Score</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-4xl font-bold text-blue-600">{currentAttempt.attemptNumber}/{lesson.maxAttempts}</div>
                <div className="text-sm text-slate-500 mt-1">Attempts Used</div>
              </div>
            </div>

            {!currentAttempt.passed && currentAttempt.attemptsRemaining > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-center">
                <p className="text-amber-700 dark:text-amber-300 font-medium">
                  {currentAttempt.attemptsRemaining} attempt{currentAttempt.attemptsRemaining > 1 ? 's' : ''} remaining
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {!currentAttempt.passed && currentAttempt.attemptsRemaining > 0 && (
                <button
                  onClick={() => { setCurrentAttempt(null); setShowResult(false); setContentRead(false); }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  <RefreshCw size={18} /> Try Again
                </button>
              )}
              <button
                onClick={() => navigate('/candidate/courses')}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ALREADY COMPLETED ──
  if (lesson.completed && !showResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => navigate('/candidate/courses')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft size={18} /> Back to Courses
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="p-10 text-center bg-gradient-to-br from-green-500 to-emerald-600">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <Award size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Course Completed!</h2>
            <p className="text-white/80 text-lg">{lesson.displayTitle || lesson.lessonTitle}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-4xl font-bold text-green-600">{lesson.candidateScore}%</div>
                <div className="text-sm text-slate-500 mt-1">Final Score</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-4xl font-bold text-slate-900 dark:text-white">{lesson.requiredScore}%</div>
                <div className="text-sm text-slate-500 mt-1">Passing Score</div>
              </div>
            </div>

            {/* Review Content */}
            {(lesson.displayNotes || lesson.notes) && (
              <div className="mb-6">
                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-600" /> Course Content
                </h3>
                <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {lesson.displayNotes || lesson.notes}
                </div>
              </div>
            )}

            {/* Review Documents */}
            {lessonDocs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" /> Course Documents
                </h3>
                <div className="space-y-2">
                  {lessonDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={getFileUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <FileText size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.fileName}</p>
                          <p className="text-xs text-slate-500">{doc.fileType} · {Math.round(doc.fileSize / 1024)}KB</p>
                        </div>
                      </div>
                      <FileDown size={18} className="text-blue-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button onClick={() => navigate('/candidate/courses')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── START SCREEN (Course Content + Start Button) ──
  if (!currentAttempt) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/candidate/courses')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft size={18} /> Back to Courses
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0c4a6e] rounded-2xl p-8 text-white">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{lesson.displayTitle || lesson.lessonTitle}</h1>
                <p className="text-blue-200/80 text-sm">
                  Course {lesson.lessonOrder} · {lesson.questions?.length || 0} questions · Pass: {lesson.requiredScore}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Course Content */}
          {(lesson.displayNotes || lesson.notes) && (
            <div className="border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowContent(!showContent)}
                className="flex items-center justify-between w-full p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-600" />
                  Course Content
                </span>
                {showContent ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {showContent && (
                <div className="px-5 pb-5">
                  <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {lesson.displayNotes || lesson.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {lessonDocs.length > 0 && (
            <div className="border-b border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Course Documents ({lessonDocs.length})
              </h3>
              <div className="space-y-2">
                {lessonDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <FileText size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.fileName}</p>
                        <p className="text-xs text-slate-500">{doc.fileType} · {Math.round(doc.fileSize / 1024)}KB</p>
                      </div>
                    </div>
                    <a
                      href={getFileUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <FileDown size={18} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Attempts */}
          {previousAttempts.length > 0 && (
            <div className="border-b border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <History size={18} className="text-amber-600" />
                  Previous Attempts ({previousAttempts.length})
                </h3>
                <button
                  onClick={() => setShowAttemptHistory(!showAttemptHistory)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {showAttemptHistory ? 'Hide' : 'Review Answers'}
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {previousAttempts.map((a) => (
                  <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl ${a.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Attempt {a.attemptNumber}
                    </span>
                    <span className={`text-sm font-bold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {a.score}% {a.passed ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>

              {showAttemptHistory && lesson.questions && (
                <div className="mt-4 space-y-3">
                  {previousAttempts.map((attempt) => {
                    const answersMap: Record<string, string> = {};
                    if (attempt.answers) {
                      attempt.answers.forEach((ans: any) => { answersMap[ans.questionId] = ans.selectedAnswer; });
                    }
                    return (
                      <div key={attempt.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <p className="font-medium text-sm mb-3 text-slate-700 dark:text-slate-300">
                          Attempt {attempt.attemptNumber} — {attempt.score}% {attempt.passed ? '✓ Passed' : '✗ Failed'}
                        </p>
                        <div className="space-y-2">
                          {lesson.questions.map((q, qi) => {
                            const selected = answersMap[q.id] || '(no answer)';
                            const correct = q.correctAnswer;
                            const isCorrect = selected === correct;
                            return (
                              <div key={q.id} className={`p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                                <p className="font-medium">
                                  {isCorrect ? <CheckCircle size={14} className="inline text-green-600 mr-1" /> : <XCircle size={14} className="inline text-red-600 mr-1" />}
                                  Q{qi + 1}: {q.question}
                                </p>
                                <p className="ml-5 mt-1">
                                  Your answer: <span className={isCorrect ? 'text-green-700 dark:text-green-400 font-medium' : 'text-red-700 dark:text-red-400 font-medium'}>{selected}</span>
                                </p>
                                {!isCorrect && (
                                  <p className="ml-5 text-green-700 dark:text-green-400">Correct: {correct}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Content Gate + Start */}
          <div className="p-5">
            {lesson.questions?.length > 0 && hasRemainingAttempts && (
              <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-5">
                <input
                  type="checkbox"
                  checked={contentRead}
                  onChange={(e) => {
                    setContentRead(e.target.checked);
                    if (e.target.checked) contentCompleteMutation.mutate();
                  }}
                  className="mt-1 accent-blue-600 w-5 h-5"
                />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">I have read and understood the course content</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Read all materials and documents before starting the assessment.
                  </p>
                </div>
              </label>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <Clock size={16} />
                {hasRemainingAttempts
                  ? `${lesson.maxAttempts - previousAttempts.length} attempt${lesson.maxAttempts - previousAttempts.length !== 1 ? 's' : ''} remaining`
                  : 'No attempts remaining'}
              </div>
              {hasRemainingAttempts && (
                <button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending || (lesson.questions?.length > 0 && !contentRead)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {startMutation.isPending ? 'Starting...' : 'Start Assessment'}
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ASSESSMENT IN PROGRESS ──
  const allAnswered = lesson.questions.every((q) => answers[q.id]);
  const answeredCount = Object.keys(answers).length;
  const totalCount = lesson.questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{lesson.lessonTitle}</h2>
            <p className="text-sm text-slate-500">
              Attempt {currentAttempt.attemptNumber} of {lesson.maxAttempts}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{answeredCount}/{totalCount}</div>
            <div className="text-xs text-slate-500">Questions Answered</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Reference Documents (during assessment) */}
      {lessonDocs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowContent(!showContent)}
            className="flex items-center justify-between w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <FileText size={16} className="text-blue-600" />
              Reference Documents ({lessonDocs.length})
            </span>
            {showContent ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
          {showContent && (
            <div className="px-4 pb-4 space-y-2">
              {lessonDocs.map((doc) => (
                <a
                  key={doc.id}
                  href={getFileUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{doc.fileName}</span>
                    <span className="text-xs text-slate-500">{doc.fileType}</span>
                  </div>
                  <FileDown size={16} className="text-blue-600" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!allAnswered) {
            toast.error('Please answer all questions before submitting');
            return;
          }
          submitMutation.mutate();
        }}
        className="space-y-4"
      >
        {lesson.questions.map((q, idx) => (
          <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center text-sm font-bold shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-lg">{q.question}</h3>
                <div className="space-y-3">
                  {q.options.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        answers[q.id] === opt
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        answers[q.id] === opt
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {answers[q.id] === opt && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className="sr-only"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Submit */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setCurrentAttempt(null); setShowContent(true); }}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!allAnswered || submitMutation.isPending}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
