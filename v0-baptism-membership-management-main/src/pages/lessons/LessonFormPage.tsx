import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, FileDown } from 'lucide-react';
import { lessonService } from '@/services/lessonService';
import { cohortService } from '@/services/cohortService';
import { instructorService } from '@/services/instructorService';
import { getFileUrl } from '@/services/api';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LessonDocument } from '@/types';
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
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<LessonDocument[]>([]);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contentLanguage, setContentLanguage] = useState<'en' | 'rw'>('en');
  const [titleRw, setTitleRw] = useState('');
  const [notesRw, setNotesRw] = useState('');
  const [descriptionRw, setDescriptionRw] = useState('');

  const [instructorId, setInstructorId] = useState<number | null>(null);

  useEffect(() => {
    instructorService.getAllInstructors({ page: 1, pageSize: 100 }).then((res: any) => {
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const me = list.find((i: any) => i.email === currentUser?.email);
      if (me) {
        setInstructorId(me.id);
        cohortService.getAll().then((allCohorts: any) => {
          const myCohorts = Array.isArray(allCohorts) ? allCohorts.filter((c: any) => c.instructorId === me.id) : [];
          setCohorts(myCohorts);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchLesson = async () => {
      try {
        const lesson = await lessonService.getById(id, true);
        setTitle(lesson.lessonTitle);
        setNotes(lesson.notes ?? '');
        setRequiredScore(lesson.requiredScore ?? 70);
        setLessonOrder(lesson.lessonOrder ?? 1);
        setSelectedCohortId(lesson.cohortId ? String(lesson.cohortId) : '');
        setCategory(lesson.category ?? '');
        setDurationMinutes(lesson.durationMinutes ?? '');
        setDescription(lesson.description ?? '');
        setTitleRw(lesson.titleRw ?? '');
        setNotesRw(lesson.notesRw ?? '');
        setDescriptionRw(lesson.descriptionRw ?? '');

        if (lesson.questions && lesson.questions.length > 0) {
          const qs: QuestionForm[] = lesson.questions.map((q) => ({
            question: q.question,
            correctAnswer: q.correctAnswer ?? '',
            options: q.options.slice(0, 4),
          }));
          setQuestions(qs);
        }

        try {
          const docs = await lessonService.getDocuments(id);
          setExistingDocuments(Array.isArray(docs) ? docs : []);
        } catch { /* no documents */ }
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    else if (title.length > 200) newErrors.title = 'Title must be under 200 characters';
    if (!selectedCohortId) newErrors.cohort = 'Select a cohort';
    if (requiredScore < 0 || requiredScore > 100) newErrors.requiredScore = 'Score must be 0-100';
    if (lessonOrder < 1) newErrors.lessonOrder = 'Order must be at least 1';
    if (durationMinutes !== '' && (durationMinutes < 1 || durationMinutes > 600)) newErrors.duration = 'Duration must be 1-600 minutes';
    if (description.length > 1000) newErrors.description = 'Description must be under 1000 characters';

    const filledQuestions = questions.filter((q) => q.question.trim());
    for (let i = 0; i < filledQuestions.length; i++) {
      const q = filledQuestions[i];
      if (!q.correctAnswer) newErrors[`question_${i}`] = `Question ${i + 1}: select a correct answer`;
      if (q.options.some((o) => !o.trim())) newErrors[`question_${i}_options`] = `Question ${i + 1}: all options must be filled`;
      if (!q.options.includes(q.correctAnswer)) newErrors[`question_${i}_match`] = `Question ${i + 1}: correct answer must be one of the options`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the validation errors');
      return;
    }

    const filledQuestions = questions.filter((q) => q.question.trim());
    setLoading(true);

    try {
      if (isEditMode && id) {
        const formData = new FormData();
        formData.append('lessonTitle', title);
        formData.append('lessonDate', new Date().toISOString().split('T')[0]);
        formData.append('notes', notes);
        formData.append('requiredScore', String(requiredScore));
        formData.append('lessonOrder', String(lessonOrder));
        formData.append('maxAttempts', '3');
        formData.append('instructorId', String(instructorId));
        formData.append('cohortId', selectedCohortId || '');
        if (category)         formData.append('category', category);
        if (durationMinutes !== '') formData.append('durationMinutes', String(durationMinutes));
        if (description) formData.append('description', description);
        if (titleRw) formData.append('titleRw', titleRw);
        if (notesRw) formData.append('notesRw', notesRw);
        if (descriptionRw) formData.append('descriptionRw', descriptionRw);
        if (files.length > 0) {
          formData.append('file', files[0]);
        }

        await lessonService.updateLesson(id, formData);
        // Upload additional files as documents
        if (files.length > 1) {
          for (let i = 1; i < files.length; i++) {
            const docFormData = new FormData();
            docFormData.append('file', files[i]);
            await lessonService.uploadDocument(id, docFormData);
          }
        }
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
        const formData = new FormData();
        formData.append('lessonTitle', title);
        formData.append('lessonDate', new Date().toISOString().split('T')[0]);
        formData.append('notes', notes);
        formData.append('requiredScore', String(requiredScore));
        formData.append('lessonOrder', String(lessonOrder));
        formData.append('maxAttempts', '3');
        formData.append('instructorId', String(instructorId));
        formData.append('cohortId', selectedCohortId || '');
        if (category) formData.append('category', category);
        if (durationMinutes !== '') formData.append('durationMinutes', String(durationMinutes));
        if (description) formData.append('description', description);
        if (titleRw) formData.append('titleRw', titleRw);
        if (notesRw) formData.append('notesRw', notesRw);
        if (descriptionRw) formData.append('descriptionRw', descriptionRw);
        if (files.length > 0) {
          formData.append('file', files[0]);
        }

        const created = await lessonService.create(formData);
        // Upload additional files as documents
        if (files.length > 1) {
          for (let i = 1; i < files.length; i++) {
            const docFormData = new FormData();
            docFormData.append('file', files[i]);
            await lessonService.uploadDocument(created.id, docFormData);
          }
        }
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
              <label className="block text-sm font-medium mb-1">{t('common.title')} * ({contentLanguage === 'en' ? 'English' : 'Kinyarwanda'})</label>
              {contentLanguage === 'en' ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${errors.title ? 'border-red-500' : ''}`}
                  required
                />
              ) : (
                <input
                  value={titleRw}
                  onChange={(e) => setTitleRw(e.target.value)}
                  placeholder="Umutwe w'isomo mu Kinyarwanda"
                  className="w-full border rounded px-3 py-2"
                />
              )}
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.orderSequence')} *</label>
              <input
                type="number"
                min={1}
                value={lessonOrder}
                onChange={(e) => setLessonOrder(Number(e.target.value))}
                className={`w-full border rounded px-3 py-2 ${errors.lessonOrder ? 'border-red-500' : ''}`}
              />
              {errors.lessonOrder && <p className="text-xs text-red-500 mt-1">{errors.lessonOrder}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.passingScorePercent')} *</label>
              <input
                type="number"
                min={0}
                max={100}
                value={requiredScore}
                onChange={(e) => setRequiredScore(Number(e.target.value))}
                className={`w-full border rounded px-3 py-2 ${errors.requiredScore ? 'border-red-500' : ''}`}
              />
              {errors.requiredScore && <p className="text-xs text-red-500 mt-1">{errors.requiredScore}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select category</option>
                <option value="Bible Foundations">Bible Foundations</option>
                <option value="Church Life">Church Life</option>
                <option value="Doctrine">Doctrine</option>
                <option value="Spiritual Growth">Spiritual Growth</option>
                <option value="Service">Service</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                max={600}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 30"
                className={`w-full border rounded px-3 py-2 ${errors.duration ? 'border-red-500' : ''}`}
              />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Description ({contentLanguage === 'en' ? 'English' : 'Kinyarwanda'})</label>
            {contentLanguage === 'en' ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of this lesson..."
                className={`w-full border rounded px-3 py-2 ${errors.description ? 'border-red-500' : ''}`}
              />
            ) : (
              <textarea
                value={descriptionRw}
                onChange={(e) => setDescriptionRw(e.target.value)}
                rows={2}
                placeholder="Ibisobanuro birambuye ku isomo..."
                className="w-full border rounded px-3 py-2"
              />
            )}
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            <p className="text-xs text-slate-400 mt-1">{contentLanguage === 'en' ? description.length : descriptionRw.length}/1000</p>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">{t('common.notesContent')}</label>
            {/* Language Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setContentLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${contentLanguage === 'en' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setContentLanguage('rw')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${contentLanguage === 'rw' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                Kinyarwanda
              </button>
            </div>
            {contentLanguage === 'en' ? (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Lesson content in English..."
                  className="w-full border rounded px-3 py-2"
                />
              </>
            ) : (
              <>
                <textarea
                  value={notesRw}
                  onChange={(e) => setNotesRw(e.target.value)}
                  rows={4}
                  placeholder="Ibisobanuro by'isomo mu Kinyarwanda..."
                  className="w-full border rounded px-3 py-2"
                />
              </>
            )}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">{t('common.fileDocumentOptional')}</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full"
            />
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-500">Selected files:</p>
                <ul className="text-sm text-slate-600">
                  {files.map((f, idx) => (
                    <li key={idx}>• {f.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {existingDocuments.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-500">Existing files:</p>
                {existingDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileDown size={14} className="text-indigo-500" />
                    <a href={getFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {doc.fileName}
                    </a>
                    <span className="text-xs text-slate-400">({doc.fileType})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Cohort Selection */}
        <Card title={isEditMode ? 'Cohort' : 'Assign to Cohort'}>
          <p className="text-sm text-slate-500 mb-3">
            Lesson will be created for all approved members in this cohort.
          </p>
          {errors.cohort && <p className="text-xs text-red-500 mb-2">{errors.cohort}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Cohort *
            </label>
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              required
              disabled={isEditMode}
            >
              <option value="">Select a cohort</option>
              {cohorts.map((c: any) => (
                <option key={c.id} value={c.id}>{c.cohortName} ({c.memberCount || 0} members)</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Lesson will be created for all approved members in this cohort</p>
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
