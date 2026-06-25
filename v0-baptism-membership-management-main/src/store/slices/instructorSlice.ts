import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/api';
import { Instructor, FilterParams } from '@/types';

interface InstructorState {
  instructors: Instructor[];
  currentInstructor: Instructor | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: InstructorState = {
  instructors: [],
  currentInstructor: null,
  isLoading: false,
  error: null,
};

export const fetchInstructors = createAsyncThunk(
  'instructor/fetchAll',
  async (params: FilterParams = {} as FilterParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/instructors', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch instructors');
    }
  }
);

export const createInstructor = createAsyncThunk(
  'instructor/create',
  async (instructor: Partial<Instructor>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/instructors', instructor);
      return (response.data.data ?? response.data) as Instructor;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create instructor');
    }
  }
);

export const updateInstructor = createAsyncThunk(
  'instructor/update',
  async ({ id, ...data }: Partial<Instructor> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/instructors/${id}`, data);
      return (response.data.data ?? response.data) as Instructor;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update instructor');
    }
  }
);

export const deleteInstructor = createAsyncThunk(
  'instructor/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/instructors/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete instructor');
    }
  }
);

// ✅ Bulk assign candidates to an instructor
export const assignCandidatesToInstructor = createAsyncThunk(
  'instructor/assignCandidates',
  async ({ instructorId, candidateIds }: { instructorId: string; candidateIds: string[] }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        `/api/instructors/${instructorId}/assign-candidates`,
        candidateIds.map(Number) // backend expects List<Long>
      );
      return (response.data.data ?? response.data) as Instructor;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign candidates');
    }
  }
);

const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructors.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        // Handle both bare array and wrapped response
        state.instructors = Array.isArray(payload)
          ? payload
          : (payload.data ?? payload ?? []);
      })
      .addCase(fetchInstructors.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createInstructor.pending,   (state) => { state.isLoading = true; })
      .addCase(createInstructor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.instructors.push(action.payload);
      })
      .addCase(createInstructor.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateInstructor.pending,   (state) => { state.isLoading = true; })
      .addCase(updateInstructor.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.instructors.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.instructors[index] = action.payload;
      })
      .addCase(updateInstructor.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteInstructor.pending,   (state) => { state.isLoading = true; })
      .addCase(deleteInstructor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.instructors = state.instructors.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteInstructor.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(assignCandidatesToInstructor.fulfilled, (state, action) => {
        const index = state.instructors.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.instructors[index] = action.payload;
      });
  },
});

export const { clearError } = instructorSlice.actions;
export default instructorSlice.reducer;

export const selectInstructors       = (state: any) => state.instructor.instructors;
export const selectInstructorLoading = (state: any) => state.instructor.isLoading;
export const selectInstructorError   = (state: any) => state.instructor.error;