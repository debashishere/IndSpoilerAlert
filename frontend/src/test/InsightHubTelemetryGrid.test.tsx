import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import { InventoryListView } from '../views/InventoryListView';

describe('Insight Hub Two-Tier Telemetry Grid (0127 - Slice 2)', () => {
  const mockInventory = [
    {
      id: 'lot-1',
      productName: 'Organic Milk',
      quantityCases: 100,
      costPerCase: 20,
      standardSellPrice: 30,
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: 'lot-2',
      productName: 'Cheddar Cheese',
      quantityCases: 50,
      costPerCase: 40,
      standardSellPrice: 60,
      expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
  ];

  const mockSales = [
    {
      id: 'sale-1',
      lotId: 'lot-1',
      quantity: 50,
      price: 25,
      date: new Date().toISOString(),
    },
  ];

  const mockBuyers = [
    { id: 'b1', name: 'Buyer One', isActive: true },
    { id: 'b2', name: 'Buyer Two', isActive: true },
  ];

  const mockAnalyticsPayload = {
    summary: {
      totalRecoveredValue: 1250,
      totalCOGS: 4000,
      caseStats: {
        total: 200,
        sold: 50,
        donated: 50,
        recycled: 50,
        expired: 50,
      },
    },
  };

  function createTestStore() {
    const store = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
      },
    });

    store.dispatch({
      type: 'inventory/setInventoryList',
      payload: mockInventory,
    });
    store.dispatch({
      type: 'ingestion/setSalesRecords',
      payload: mockSales,
    });
    store.dispatch({
      type: 'core/setBuyers',
      payload: mockBuyers,
    });
    store.dispatch({
      type: 'core/fetchAnalyticsSummary/fulfilled',
      payload: mockAnalyticsPayload,
    });

    return store;
  }

  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () =>
      ({ ok: true, status: 200, json: async () => ({}) }) as Response
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the 7-card two-tier grid layout and replaces legacy Critical Expirations with Critical RSL (<14 Days)', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Row 1: Valuation & Financial Performance (4 cards)
    expect(screen.getByText('Active Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
    expect(screen.getByText('Revenue Secured')).toBeInTheDocument();
    expect(screen.getByText('Landfill Diversion Rate')).toBeInTheDocument();

    // Row 2: Operational Flow & Buyer Liquidity (3 cards)
    expect(screen.getByText('Critical RSL (<14 Days)')).toBeInTheDocument();
    expect(screen.getByText('Liquidation Velocity')).toBeInTheDocument();
    expect(screen.getByText('Matched Buyer Network')).toBeInTheDocument();

    // Legacy card must be deprecated and removed
    expect(screen.queryByText('Critical Expirations')).not.toBeInTheDocument();
    expect(screen.queryByText(/Lots expiring in < 10 days/i)).not.toBeInTheDocument();
  });

  it('hydrates dynamic telemetry values for both financial and operational cards from store state', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    const tier1 = screen.getByTestId('telemetry-tier-1');
    const tier2 = screen.getByTestId('telemetry-tier-2');

    // Row 1 values scoped to Tier 1
    expect(within(tier1).getByText('$6,000')).toBeInTheDocument();
    expect(within(tier1).getByText('$4,000')).toBeInTheDocument();
    expect(within(tier1).getByText('$1,250')).toBeInTheDocument();
    expect(within(tier1).getByText('75%')).toBeInTheDocument();

    // Row 2 values scoped to Tier 2 (from useIngestionTelemetry)
    expect(within(tier2).getByText('1 Lot')).toBeInTheDocument();
    expect(within(tier2).getByText('25.0%')).toBeInTheDocument();
    expect(within(tier2).getByText('2 Verified')).toBeInTheDocument();
  });

  it('coordinates single-active info disclosure exclusively across all 7 cards in both tiers', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Initially, no info popover is visible
    expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();

    // 1. Open Tier 1 card (Active Portfolio Value)
    const portfolioInfoBtn = screen.getByRole('button', {
      name: /More information about Active Portfolio Value/i,
    });
    fireEvent.click(portfolioInfoBtn);

    expect(screen.getByText('Active Portfolio Value Info')).toBeInTheDocument();
    expect(screen.getAllByTestId('info-overlay')).toHaveLength(1);

    // 2. Open Tier 2 card (Critical RSL (<14 Days)) -> Portfolio should close, RSL should open
    const rslInfoBtn = screen.getByRole('button', {
      name: /More information about Critical RSL \(<14 Days\)/i,
    });
    fireEvent.click(rslInfoBtn);

    expect(screen.queryByText('Active Portfolio Value Info')).not.toBeInTheDocument();
    expect(screen.getByText('Critical RSL (<14 Days) Info')).toBeInTheDocument();
    expect(screen.getAllByTestId('info-overlay')).toHaveLength(1);

    // 3. Clicking the same button again toggles it off
    fireEvent.click(rslInfoBtn);
    expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();

    // 4. Open Tier 2 card (Liquidation Velocity) and close with the 'X' button
    const velocityInfoBtn = screen.getByRole('button', {
      name: /More information about Liquidation Velocity/i,
    });
    fireEvent.click(velocityInfoBtn);
    expect(screen.getByText('Liquidation Velocity Info')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();

    // 5. Open Tier 2 card (Matched Buyer Network) and dismiss with outside click
    const buyerInfoBtn = screen.getByRole('button', {
      name: /More information about Matched Buyer Network/i,
    });
    fireEvent.click(buyerInfoBtn);
    expect(screen.getByText('Matched Buyer Network Info')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();
  });
});
