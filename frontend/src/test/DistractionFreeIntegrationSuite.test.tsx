import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { ingestionSlice, setActiveConnector } from '../store/slices/ingestionSlice';

describe('Distraction-Free Integration Suite: Slice 1 (Redux State Seam)', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ingestion: ingestionSlice.reducer,
      },
    });
  });

  it('initializes activeConnector to null by default when no search param is present', () => {
    const state = store.getState().ingestion;
    expect(state.activeConnector).toBeNull();
  });

  it('dispatches setActiveConnector to transition into and out of an active connector state', () => {
    expect(store.getState().ingestion.activeConnector).toBeNull();

    store.dispatch(setActiveConnector('google-sheets'));
    expect(store.getState().ingestion.activeConnector).toBe('google-sheets');

    store.dispatch(setActiveConnector('zapier'));
    expect(store.getState().ingestion.activeConnector).toBe('zapier');

    store.dispatch(setActiveConnector('csv-upload'));
    expect(store.getState().ingestion.activeConnector).toBe('csv-upload');

    store.dispatch(setActiveConnector('doc-scanner'));
    expect(store.getState().ingestion.activeConnector).toBe('doc-scanner');

    store.dispatch(setActiveConnector(null));
    expect(store.getState().ingestion.activeConnector).toBeNull();
  });
});

import { cleanup } from '@testing-library/react';

describe('Distraction-Free Integration Suite: Slice 2 (Deep-Link Mount Seam)', () => {
  const mockAuthValue: any = {
    user: {
      uid: 'supplier-user-1',
      email: 'supplier@indspoileralert.com',
      profiles: { supplier: true },
    },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    login: async () => ({} as any),
    signup: async () => ({} as any),
    logout: async () => {},
  };

  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('hides GlobalNavigationBar completely when deep-linking directly to a connector route', async () => {
    // Deep-link to google-sheets connector in ingestion tab
    window.history.replaceState({}, '', '/?tab=ingestion&connector=google-sheets');

    const coreReducer = (await import('../store/slices/coreSlice')).default;
    const ingestionReducer = (await import('../store/slices/ingestionSlice')).default;
    const inventoryReducer = (await import('../store/slices/inventorySlice')).default;
    const workflowReducer = (await import('../store/slices/workflowSlice')).default;
    const logisticsReducer = (await import('../store/slices/logisticsSlice')).default;
    const authReducer = (await import('../store/slices/authSlice')).default;
    const zapierSyncReducer = (await import('../store/slices/zapierSyncSlice')).default;

    const testStore = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
        workflow: workflowReducer,
        logistics: logisticsReducer,
        auth: authReducer,
        zapierSync: zapierSyncReducer,
      },
    });

    const { SupplierWorkspace } = await import('../views/supplier/SupplierWorkspace');
    const { AuthContext } = await import('../context/AuthContext');
    const { render, screen } = await import('@testing-library/react');
    const { Provider } = await import('react-redux');

    render(
      <Provider store={testStore}>
        <AuthContext.Provider value={mockAuthValue}>
          <SupplierWorkspace />
        </AuthContext.Provider>
      </Provider>
    );

    // Global navigation banner must NOT be rendered in distraction-free workspace
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Ingestion/i })).not.toBeInTheDocument();

    // The connector workbench header should be present
    expect(await screen.findByText(/Back to Ingestion Pipeline/i)).toBeInTheDocument();
  });
});

