import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { lessonService } from '@/services/lessonService';
import { Lesson, LessonAttempt } from '@/types';
import { RootState } from '@/store';

interface LessonState {
  lessons: Lesson[];
  currentLesson: Lesson | null;
  attempts: LessonAttempt[];
  progress: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: LessonState = {
  lessons: [],
  currentLesson: null,
  attempts: [],
  progress: 0,
  isLoading: false,
  error: null,
};

export const fetchLessonsByInstructor = createAsyncThunk(
  'lessons/fetchByInstructor',
  async (instructorId: string, { rejectWithValue }) => {
    try {
      return await lessonService.getByInstructor(instructorId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch lessons');
    }
  }
);

export const fetchLessonsByCandidate = createAsyncThunk(
  'lessons/fetchByCandidate',
  async (candidateId: string, { rejectWithValue }) => {
    try {
      return await lessonService.getByCandidate(candidateId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch lessons');
    }
  }
);

export const fetchLessonById = createAsyncThunk(
  'lessons/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await lessonService.getById(id);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch lesson');
    }
  }
);

export const createLesson = createAsyncThunk(
  'lessons/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await lessonService.create(formData);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create lesson');
    }
  }
);

export const addQuestions = createAsyncThunk(
  'lessons/addQuestions',
  async ({ lessonId, questions }: { lessonId: string; questions: any[] }, { rejectWithValue }) => {
    try {
      return await lessonService.addQuestions(lessonId, questions);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add questions');
    }
  }
);

export const startAttempt = createAsyncThunk(
  'lessons/startAttempt',
  async ({ lessonId, candidateId }: { lessonId: string; candidateId: string }, { rejectWithValue }) => {
    try {
      return await lessonService.startAttempt(lessonId, candidateId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to start attempt');
    }
  }
);

export const submitAttempt = createAsyncThunk(
  'lessons/submitAttempt',
  async (
    { lessonId, candidateId, questionIds, answers }:
    { lessonId: string; candidateId: string; questionIds: string[]; answers: string[] },
    { rejectWithValue }
  ) => {
    try {
      return await lessonService.submitAttempt(lessonId, candidateId, questionIds, answers);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to submit attempt');
    }
  }
);

export const fetchAttempts = createAsyncThunk(
  'lessons/fetchAttempts',
  async ({ lessonId, candidateId }: { lessonId: string; candidateId: string }, { rejectWithValue }) => {
    try {
      return await lessonService.getAttempts(lessonId, candidateId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch attempts');
    }
  }
);

export const fetchProgress = createAsyncThunk(
  'lessons/fetchProgress',
  async (candidateId: string, { rejectWithValue }) => {
    try {
      return await lessonService.getProgress(candidateId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch progress');
    }
  }
);

const lessonSlice = createSlice({
  name: 'lessons',
  initialState,
  reducers: {
    clearCurrentLesson(state) {
      state.currentLesson = null;
    },
    clearAttempts(state) {
      state.attempts = [];
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: LessonState) => {
      state.isLoading = true;
      state.error = null;
    };
    const handleError = (state: LessonState, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload as string;
    };

    builder
      .addCase(fetchLessonsByInstructor.pending, handlePending)
      .addCase(fetchLessonsByInstructor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lessons = action.payload;
      })
      .addCase(fetchLessonsByInstructor.rejected, handleError)

      .addCase(fetchLessonsByCandidate.pending, handlePending)
      .addCase(fetchLessonsByCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lessons = action.payload;
      })
      .addCase(fetchLessonsByCandidate.rejected, handleError)

      .addCase(fetchLessonById.pending, handlePending)
      .addCase(fetchLessonById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLesson = action.payload;
      })
      .addCase(fetchLessonById.rejected, handleError)

      .addCase(createLesson.pending, handlePending)
      .addCase(createLesson.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lessons.push(action.payload);
      })
      .addCase(createLesson.rejected, handleError)

      .addCase(addQuestions.fulfilled, (state, action) => {
        state.currentLesson = action.payload;
        const idx = state.lessons.findIndex((l) => l.id === action.payload.id);
        if (idx >= 0) state.lessons[idx] = action.payload;
      })

      .addCase(startAttempt.fulfilled, (state, action) => {
        state.attempts.push(action.payload);
      })

      .addCase(submitAttempt.fulfilled, (state, action) => {
        const idx = state.attempts.findIndex((a) => a.id === action.payload.id);
        if (idx >= 0) state.attempts[idx] = action.payload;
        else state.attempts.push(action.payload);
        if (state.currentLesson && state.currentLesson.id === action.payload.lessonId) {
          if (action.payload.passed) {
            state.currentLesson.completed = true;
            state.currentLesson.studentScore = action.payload.score;
          }
        }
      })

      .addCase(fetchAttempts.fulfilled, (state, action) => {
        state.attempts = action.payload;
      })

      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      });
  },
});

export const { clearCurrentLesson, clearAttempts } = lessonSlice.actions;

export const selectLessons = (state: RootState) => state.lessons.lessons;
export const selectCurrentLesson = (state: RootState) => state.lessons.currentLesson;
export const selectAttempts = (state: RootState) => state.lessons.attempts;
export const selectLessonProgress = (state: RootState) => state.lessons.progress;
export const selectLessonLoading = (state: RootState) => state.lessons.isLoading;

export default lessonSlice.reducer;
