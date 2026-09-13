import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BuyerNegotiationPortalView } from '../views/BuyerNegotiationPortalView';

describe('BuyerNegotiationPortalView (Slice 3 Seam 3B)', () => {
  const mockOfferId = '65fa1234567890abcdef0001';
  const mockToken = 'valid-token-123.abc';

  const mockPortalData = {
    offer: {
      _id: mockOfferId,
      price: 3.50,
      quantity: 150,
      status: 'countered',
      buyerId: {
        _id: 'buyer-1',
        companyName: 'Apex Liquidators',
        email: 'apex@liquidators.com'
      }
    },
    lot: {
      _id: 'lot-1',
      lotNumber: 'LOT-9988',
      quantityCases: 200,
      standardSellPrice: 5.00
    },
    product: {
      sku: 'SKU-APPLES-01',
      description: 'Organic Honeycrisp Apples',
      brand: 'Fresh Orchard'
    },
    distributionCenter: {
      name: 'Central Cold Storage - Chicago',
      city: 'Chicago',
      state: 'IL'
    },
    latestSupplierProposal: {
      sender: 'supplier',
      content: 'We can accept $4.20/cs for 150 cases.',
      proposedPrice: 4.20,
      proposedQuantity: 150,
      timestamp: '2026-09-13T10:00:00.000Z'
    },
    messages: [
      {
        sender: 'buyer',
        content: 'Initial bid: $3.50/cs for 150 cases.',
        proposedPrice: 3.50,
        proposedQuantity: 150,
        timestamp: '2026-09-12T15:00:00.000Z'
      },
      {
        sender: 'supplier',
        content: 'We can accept $4.20/cs for 150 cases.',
        proposedPrice: 4.20,
        proposedQuantity: 150,
        timestamp: '2026-09-13T10:00:00.000Z'
      }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays error state when token is invalid or missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized: Invalid or expired negotiation token.' })
    } as any);

    render(<BuyerNegotiationPortalView offerId={mockOfferId} token="invalid-token" />);

    await waitFor(() => {
      expect(screen.getByText(/Unauthorized: Invalid or expired negotiation token/i)).toBeInTheDocument();
    });
  });

  it('renders lot summary, supplier counter proposal terms, and thread history', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPortalData
    } as any);

    render(<BuyerNegotiationPortalView offerId={mockOfferId} token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText(/Organic Honeycrisp Apples/i)).toBeInTheDocument();
    });

    // Lot & Product Context
    expect(screen.getByText(/LOT-9988/i)).toBeInTheDocument();
    expect(screen.getByText(/Central Cold Storage - Chicago/i)).toBeInTheDocument();

    // Latest Supplier Counter Terms
    expect(screen.getAllByText(/\$4\.20/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/630\.00/i)).toBeInTheDocument(); // 4.20 * 150

    // Messages history
    expect(screen.getByText(/Initial bid: \$3\.50\/cs for 150 cases\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/We can accept \$4\.20\/cs for 150 cases\./i).length).toBeGreaterThan(0);

    // Prominent CTAs
    expect(screen.getByRole('button', { name: /accept counter-offer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /propose revised offer/i })).toBeInTheDocument();
  });

  it('submits a revised re-bid counter-offer and refreshes the negotiation thread', async () => {
    const fetchMock = vi.fn();
    fetchMock
      // Initial GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPortalData
      } as any)
      // POST re-bid
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          offer: {
            ...mockPortalData.offer,
            status: 'pending',
            messages: [
              ...mockPortalData.messages,
              {
                sender: 'buyer',
                content: 'Counter: $3.90/cs for 150 cases. Firm final offer.',
                proposedPrice: 3.90,
                proposedQuantity: 150,
                timestamp: new Date().toISOString()
              }
            ]
          }
        })
      } as any)
      // Subsequent refresh GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockPortalData,
          offer: { ...mockPortalData.offer, status: 'pending' },
          messages: [
            ...mockPortalData.messages,
            {
              sender: 'buyer',
              content: 'Counter: $3.90/cs for 150 cases. Firm final offer.',
              proposedPrice: 3.90,
              proposedQuantity: 150,
              timestamp: new Date().toISOString()
            }
          ]
        })
      } as any);

    globalThis.fetch = fetchMock;

    render(<BuyerNegotiationPortalView offerId={mockOfferId} token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText(/Organic Honeycrisp Apples/i)).toBeInTheDocument();
    });

    // Open revised offer form/modal
    fireEvent.click(screen.getByRole('button', { name: /propose revised offer/i }));

    // Verify form inputs appear
    const priceInput = screen.getByLabelText(/proposed price/i);
    const qtyInput = screen.getByLabelText(/proposed quantity/i);
    const messageInput = screen.getByLabelText(/note or message/i);

    fireEvent.change(priceInput, { target: { value: '3.90' } });
    fireEvent.change(qtyInput, { target: { value: '150' } });
    fireEvent.change(messageInput, { target: { value: 'Counter: $3.90/cs for 150 cases. Firm final offer.' } });

    // Submit counter
    fireEvent.click(screen.getByRole('button', { name: /submit revised offer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/portal/negotiation/${mockOfferId}/re-bid?token=${encodeURIComponent(mockToken)}`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            proposedPrice: 3.90,
            proposedQuantity: 150,
            message: 'Counter: $3.90/cs for 150 cases. Firm final offer.'
          })
        })
      );
    });

    // Verify success feedback appears
    await waitFor(() => {
      expect(screen.getByText(/counter-offer has been sent/i)).toBeInTheDocument();
    });
  });

  it('accepts the supplier counter-offer and redirects buyer to DealSettlementPortalView (/deal/:dealId?dealToken=...)', async () => {
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { ...originalLocation, href: '' };

    const mockDealId = '65fa9999999999abcdef9999';
    const mockDealToken = 'deal-token-123.sig456';

    const fetchMock = vi.fn();
    fetchMock
      // Initial GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPortalData
      } as any)
      // POST accept
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          dealId: mockDealId,
          dealToken: mockDealToken
        })
      } as any);

    globalThis.fetch = fetchMock;

    render(<BuyerNegotiationPortalView offerId={mockOfferId} token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText(/Organic Honeycrisp Apples/i)).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept counter-offer/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/portal/negotiation/${mockOfferId}/accept?token=${encodeURIComponent(mockToken)}`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );
    });

    await waitFor(() => {
      expect(window.location.href).toContain(`/deal/${mockDealId}?dealToken=${encodeURIComponent(mockDealToken)}`);
    });

    window.location = originalLocation;
  });
});
