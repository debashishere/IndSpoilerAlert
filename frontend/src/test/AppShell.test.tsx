import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab, setSidebarExpanded, setHealthStatus } from '../store/slices/coreSlice';

describe('Cycle 4: AppShell, Sidebar & Header Integration', () => {
  beforeEach(() => {
    store.dispatch(setActiveTab('ingestion'));
    store.dispatch(setSidebarExpanded(false));
    store.dispatch(setHealthStatus({ backendHealthy: true, sidecarHealthy: false }));
  });

  it('should render AppShell with Sidebar containing exact classes, brand, nav links, and health indicators', async () => {
    const { AppShell } = await import('../components/shell/AppShell');

    const { container } = render(
      <Provider store={store}>
        <AppShell header={{ title: 'Test Title', subtitle: 'Test Subtitle' }}>
          <div data-testid="child-content">Content</div>
        </AppShell>
      </Provider>
    );

    // Verify app-container and main-content
    expect(container.querySelector('.app-container')).toBeInTheDocument();
    expect(container.querySelector('.main-content')).toBeInTheDocument();

    // Verify Sidebar classes and brand
    const sidebar = container.querySelector('aside.sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar?.classList.contains('collapsed')).toBe(true);

    const brand = container.querySelector('.brand');
    expect(brand).toBeInTheDocument();
    expect(container.querySelector('.brand-icon')?.textContent).toBe('⚡');
    expect(container.querySelector('.brand-name')?.textContent).toBe('InventoryFlowing');

    // Verify navigation links for base release (Distressed Analytics & Freight Logistics deferred via feature flags)
    const navLinks = container.querySelectorAll('.nav-link');
    expect(navLinks.length).toBe(6);
    expect(screen.getByText('Ingestion Engine')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Workflow Setup')).toBeInTheDocument();
    expect(screen.getByText('Buyer Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Distressed Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Freight Logistics')).not.toBeInTheDocument();

    // Verify health status indicators
    expect(container.querySelector('.sidebar-health-status')).toBeInTheDocument();
    expect(screen.getByText('MongoDB: Connected')).toBeInTheDocument();
    expect(screen.getByText('FastAPI: Offline')).toBeInTheDocument();

    // Verify Header
    expect(container.querySelector('header.header')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();

    // Verify child content
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should dispatch setActiveTab when clicking navigation links', async () => {
    const { AppShell } = await import('../components/shell/AppShell');

    render(
      <Provider store={store}>
        <AppShell />
      </Provider>
    );

    const inventoryLink = screen.getAllByText('Inventory')[0].closest('.nav-link');
    expect(inventoryLink).not.toBeNull();
    fireEvent.click(inventoryLink!);

    expect(store.getState().core.activeTab).toBe('inventory');
  });

  it('should expand and collapse sidebar on clicks', async () => {
    const { Sidebar } = await import('../components/shell/Sidebar');

    const { container } = render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    const sidebar = container.querySelector('aside.sidebar');
    expect(sidebar?.classList.contains('collapsed')).toBe(true);

    // Click collapsed sidebar to expand
    fireEvent.click(sidebar!);
    expect(store.getState().core.sidebarExpanded).toBe(true);
  });
});

describe('Cycle 5: ErrorBoundary Integration & Recovery', () => {
  const ThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
    if (shouldThrow) {
      throw new Error('Simulated domain view runtime exception!');
    }
    return <div data-testid="recovered-view">Normal Domain View</div>;
  };

  it('should catch child exceptions, display recovery prompt, and recover when try again is clicked', async () => {
    const { ErrorBoundary } = await import('../components/shell/ErrorBoundary');

    const originalConsoleError = console.error;
    console.error = () => {}; // suppress React error boundary console log during test

    try {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify fallback message appears
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Simulated domain view runtime exception!')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /try again/i });
      expect(retryBtn).toBeInTheDocument();

      // Now rerender with shouldThrow=false inside the same tree when clicking Try Again
      // When the button is clicked, ErrorBoundary resets its hasError state
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      fireEvent.click(retryBtn);
      expect(screen.getByTestId('recovered-view')).toBeInTheDocument();
    } finally {
      console.error = originalConsoleError;
    }
  });
});
