import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/api';
import { Certificate, FilterParams } from '@/types';

interface CertificateState {
  certificates: Certificate[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CertificateState = {
  certificates: [],
  isLoading: false,
  error: null,
};

// GET ALL CERTIFICATES
export const fetchCertificates = createAsyncThunk(
  'certificate/fetchAll',
  async (params: FilterParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/certificates', {
        params,
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch certificates'
      );
    }
  }
);

// CREATE CERTIFICATE
export const createCertificate = createAsyncThunk(
  'certificate/create',
  async (cert: Partial<Certificate>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/api/certificates',
        cert
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create certificate'
      );
    }
  }
);

// DELETE CERTIFICATE
export const deleteCertificate = createAsyncThunk(
  'certificate/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/certificates/${id}`);

      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete certificate'
      );
    }
  }
);

const certificateSlice = createSlice({
  name: 'certificate',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchCertificates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchCertificates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.certificates = action.payload || [];
      })

      .addCase(fetchCertificates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(createCertificate.fulfilled, (state, action) => {
        state.certificates.push(action.payload);
      })

      // DELETE
      .addCase(deleteCertificate.fulfilled, (state, action) => {
        state.certificates = state.certificates.filter(
          (cert) => cert.id !== action.payload
        );
      });
  },
});

// SELECTORS
export const selectCertificates = (state: any) =>
  state.certificate.certificates;

export const selectCertificateLoading = (state: any) =>
  state.certificate.isLoading;

export default certificateSlice.reducer;