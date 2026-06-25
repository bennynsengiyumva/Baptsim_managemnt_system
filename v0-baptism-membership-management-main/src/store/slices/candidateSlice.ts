import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/api';
import { Candidate, FilterParams } from '@/types';

interface CandidateState {
  candidates: Candidate[];
  currentCandidate: Candidate | null;
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CandidateState = {
  candidates: [],
  currentCandidate: null,
  total: 0,
  page: 1,
  pageSize: 10,
  isLoading: false,
  error: null,
};

// ✅ No role logic needed here — backend filters by JWT automatically
export const fetchCandidates = createAsyncThunk(
  'candidate/fetchAll',
  async (params: FilterParams = {} as FilterParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/candidates', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch candidates');
    }
  }
);

export const fetchCandidateById = createAsyncThunk(
  'candidate/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/candidates/${id}`);
      return (response.data.data ?? response.data) as Candidate;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch candidate');
    }
  }
);

export const createCandidate = createAsyncThunk(
  'candidate/create',
  async (candidate: Partial<Candidate>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/candidates', candidate);
      return (response.data.data ?? response.data) as Candidate;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create candidate');
    }
  }
);

export const updateCandidate = createAsyncThunk(
  'candidate/update',
  async ({ id, ...data }: Partial<Candidate> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/candidates/${id}`, data);
      return (response.data.data ?? response.data) as Candidate;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update candidate');
    }
  }
);

export const deleteCandidate = createAsyncThunk(
  'candidate/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/candidates/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete candidate');
    }
  }
);

export const assignInstructor = createAsyncThunk(
  'candidate/assignInstructor',
  async (
    { candidateId, instructorId }: { candidateId: string; instructorId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.patch(
        `/api/candidates/${candidateId}/assign-instructor/${instructorId}`
      );
      return (response.data.data ?? response.data) as Candidate;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign instructor');
    }
  }
);

export const unassignInstructor = createAsyncThunk(
  'candidate/unassignInstructor',
  async (candidateId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(
        `/api/candidates/${candidateId}/unassign-instructor`
      );
      return (response.data.data ?? response.data) as Candidate;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unassign instructor');
    }
  }
);

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearCurrentCandidate: (state) => { state.currentCandidate = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        if (Array.isArray(payload)) {
          state.candidates = payload;
        } else {
          state.candidates = payload.data ?? payload ?? [];
          state.total     = payload.total    ?? 0;
          state.page      = payload.page     ?? 1;
          state.pageSize  = payload.pageSize ?? 10;
        }
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCandidateById.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchCandidateById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCandidate = action.payload;
      })
      .addCase(fetchCandidateById.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createCandidate.pending,   (state) => { state.isLoading = true; })
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates.push(action.payload);
        state.currentCandidate = action.payload;
      })
      .addCase(createCandidate.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCandidate.pending,   (state) => { state.isLoading = true; })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.candidates.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.candidates[index] = action.payload;
        state.currentCandidate = action.payload;
      })
      .addCase(updateCandidate.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteCandidate.pending,   (state) => { state.isLoading = true; })
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates = state.candidates.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCandidate.rejected,  (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(assignInstructor.fulfilled, (state, action) => {
        const index = state.candidates.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.candidates[index] = action.payload;
        if (state.currentCandidate?.id === action.payload.id) {
          state.currentCandidate = action.payload;
        }
      })
      .addCase(unassignInstructor.fulfilled, (state, action) => {
        const index = state.candidates.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.candidates[index] = action.payload;
        if (state.currentCandidate?.id === action.payload.id) {
          state.currentCandidate = action.payload;
        }
      });
  },
});

export const { clearError, clearCurrentCandidate } = candidateSlice.actions;
export default candidateSlice.reducer;

export const selectCandidates       = (state: any) => state.candidate.candidates;
export const selectCurrentCandidate = (state: any) => state.candidate.currentCandidate;
export const selectCandidateLoading = (state: any) => state.candidate.isLoading;
export const selectCandidateError   = (state: any) => state.candidate.error;
export const selectCandidateTotal   = (state: any) => state.candidate.total;