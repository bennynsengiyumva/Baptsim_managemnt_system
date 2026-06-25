import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/services/api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  twoFactorEmail: string | null;
  users: User[];
  usersLoading: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('authToken') || null,
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('authToken'),
  requiresTwoFactor: false,
  twoFactorEmail: null,
  users: [],
  usersLoading: false,
};

function normalizeAuthResponse(raw: any): { token: string; user: User } {
  const token = raw.token;
  const source = raw.user ?? raw;
  const user = {
    id:       source.id       ?? source.userId   ?? `temp-${Date.now()}`,
    fullName: source.fullName ?? source.name      ?? (source.email ? source.email.split('@')[0] : 'User'),
    email:    source.email,
    phone:    source.phone    ?? '',
    role:     source.role,
    enabled:  source.enabled  ?? true,
    ...source,
  } as User;
  return { token, user };
}

function extractUserList(responseData: any): User[] {
  if (Array.isArray(responseData))          return responseData;
  if (Array.isArray(responseData?.data))    return responseData.data;
  if (Array.isArray(responseData?.content)) return responseData.content;
  console.warn('[fetchUsers] Unexpected response shape:', responseData);
  return [];
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const data = response.data;

      if (data.requiresTwoFactor) {
        localStorage.setItem('2fa_email', data.email);
        return { requiresTwoFactor: true, email: data.email };
      }

      const { token, user } = normalizeAuthResponse(data);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/auth/verify-2fa', { email, code });
      const { token, user } = normalizeAuthResponse(response.data);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
  }
);

export const resendTwoFactorCode = createAsyncThunk(
  'auth/resendTwoFactorCode',
  async (email: string, { rejectWithValue }) => {
    try {
      await apiClient.post('/api/auth/two-factor/resend', { email });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend code');
    }
  }
);

export const sendTwoFactorSetupCode = createAsyncThunk(
  'auth/sendTwoFactorSetupCode',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post('/api/auth/two-factor/send-setup-code');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send code');
    }
  }
);

export const enableTwoFactor = createAsyncThunk(
  'auth/enableTwoFactor',
  async (code: string, { rejectWithValue }) => {
    try {
      await apiClient.post('/api/auth/two-factor/enable', { code });
      return { twoFactorEnabled: true };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enable 2FA');
    }
  }
);

export const disableTwoFactor = createAsyncThunk(
  'auth/disableTwoFactor',
  async (password: string, { rejectWithValue }) => {
    try {
      await apiClient.post('/api/auth/two-factor/disable', { password });
      return { twoFactorEnabled: false };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to disable 2FA');
    }
  }
);

