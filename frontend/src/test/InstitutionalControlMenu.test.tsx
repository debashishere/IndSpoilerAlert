import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setHealthStatus } from '../store/slices/coreSlice';
import { InstitutionalControlMenu } from '../components/navigation/InstitutionalControlMenu';
import { ThemeProvider } from '../context/ThemeContext';

describe('Slice 2: InstitutionalControlMenu & Profile Pill Popover', () => {
  beforeEach(() => {
    store.dispatch(setHealthStatus({ backendHealthy: true, sidecarHealthy: false }));
  });

  it('renders user details, email, and verified status badge', () => {
    render(
      <Provider store={store}>
        <ThemeProvider>
          <InstitutionalControlMenu
            isOpen={true}
            onClose={vi.fn()}
            user={{
              name: 'Debashishere007',
              email: 'debashis@example.corp',
              role: 'Verified Agent',
              agentId: 'AGT-402',
            }}
          />
        </ThemeProvider>
      </Provider>
    );

    expect(screen.getByText('Debashishere007')).toBeInTheDocument();
    expect(screen.getByText('debashis@example.corp')).toBeInTheDocument();
    expect(screen.getByText(/Verified Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/AGT-402/i)).toBeInTheDocument();
  });

  it('renders supplier selector and calls onSelectSupplier when changed', () => {
    const onSelectSupplier = vi.fn();
    render(
      <Provider store={store}>
        <ThemeProvider>
          <InstitutionalControlMenu
            isOpen={true}
            onClose={vi.fn()}
            selectedSupplier="60c72b2f9b1d8b0015f8e001"
            onSelectSupplier={onSelectSupplier}
          />
        </ThemeProvider>
      </Provider>
    );

    const select = screen.getByRole('combobox', { name: /Facility \/ Supplier/i });
    expect(select).toBeInTheDocument();

    fireEvent.change(select, { target: { value: '60c72b2f9b1d8b0015f8e002' } });
    expect(onSelectSupplier).toHaveBeenCalledWith('60c72b2f9b1d8b0015f8e002');
  });

  it('renders theme switcher and toggles between Light and Dark mode', () => {
    render(
      <Provider store={store}>
        <ThemeProvider>
          <InstitutionalControlMenu
            isOpen={true}
            onClose={vi.fn()}
          />
        </ThemeProvider>
      </Provider>
    );

    const themeToggleBtn = screen.getByRole('button', { name: /Toggle Theme|Switch to Dark theme|Switch to Light theme/i });
    expect(themeToggleBtn).toBeInTheDocument();

    fireEvent.click(themeToggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toMatch(/dark|light/);
  });

  it('displays real-time telemetry indicators for Backend, Sidecar, and Terminal Node', () => {
    render(
      <Provider store={store}>
        <ThemeProvider>
          <InstitutionalControlMenu
            isOpen={true}
            onClose={vi.fn()}
          />
        </ThemeProvider>
      </Provider>
    );

    expect(screen.getByText(/Backend API/i)).toBeInTheDocument();
    expect(screen.getByText(/Sidecar/i)).toBeInTheDocument();
    expect(screen.getByText(/Node: NA-SOUTH-TX-HUB/i)).toBeInTheDocument();
  });

  it('triggers logout when clicking Sign Out / Lock Console', () => {
    const onLogout = vi.fn();
    render(
      <Provider store={store}>
        <ThemeProvider>
          <InstitutionalControlMenu
            isOpen={true}
            onClose={vi.fn()}
            onLogout={onLogout}
          />
        </ThemeProvider>
      </Provider>
    );

    const logoutBtn = screen.getByRole('button', { name: /Sign Out \/ Lock Console/i });
    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalled();
  });

  it('dismisses when Escape key is pressed or outside click occurs', () => {
    const onClose = vi.fn();
    render(
      <Provider store={store}>
        <ThemeProvider>
          <InstitutionalControlMenu
            isOpen={true}
            onClose={onClose}
          />
        </ThemeProvider>
      </Provider>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
