import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { openAwardModal } from '../store/slices/inventorySlice';

describe('Issue #38 Tracer Bullet 4: GlobalModals & Cross-Domain Modal Triggering', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render GlobalModals inside AppShell, open AwardModal via action, and transition to EmailSentVisualizer on confirm', async () => {
    const { AppShell } = await import('../components/shell/AppShell');

    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/award') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            _id: 'lot-g1',
            status: 'sold',
            emailSentResult: { previewUrl: 'https://ethereal.email/message/test-preview-url' }
          })
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });

    vi.stubGlobal('fetch', fetchSpy);

    const mockBid = {
      _id: 'bid-100',
      quantity: 40,
      price: 18.5,
      buyerId: { companyName: 'Acme Supermarkets', email: 'ops@acme.com' }
    };

    const mockLot = {
      _id: 'lot-g1',
      availableQty: 100,
      productId: { description: 'Organic Yogurt Cases' }
    };

    render(
      <Provider store={store}>
        <AppShell>
          <div>Dashboard Content</div>
        </AppShell>
      </Provider>
    );

    // Initially modal is hidden
    expect(screen.queryByText('Confirm Award & Customize Notification')).not.toBeInTheDocument();

    // Trigger openAwardModal via Redux dispatch
    store.dispatch(openAwardModal({ bid: mockBid, lot: mockLot }));

    // Verify AwardModal rendered with exact values
    expect(await screen.findByText('Confirm Award & Customize Notification')).toBeInTheDocument();
    expect(screen.getAllByText(/Acme Supermarkets/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\$18\.50/i).length).toBeGreaterThanOrEqual(1);

    // Confirm award
    const confirmBtn = screen.getByRole('button', { name: 'Confirm Award & Send Email' });
    fireEvent.click(confirmBtn);

    // Verify AwardModal closes and EmailSentVisualizer opens showing preview URL
    await waitFor(() => {
      expect(screen.queryByText('Confirm Award & Customize Notification')).not.toBeInTheDocument();
      expect(screen.getByText('Transactional Email Sent Successfully!')).toBeInTheDocument();
    });

    expect(screen.getByText(/Real Email Sent/i)).toBeInTheDocument();
    expect(screen.getByText('Preview Sent Email Online')).toHaveAttribute(
      'href',
      'https://ethereal.email/message/test-preview-url'
    );
  });
});
