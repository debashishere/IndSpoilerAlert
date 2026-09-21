import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface BuyerProfile {
  id: string;
  email: string;
  companyName: string;
  isVerified: boolean;
  categories?: string[];
}

export interface AuthState {
  buyer: BuyerProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'verify';
  pendingEmail: string | null;
  loading: boolean;
  error: string | null;
}

export const BUYER_TOKEN_STORAGE_KEY = 'marketplace_buyer_token';

const getInitialToken = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(BUYER_TOKEN_STORAGE_KEY);
  }
  return null;
};

const initialToken = getInitialToken();

const initialState: AuthState = {
  buyer: null,
  token: initialToken,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authModalMode: 'login',
  pendingEmail: null,
  loading: Boolean(initialToken),
  error: null,
};

export const sendBuyerVerificationThunk = createAsyncThunk(
  'auth/sendBuyerVerification',
  async (payload: { email: string; companyName?: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/marketplace/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return rejectWithValue(data.message || 'Failed to send verification code');
      }
      return { email: payload.email, devOtp: data.devOtp };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const verifyBuyerTokenThunk = createAsyncThunk(
  'auth/verifyBuyerToken',
  async (payload: { email: string; token: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/marketplace/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return rejectWithValue(data.message || 'Invalid or expired token');
      }
      return { buyer: data.buyer, token: data.token };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const checkBuyerSessionThunk = createAsyncThunk(
  'auth/checkBuyerSession',
  async (argToken: string | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = argToken || state.auth?.token || (typeof window !== 'undefined' ? localStorage.getItem(BUYER_TOKEN_STORAGE_KEY) : null);
      if (!token) return { authenticated: false };

      const response = await fetch('/api/v1/marketplace/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.authenticated) {
        return { authenticated: true, buyer: data.buyer, token };
      }
      return { authenticated: false };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    openAuthModal: (state, action: PayloadAction<{ mode?: 'login' | 'register' | 'verify'; email?: string }>) => {
      state.isAuthModalOpen = true;
      state.authModalMode = action.payload.mode || 'login';
      if (action.payload.email) {
        state.pendingEmail = action.payload.email;
      }
      state.error = null;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
      state.error = null;
    },
    setBuyerAuth: (state, action: PayloadAction<{ buyer: BuyerProfile; token: string }>) => {
      state.buyer = action.payload.buyer;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isAuthModalOpen = false;
      state.error = null;
    },
    logoutBuyer: (state) => {
      state.buyer = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAuthModalOpen = false;
      state.pendingEmail = null;
      state.error = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(BUYER_TOKEN_STORAGE_KEY);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendBuyerVerificationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendBuyerVerificationThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingEmail = action.payload.email;
        state.authModalMode = 'verify';
      })
      .addCase(sendBuyerVerificationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyBuyerTokenThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyBuyerTokenThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.buyer = action.payload.buyer;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isAuthModalOpen = false;
        if (typeof window !== 'undefined' && window.localStorage && action.payload.token) {
          localStorage.setItem(BUYER_TOKEN_STORAGE_KEY, action.payload.token);
        }
      })
      .addCase(verifyBuyerTokenThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkBuyerSessionThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkBuyerSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.authenticated && action.payload.buyer) {
          state.buyer = action.payload.buyer;
          state.token = action.payload.token || state.token;
          state.isAuthenticated = true;
        } else {
          state.buyer = null;
          state.token = null;
          state.isAuthenticated = false;
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(BUYER_TOKEN_STORAGE_KEY);
          }
        }
      })
      .addCase(checkBuyerSessionThunk.rejected, (state) => {
        state.loading = false;
        state.buyer = null;
        state.token = null;
        state.isAuthenticated = false;
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(BUYER_TOKEN_STORAGE_KEY);
        }
      });
  },
});

export const { openAuthModal, closeAuthModal, setBuyerAuth, logoutBuyer } = authSlice.actions;

export const selectBuyer = (state: RootState) => state.auth?.buyer;
export const selectToken = (state: RootState) => state.auth?.token;
export const selectIsAuthenticated = (state: RootState) => state.auth?.isAuthenticated;
export const selectIsAuthModalOpen = (state: RootState) => state.auth?.isAuthModalOpen;
export const selectAuthModalMode = (state: RootState) => state.auth?.authModalMode;
export const selectAuthLoading = (state: RootState) => state.auth?.loading;
export const selectAuthError = (state: RootState) => state.auth?.error;

export default authSlice.reducer;
