import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { lessonService } from '@/services/lessonService';
import { candidateService } from '@/services/candidateService';
import { instructorService } from '@/services/instructorService';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface QuestionForm {
  question: string;
  correctAnswer: string;
  options: string[];
}

export default function LessonFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector(selectUser);
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [requiredScore, setRequiredScore] = useState(70);
  const [lessonOrder, setLessonOrder] = useState(1);
  const [candidateId, setCandidateId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: instructors = [] } = useQuery({
    queryKey: ['current-instructor'],
    queryFn: async () => {
      const res = await instructorService.getAllInstructors({ page: 1, pageSize: 100 });
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return list.find((i: any) => i.email === currentUser?.email);
    },
    enabled: !!currentUser,
  });

  const instructorId = (instructors as any)?.id;

  const { data: candidates = [] } = useQuery({
    queryKey: ['instructor-candidates', instructorId],
    queryFn: () => candidateService.getCandidatesByInstructor(instructorId),
    enabled: !!instructorId,
  });

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchLesson = async () => {
      try {
        const lesson = await lessonService.getById(id, true);
        setTitle(lesson.lessonTitle);
        setNotes(lesson.notes ?? '');
        setRequiredScore(lesson.requiredScore ?? 70);
        setLessonOrder(lesson.lessonOrder ?? 1);
        setCandidateId(lesson.candidateId?.toString() ?? '');

        if (lesson.questions && lesson.questions.length > 0) {
          const qs: QuestionForm[] = lesson.questions.map((q) => ({
            question: q.question,
            correctAnswer: q.correctAnswer ?? '',
            options: q.options.slice(0, 4),
          }));
          setQuestions(qs);
        }
      } catch {
        toast.error('Failed to load lesson');
        navigate('/instructor/lessons');
      }
    };

    fetchLesson();
  }, [id, isEditMode, navigate]);

  const handleQuestionChange = (qIdx: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[qIdx] as any)[field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', correctAnswer: '', options: ['', '', '', ''] }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !candidateId) {
      toast.error('Title and candidate are required');
      return;
    }

    const filledQuestions = questions.filter((q) => q.question.trim());
    for (const q of filledQuestions) {
      if (!q.correctAnswer || q.options.some((o) => !o.trim())) {
        toast.error('Each filled question needs a correct answer and 4 options');
        return;
      }
      if (!q.options.includes(q.correctAnswer)) {
        toast.error('Correct answer must be one of the options');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('lessonTitle', title);
      formData.append('lessonDate', new Date().toISOString().split('T')[0]);
      formData.append('notes', notes);
      formData.append('requiredScore', String(requiredScore));
      formData.append('lessonOrder', String(lessonOrder));
      formData.append('maxAttempts', '3');
      formData.append('candidateId', candidateId);
      formData.append('instructorId', String(instructorId));
      if (file) {
        formData.append('file', file);
      }

      const filledQuestions = questions.filter((q) => q.question.trim());

      if (isEditMode && id) {
        await lessonService.updateLesson(id, formData);
        if (filledQuestions.length > 0) {
          await lessonService.addQuestions(id, filledQuestions.map((q, i) => ({
            question: q.question,
            correctAnswer: q.correctAnswer,
            options: q.options,
            orderIndex: i,
          })));
        }
        toast.success('Lesson updated successfully');
      } else {
        const created = await lessonService.create(formData);
        if (filledQuestions.length > 0) {
          await lessonService.addQuestions(created.id, filledQuestions.map((q, i) => ({
            question: q.question,
            correctAnswer: q.correctAnswer,
            options: q.options,
            orderIndex: i,
          })));
        }
        toast.success('Lesson created successfully');
      }

      navigate('/instructor/lessons');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{isEditMode ? t('common.editLesson') : t('common.createLesson')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title={t('common.lessonDetails')}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.title')}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.candidate')}</label>
              <select
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">{t('common.selectCandidate')}</option>
                {(Array.isArray(candidates) ? candidates : []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || `${c.firstName ?? ''} ${c.lastName ?? ''}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.orderSequence')}</label>
              <input
                type="number"
                min={1}
                value={lessonOrder}
                onChange={(e) => setLessonOrder(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.passingScorePercent')}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={requiredScore}
                onChange={(e) => setRequiredScore(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">{t('common.notesContent')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">{t('common.fileDocumentOptional')}</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full"
            />
          </div>
        </Card>

        <Card title={t('common.assessmentQuestionsOptional')}>
          <p className="text-sm text-slate-500 mb-4">
            {t('common.addQuestionsDescription')}
          </p>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="border rounded p-4 mb-4 relative">
              <button
                type="button"
                onClick={() => removeQuestion(qIdx)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
              >
                {t('common.remove')}
              </button>
              <h4 className="font-medium mb-2">{t('common.question')} {qIdx + 1}</h4>
              <input
                value={q.question}
                onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                placeholder={t('common.enterQuestion')}
                className="w-full border rounded px-3 py-2 mb-3"
              />

              <div className="grid grid-cols-2 gap-3 mb-3">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctAnswer === opt}
                      onChange={() => handleQuestionChange(qIdx, 'correctAnswer', opt)}
                    />
                    <input
                      value={opt}
                      onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                      placeholder={`${t('common.option')} ${optIdx + 1}`}
                      className="flex-1 border rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="text-sm text-primary hover:underline flex items-center gap-1">
            <Plus size={16} /> {t('common.addQuestion')}
          </button>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? t('common.saving') : isEditMode ? t('common.updateLesson') : t('common.createLesson')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/instructor/lessons')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
