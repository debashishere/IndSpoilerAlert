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
  return vi.fn().mockImplementation(async (_url: string, opts?: any) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => (opts?.method === 'POST' || opts?.method === 'PUT' ? templates[0] || {} : templates),
  }));
}

async function renderHub(supplierId = 'sup-123') {
  const { EmailsHubView } = await import('../views/EmailsHubView');
  return render(
    <Provider store={store}>
      <EmailsHubView supplierId={supplierId} />
    </Provider>
  );
}

async function openTemplatesTab() {
  fireEvent.click(screen.getByRole('button', { name: /^templates$/i }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /\+ new template/i })).toBeInTheDocument()
  );
}

// ---------------------------------------------------------------------------
// Issue 03 — Template Editor
// ---------------------------------------------------------------------------
describe('Issue 03 — Template Editor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Cycle 1 — S1: + New Template opens editor
  // -------------------------------------------------------------------------
  describe('S1: + New Template opens editor', () => {
    it('clicking + New Template replaces the gallery with the Template Editor header', async () => {
      global.fetch = mockFetch([]) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));

      // Editor header must appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument();
      });

      // Gallery header must be gone
      expect(screen.queryByRole('heading', { name: /template gallery/i })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 2 — S2: Edit action on a card opens editor pre-filled
  // -------------------------------------------------------------------------
  describe('S2: gallery card Edit opens editor pre-filled', () => {
    it('clicking Edit on a card shows the editor with that template name pre-filled', async () => {
      global.fetch = mockFetch() as any;

      await renderHub();
      await openTemplatesTab();

      await waitFor(() =>
        expect(screen.getByText('Clearance Blast')).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole('button', { name: /edit clearance blast/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit template/i })).toBeInTheDocument();
      });

      const nameInput = screen.getByRole('textbox', { name: /template name/i });
      expect(nameInput).toHaveValue('Clearance Blast');
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 3 — S3: Back button (clean) → returns to gallery
  // -------------------------------------------------------------------------
  describe('S3: Back button with clean body returns to gallery', () => {
    it('clicking Back in the editor with no changes returns to the gallery', async () => {
      global.fetch = mockFetch([]) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /template gallery/i })).toBeInTheDocument();
      });

      expect(screen.queryByRole('heading', { name: /new template/i })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 4 — S4: Back with unsaved body → discard confirmation
  // -------------------------------------------------------------------------
  describe('S4: Back with unsaved body shows discard confirmation', () => {
    it('Confirm discard returns to gallery; Cancel stays in editor', async () => {
      global.fetch = mockFetch([]) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument()
      );

      // Type something in the Name field to mark it dirty
      const nameInput = screen.getByRole('textbox', { name: /template name/i });
      fireEvent.change(nameInput, { target: { value: 'Draft' } });

      // Click Back — should show discard dialog
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /discard/i })).toBeInTheDocument();
      });

      // --- Path A: Cancel → stay in editor ---
      fireEvent.click(screen.getByRole('button', { name: /keep editing/i }));
      expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument();

      // Click Back again and confirm discard
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /discard/i })).toBeInTheDocument();
      });

      // --- Path B: Confirm → gallery ---
      fireEvent.click(screen.getByRole('button', { name: /^discard$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /template gallery/i })).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 5 — S5: Metadata form fields render and bind
  // -------------------------------------------------------------------------
  describe('S5: metadata form fields', () => {
    it('renders Name, Category, Subject, From Email, Signature fields with correct initial values for a new template', async () => {
      global.fetch = mockFetch([]) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument()
      );

      expect(screen.getByRole('textbox', { name: /template name/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /subject/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /from email/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /signature/i })).toBeInTheDocument();

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      expect(categorySelect).toHaveDisplayValue('General');
      ['Clearance', 'Auction', 'Award', 'General'].forEach((cat) => {
        expect(categorySelect).toContainHTML(cat);
      });
    });

    it('pre-fills all fields when opening an existing template for edit', async () => {
      global.fetch = mockFetch() as any;

      await renderHub();
      await openTemplatesTab();

      await waitFor(() =>
        expect(screen.getByText('Clearance Blast')).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole('button', { name: /edit clearance blast/i }));

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('Clearance Blast');
      });

      expect(screen.getByRole('combobox', { name: /category/i })).toHaveValue('Clearance');
      expect(screen.getByRole('textbox', { name: /subject/i })).toHaveValue('50% off — today only');
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 6 — S6: Validation — Save blocked when Name or Subject is empty
  // -------------------------------------------------------------------------
  describe('S6: validation blocks save when Name or Subject is empty', () => {
    it('shows a validation error and does not call fetch when Name is empty', async () => {
      global.fetch = mockFetch([]) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument()
      );

      fireEvent.change(screen.getByRole('textbox', { name: /subject/i }), {
        target: { value: 'A subject' },
      });

      const fetchCallsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(fetchCallsBefore);
    });

    it('shows a validation error and does not call fetch when Subject is empty', async () => {
      global.fetch = mockFetch([]) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument()
      );

      fireEvent.change(screen.getByRole('textbox', { name: /template name/i }), {
        target: { value: 'My Template' },
      });

      const fetchCallsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      });

      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(fetchCallsBefore);
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 7 — S7: POST for new template
  // -------------------------------------------------------------------------
  describe('S7: POST /api/email-templates for a new template', () => {
    it('calls POST with correct payload when saving a new template', async () => {
      const savedTemplate = {
        _id: 'tpl-new',
        name: 'My New Template',
        category: 'General',
        subject: 'Hello World',
        supplierId: 'sup-123',
        updatedAt: new Date().toISOString(),
      };

      global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: any) => {
        if (opts?.method === 'POST') {
          return { ok: true, status: 201, json: async () => savedTemplate };
        }
        return { ok: true, status: 200, json: async () => [savedTemplate] };
      }) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument()
      );

      fireEvent.change(screen.getByRole('textbox', { name: /template name/i }), {
        target: { value: 'My New Template' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /subject/i }), {
        target: { value: 'Hello World' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const postCall = calls.find(([_url, opts]: [string, any]) => opts?.method === 'POST');
        expect(postCall).toBeDefined();

        const [url, opts] = postCall;
        expect(url).toMatch(/\/api\/email-templates/);

        const body = JSON.parse(opts.body);
        expect(body.name).toBe('My New Template');
        expect(body.subject).toBe('Hello World');
        expect(body.category).toBe('General');
        expect(body.supplierId).toBe('sup-123');
        expect('bodyHtml' in body).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 8 — S8: PUT for existing template
  // -------------------------------------------------------------------------
  describe('S8: PUT /api/email-templates/:id for an existing template', () => {
    it('calls PUT with correct :id and payload when saving an edited template', async () => {
      const updatedTemplate = { ...TEMPLATES_STUB[0], name: 'Clearance Blast v2' };

      let putDone = false;
      global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: any) => {
        if (opts?.method === 'PUT') {
          putDone = true;
          return { ok: true, status: 200, json: async () => updatedTemplate };
        }
        return { ok: true, status: 200, json: async () => (putDone ? [updatedTemplate] : TEMPLATES_STUB) };
      }) as any;

      await renderHub();
      await openTemplatesTab();

      await waitFor(() =>
        expect(screen.getByText('Clearance Blast')).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole('button', { name: /edit clearance blast/i }));

      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('Clearance Blast')
      );

      fireEvent.change(screen.getByRole('textbox', { name: /template name/i }), {
        target: { value: 'Clearance Blast v2' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const putCall = calls.find(([_url, opts]: [string, any]) => opts?.method === 'PUT');
        expect(putCall).toBeDefined();

        const [url, opts] = putCall;
        expect(url).toMatch(/\/api\/email-templates\/tpl-1/);

        const body = JSON.parse(opts.body);
        expect(body.name).toBe('Clearance Blast v2');
        expect(body.supplierId).toBe('sup-123');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Cycle 9 — S9: After save → gallery with saved card
  // -------------------------------------------------------------------------
  describe('S9: after successful save → gallery shows the saved card', () => {
    it('returns to gallery after POST and the new card is visible', async () => {
      const savedTemplate = {
        _id: 'tpl-new',
        name: 'Fresh Template',
        category: 'Award',
        subject: 'Congratulations',
        supplierId: 'sup-123',
        updatedAt: new Date().toISOString(),
      };

      global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: any) => {
        if (opts?.method === 'POST') {
          return { ok: true, status: 201, json: async () => savedTemplate };
        }
        return { ok: true, status: 200, json: async () => [savedTemplate] };
      }) as any;

      await renderHub();
      await openTemplatesTab();

      fireEvent.click(screen.getByRole('button', { name: /\+ new template/i }));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /new template/i })).toBeInTheDocument()
      );

      fireEvent.change(screen.getByRole('textbox', { name: /template name/i }), {
        target: { value: 'Fresh Template' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /subject/i }), {
        target: { value: 'Congratulations' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /template gallery/i })).toBeInTheDocument();
      });

      expect(screen.getByText('Fresh Template')).toBeInTheDocument();
    });
  });
});
