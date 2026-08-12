import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TEMPLATES_STUB = [
  {
    _id: 'tpl-1',
    name: 'Clearance Blast',
    category: 'Clearance',
    subject: '50% off — today only',
    updatedAt: '2026-07-15T10:00:00Z',
    supplierId: 'sup-123',
  },
  {
    _id: 'tpl-2',
    name: 'Auction Opener',
    category: 'Auction',
    subject: 'Bidding starts now',
    updatedAt: '2026-08-01T08:30:00Z',
    supplierId: 'sup-123',
  },
];

function mockFetch(templates: any[] = TEMPLATES_STUB, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => templates,
  });
}

function renderGallery(supplierId = 'sup-123') {
  return import('../components/EmailBuilder/TemplateGallery').then(({ TemplateGallery }) =>
    render(
      <Provider store={store}>
        <TemplateGallery supplierId={supplierId} />
      </Provider>
    )
  );
}

// ---------------------------------------------------------------------------
// Issue 02 — Template Gallery
// ---------------------------------------------------------------------------
describe('Issue 02 — Template Gallery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Cycle 1 — S1: Loading state
  // -------------------------------------------------------------------------
  describe('S1: loading state', () => {
    it('shows a loading indicator while the fetch is in-flight', async () => {
      // Never resolve so we stay in loading state
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) as any;

      await renderGallery();

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 2 — S2: Populated list
  // -------------------------------------------------------------------------
  describe('S2: populated list', () => {
    it('renders a card for each template with name, category badge, subject, and last-updated date', async () => {
      global.fetch = mockFetch() as any;

      await renderGallery();

      await waitFor(() => {
        expect(screen.getByText('Clearance Blast')).toBeInTheDocument();
      });

      // Card 1
      expect(screen.getByText('Clearance Blast')).toBeInTheDocument();
      expect(screen.getByText('Clearance')).toBeInTheDocument();
      expect(screen.getByText('50% off — today only')).toBeInTheDocument();
      expect(screen.getByText(/Jul 15, 2026/i)).toBeInTheDocument();

      // Card 2
      expect(screen.getByText('Auction Opener')).toBeInTheDocument();
      expect(screen.getByText('Auction')).toBeInTheDocument();
      expect(screen.getByText('Bidding starts now')).toBeInTheDocument();
      expect(screen.getByText(/Aug 1, 2026/i)).toBeInTheDocument();
    });

    it('fetches from /api/email-templates scoped to the supplierId', async () => {
      global.fetch = mockFetch() as any;

      await renderGallery('sup-abc');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/\/api\/email-templates/);
      expect(calledUrl).toMatch(/supplierId=sup-abc/);
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 3 — S3: Empty state
  // -------------------------------------------------------------------------
  describe('S3: empty state', () => {
    it('shows the empty-state CTA when no templates exist for the supplier', async () => {
      global.fetch = mockFetch([]) as any;

      await renderGallery();

      await waitFor(() => {
        expect(screen.getByText(/no templates yet/i)).toBeInTheDocument();
      });

      // CTA button must be present
      expect(screen.getByRole('button', { name: /create your first template/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 4 — S4: Delete action
  // -------------------------------------------------------------------------
  describe('S4: delete action', () => {
    it('removes the card from the list after Delete is confirmed without a full reload', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => TEMPLATES_STUB })
        .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) }) as any;

      await renderGallery();

      await waitFor(() => {
        expect(screen.getByText('Clearance Blast')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Clearance Blast')).not.toBeInTheDocument();
      });

      // Second card must still be there
      expect(screen.getByText('Auction Opener')).toBeInTheDocument();

      // Verify DELETE was called with the correct id
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const deleteCall = calls.find(([url, opts]: [string, any]) => opts?.method === 'DELETE');
      expect(deleteCall).toBeDefined();
      expect(deleteCall[0]).toMatch(/\/api\/email-templates\/tpl-1/);
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 5 — S5: Error state
  // -------------------------------------------------------------------------
  describe('S5: error state', () => {
    it('shows a graceful error message when the fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

      await renderGallery();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/failed to load templates/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 6 — S6: + New Template button (no-op)
  // -------------------------------------------------------------------------
  describe('S6: + New Template button', () => {
    it('renders "+ New Template" in the gallery header and clicking it does nothing (no-op)', async () => {
      global.fetch = mockFetch([]) as any;

      await renderGallery();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\+ new template/i })).toBeInTheDocument();
      });

      // Should not throw on click
      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 7 — S7: EmailsHubView integration — Templates tab mounts TemplateGallery
  // -------------------------------------------------------------------------
  describe('S7: EmailsHubView integration', () => {
    it('clicking the Templates tab renders TemplateGallery (not the old placeholder)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      }) as any;

      const { EmailsHubView } = await import('../views/EmailsHubView');

      render(
        <Provider store={store}>
          <EmailsHubView supplierId="sup-123" />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /^templates$/i }));

      // Gallery header must appear — NOT the old "coming soon" placeholder
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\+ new template/i })).toBeInTheDocument();
      });

      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    });

    it('passes the supplierId down to TemplateGallery so the correct fetch URL is called', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      }) as any;

      const { EmailsHubView } = await import('../views/EmailsHubView');

      render(
        <Provider store={store}>
          <EmailsHubView supplierId="sup-xyz" />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /^templates$/i }));

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const galleryFetch = calls.find(([url]: [string]) =>
          url?.includes?.('/api/email-templates') && url?.includes?.('sup-xyz')
        );
        expect(galleryFetch).toBeDefined();
      });
    });
  });
});
