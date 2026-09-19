import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab } from '../store/slices/coreSlice';
import { NotificationsPopover } from '../components/navigation/NotificationsPopover';

describe('Slice 3: Quick Notifications Popover Flyout', () => {
  beforeEach(() => {
    store.dispatch(setActiveTab('ingestion'));
  });

  it('renders title, unread count badge, and mark-as-read control when open', () => {
    render(
      <Provider store={store}>
        <NotificationsPopover
          isOpen={true}
          onClose={vi.fn()}
        />
      </Provider>
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText(/4 Unread/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark all as read/i })).toBeInTheDocument();
  });

  it('renders chronological list of notification alert items with icons, timestamps, and messages', () => {
    render(
      <Provider store={store}>
        <NotificationsPopover
          isOpen={true}
          onClose={vi.fn()}
        />
      </Provider>
    );

    expect(screen.getByText(/New Bid on Lot #LOT-2026-99/i)).toBeInTheDocument();
    expect(screen.getByText(/Campaign Auto-Escalation Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/FDA Compliance Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/5m ago/i)).toBeInTheDocument();
  });

  it('clears unread badge count when clicking Mark all as read', () => {
    render(
      <Provider store={store}>
        <NotificationsPopover
          isOpen={true}
          onClose={vi.fn()}
        />
      </Provider>
    );

    const markReadBtn = screen.getByRole('button', { name: /Mark all as read/i });
    fireEvent.click(markReadBtn);

    expect(screen.getByText(/0 Unread/i)).toBeInTheDocument();
  });

  it('navigates to inbox and closes popover when clicking View All in Inbox', () => {
    const onClose = vi.fn();
    const onViewAll = vi.fn();
    render(
      <Provider store={store}>
        <NotificationsPopover
          isOpen={true}
          onClose={onClose}
          onViewAll={onViewAll}
        />
      </Provider>
    );

    const viewAllBtn = screen.getByRole('button', { name: /View All in Inbox/i });
    fireEvent.click(viewAllBtn);

    expect(store.getState().core.activeTab).toBe('inbox');
    expect(onClose).toHaveBeenCalled();
    expect(onViewAll).toHaveBeenCalled();
  });

  it('closes popover on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <Provider store={store}>
        <NotificationsPopover
          isOpen={true}
          onClose={onClose}
        />
      </Provider>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
