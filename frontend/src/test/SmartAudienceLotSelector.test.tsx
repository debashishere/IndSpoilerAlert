import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartAudienceLotSelector } from '../components/SmartAudienceLotSelector';

describe('Issue #79 / Slice 4: Smart Audience Targeting & Inventory Lot Selector', () => {
  const mockOnAudienceChange = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string, opts?: any) => {
      if (url.includes('/api/emails/broadcast-preview')) {
        const body = JSON.parse(opts?.body || '{}');
        const count = body.buyerSegment === 'all_buyers' ? 12 : 5;
        const totalCases = (body.lotIds?.length || 0) * 200 || 690;
        return new Response(JSON.stringify({
          success: true,
          recipientCount: count,
          totalCases: totalCases,
          matchedBuyers: [],
          selectedLots: []
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }));
  });

  it('Slice 4 - Criterion 1: renders Smart Audience Targeting UI controls and buyer segment cards', () => {
    render(
      <SmartAudienceLotSelector
        supplierId="sup-101"
        onAudienceChange={mockOnAudienceChange}
      />
    );

    expect(screen.getByText(/Smart Audience Targeting/i)).toBeInTheDocument();
    expect(screen.getByText(/Short-Dated Grocers/i)).toBeInTheDocument();
    expect(screen.getByText(/Discount Retailers/i)).toBeInTheDocument();
    expect(screen.getByText(/Food Banks & Rescues/i)).toBeInTheDocument();
    expect(screen.getByText(/All Registered Buyers/i)).toBeInTheDocument();
  });

  it('Slice 4 - Criterion 2: renders Surplus Inventory Lot picker and allows lot selection toggling', async () => {
    render(
      <SmartAudienceLotSelector
        supplierId="sup-101"
        onAudienceChange={mockOnAudienceChange}
      />
    );

    expect(screen.getByText(/Surplus Inventory Lot Picker/i)).toBeInTheDocument();
    expect(screen.getByText(/LOT-880 — Organic Milk 1L/i)).toBeInTheDocument();
    expect(screen.getByText(/LOT-881 — Greek Yogurt 500g/i)).toBeInTheDocument();

    // Toggle lot 880
    const lotItem = screen.getByText(/LOT-880 — Organic Milk 1L/i);
    fireEvent.click(lotItem);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/emails/broadcast-preview'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );
    });
  });

  it('Slice 4 - Criterion 3: updates preview metrics dynamically when changing buyer segment', async () => {
    render(
      <SmartAudienceLotSelector
        supplierId="sup-101"
        onAudienceChange={mockOnAudienceChange}
      />
    );

    // Switch buyer segment to All Registered Buyers
    const allBuyersBtn = screen.getByText(/All Registered Buyers/i);
    fireEvent.click(allBuyersBtn);

    await waitFor(() => {
      expect(screen.getByTestId('recipient-count-badge')).toHaveTextContent('12 Matched Buyer Accounts');
    });

    expect(mockOnAudienceChange).toHaveBeenCalledWith(expect.objectContaining({
      buyerSegment: 'all_buyers',
      recipientCount: 12
    }));
  });
});