describe('Distraction-Free Integration Suite: Slice 3 (Dynamic Ingress & Return Commitment Seam)', () => {
  const mockAuthValue: any = {
    user: {
      uid: 'supplier-user-1',
      email: 'supplier@indspoileralert.com',
      profiles: { supplier: true },
    },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    login: async () => ({} as any),
    signup: async () => ({} as any),
    logout: async () => {},
  };

  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('hides navbar on connector ingress and restores navbar upon committing return via Single-Arrow Return Anchor', async () => {
    window.history.replaceState({}, '', '/?tab=ingestion');

    const coreReducer = (await import('../store/slices/coreSlice')).default;
    const ingestionReducer = (await import('../store/slices/ingestionSlice')).default;
    const inventoryReducer = (await import('../store/slices/inventorySlice')).default;
    const workflowReducer = (await import('../store/slices/workflowSlice')).default;
    const logisticsReducer = (await import('../store/slices/logisticsSlice')).default;
    const authReducer = (await import('../store/slices/authSlice')).default;
    const zapierSyncReducer = (await import('../store/slices/zapierSyncSlice')).default;

    const testStore = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
        workflow: workflowReducer,
        logistics: logisticsReducer,
        auth: authReducer,
        zapierSync: zapierSyncReducer,
      },
    });

    const { SupplierWorkspace } = await import('../views/supplier/SupplierWorkspace');
    const { AuthContext } = await import('../context/AuthContext');
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { Provider } = await import('react-redux');

    render(
      <Provider store={testStore}>
        <AuthContext.Provider value={mockAuthValue}>
          <SupplierWorkspace />
        </AuthContext.Provider>
      </Provider>
    );

    // Step 1: Ingestion pipeline view mounts with GlobalNavigationBar visible
    expect(await screen.findByRole('button', { name: /^Ingestion/i })).toBeInTheDocument();

    // Step 2: Operator triggers connector ingress via DataSourcesDock "+ Add Data Source" button
    const addDataSourceButton = await screen.findByTestId('data-sources-add-button');
    fireEvent.click(addDataSourceButton);

    // Verification: Global navigation bar is completely suppressed from DOM
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Ingestion/i })).not.toBeInTheDocument();
    });

    // Verification: Single-Arrow Return Anchor is present in connector shell
    const returnButton = await screen.findByRole('button', { name: /Back to Ingestion Pipeline/i });
    expect(returnButton).toBeInTheDocument();

    // Step 3: Operator clicks Single-Arrow Return Anchor to commit return to pipeline
    fireEvent.click(returnButton);

    // Verification: Global navigation bar is immediately restored
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Ingestion/i })).toBeInTheDocument();
    });
  });
});

describe('Distraction-Free Integration Suite: Slice 4 (Browser Popstate History Seam)', () => {
  const mockAuthValue: any = {
    user: {
      uid: 'supplier-user-1',
      email: 'supplier@indspoileralert.com',
      profiles: { supplier: true },
    },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    login: async () => ({} as any),
    signup: async () => ({} as any),
    logout: async () => {},
  };

  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('dynamically suppresses and restores GlobalNavigationBar upon native browser history back and forward navigation', async () => {
    // Mount initially inside zapier connector
    window.history.replaceState({}, '', '/?tab=ingestion&connector=zapier');

    const coreReducer = (await import('../store/slices/coreSlice')).default;
    const ingestionReducer = (await import('../store/slices/ingestionSlice')).default;
    const inventoryReducer = (await import('../store/slices/inventorySlice')).default;
    const workflowReducer = (await import('../store/slices/workflowSlice')).default;
    const logisticsReducer = (await import('../store/slices/logisticsSlice')).default;
    const authReducer = (await import('../store/slices/authSlice')).default;
    const zapierSyncReducer = (await import('../store/slices/zapierSyncSlice')).default;

    const testStore = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
        workflow: workflowReducer,
        logistics: logisticsReducer,
        auth: authReducer,
        zapierSync: zapierSyncReducer,
      },
    });

    const { SupplierWorkspace } = await import('../views/supplier/SupplierWorkspace');
    const { AuthContext } = await import('../context/AuthContext');
    const { render, screen, waitFor, act } = await import('@testing-library/react');
    const { Provider } = await import('react-redux');

    render(
      <Provider store={testStore}>
        <AuthContext.Provider value={mockAuthValue}>
          <SupplierWorkspace />
        </AuthContext.Provider>
      </Provider>
    );

    // Initial state: Zapier connector active -> Navbar suppressed
    expect(screen.queryByRole('button', { name: /^Ingestion/i })).not.toBeInTheDocument();
    expect(await screen.findByText(/Back to Ingestion Pipeline/i)).toBeInTheDocument();

    // Action 1: User navigates back via native browser back button (popstate to pipeline)
    await act(async () => {
      window.history.pushState({}, '', '/?tab=ingestion');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Verification 1: Navbar is immediately restored
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Ingestion/i })).toBeInTheDocument();
    });

    // Action 2: User navigates forward via native browser forward button (popstate to csv-upload)
    await act(async () => {
      window.history.pushState({}, '', '/?tab=ingestion&connector=csv-upload');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Verification 2: Navbar is immediately suppressed again
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Ingestion/i })).not.toBeInTheDocument();
    });
  });
});



