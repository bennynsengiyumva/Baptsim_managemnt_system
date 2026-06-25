import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/api';
import { Baptism, FilterParams } from '@/types';

interface BaptismState {
  baptisms: Baptism[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BaptismState = {
  baptisms: [],
  isLoading: false,
  error: null,
};

export const fetchBaptisms = createAsyncThunk(
  'baptism/fetchAll',
  async (params: FilterParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/baptisms', { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createBaptism = createAsyncThunk(
  'baptism/create',
  async (baptism: Partial<Baptism>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/baptisms', baptism);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateBaptism = createAsyncThunk(
  'baptism/update',
  async ({ id, ...data }: Partial<Baptism> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/baptisms/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const baptismSlice = createSlice({
  name: 'baptism',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBaptisms.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBaptisms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.baptisms = action.payload.data;
      })
      .addCase(fetchBaptisms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createBaptism.fulfilled, (state, action) => {
        state.baptisms.push(action.payload);
      })
      .addCase(updateBaptism.fulfilled, (state, action) => {
        const index = state.baptisms.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.baptisms[index] = action.payload;
        }
      });
  },
});

export const { clearError } = baptismSlice.actions;
export default baptismSlice.reducer;
