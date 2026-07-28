import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab } from '../store/slices/coreSlice';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { Sidebar } from '../components/shell/Sidebar';
import { useRoleGuard, RoleGuard } from '../components/auth/RoleGuard';

const createMockAuthValue = (buyer: boolean, supplier: boolean): AuthContextType => ({
  user: {
    uid: 'test-user-123',
    email: 'test@example.com',
    profiles: { buyer, supplier },
  },
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({} as any),
  signup: async () => ({} as any),
  logout: async () => {},
});

describe('Issue 03: Role-Gated Navigation & Module Access Matrix', () => {
  beforeEach(() => {
    store.dispatch(setActiveTab('marketplace'));
  });

  describe('Sidebar Module Matrix Visibility', () => {
    it('renders common modules (Marketplace, Inbox, Settings) and hides Supplier-only modules for Buyer-only accounts', () => {
      const authValue = createMockAuthValue(true, false); // Buyer: true, Supplier: false

      render(
        <Provider store={store}>
          <AuthContext.Provider value={authValue}>
            <Sidebar />
          </AuthContext.Provider>
        </Provider>
      );

      // Common modules MUST be visible for Buyer-only
      expect(screen.getByText('Buyer Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Inbox')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Supplier-only modules MUST NOT be visible for Buyer-only
      expect(screen.queryByText('Ingestion Engine')).not.toBeInTheDocument();
      expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
      expect(screen.queryByText('Workflow Setup')).not.toBeInTheDocument();
    });

    it('renders all modules (Supplier-only + Common) for accounts with Supplier access', () => {
      const authValue = createMockAuthValue(true, true); // Dual Profile / Supplier

      render(
        <Provider store={store}>
          <AuthContext.Provider value={authValue}>
            <Sidebar />
          </AuthContext.Provider>
        </Provider>
      );

      // Supplier-only modules MUST be visible
      expect(screen.getByText('Ingestion Engine')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Workflow Setup')).toBeInTheDocument();

      // Common modules MUST also be visible
      expect(screen.getByText('Buyer Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Inbox')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Role Guard and Redirect Handling', () => {
    it('redirects Buyer-only account from guarded supplier route (e.g. ingestion) to marketplace', () => {
      store.dispatch(setActiveTab('ingestion'));
      const authValue = createMockAuthValue(true, false);

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <Provider store={store}>
          <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
        </Provider>
      );

      const { result } = renderHook(() => useRoleGuard(), { wrapper });

      expect(result.current.hasSupplierProfile).toBe(false);
      expect(result.current.effectiveTab).toBe('marketplace');
      expect(store.getState().core.activeTab).toBe('marketplace');
    });

    it('allows Supplier account to stay on guarded supplier route', () => {
      store.dispatch(setActiveTab('inventory'));
      const authValue = createMockAuthValue(true, true);

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <Provider store={store}>
          <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
        </Provider>
      );

      const { result } = renderHook(() => useRoleGuard(), { wrapper });

      expect(result.current.isAllowed).toBe(true);
      expect(result.current.effectiveTab).toBe('inventory');
      expect(store.getState().core.activeTab).toBe('inventory');
    });
  });
});
