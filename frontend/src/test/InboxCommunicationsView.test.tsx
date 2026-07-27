import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailCommunicationsView } from '../views/EmailCommunicationsView';

describe('Inbox & Email Communications TDD Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders multiple distinct email threads for the same recipient with different subjects', async () => {
    const mockThreads = [
      {
        threadId: 'th-001',
        supplierId: 'sup-unilever',
        buyerEmail: 'repeat.buyer@retail.com',
        subject: 'First Subject: Organic Yogurt Batch',
        status: 'active',
        openCount: 2,
        messages: [{ messageId: 'm1', senderType: 'supplier', senderEmail: 'ops@unilever.com', body: 'First body text', sentAt: '2026-08-01T08:00:00Z' }],
        updatedAt: '2026-08-01T08:00:00Z',
        createdAt: '2026-08-01T08:00:00Z'
      },
      {
        threadId: 'th-002',
        supplierId: 'sup-unilever',
        buyerEmail: 'repeat.buyer@retail.com',
        subject: 'Second Subject: Plant Milk Clearance',
        status: 'active',
        openCount: 0,
        messages: [{ messageId: 'm2', senderType: 'supplier', senderEmail: 'ops@unilever.com', body: 'Second body text', sentAt: '2026-08-01T09:00:00Z' }],
        updatedAt: '2026-08-01T09:00:00Z',
        createdAt: '2026-08-01T09:00:00Z'
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/email-threads')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockThreads
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;

    render(<EmailCommunicationsView supplierId="sup-unilever" />);

    // Both distinct threads should appear in the Inbox sidebar
    expect(await screen.findByText('First Subject: Organic Yogurt Batch')).toBeInTheDocument();
    expect(screen.getByText('Second Subject: Plant Milk Clearance')).toBeInTheDocument();

    // Verify both belong to repeat.buyer@retail.com
    const buyerInstances = screen.getAllByText('repeat.buyer@retail.com');
    expect(buyerInstances.length).toBeGreaterThanOrEqual(2);
  });

  it('filters threads by sent filter and displays outbound sent emails', async () => {
    const mockThreads = [
      {
        threadId: 'th-sent-1',
        supplierId: 'sup-unilever',
        buyerEmail: 'outbound@buyer.com',
        subject: 'Outbound Direct Offer',
        status: 'active',
        openCount: 1,
        messages: [{ messageId: 'm-sent', senderType: 'supplier', senderEmail: 'ops@unilever.com', body: 'Sent email message body', sentAt: '2026-08-01T10:00:00Z' }],
        updatedAt: '2026-08-01T10:00:00Z',
        createdAt: '2026-08-01T10:00:00Z'
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/email-threads')) {
        return Promise.resolve({ ok: true, json: async () => mockThreads });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as any;

    render(<EmailCommunicationsView supplierId="sup-unilever" />);

    expect(await screen.findByText('Outbound Direct Offer')).toBeInTheDocument();

    const sentBtn = screen.getByRole('button', { name: /sent/i });
    fireEvent.click(sentBtn);

    expect(screen.getByText('Outbound Direct Offer')).toBeInTheDocument();
    expect(screen.getByText('outbound@buyer.com')).toBeInTheDocument();
  });
});
