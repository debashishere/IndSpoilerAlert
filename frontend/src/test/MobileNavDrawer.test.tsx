import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab } from '../store/slices/coreSlice';
import { MobileNavDrawer } from '../components/navigation/MobileNavDrawer';

describe('Slice 4: MobileNavDrawer & Responsive Slide-Over Drawer', () => {
  beforeEach(() => {
    store.dispatch(setActiveTab('ingestion'));
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Provider store={store}>
        <MobileNavDrawer isOpen={false} onClose={vi.fn()} />
      </Provider>
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('renders drawer header, user card, and verified badge when open', () => {
    render(
      <Provider store={store}>
        <MobileNavDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={{
            name: 'Debashishere007',
            email: 'debashis@example.corp',
            role: 'Verified Agent',
            agentId: 'AGT-402',
            initials: 'DH',
          }}
        />
      </Provider>
    );

    expect(screen.getByRole('dialog', { name: /Mobile Navigation Drawer/i })).toBeInTheDocument();
    expect(screen.getByText('IndSpoiler Alert')).toBeInTheDocument();
    expect(screen.getByText('OS v4.2')).toBeInTheDocument();
    expect(screen.getByText('Debashishere007')).toBeInTheDocument();
    expect(screen.getByText(/Verified Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/AGT-402/i)).toBeInTheDocument();
  });

  it('renders 3-column stats matrix grid with Active Lots, Pending Bids, and Unread Alerts', () => {
    render(
      <Provider store={store}>
        <MobileNavDrawer
          isOpen={true}
          onClose={vi.fn()}
          stats={{
            activeLots: 100,
            pendingBids: '3 Active',
            unreadAlerts: '4 Alerts',
          }}
        />
      </Provider>
    );

    expect(screen.getByText('Active Lots')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Pending Bids')).toBeInTheDocument();
    expect(screen.getByText('3 Active')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('4 Alerts')).toBeInTheDocument();
  });

  it('renders navigation links and handles tab switching', () => {
    const onClose = vi.fn();
    const onTabSelect = vi.fn();
    render(
      <Provider store={store}>
        <MobileNavDrawer
          isOpen={true}
          onClose={onClose}
          onTabSelect={onTabSelect}
        />
      </Provider>
    );

    expect(screen.getByText('Primary Navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marketplace/i })).toBeInTheDocument();
    expect(screen.getByText('Live 94.8%')).toBeInTheDocument();

    const insightLink = screen.getByRole('button', { name: /Insight/i });
    fireEvent.click(insightLink);

    expect(store.getState().core.activeTab).toBe('inventory');
    expect(onTabSelect).toHaveBeenCalledWith('inventory');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders Terminal Node card and compliance tags in footer', () => {
    render(
      <Provider store={store}>
        <MobileNavDrawer isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText('Northeast Hub Newark')).toBeInTheDocument();
    expect(screen.getByText('Node: NA-SOUTH-TX-HUB')).toBeInTheDocument();
    expect(screen.getByText('FSMA 204 Audited')).toBeInTheDocument();
    expect(screen.getByText('TLS 1.3 End-to-End')).toBeInTheDocument();
  });

  it('triggers logout and closes drawer on Sign Out / Lock Console click', () => {
    const onLogout = vi.fn();
    const onClose = vi.fn();
    render(
      <Provider store={store}>
        <MobileNavDrawer
          isOpen={true}
          onClose={onClose}
          onLogout={onLogout}
        />
      </Provider>
    );

    const logoutBtn = screen.getByRole('button', { name: /Sign Out \/ Lock Console/i });
    fireEvent.click(logoutBtn);

    expect(onLogout).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('closes drawer when clicking close button, backdrop, or pressing Escape', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Provider store={store}>
        <MobileNavDrawer isOpen={true} onClose={onClose} />
      </Provider>
    );

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Close Drawer/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // Backdrop click
    const backdrop = screen.getByTestId('mobile-drawer-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
