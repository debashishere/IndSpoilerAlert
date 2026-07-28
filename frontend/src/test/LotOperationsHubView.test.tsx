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
});
