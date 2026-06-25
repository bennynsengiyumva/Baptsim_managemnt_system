import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/api';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async () => {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  }
);

interface DashboardState {
  stats: any;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchDashboardStats.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed to fetch stats'; });
  },
});

export const selectDashboardStats = (state: any) => state.dashboard?.stats;
export const selectDashboardLoading = (state: any) => state.dashboard?.loading;
export default dashboardSlice.reducer;
