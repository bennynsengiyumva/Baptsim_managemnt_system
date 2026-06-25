import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, XCircle, AlertTriangle, RefreshCw, FileDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { candidateService } from '@/services/candidateService';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LessonAttempt } from '@/types';
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

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', id, candidateId],
    queryFn: () => lessonService.getAttempts(id!, candidateId!),
    enabled: !!id && !!candidateId,
  });

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
    },
    onError: (err: any) => toast.error(err.message || 'Failed to start attempt'),
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
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit assessment'),
  });

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

  // Show result immediately after submission
  if (showResult && currentAttempt) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <div className="text-center py-8">
            {currentAttempt.passed ? (
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            ) : (
              <XCircle size={64} className="mx-auto text-red-500 mb-4" />
            )}
            <h2 className="text-2xl font-bold mb-2">
              {currentAttempt.passed ? t('common.passedExclamation') : t('common.notThisTime')}
            </h2>
            <p className="text-lg mb-1">
              {t('common.score')}: {currentAttempt.score}% ({t('common.passing')}: {lesson.requiredScore}%)
            </p>
            <p className="text-slate-500">
              {t('common.attempt')} {currentAttempt.attemptNumber} {t('common.of')} {lesson.maxAttempts}
            </p>
            {!currentAttempt.passed && currentAttempt.attemptsRemaining > 0 && (
              <p className="text-amber-600 mt-2">
                {currentAttempt.attemptsRemaining} {t('common.attemptsRemaining')}
              </p>
            )}

            <div className="mt-6 flex gap-3 justify-center">
              {!currentAttempt.passed && currentAttempt.attemptsRemaining > 0 && (
                <Button onClick={() => startMutation.mutate()}>
                  <RefreshCw size={16} /> {t('common.tryAgain')}
                </Button>
              )}
              <Button variant="secondary" onClick={() => navigate('/candidate/courses')}>
                {t('common.backToCourses')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Already completed (from a previous session)
  if (lesson.completed && !showResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <div className="text-center py-8">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('common.courseCompleted')}</h2>
            <p className="text-lg text-slate-600 mb-1">{lesson.lessonTitle}</p>
            <p className="text-slate-500">
              {t('common.score')}: {lesson.studentScore}% ({t('common.passing')}: {lesson.requiredScore}%)
            </p>
            {lesson.documentUrl && (
              <a href={lesson.documentUrl} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mt-4">
                <FileDown size={16} /> {t('common.downloadCourseMaterials')}
              </a>
            )}
            <div className="mt-6">
              <Button onClick={() => navigate('/candidate/courses')}>{t('common.backToCourses')}</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Start screen — show course info and start button
  if (!currentAttempt) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <BookOpen size={32} className="text-indigo-600 mt-1" />
            <div>
              <h2 className="text-2xl font-bold">{lesson.lessonTitle}</h2>
              <p className="text-sm text-slate-500">
                {t('common.course')} {lesson.lessonOrder} &middot; {lesson.questions?.length || 0} {t('common.questions')}
                &middot; {t('common.passing')}: {lesson.requiredScore}%
              </p>
            </div>
          </div>

          {lesson.notes && (
            <div className="mb-6 p-4 bg-slate-50 rounded">
              <h3 className="font-medium mb-2">{t('common.courseContent')}</h3>
              <p className="text-sm whitespace-pre-wrap">{lesson.notes}</p>
            </div>
          )}

          {lesson.documentUrl && (
            <div className="mb-6">
              <a
                href={lesson.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
              >
                <FileDown size={16} /> {t('common.downloadAttachedMaterials')}
              </a>
            </div>
          )}

          {previousAttempts.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 rounded">
              <h3 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle size={16} /> {t('common.previousAttempts')}
              </h3>
              {previousAttempts.map((a) => (
                <p key={a.id} className="text-sm text-amber-700">
                  Attempt {a.attemptNumber}: {a.score}% {a.passed ? '(Passed)' : '(Failed)'}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              {hasRemainingAttempts
                ? `${lesson.maxAttempts - previousAttempts.length} ${t('common.attemptsRemaining')}`
                : t('common.noAttemptsRemaining')}
            </p>
            {hasRemainingAttempts && (
              <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                {startMutation.isPending ? t('common.starting') : t('common.startAssessment')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Assessment in progress
  const allAnswered = lesson.questions.every((q) => answers[q.id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lesson.lessonTitle}</h2>
          <p className="text-sm text-slate-500">
            {t('common.attempt')} {currentAttempt.attemptNumber} {t('common.of')} {lesson.maxAttempts}
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {Object.keys(answers).length} {t('common.of')} {lesson.questions.length} {t('common.answered')}
        </span>
      </div>

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
          <Card key={q.id}>
            <h3 className="font-medium mb-3">
              {idx + 1}. {q.question}
            </h3>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => (
                <label
                  key={optIdx}
                  className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                    answers[q.id] === opt
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                    className="accent-indigo-600"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setCurrentAttempt(null);
              navigate(`/candidate/courses/${id}`);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!allAnswered || submitMutation.isPending}>
            {submitMutation.isPending ? t('common.submitting') : t('common.submitAssessment')}
          </Button>
        </div>
      </form>
    </div>
  );
}
