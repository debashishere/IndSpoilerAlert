import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { BUYER_TOKEN_STORAGE_KEY } from '../../store/slices/authSlice';
import coreReducer from '../../store/slices/coreSlice';
import { StandaloneMarketplacePortal } from './StandaloneMarketplacePortal';

function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      auth: authReducer,
      core: coreReducer,
    },
    preloadedState,
  });
}

describe('Seam 2: Standalone Marketplace Portal Session Bootstrapping', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dispatches checkBuyerSessionThunk on mount when stored token exists, hydrating authenticated buyer', async () => {
    localStorage.setItem(BUYER_TOKEN_STORAGE_KEY, 'stored_buyer_session_token_123');

    const mockBuyer = {
      id: 'buyer_abc',
      email: 'alex@kroger.com',
      companyName: 'Kroger Supermarkets',
      isVerified: true,
    };

    const mockFetch = vi.fn(async (url: any, options: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/marketplace/auth/session')) {
        return {
          ok: true,
          json: async () => ({
            authenticated: true,
            buyer: mockBuyer,
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ listings: [] }),
      } as Response;
    });
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

    const store = createTestStore();

    render(
      <Provider store={store}>
        <StandaloneMarketplacePortal />
      </Provider>
    );

    // Should call /api/v1/marketplace/auth/session with Bearer token
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/marketplace/auth/session'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer stored_buyer_session_token_123',
          },
        })
      );
    });

    // Store should update to authenticated
    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.buyer?.companyName).toBe('Kroger Supermarkets');
    });
  });

  it('does not dispatch checkBuyerSessionThunk on mount when no stored token exists', async () => {
    const mockFetch = vi.fn(async (url: any) => {
      return {
        ok: true,
        json: async () => ({ listings: [] }),
      } as Response;
    });
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

    const store = createTestStore();

    render(
      <Provider store={store}>
        <StandaloneMarketplacePortal />
      </Provider>
    );

    // Allow effects to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/marketplace/auth/session'),
      expect.anything()
    );
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});
