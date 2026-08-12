import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setActiveTab } from '../store/slices/coreSlice';

// ---------------------------------------------------------------------------
// Cycle 1 — S1: Sidebar nav label reads "Emails" with Mail icon
// ---------------------------------------------------------------------------
describe('Issue 01 — Emails Hub Shell', () => {
  beforeEach(() => {
    store.dispatch(setActiveTab('inbox'));
    vi.restoreAllMocks();
  });

  describe('S1: Sidebar nav label', () => {
    it('shows "Emails" (not "Inbox") in the sidebar nav for the inbox tab', async () => {
      const { Sidebar } = await import('../components/shell/Sidebar');

      render(
        <Provider store={store}>
          <Sidebar />
        </Provider>
      );

      // Must read "Emails"
      expect(screen.getByText('Emails')).toBeInTheDocument();
      // Must NOT read plain "Inbox" as a nav label
      expect(screen.queryByText('Inbox')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Cycle 2 — S2: EmailsHubView shows two sub-tab buttons: Inbox | Templates
  // ---------------------------------------------------------------------------
  describe('S2: EmailsHubView sub-tabs', () => {
    it('renders two visible sub-tab buttons: Inbox and Templates', async () => {
      // Stub fetch so EmailCommunicationsView inside doesn't blow up
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }) as any;

      const { EmailsHubView } = await import('../views/EmailsHubView');

      render(
        <Provider store={store}>
          <EmailsHubView
            supplierId="sup-test"
          />
        </Provider>
      );

      expect(screen.getByRole('button', { name: /^inbox$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^templates$/i })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Cycle 3 — S3: Inbox sub-tab renders EmailCommunicationsView
  // ---------------------------------------------------------------------------
  describe('S3: EmailsHubView Inbox sub-tab', () => {
    it('clicking Inbox sub-tab shows the "Inbox Workspace" heading from EmailCommunicationsView', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }) as any;

      const { EmailsHubView } = await import('../views/EmailsHubView');

      render(
        <Provider store={store}>
          <EmailsHubView supplierId="sup-test" />
        </Provider>
      );

      // Inbox is the default active sub-tab — heading should be visible without clicking
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /inbox workspace/i })).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Cycle 4 — S4: Templates sub-tab renders TemplateGallery (Issue 02)
  // ---------------------------------------------------------------------------
  describe('S4: EmailsHubView Templates sub-tab', () => {
    it('clicking Templates sub-tab renders the Template Gallery and does not crash', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      }) as any;

      const { EmailsHubView } = await import('../views/EmailsHubView');

      render(
        <Provider store={store}>
          <EmailsHubView supplierId="sup-test" />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /^templates$/i }));

      // The real TemplateGallery replaces the old placeholder — assert its header button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\+ new template/i })).toBeInTheDocument();
      });

      // Old "coming soon" placeholder must be gone
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    });
  });
});
