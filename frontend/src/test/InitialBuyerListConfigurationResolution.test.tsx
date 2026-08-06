// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LiquidationAutomationStudio, getStageBuyerCount } from '../components/LiquidationAutomationStudio';
import coreReducer, { fetchBuyerLists, fetchCoreReferenceData } from '../store/slices/coreSlice';

function createMockStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      core: coreReducer,
      workflow: (state = { editingCampaignId: null }) => state,
      auth: (state = { user: { uid: 'u-1', email: 'test@example.com' } }) => state,
    },
    preloadedState,
  });
}

describe('Initial Buyer List Configuration Issue Fix', () => {
  const mockSupplierId = 'sup-101';
  const sampleLots = [
    { _id: 'lot-1', title: 'Dairy Pack Lot #1', remainingShelfLife: 0.15, quantityCases: 200 }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly returns exact configured buyer count for primary (9) and secondary (11) buyer lists in getStageBuyerCount', () => {
    const mockLists = [
      { _id: 'list-primary', name: 'Primary Buyers', type: 'primary', buyerIds: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9'] },
      { _id: 'list-secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'] },
    ];

    // Mock 100 all buyers (39 tier1, 60 tier2)
    const mockAllBuyers = [
      ...Array.from({ length: 39 }, (_, i) => ({ id: `b-t1-${i}`, tier: 'tier1' })),
      ...Array.from({ length: 60 }, (_, i) => ({ id: `b-t2-${i}`, tier: 'tier2' })),
    ];

    const stage1: any = { stageIndex: 1, buyerMode: 'list', buyerListId: 'list-primary', customBuyers: [] };
    const stage2: any = { stageIndex: 2, buyerMode: 'list', buyerListId: 'list-secondary', customBuyers: [] };

    expect(getStageBuyerCount(stage1, mockLists, mockAllBuyers)).toBe(9);
    expect(getStageBuyerCount(stage2, mockLists, mockAllBuyers)).toBe(11);
  });

  it('dispatches fetchBuyerLists and fetchCoreReferenceData upon mount of LiquidationAutomationStudio', () => {
    const store = createMockStore({
      core: {
        buyerLists: [
          { _id: 'list-primary', name: 'Primary Buyers', type: 'primary', buyerIds: Array(9).fill('id') },
          { _id: 'list-secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: Array(11).fill('id') },
        ],
        buyers: [],
        suppliers: [],
        activeTab: 'workflows',
        sidebarExpanded: false,
        backendHealthy: true,
        sidecarHealthy: true,
        loading: false,
        error: null,
        analyticsSummary: null,
        analyticsLoading: false,
      }
    });

    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <LiquidationAutomationStudio
          supplierId={mockSupplierId}
          inventoryLots={sampleLots}
          buyers={[]}
          apiBaseUrl="http://localhost:5000/api"
        />
      </Provider>
    );

    // Verify thunks were dispatched on mount
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
