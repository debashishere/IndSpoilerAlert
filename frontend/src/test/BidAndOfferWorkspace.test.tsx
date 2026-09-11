import React, { Suspense } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setInventoryList, setSelectedLotHubId, setLotHubSubTab, setLotHubData } from '../store/slices/inventorySlice';
import { setActiveTab } from '../store/slices/coreSlice';
import LotOperationsHubView from '../components/LotOperationsHubView';

describe('Issue #01: Bid & Offer Workspace List View', () => {
  const dummyLot = {
    _id: 'lot-hub-bids-1',
    lotNumber: 'LOT-11',
    status: 'active',
    quantityCases: 200,
    productId: {
      _id: 'prod-11',
      sku: 'SKU-TEST-11',
      description: 'Organic Milk 1L',
      allergens: ['milk']
    }
  };

  const sampleBids = [
    {
      _id: 'bid-1',
      lotId: 'lot-hub-bids-1',
      buyerId: {
        _id: 'buyer-1',
        companyName: 'Apex Liquidators',
        email: 'debashisroe1996@gmail.com'
      },
      price: 3.50,
      quantity: 150,
      status: 'pending',
      submittedAt: '2026-09-08T10:30:00.000Z'
    },
    {
      _id: 'bid-2',
      lotId: 'lot-hub-bids-1',
      buyerId: {
        _id: 'buyer-2',
        companyName: 'Beacon Foods',
        email: 'buyer2@beaconsurplus.com'
      },
      price: 4.00,
      quantity: 50,
      status: 'fully_accepted',
      submittedAt: '2026-09-08T11:00:00.000Z'
    }
  ];

  beforeEach(() => {
    store.dispatch(setInventoryList([dummyLot]));
    store.dispatch(setSelectedLotHubId('lot-hub-bids-1'));
    store.dispatch(setLotHubSubTab('bids'));
    store.dispatch(setActiveTab('lot-hub'));
    store.dispatch(setLotHubData({ bidsList: sampleBids, negotiationBids: sampleBids }));
  });

  it('unifies dual panels into a single full-width "Bid & Offer" section and renders key commercial metrics', async () => {
    render(
      <Provider store={store}>
        <LotOperationsHubView />
      </Provider>
    );

    // Should have unified "Bid & Offer" section header
    expect(screen.getByRole('heading', { level: 3, name: /Bid & Offer/i }) || screen.getByText(/^Bid & Offer/i)).toBeDefined();

    // Should NOT have the old dual panel headers
    expect(screen.queryByText(/Incoming Bids & Offers/i)).toBeNull();
    expect(screen.queryByText(/Live Negotiation Chat & Counter-Offer/i)).toBeNull();

    // Verify Buyer 1 details
    expect(screen.getByText('Apex Liquidators')).toBeDefined();
    expect(screen.getByText('debashisroe1996@gmail.com')).toBeDefined();
    expect(screen.getByText('$3.50')).toBeDefined();
    expect(screen.getByText('150')).toBeDefined();
    expect(screen.getByText('$525.00')).toBeDefined();

    // Verify Buyer 2 details
    expect(screen.getByText('Beacon Foods')).toBeDefined();
    expect(screen.getByText('buyer2@beaconsurplus.com')).toBeDefined();
    expect(screen.getByText('$4.00')).toBeDefined();
    expect(screen.getByText('50')).toBeDefined();
    expect(screen.getByText('$200.00')).toBeDefined();
  });

  it('filters records accurately using interactive status filter tabs and search', async () => {
    const multiStatusBids = [
      ...sampleBids,
      {
        _id: 'bid-3',
        lotId: 'lot-hub-bids-1',
        buyerId: {
          _id: 'buyer-3',
          companyName: 'Quick Liquidators',
          email: 'quick@liq.com'
        },
        price: 3.80,
        quantity: 80,
        status: 'countered',
        submittedAt: '2026-09-08T11:15:00.000Z'
      },
      {
        _id: 'bid-4',
        lotId: 'lot-hub-bids-1',
        buyerId: {
          _id: 'buyer-4',
          companyName: 'Bargain Mart',
          email: 'declined@mart.com'
        },
        price: 2.00,
        quantity: 120,
        status: 'rejected',
        submittedAt: '2026-09-08T11:30:00.000Z'
      }
    ];

    store.dispatch(setLotHubData({ bidsList: multiStatusBids, negotiationBids: multiStatusBids }));

    render(
      <Provider store={store}>
        <LotOperationsHubView />
      </Provider>
    );

    // Initial 'All' tab should show all 4
    expect(screen.getByText('Apex Liquidators')).toBeDefined();
    expect(screen.getByText('Beacon Foods')).toBeDefined();
    expect(screen.getByText('Quick Liquidators')).toBeDefined();
    expect(screen.getByText('Bargain Mart')).toBeDefined();

    // 1. Filter: Pending
    fireEvent.click(screen.getByRole('tab', { name: 'Pending' }));
    expect(screen.getByText('Apex Liquidators')).toBeDefined();
    expect(screen.queryByText('Beacon Foods')).toBeNull();
    expect(screen.queryByText('Quick Liquidators')).toBeNull();
    expect(screen.queryByText('Bargain Mart')).toBeNull();

    // 2. Filter: Countered
    fireEvent.click(screen.getByRole('tab', { name: 'Countered' }));
    expect(screen.queryByText('Apex Liquidators')).toBeNull();
    expect(screen.queryByText('Beacon Foods')).toBeNull();
    expect(screen.getByText('Quick Liquidators')).toBeDefined();
    expect(screen.queryByText('Bargain Mart')).toBeNull();

    // 3. Filter: Awarded
    fireEvent.click(screen.getByRole('tab', { name: 'Awarded' }));
    expect(screen.queryByText('Apex Liquidators')).toBeNull();
    expect(screen.getByText('Beacon Foods')).toBeDefined();
    expect(screen.queryByText('Quick Liquidators')).toBeNull();
    expect(screen.queryByText('Bargain Mart')).toBeNull();

    // 4. Filter: Declined
    fireEvent.click(screen.getByRole('tab', { name: 'Declined' }));
    expect(screen.queryByText('Apex Liquidators')).toBeNull();
    expect(screen.queryByText('Beacon Foods')).toBeNull();
    expect(screen.queryByText('Quick Liquidators')).toBeNull();
    expect(screen.getByText('Bargain Mart')).toBeDefined();

    // 5. Reset to All
    fireEvent.click(screen.getByRole('tab', { name: 'All' }));
    expect(screen.getByText('Apex Liquidators')).toBeDefined();
    expect(screen.getByText('Beacon Foods')).toBeDefined();
    expect(screen.getByText('Quick Liquidators')).toBeDefined();
    expect(screen.getByText('Bargain Mart')).toBeDefined();

    // 6. Search by text
    const searchInput = screen.getByLabelText(/Search bids/i);
    fireEvent.change(searchInput, { target: { value: 'Apex' } });
    expect(screen.getByText('Apex Liquidators')).toBeDefined();
    expect(screen.queryByText('Beacon Foods')).toBeNull();
    expect(screen.queryByText('Quick Liquidators')).toBeNull();
    expect(screen.queryByText('Bargain Mart')).toBeNull();

    // 7. Search by email
    fireEvent.change(searchInput, { target: { value: 'declined@mart.com' } });
    expect(screen.queryByText('Apex Liquidators')).toBeNull();
    expect(screen.queryByText('Beacon Foods')).toBeNull();
    expect(screen.queryByText('Quick Liquidators')).toBeNull();
    expect(screen.getByText('Bargain Mart')).toBeDefined();
  });

  it('triggers inspector action target and updates selection when a bid row is clicked', async () => {
    const onSelectBidMock = vi.fn();
    const onOpenBidInspectorMock = vi.fn();

    render(
      <Provider store={store}>
        <LotOperationsHubView 
          onSelectBid={onSelectBidMock} 
          onOpenBidInspector={onOpenBidInspectorMock} 
        />
      </Provider>
    );

    const bidRow = screen.getByTestId('bid-row-bid-1');
    expect(bidRow).toBeDefined();

    fireEvent.click(bidRow);

    // Callbacks triggered
    expect(onSelectBidMock).toHaveBeenCalledTimes(1);
    expect(onSelectBidMock).toHaveBeenCalledWith(expect.objectContaining({ _id: 'bid-1' }));

    expect(onOpenBidInspectorMock).toHaveBeenCalledTimes(1);
    expect(onOpenBidInspectorMock).toHaveBeenCalledWith(expect.objectContaining({ _id: 'bid-1' }));

    // Redux store updated
    expect((store.getState() as any).inventory.lotHubData.selectedBidForNegotiation?._id).toBe('bid-1');
  });
});
