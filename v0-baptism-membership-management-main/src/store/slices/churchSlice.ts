import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/api';

export interface Church {
  id?: number;
  churchName: string;
  district: string;
  fieldName: string;
  unionName: string;
  address: string;
  phone: string;
  email: string;

  pastorId?: number;
  pastorName?: string;
}

interface ChurchState {
  churches: Church[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChurchState = {
  churches: [],
  isLoading: false,
  error: null,
};

export const fetchChurches = createAsyncThunk(
  'church/fetchChurches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/churches');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load churches'
      );
    }
  }
);

export const createChurch = createAsyncThunk(
  'church/createChurch',
  async (church: Church, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/api/churches',
        church
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create church'
      );
    }
  }
);

export const updateChurch = createAsyncThunk(
  'church/updateChurch',
  async (
    {
      id,
      church,
    }: {
      id: number;
      church: Church;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.put(
        `/api/churches/${id}`,
        church
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update church'
      );
    }
  }
);

export const deleteChurch = createAsyncThunk(
  'church/deleteChurch',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/churches/${id}`);

      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete church'
      );
    }
  }
);

export const assignPastor = createAsyncThunk(
  'church/assignPastor',
  async (
    {
      churchId,
      pastorId,
    }: {
      churchId: number;
      pastorId: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.put(
        `/api/churches/${churchId}/assign-pastor/${pastorId}`
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to assign pastor'
      );
    }
  }
);

const churchSlice = createSlice({
  name: 'church',
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchChurches.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(fetchChurches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.churches = action.payload;
      })

      .addCase(fetchChurches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(createChurch.fulfilled, (state, action) => {
        state.churches.push(action.payload);
      })

      // UPDATE
      .addCase(updateChurch.fulfilled, (state, action) => {
        state.churches = state.churches.map((church) =>
          church.id === action.payload.id
            ? action.payload
            : church
        );
      })

      // DELETE
      .addCase(deleteChurch.fulfilled, (state, action) => {
        state.churches = state.churches.filter(
          (church) => church.id !== action.payload
        );
      })

      // ASSIGN PASTOR
      .addCase(assignPastor.fulfilled, (state, action) => {
        state.churches = state.churches.map((church) =>
          church.id === action.payload.id
            ? action.payload
            : church
        );
      });
  },
});

export default churchSlice.reducer;

export const selectChurches = (state: any) =>
  state.church.churches;

export const selectChurchLoading = (state: any) =>
  state.church.isLoading;

export const selectChurchError = (state: any) =>
  state.church.error;