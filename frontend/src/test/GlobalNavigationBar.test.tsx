import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab } from '../store/slices/coreSlice';
import { GlobalNavigationBar } from '../components/navigation/GlobalNavigationBar';

describe('Slice 1: GlobalNavigationBar Web Foundation & Primary Tab Routing', () => {
  beforeEach(() => {
    store.dispatch(setActiveTab('ingestion'));
  });

  it('renders brand emblem, title, and enterprise subtitle', () => {
    render(
      <Provider store={store}>
        <GlobalNavigationBar />
      </Provider>
    );

    expect(screen.getByText('IndSpoiler Alert')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Liquidation OS')).toBeInTheDocument();
  });

  it('renders all primary desktop module tabs with correct labels and Public Marketplace launcher', () => {
    render(
      <Provider store={store}>
        <GlobalNavigationBar />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /^Ingestion/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Insight/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Workflow/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marketplace/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inbox/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();

    const marketplaceLauncher = screen.getByRole('link', { name: /Public Marketplace Portal/i });
    expect(marketplaceLauncher).toBeInTheDocument();
    expect(marketplaceLauncher).toHaveAttribute('href', '/marketplace');
    expect(marketplaceLauncher).toHaveAttribute('target', '_blank');
    expect(marketplaceLauncher).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies active styling to the currently active Redux tab', () => {
    render(
      <Provider store={store}>
        <GlobalNavigationBar />
      </Provider>
    );

    const activeTabButton = screen.getByRole('button', { name: /^Ingestion/i });
    expect(activeTabButton).toHaveClass('bg-[#0d47a1]');
    expect(activeTabButton).toHaveClass('text-white');

    const inactiveTabButton = screen.getByRole('button', { name: /Insight/i });
    expect(inactiveTabButton).not.toHaveClass('bg-[#0d47a1]');
  });

  it('dispatches setActiveTab to Redux and triggers onTabChange callback when clicking a tab', () => {
    const onTabChange = vi.fn();
    render(
      <Provider store={store}>
        <GlobalNavigationBar onTabChange={onTabChange} />
      </Provider>
    );

    const insightButton = screen.getByRole('button', { name: /Insight/i });
    fireEvent.click(insightButton);

    expect(store.getState().core.activeTab).toBe('inventory');
    expect(onTabChange).toHaveBeenCalledWith('inventory');

    const workflowButton = screen.getByRole('button', { name: /Workflow/i });
    fireEvent.click(workflowButton);

    expect(store.getState().core.activeTab).toBe('workflows');
    expect(onTabChange).toHaveBeenCalledWith('workflows');
  });

  it('renders notification bell with unread indicator badge', () => {
    render(
      <Provider store={store}>
        <GlobalNavigationBar />
      </Provider>
    );

    const bell = screen.getByTitle('Notifications');
    expect(bell).toBeInTheDocument();
    expect(bell.querySelector('.bg-blue-600')).toBeInTheDocument();
  });

  it('renders user profile pill with initials, username, and verified status', () => {
    render(
      <Provider store={store}>
        <GlobalNavigationBar />
      </Provider>
    );

    expect(screen.getByText('DH')).toBeInTheDocument();
    expect(screen.getByText('Debashishere007')).toBeInTheDocument();
    expect(screen.getByText(/Verified Agent/i)).toBeInTheDocument();
  });
});
