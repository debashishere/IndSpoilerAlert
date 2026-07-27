import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab } from '../store/slices/coreSlice';
import { AuthContext, AuthProvider, useAuth } from '../context/AuthContext';
import { firebaseAuthService, AuthUser } from '../services/firebaseAuthService';
import { MarketplaceView } from '../views/MarketplaceView';
import { SettingsView } from '../views/SettingsView';
import { Sidebar } from '../components/shell/Sidebar';

describe('Issue 04: In-App Profile Activation & Upgrade Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    store.dispatch(setActiveTab('marketplace'));
  });

  describe('Auth Service Profile State Updates', () => {
    it('allows dynamic updating of user profiles without requiring page reload', async () => {
      // Initialize mock user with supplier only
      const initialUser: AuthUser = {
        uid: 'user-1',
        email: 'supplier@example.com',
        profiles: { buyer: false, supplier: true },
      };
      localStorage.setItem('spoiler_auth_mock_user', JSON.stringify(initialUser));
      localStorage.setItem('spoiler_auth_mock_token', 'mock-token');

      // Test component to verify useAuth updateProfiles
      const TestConsumer = () => {
        const { user, updateProfiles } = useAuth();
        return (
          <div>
            <div data-testid="buyer-status">{user?.profiles.buyer ? 'Buyer Active' : 'Buyer Inactive'}</div>
            <div data-testid="supplier-status">{user?.profiles.supplier ? 'Supplier Active' : 'Supplier Inactive'}</div>
            <button onClick={() => updateProfiles({ buyer: true })}>Become Buyer</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('buyer-status')).toHaveTextContent('Buyer Inactive');
      });

      fireEvent.click(screen.getByText('Become Buyer'));

      await waitFor(() => {
        expect(screen.getByTestId('buyer-status')).toHaveTextContent('Buyer Active');
        expect(screen.getByTestId('supplier-status')).toHaveTextContent('Supplier Active');
      });
    });
  });

  describe('Supplier Marketplace Buyer Activation Prompt', () => {
    it('renders "Become a Buyer to Bid" prompt in Marketplace if buyerProfile is inactive', async () => {
      const mockAuthValue = {
        user: {
          uid: 'user-supplier-only',
          email: 'supplier@example.com',
          profiles: { buyer: false, supplier: true },
        },
        token: 'token-123',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        updateProfiles: vi.fn(),
      };

      render(
        <Provider store={store}>
          <AuthContext.Provider value={mockAuthValue}>
            <MarketplaceView />
          </AuthContext.Provider>
        </Provider>
      );

      // Prompt should be visible asking to activate Buyer profile to bid
      expect(screen.getByText(/Become a Buyer to Bid/i)).toBeInTheDocument();

      const activateBtn = screen.getByRole('button', { name: /Activate Buyer Profile/i });
      fireEvent.click(activateBtn);

      expect(mockAuthValue.updateProfiles).toHaveBeenCalledWith({ buyer: true });
    });
  });

  describe('Settings View Supplier Activation Option', () => {
    it('renders "Become a Supplier" activation option for Buyer-only accounts', async () => {
      const mockAuthValue = {
        user: {
          uid: 'user-buyer-only',
          email: 'buyer@example.com',
          profiles: { buyer: true, supplier: false },
        },
        token: 'token-123',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        updateProfiles: vi.fn(),
      };

      render(
        <Provider store={store}>
          <AuthContext.Provider value={mockAuthValue}>
            <SettingsView />
          </AuthContext.Provider>
        </Provider>
      );

      expect(screen.getByText(/Become a Supplier/i)).toBeInTheDocument();

      const activateSupplierBtn = screen.getByRole('button', { name: /Activate Supplier Profile/i });
      fireEvent.click(activateSupplierBtn);

      expect(mockAuthValue.updateProfiles).toHaveBeenCalledWith({ supplier: true });
    });
  });

  describe('Dynamic Navigation Unlock', () => {
    it('immediately unlocks Ingestion, Inventory, and Workflows in Sidebar when supplierProfile is activated', async () => {
      // Simulate real AuthProvider state update
      const initialUser: AuthUser = {
        uid: 'user-buyer-only',
        email: 'buyer@example.com',
        profiles: { buyer: true, supplier: false },
      };
      localStorage.setItem('spoiler_auth_mock_user', JSON.stringify(initialUser));
      localStorage.setItem('spoiler_auth_mock_token', 'mock-token');

      render(
        <Provider store={store}>
          <AuthProvider>
            <Sidebar />
            <SettingsView />
          </AuthProvider>
        </Provider>
      );

      // Initially, Supplier navigation modules are absent
      await waitFor(() => {
        expect(screen.queryByText('Ingestion Engine')).not.toBeInTheDocument();
        expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
        expect(screen.queryByText('Workflow Setup')).not.toBeInTheDocument();
      });

      // Click "Activate Supplier Profile" in Settings
      const activateBtn = screen.getByRole('button', { name: /Activate Supplier Profile/i });
      fireEvent.click(activateBtn);

      // Verify immediate unlock without page reload
      await waitFor(() => {
        expect(screen.getByText('Ingestion Engine')).toBeInTheDocument();
        expect(screen.getByText('Inventory')).toBeInTheDocument();
        expect(screen.getByText('Workflow Setup')).toBeInTheDocument();
      });
    });
  });
});
