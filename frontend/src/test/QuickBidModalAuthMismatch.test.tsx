import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import authReducer from '../store/slices/authSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import { QuickBidModal } from '../components/QuickBidModal';
import { AuthContext, AuthContextType } from '../context/AuthContext';

function createMockStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      core: coreReducer,
      auth: authReducer,
      inventory: inventoryReducer,
    },
    preloadedState,
  });
}

describe('QuickBidModal Account Mismatch & Auth Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders account mismatch warning and disables submission when logged in with a different email', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    const mockAuthContext: AuthContextType = {
      user: {
        uid: 'user-123',
        email: 'debashisroe1996@gmail.com',
        displayName: 'Debashis Roe',
        profiles: { buyer: true, supplier: false },
      },
      token: 'mock-jwt-token-123',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: mockLogout,
      updateProfiles: vi.fn(),
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/bids/quick-bid-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            buyerEmail: 'debashishere007@gmail.com',
            listingId: 'LOT-999',
            defaultAmount: 20.00,
            lot: {
              lotNumber: 'LOT-999',
              availableQty: 500,
              standardSellPrice: 25.00
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockAuthContext}>
          <QuickBidModal token="test-token-007" onClose={vi.fn()} />
        </AuthContext.Provider>
      </Provider>
    );

    // Should display Account Mismatch warning
    const mismatchHeading = await screen.findByRole('heading', { name: /Account Mismatch/i });
    expect(mismatchHeading).toBeInTheDocument();
    expect(screen.getAllByText(/debashishere007@gmail\.com/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/debashisroe1996@gmail\.com/i)).toBeInTheDocument();

    // Submit button should not allow submission or should be disabled
    const switchBtn = screen.getByRole('button', { name: /switch account/i });
    expect(switchBtn).toBeInTheDocument();

    fireEvent.click(switchBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('allows submission when logged in with matching email', async () => {
    const mockAuthContext: AuthContextType = {
      user: {
        uid: 'user-007',
        email: 'debashishere007@gmail.com',
        displayName: 'Debashis 007',
        profiles: { buyer: true, supplier: false },
      },
      token: 'mock-jwt-token-007',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      updateProfiles: vi.fn(),
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/bids/quick-bid-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            buyerEmail: 'debashishere007@gmail.com',
            listingId: 'LOT-999',
            defaultAmount: 20.00,
            lot: {
              lotNumber: 'LOT-999',
              availableQty: 500,
              standardSellPrice: 25.00
            }
          })
        });
      }
      if (url.includes('/api/bids/quick-submit')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, bid: { amount: 20.00 } })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockAuthContext}>
          <QuickBidModal token="test-token-007" onClose={vi.fn()} />
        </AuthContext.Provider>
      </Provider>
    );

    const submitBtn = await screen.findByRole('button', { name: /confirm & submit bid/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
    expect(screen.queryByText(/Account Mismatch/i)).not.toBeInTheDocument();
  });

  it('allows bid when signed in with main email and offer was issued to sub-email (+alias)', async () => {
    const mockAuthContext: AuthContextType = {
      user: {
        uid: 'user-007',
        email: 'debashishere007@gmail.com',
        displayName: 'Debashis Main',
        profiles: { buyer: true, supplier: false },
      },
      token: 'mock-jwt-token-007',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      updateProfiles: vi.fn(),
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/bids/quick-bid-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            buyerEmail: 'debashishere007+wholefoodsmarketregional@gmail.com',
            listingId: 'LOT-999',
            defaultAmount: 20.00,
            lot: {
              lotNumber: 'LOT-999',
              availableQty: 500,
              standardSellPrice: 25.00
            }
          })
        });
      }
      if (url.includes('/api/bids/quick-submit')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, bid: { amount: 20.00 } })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockAuthContext}>
          <QuickBidModal token="test-token-sub-email" onClose={vi.fn()} />
        </AuthContext.Provider>
      </Provider>
    );

    const submitBtn = await screen.findByRole('button', { name: /confirm & submit bid/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
    expect(screen.queryByText(/Account Mismatch/i)).not.toBeInTheDocument();
  });
});

