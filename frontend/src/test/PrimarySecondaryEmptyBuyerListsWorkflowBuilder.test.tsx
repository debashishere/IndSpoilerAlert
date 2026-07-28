// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LiquidationAutomationStudio, getStageBuyerCount } from '../components/LiquidationAutomationStudio';
import coreReducer from '../store/slices/coreSlice';

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

describe('Primary and Secondary Buyer List Configuration in Workflow Builder', () => {
  const mockSupplierId = 'sup-101';
  const sampleLots = [
    { _id: 'lot-1', title: 'Dairy Pack Lot #1', remainingShelfLife: 0.15, quantityCases: 200 }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders default Primary and Secondary Buyer Lists as empty (0 buyers) initially', () => {
    const store = createMockStore({
      core: {
        buyerLists: [
          { _id: 'list-primary', name: 'Primary Buyers', type: 'primary', buyerIds: [] },
          { _id: 'list-secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: [] },
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

    const dropdowns = screen.getAllByRole('combobox');
    const listDropdown = dropdowns.find(d => {
      return Array.from(d.querySelectorAll('option')).some(opt => opt.textContent?.includes('Primary Buyers'));
    }) as HTMLSelectElement;

    expect(listDropdown).toBeDefined();

    const options = Array.from(listDropdown.querySelectorAll('option'));
    const primaryOption = options.find(opt => opt.textContent?.includes('Primary Buyers'));
    const secondaryOption = options.find(opt => opt.textContent?.includes('Secondary Liquidators'));

    expect(primaryOption).toBeDefined();
    expect(primaryOption?.textContent).toContain('Primary Buyers — 0 buyers (Error: No buyers configured)');
    expect(primaryOption?.disabled).toBe(true);

    expect(secondaryOption).toBeDefined();
    expect(secondaryOption?.textContent).toContain('Secondary Liquidators — 0 buyers (Error: No buyers configured)');
    expect(secondaryOption?.disabled).toBe(true);
  });

  it('displays zero-buyer error banner when an empty buyer list is assigned to a workflow stage', () => {
    const store = createMockStore({
      core: {
        buyerLists: [
          { _id: 'list-primary', name: 'Primary Buyers', type: 'primary', buyerIds: [] },
          { _id: 'list-secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: [] },
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

    const zeroBuyerBanners = screen.getAllByTestId('zero-buyer-error-banner');
    expect(zeroBuyerBanners.length).toBeGreaterThan(0);
    expect(zeroBuyerBanners[0].textContent).toMatch(/No buyers configured|0 targeted buyers|unactive and unselectable/i);
  });

  it('returns 0 for empty buyer lists in getStageBuyerCount', () => {
    const emptyPrimaryStage: any = {
      stageIndex: 1,
      name: 'Stage 1',
      buyerMode: 'list',
      buyerListId: 'list-primary',
      buyerListName: 'Primary Buyers',
      customBuyers: [],
    };

    const mockLists = [
      { _id: 'list-primary', name: 'Primary Buyers', type: 'primary', buyerIds: [] },
      { _id: 'list-secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: [] },
    ];

    const count = getStageBuyerCount(emptyPrimaryStage, mockLists);
    expect(count).toBe(0);
  });
});
