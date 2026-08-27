import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Play, Search, Filter, Globe, Award, TrendingUp, Lock, ChevronRight, Users, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { lessonService } from '@/services/lessonService';
import { candidateService } from '@/services/candidateService';
import { getFileUrl } from '@/services/api';
import { selectUser } from '@/store/authStore';
import { Lesson } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'Bible Study': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'Baptism': { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  'Doctrine': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'Spiritual Growth': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  'Church History': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'Service': { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
};

const defaultColor = { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' };

const difficultyConfig: Record<string, { label: string; color: string }> = {
  'BEGINNER': { label: 'Beginner', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  'INTERMEDIATE': { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  'ADVANCED': { label: 'Advanced', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export default function CandidateCoursesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);

  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [courseLanguage, setCourseLanguage] = useState<'en' | 'rw'>(i18n.language === 'rw' ? 'rw' : 'en');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (currentUser?.email) {
      candidateService.getCandidatesByEmail(currentUser.email).then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) setCandidateId(String(list[0].id));
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (candidateId) {
      import('@/services/api').then(({ default: api }) => {
        api.get('/api/candidates/course-language').then((res: any) => {
          if (res.data?.preferredCourseLanguage) {
            setCourseLanguage(res.data.preferredCourseLanguage);
          }
        }).catch(() => {});
      });
    }
  }, [candidateId]);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['candidate-courses', candidateId, courseLanguage],
    queryFn: async () => {
      try {
        return await lessonService.getByCandidate(candidateId!, courseLanguage);
      } catch (e) {
        toast.error('Failed to load courses');
        throw e;
      }
    },
    enabled: !!candidateId,
  });

  const { data: progressDetail } = useQuery({
    queryKey: ['candidate-progress-detail', candidateId],
    queryFn: () => lessonService.getProgressDetail(candidateId!),
    enabled: !!candidateId,
  });

  const { data: progress = 0 } = useQuery({
    queryKey: ['candidate-progress', candidateId],
    queryFn: () => lessonService.getProgress(candidateId!),
    enabled: !!candidateId,
  });

  const completedCount = lessons.filter((l: Lesson) => l.completed).length;
  const inProgressCount = lessons.filter((l: Lesson) => l.status === 'IN_PROGRESS').length;
  const totalCount = lessons.length;

  const filteredLessons = lessons.filter((l: Lesson) => {
    const title = l.displayTitle || l.lessonTitle;
    const desc = l.displayDescription || l.description;
    const matchesSearch = !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase()) || (desc && desc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'completed' && l.completed) ||
      (statusFilter === 'in_progress' && l.status === 'IN_PROGRESS') ||
      (statusFilter === 'not_started' && !l.completed && l.status !== 'IN_PROGRESS');
    return matchesSearch && matchesStatus;
  });

  const handleStartCourse = async (lesson: Lesson) => {
    if (!candidateId) return;
    try {
      await lessonService.startLesson(lesson.id, candidateId);
      toast.success('Course started!');
      navigate(`/candidate/courses/${lesson.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to start course');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0c4a6e] rounded-2xl p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('common.myCourses', 'My Courses')}</h1>
              <p className="text-blue-200/80 text-sm">
                {totalCount > 0
                  ? `${completedCount} of ${totalCount} courses completed`
                  : 'No courses assigned yet'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-200/80">Overall Progress</span>
                <span className="text-sm font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {progressDetail && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{progressDetail.totalLessons}</div>
                <div className="text-xs text-slate-500">Total Courses</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{progressDetail.completedLessons}</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{progressDetail.remainingLessons}</div>
                <div className="text-xs text-slate-500">Remaining</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Award size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{Math.round(progressDetail.progressPercentage)}%</div>
                <div className="text-xs text-slate-500">Progress</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
              <Globe size={16} className="text-slate-500" />
              <select
                value={courseLanguage}
                onChange={async (e) => {
                  const lang = e.target.value as 'en' | 'rw';
                  setCourseLanguage(lang);
                  try {
                    const { default: api } = await import('@/services/api');
                    await api.put('/api/candidates/course-language', { language: lang });
                  } catch {}
                }}
                className="bg-transparent text-sm font-medium focus:outline-none dark:text-white"
              >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </div>

            <div className="flex border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="0" y="0" width="7" height="7" rx="1" />
                  <rect x="9" y="0" width="7" height="7" rx="1" />
                  <rect x="0" y="9" width="7" height="7" rx="1" />
                  <rect x="9" y="9" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="0" y="0" width="16" height="3" rx="1" />
                  <rect x="0" y="4.5" width="16" height="3" rx="1" />
                  <rect x="0" y="9" width="16" height="3" rx="1" />
                  <rect x="0" y="13" width="16" height="3" rx="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson: Lesson) => (
            <CourseCard
              key={lesson.id}
              lesson={lesson}
              lessons={lessons}
              onStart={handleStartCourse}
              onOpen={() => navigate(`/candidate/courses/${lesson.id}`)}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson: Lesson) => (
            <CourseListRow
              key={lesson.id}
              lesson={lesson}
              lessons={lessons}
              onStart={handleStartCourse}
              onOpen={() => navigate(`/candidate/courses/${lesson.id}`)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Empty States */}
      {lessons.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No courses assigned</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Your instructor will assign courses for your baptism preparation. Check back soon!
          </p>
        </div>
      )}

      {lessons.length > 0 && filteredLessons.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No courses match your search</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

function CourseCard({ lesson, lessons, onStart, onOpen, t }: {
  lesson: Lesson;
  lessons: Lesson[];
  onStart: (l: Lesson) => void;
  onOpen: () => void;
  t: any;
}) {
  const isLocked =
    lesson.lessonOrder > 1 &&
    lessons.some((l: Lesson) => l.lessonOrder < lesson.lessonOrder && !l.completed);

  const isStarted = lesson.status === 'IN_PROGRESS' || lesson.status === 'COMPLETED';
  const isCompleted = lesson.status === 'COMPLETED';
  const category = lesson.category || 'Bible Study';
  const colors = categoryColors[category] || defaultColor;

  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
  ];
  const gradient = gradients[lesson.lessonOrder % gradients.length];

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Course Thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          {isLocked ? (
            <Lock size={40} className="text-white/60" />
          ) : (
            <BookOpen size={40} className="text-white/80" />
          )}
        </div>

        {/* Order badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-black/30 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
            Module {lesson.lessonOrder}
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {isCompleted ? (
            <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
              <CheckCircle size={12} /> Completed
            </span>
          ) : isStarted ? (
            <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
              <Clock size={12} /> In Progress
            </span>
          ) : isLocked ? (
            <span className="px-2.5 py-1 bg-slate-500/80 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
              <Lock size={12} /> Locked
            </span>
          ) : null}
        </div>

        {/* Hover overlay */}
        {!isLocked && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={onOpen}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110"
            >
              {isCompleted ? (
                <BookOpen size={24} className="text-slate-700" />
              ) : (
                <Play size={24} className="text-blue-600 ml-1" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-5">
        {/* Category & Difficulty */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
            {category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {lesson.displayTitle || lesson.lessonTitle}
        </h3>

        {/* Description */}
        {(lesson.displayDescription || lesson.description) && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
            {lesson.displayDescription || lesson.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          {lesson.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock size={14} /> {lesson.durationMinutes} min
            </span>
          )}
          {lesson.candidateScore != null && isCompleted && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Award size={14} /> Score: {lesson.candidateScore}%
            </span>
          )}
        </div>

        {/* Progress bar (for in-progress) */}
        {isStarted && !isCompleted && lesson.completionPercentage != null && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Progress</span>
              <span className="text-xs font-semibold text-blue-600">{lesson.completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${lesson.completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-400">
            {isCompleted ? (
              <span className="text-green-600 font-medium">Passed ({lesson.candidateScore}%)</span>
            ) : (
              <span>Pass: {lesson.requiredScore}%</span>
            )}
          </div>

          {isLocked ? (
            <button
              onClick={() => toast.error('Complete the previous course first')}
              className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-not-allowed"
            >
              Locked
            </button>
          ) : isCompleted ? (
            <button
              onClick={onOpen}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
            >
              Review <ChevronRight size={14} />
            </button>
          ) : isStarted ? (
            <button
              onClick={onOpen}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => onStart(lesson)}
              className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-1 shadow-sm"
            >
              <Play size={14} /> Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseListRow({ lesson, lessons, onStart, onOpen, t }: {
  lesson: Lesson;
  lessons: Lesson[];
  onStart: (l: Lesson) => void;
  onOpen: () => void;
  t: any;
}) {
  const isLocked =
    lesson.lessonOrder > 1 &&
    lessons.some((l: Lesson) => l.lessonOrder < lesson.lessonOrder && !l.completed);

  const isStarted = lesson.status === 'IN_PROGRESS' || lesson.status === 'COMPLETED';
  const isCompleted = lesson.status === 'COMPLETED';
  const category = lesson.category || 'Bible Study';
  const colors = categoryColors[category] || defaultColor;

  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
  ];
  const gradient = gradients[lesson.lessonOrder % gradients.length];

  return (
    <div
      onClick={isLocked ? undefined : onOpen}
      className={`group flex items-center gap-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700'}`}
    >
      {/* Thumbnail */}
      <div className={`w-24 h-24 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shrink-0`}>
        {isLocked ? (
          <Lock size={24} className="text-white/60" />
        ) : (
          <BookOpen size={24} className="text-white/80" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-400">#{lesson.lessonOrder}</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
            {category}
          </span>
          {isCompleted && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              Completed
            </span>
          )}
          {isStarted && !isCompleted && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              In Progress
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
          {lesson.displayTitle || lesson.lessonTitle}
        </h3>
        {(lesson.displayDescription || lesson.description) && (
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {lesson.displayDescription || lesson.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          {lesson.durationMinutes && (
            <span className="flex items-center gap-1"><Clock size={12} /> {lesson.durationMinutes} min</span>
          )}
          {isStarted && lesson.completionPercentage != null && (
            <span className="flex items-center gap-1">
              <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${lesson.completionPercentage}%` }} />
              </div>
              {lesson.completionPercentage}%
            </span>
          )}
          {isCompleted && lesson.candidateScore != null && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Award size={12} /> Score: {lesson.candidateScore}%
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {isLocked ? (
          <span className="text-slate-400"><Lock size={20} /></span>
        ) : isCompleted ? (
          <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            Review
          </button>
        ) : isStarted ? (
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Continue
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(lesson); }}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-1"
          >
            <Play size={14} /> Start
          </button>
        )}
      </div>
    </div>
  );
}
