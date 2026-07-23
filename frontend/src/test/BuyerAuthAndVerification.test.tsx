import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import coreReducer from '../store/slices/coreSlice';
import authReducer, { openAuthModal } from '../store/slices/authSlice';
import MarketplaceLayout from '../components/shell/MarketplaceLayout';
import BuyerAuthModal from '../components/domain/marketplace/BuyerAuthModal';

function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      core: coreReducer,
      auth: authReducer,
    },
    preloadedState,
  });
}

describe('0086 — Buyer Authentication & Email Verification UI & Redux Integration', () => {
  it('renders Log In / Register button in MarketplaceLayout header when unauthenticated', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div>Marketplace Catalog Content</div>
        </MarketplaceLayout>
      </Provider>
    );

    expect(screen.getByText(/Buyer Login/i)).toBeInTheDocument();
    expect(screen.queryByText(/Verified Buyer/i)).not.toBeInTheDocument();
  });

  it('opens BuyerAuthModal when clicking Log In button in header', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div>Marketplace Catalog Content</div>
        </MarketplaceLayout>
      </Provider>
    );

    const loginButton = screen.getByText(/Buyer Login/i);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Buyer Authentication & Verification/i)).toBeInTheDocument();
    });
  });

  it('completes buyer email verification flow in BuyerAuthModal and updates header state', async () => {
    const store = createTestStore();

    // Mock global fetch for API calls
    const originalFetch = global.fetch;
    global.fetch = vi.fn((url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/send-verification')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, devOtp: '123456', email: 'test@bistro.com' }),
        } as Response);
      }
      if (urlStr.includes('/auth/verify-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            token: 'test_token_123',
            buyer: {
              id: 'b1',
              email: 'test@bistro.com',
              companyName: 'Bistro Test Corp',
              isVerified: true,
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    });

    render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div>Marketplace Catalog Content</div>
        </MarketplaceLayout>
      </Provider>
    );

    // Open modal
    store.dispatch(openAuthModal({ mode: 'login' }));

    // Verify modal is visible
    await waitFor(() => {
      expect(screen.getByText(/Buyer Authentication & Verification/i)).toBeInTheDocument();
    });

    // Enter email and company name
    const emailInput = screen.getByPlaceholderText(/buyer@company.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@bistro.com' } });

    const companyInput = screen.getByPlaceholderText(/Company \/ Business Name/i);
    fireEvent.change(companyInput, { target: { value: 'Bistro Test Corp' } });

    // Click Send Verification Code
    const sendButton = screen.getByText(/Send Verification Code/i);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Enter 6-Digit OTP \/ Verification Token/i)).toBeInTheDocument();
    });

    // Enter OTP token
    const otpInput = screen.getByPlaceholderText(/123456/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });

    // Submit Verification
    const verifyButton = screen.getByText(/Verify & Log In/i);
    fireEvent.click(verifyButton);

    await waitFor(() => {
      // Modal should close and header should reflect authenticated state
      expect(screen.queryByText(/Buyer Authentication & Verification/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Bistro Test Corp/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified Buyer/i)).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });

  it('allows buyer to log out from header dropdown', async () => {
    const store = createTestStore({
      auth: {
        buyer: {
          id: 'b1',
          email: 'test@bistro.com',
          companyName: 'Bistro Test Corp',
          isVerified: true,
        },
        token: 'test_token_123',
        isAuthenticated: true,
        isAuthModalOpen: false,
        authModalMode: 'login',
        pendingEmail: null,
        loading: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <MarketplaceLayout>
          <div>Marketplace Catalog Content</div>
        </MarketplaceLayout>
      </Provider>
    );

    expect(screen.getByText(/Bistro Test Corp/i)).toBeInTheDocument();

    // Click buyer avatar / dropdown toggle
    const profileButton = screen.getByText(/Bistro Test Corp/i);
    fireEvent.click(profileButton);

    // Verify dropdown items
    expect(screen.getByText(/My Bids/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Buyer Status/i)).toBeInTheDocument();

    // Click Log Out
    const logoutBtn = screen.getByText(/Log Out/i);
    fireEvent.click(logoutBtn);

    // State should revert to unauthenticated
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(screen.getByText(/Buyer Login/i)).toBeInTheDocument();
  });
});
