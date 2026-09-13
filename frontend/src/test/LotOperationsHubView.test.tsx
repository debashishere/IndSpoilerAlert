import React, { Suspense } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setInventoryList, setSelectedLotHubId, setLotHubSubTab, setSelectedLot } from '../store/slices/inventorySlice';
import { setActiveTab } from '../store/slices/coreSlice';

describe('Issue #39: Lot Operations Hub Vertical Slice', () => {
  const dummyLot = {
    _id: 'lot-hub-test-1',
    lotNumber: 'LOT-999',
    status: 'pending',
    quantityCases: 150,
    productId: {
      _id: 'prod-1',
      sku: 'SKU-TEST-999',
      description: 'Organic Greek Yogurt 12x8oz',
      allergens: ['milk']
    }
  };

  beforeEach(() => {
    store.dispatch(setInventoryList([dummyLot]));
    store.dispatch(setSelectedLotHubId('lot-hub-test-1'));
    store.dispatch(setSelectedLot(null));
    store.dispatch(setLotHubSubTab('details'));
    store.dispatch(setActiveTab('lot-hub'));
  });

  it('should lazy load and render LotOperationsHubView using Redux store without props', async () => {
    const LazyLotHubView = React.lazy(() => import('../components/LotOperationsHubView'));

    render(
      <Provider store={store}>
        <Suspense fallback={<div>Loading Lazy Hub...</div>}>
          <LazyLotHubView />
        </Suspense>
      </Provider>
    );

    expect(await screen.findByText('Organic Greek Yogurt 12x8oz')).toBeDefined();
    expect(screen.getByText('SKU-TEST-999')).toBeDefined();
    expect(screen.getByText('Lot #LOT-999')).toBeDefined();
  });

  it('should switch sub-tabs and update Redux state cleanly when no legacy props are passed', async () => {
    const LazyLotHubView = React.lazy(() => import('../components/LotOperationsHubView'));

    render(
      <Provider store={store}>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyLotHubView />
        </Suspense>
      </Provider>
    );

    await screen.findByText('Organic Greek Yogurt 12x8oz');

    // Click on Bidding tab
    const bidsTabBtn = screen.getByText(/Bidding & Awarding/i);
    fireEvent.click(bidsTabBtn);
    expect((store.getState() as any).inventory.lotHubSubTab).toBe('bids');

    // Click on Activities tab
    const activitiesTabBtn = screen.getByText(/Lot CRM & Audit Timeline/i);
    fireEvent.click(activitiesTabBtn);
    expect((store.getState() as any).inventory.lotHubSubTab).toBe('activities');
  });

  it('should dispatch Redux actions to navigate back to inventory list on Back button click', async () => {
    const LazyLotHubView = React.lazy(() => import('../components/LotOperationsHubView'));

    render(
      <Provider store={store}>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyLotHubView />
        </Suspense>
      </Provider>
    );

    await screen.findByText('Organic Greek Yogurt 12x8oz');

    const backBtn = screen.getByText(/Back to/i);
    fireEvent.click(backBtn);

    expect((store.getState() as any).inventory.selectedLotHubId).toBeNull();
    expect((store.getState() as any).inventory.selectedLot).toBeNull();
  });

  it('should navigate back to ingestion table when returnTab is ingestion', async () => {
    const LazyLotHubView = React.lazy(() => import('../components/LotOperationsHubView'));

    store.dispatch(setActiveTab('ingestion'));
    store.dispatch(setActiveTab('lot-hub'));

    render(
      <Provider store={store}>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyLotHubView />
        </Suspense>
      </Provider>
    );

    await screen.findByText('Organic Greek Yogurt 12x8oz');

    const backBtn = screen.getByText(/Back to Ingestion Table/i);
    fireEvent.click(backBtn);

    expect((store.getState() as any).core.activeTab).toBe('ingestion');
  });

  it('should render stacked dual-figure unit price and recalculate Total Recovery for accepted bids with negotiated terms (Issue 01 Seam 3)', async () => {
    const LazyLotHubView = React.lazy(() => import('../components/LotOperationsHubView'));

    const testBids = [
      {
        _id: 'bid-negotiated-accepted-1',
        buyerId: { companyName: 'Savvy Buyer LLC', email: 'savvy@buyer.com' },
        price: 29.00,
        finalPrice: 30.00,
        quantity: 100,
        awardedQty: 80,
        status: 'fully_accepted',
        submittedAt: new Date().toISOString()
      },
      {
        _id: 'bid-standard-accepted-2',
        buyerId: { companyName: 'Standard Buyer Inc', email: 'standard@buyer.com' },
        price: 25.00,
        finalPrice: 25.00,
        quantity: 50,
        awardedQty: 50,
        status: 'fully_accepted',
        submittedAt: new Date().toISOString()
      },
      {
        _id: 'bid-pending-3',
        buyerId: { companyName: 'Pending Buyer Co', email: 'pending@buyer.com' },
        price: 20.00,
        quantity: 60,
        status: 'pending',
        submittedAt: new Date().toISOString()
      }
    ];

    render(
      <Provider store={store}>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyLotHubView subTab="bids" bidsList={testBids} />
        </Suspense>
      </Provider>
    );

    // 1. Verify negotiated bid displays stacked dual-figure presentation:
    // Prominent green settled price $30.00/cs with Settled tag
    expect(await screen.findByText('$30.00/cs')).toBeDefined();
    expect(screen.getByText('Settled')).toBeDefined();
    // Subtext showing initial bid price: Initial: $29.00/cs
    expect(screen.getByText('Initial: $29.00/cs')).toBeDefined();
    // Recalculated Total Recovery: 30.00 * 80 = $2,400.00
    expect(screen.getByText('$2,400.00')).toBeDefined();

    // 2. Verify standard accepted bid where finalPrice === price renders single unit price without Settled tag
    expect(screen.getByText('$25.00')).toBeDefined();
    expect(screen.getByText('$1,250.00')).toBeDefined(); // 25.00 * 50

    // 3. Verify pending bid displays baseline price and standard total recovery
    expect(screen.getByText('$20.00')).toBeDefined();
    expect(screen.getByText('$1,200.00')).toBeDefined(); // 20.00 * 60
  });
});

