import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { AuthContext } from '../context/AuthContext';
import App from '../App';

describe('01 — Route Boundary and Subdomain Handling for Standalone Marketplace', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(global, 'fetch').mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => ([]),
    } as any));
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders StandaloneMarketplacePortal on /marketplace even when auth is isLoading, completely bypassing supplier loading spinner and PublicLandingPage', async () => {
    window.history.pushState({}, '', '/marketplace');

    const mockAuthLoading = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // Auth is still resolving!
      login: async () => ({} as any),
      signup: async () => ({} as any),
      logout: async () => {},
      updateProfiles: async () => ({} as any),
    };

    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockAuthLoading}>
          <App />
        </AuthContext.Provider>
      </Provider>
    );

    // Should NOT show supplier loading indicator
    expect(screen.queryByText(/Loading IndSpoiler Alert/i)).not.toBeInTheDocument();

    // Should NOT show supplier PublicLandingPage
    expect(screen.queryByText(/Sign In to Liquidation Portal/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('public-landing-page')).not.toBeInTheDocument();

    // Should NOT render supplier GlobalNavigationBar
    expect(screen.queryByText('Enterprise Liquidation OS')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Ingestion/i })).not.toBeInTheDocument();

    // SHOULD render MarketplaceLayout shell
    expect(screen.getByTestId('marketplace-header')).toBeInTheDocument();
    expect(screen.getByText('InventoryFlowing')).toBeInTheDocument();
  });

  it('renders StandaloneMarketplacePortal when host starts with marketplace. (subdomain) even on path /', async () => {
    // Mock hostname
    const originalHostname = window.location.hostname;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        pathname: '/',
        hostname: 'marketplace.inventoryflowing.com',
        search: '',
      },
    });

    const mockUnauthenticated = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({} as any),
      signup: async () => ({} as any),
      logout: async () => {},
      updateProfiles: async () => ({} as any),
    };

    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockUnauthenticated}>
          <App />
        </AuthContext.Provider>
      </Provider>
    );

    expect(screen.getByTestId('marketplace-header')).toBeInTheDocument();
    expect(screen.queryByTestId('public-landing-page')).not.toBeInTheDocument();
    expect(screen.queryByText('Enterprise Liquidation OS')).not.toBeInTheDocument();

    // Restore location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('delegates to SupplierWorkspace on default / route, showing supplier auth gate when unauthenticated', async () => {
    window.history.pushState({}, '', '/');

    const mockUnauthenticated = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({} as any),
      signup: async () => ({} as any),
      logout: async () => {},
      updateProfiles: async () => ({} as any),
    };

    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockUnauthenticated}>
          <App />
        </AuthContext.Provider>
      </Provider>
    );

    // Unauthenticated supplier route should show PublicLandingPage
    expect(screen.getByTestId('public-landing-page')).toBeInTheDocument();
    expect(screen.queryByTestId('marketplace-header')).not.toBeInTheDocument();
  });

  it('responds to popstate events when navigating back and forth', async () => {
    window.history.pushState({}, '', '/marketplace');

    const mockUnauthenticated = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({} as any),
      signup: async () => ({} as any),
      logout: async () => {},
      updateProfiles: async () => ({} as any),
    };

    render(
      <Provider store={store}>
        <AuthContext.Provider value={mockUnauthenticated}>
          <App />
        </AuthContext.Provider>
      </Provider>
    );

    expect(screen.getByTestId('marketplace-header')).toBeInTheDocument();
    expect(screen.queryByTestId('public-landing-page')).not.toBeInTheDocument();

    // Simulate browser back button to /
    act(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByTestId('public-landing-page')).toBeInTheDocument();
    expect(screen.queryByTestId('marketplace-header')).not.toBeInTheDocument();
  });
});
