import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  BUYER_TOKEN_STORAGE_KEY,
  verifyBuyerTokenThunk,
  logoutBuyer,
  checkBuyerSessionThunk,
} from './authSlice';

function createStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });
}

describe('Seam 1: Storage Key & Session Persistence in Redux authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('exports BUYER_TOKEN_STORAGE_KEY with standard key name', () => {
    expect(BUYER_TOKEN_STORAGE_KEY).toBe('marketplace_buyer_token');
  });

  it('persists token to localStorage on verifyBuyerTokenThunk.fulfilled', async () => {
    const store = createStore();
    const mockBuyer = {
      id: 'buyer_123',
      email: 'verified@buyer.com',
      companyName: 'Verified Buyer Co',
      isVerified: true,
    };

    vi.spyOn(global, 'fetch').mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        token: 'buyer_sess_mock_token_123',
        buyer: mockBuyer,
      }),
    } as any));

    await store.dispatch(verifyBuyerTokenThunk({ email: 'verified@buyer.com', token: '123456' }));

    expect(store.getState().auth.token).toBe('buyer_sess_mock_token_123');
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(localStorage.getItem(BUYER_TOKEN_STORAGE_KEY)).toBe('buyer_sess_mock_token_123');
  });

  it('removes token from localStorage on logoutBuyer', () => {
    localStorage.setItem(BUYER_TOKEN_STORAGE_KEY, 'existing_token_xyz');
    const store = createStore({
      auth: {
        buyer: { id: 'b1', email: 'test@b.com', companyName: 'B Corp', isVerified: true },
        token: 'existing_token_xyz',
        isAuthenticated: true,
        isAuthModalOpen: false,
        authModalMode: 'login',
        pendingEmail: null,
        loading: false,
        error: null,
      },
    });

    store.dispatch(logoutBuyer());

    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem(BUYER_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('removes token from localStorage when checkBuyerSessionThunk fails / returns unauthenticated', async () => {
    localStorage.setItem(BUYER_TOKEN_STORAGE_KEY, 'stale_token_abc');
    const store = createStore({
      auth: {
        buyer: null,
        token: 'stale_token_abc',
        isAuthenticated: false,
        isAuthModalOpen: false,
        authModalMode: 'login',
        pendingEmail: null,
        loading: true,
        error: null,
      },
    });

    vi.spyOn(global, 'fetch').mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({ authenticated: false }),
    } as any));

    await store.dispatch(checkBuyerSessionThunk());

    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem(BUYER_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