export const checkTwoFactorStatus = createAsyncThunk(
  'auth/checkTwoFactorStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/auth/two-factor/status');
      return { twoFactorEnabled: response.data.twoFactorEnabled };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check 2FA status');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    payload: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      role?: string;
      churchId?: number;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
      qualification?: string;
      yearsOfService?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/api/auth/register', payload);
      const { token, user } = normalizeAuthResponse(response.data);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/auth/refresh');
      const { token, user } = normalizeAuthResponse(response.data);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error: any) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'auth/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/users');
      return extractUserList(response.data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'auth/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/users/${userId}`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const createUser = createAsyncThunk(
  'auth/createUser',
  async (
    payload: { fullName: string; email: string; phone: string; password: string; role: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/api/auth/create-user', payload);
      const raw = response.data;
      const newUser: User = {
        id:       raw.id       ?? raw.userId   ?? `temp-${Date.now()}`,
        fullName: raw.fullName ?? payload.fullName,
        email:    raw.email    ?? payload.email,
        phone:    raw.phone    ?? payload.phone,
        role:     raw.role     ?? payload.role,
        enabled:  raw.enabled  ?? true,
        ...raw,
      } as User;
      return newUser;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      }
    },
    clearTwoFactorState: (state) => {
      state.requiresTwoFactor = false;
      state.twoFactorEmail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,   (state) => { state.isLoading = true; state.error = null; state.requiresTwoFactor = false; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresTwoFactor) {
          state.requiresTwoFactor = true;
          state.twoFactorEmail    = action.payload.email;
        } else {
          state.isAuthenticated   = true;
          state.user              = action.payload.user ?? null;
          state.token             = action.payload.token ?? null;
          state.requiresTwoFactor = false;
        }
        state.error = null;
      })
      .addCase(loginUser.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      })
      .addCase(verifyTwoFactor.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.isLoading         = false;
        state.isAuthenticated   = true;
        state.requiresTwoFactor = false;
        state.twoFactorEmail    = null;
        state.user              = action.payload.user ?? null;
        state.token             = action.payload.token ?? null;
        state.error             = null;
      })
      .addCase(verifyTwoFactor.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      })
      .addCase(enableTwoFactor.fulfilled, (state, action) => {
        if (state.user) {
          state.user.twoFactorEnabled = action.payload.twoFactorEnabled;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(disableTwoFactor.fulfilled, (state, action) => {
        if (state.user) {
          state.user.twoFactorEnabled = action.payload.twoFactorEnabled;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(checkTwoFactorStatus.fulfilled, (state, action) => {
        if (state.user) {
          state.user.twoFactorEnabled = action.payload.twoFactorEnabled;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(registerUser.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.isAuthenticated = true;
        state.user            = action.payload.user;
        state.token           = action.payload.token;
        state.error           = null;
      })
      .addCase(registerUser.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated    = false;
        state.user               = null;
        state.token              = null;
        state.error              = null;
        state.requiresTwoFactor  = false;
        state.twoFactorEmail     = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isAuthenticated    = false;
        state.user               = null;
        state.token              = null;
        state.requiresTwoFactor  = false;
        state.twoFactorEmail     = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user            = action.payload.user;
        state.token           = action.payload.token;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user            = null;
        state.token           = null;
      })
      .addCase(fetchUsers.pending,   (state) => { state.usersLoading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users        = action.payload;
      })
      .addCase(fetchUsers.rejected,  (state) => { state.usersLoading = false; })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => String(u.id) !== String(action.payload));
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users = [action.payload, ...state.users];
      });
  },
});

export const { clearError, setUser, clearTwoFactorState } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectUser              = (state: any) => state.auth.user;
export const selectIsAuthenticated   = (state: any) => state.auth.isAuthenticated;
export const selectIsLoading         = (state: any) => state.auth.isLoading;
export const selectError             = (state: any) => state.auth.error;
export const selectUserRole          = (state: any) => state.auth.user?.role;
export const selectUsers             = (state: any) => state.auth.users;
export const selectUsersLoading      = (state: any) => state.auth.usersLoading;
export const selectRequiresTwoFactor = (state: any) => state.auth.requiresTwoFactor;
export const selectTwoFactorEmail    = (state: any) => state.auth.twoFactorEmail;

// Role helpers
export const selectIsAdmin           = (state: any) => state.auth.user?.role === 'ADMIN';
export const selectIsPastor          = (state: any) => state.auth.user?.role === 'PASTOR';
export const selectIsInstructor      = (state: any) => state.auth.user?.role === 'INSTRUCTOR';
export const selectIsCandidate       = (state: any) => state.auth.user?.role === 'CANDIDATE';
export const selectIsHeadOfRum       = (state: any) => state.auth.user?.role === 'HEAD_OF_RUM';
export const selectIsHeadOfField     = (state: any) => state.auth.user?.role === 'HEAD_OF_FIELD';
export const selectIsFirstChurchElder = (state: any) => state.auth.user?.role === 'FIRST_CHURCH_ELDER';

export const selectCanManage         = (state: any) =>
  ['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'PASTOR', 'FIRST_CHURCH_ELDER'].includes(state.auth.user?.role ?? '');
