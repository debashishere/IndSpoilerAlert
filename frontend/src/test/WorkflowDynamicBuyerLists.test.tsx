// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  LiquidationAutomationStudio,
  getStageBuyerCount,
  resolveStagesWithBuyerLists
} from '../components/LiquidationAutomationStudio';
import coreReducer, { setBuyerLists } from '../store/slices/coreSlice';

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

describe('Issue #05 — Workflow Builder Dynamic Buyer Lists', () => {
  const mockSupplierId = 'sup-101';

  const mockBuyerLists = [
    { _id: 'list-primary', name: 'Primary Buyers', type: 'primary', buyerIds: ['b1', 'b2', 'b3'] },
    { _id: 'list-secondary', name: 'Secondary Liquidators', type: 'secondary', buyerIds: ['b4'] },
    { _id: 'list-custom-1', name: 'Northeast Regional Tier 1', type: 'custom', buyerIds: ['b1', 'b5', 'b6', 'b7'] },
  ];

  const sampleLots = [
    { _id: 'lot-1', title: 'Dairy Pack Lot #1', remainingShelfLife: 0.15, quantityCases: 200 }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStageBuyerCount function', () => {
    it('returns the list member count when buyerMode === "list"', () => {
      const stage: any = {
        stageIndex: 1,
        name: 'Stage 1',
        buyerMode: 'list',
        buyerListId: 'list-primary',
        buyerListName: 'Primary Buyers',
        customBuyers: [],
      };

      const count = getStageBuyerCount(stage, mockBuyerLists);
      expect(count).toBe(3);
    });

    it('returns customBuyers.length when buyerMode === "custom"', () => {
      const stage: any = {
        stageIndex: 1,
        name: 'Stage 1',
        buyerMode: 'custom',
        buyerListId: '',
        buyerListName: '',
        customBuyers: [
          { id: 'b1', name: 'Buyer 1', email: 'b1@test.com', tier: 'tier1' },
          { id: 'b2', name: 'Buyer 2', email: 'b2@test.com', tier: 'tier2' },
        ],
      };

      const count = getStageBuyerCount(stage, mockBuyerLists);
      expect(count).toBe(2);
    });

    it('returns 0 when buyerListId is not found in buyerLists', () => {
      const stage: any = {
        stageIndex: 1,
        name: 'Stage 1',
        buyerMode: 'list',
        buyerListId: 'non-existent-id',
        buyerListName: 'Unknown List',
        customBuyers: [],
      };

      const count = getStageBuyerCount(stage, mockBuyerLists);
      expect(count).toBe(0);
    });
  });

  describe('StageAudiencePicker component rendering and behavior', () => {
    it('renders live buyer lists from Redux store in the target dropdown', () => {
      const store = createMockStore({
        core: {
          buyerLists: mockBuyerLists,
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

      // Check for select dropdown containing buyer lists
      const dropdowns = screen.getAllByRole('combobox');
      const listDropdown = dropdowns.find(d => {
        return Array.from(d.querySelectorAll('option')).some(opt => opt.textContent?.includes('Primary Buyers'));
      });

      expect(listDropdown).toBeDefined();
      expect(listDropdown?.textContent).toContain('Primary Buyers — 3 buyers');
      expect(listDropdown?.textContent).toContain('Secondary Liquidators — 1 buyers');
      expect(listDropdown?.textContent).toContain('Northeast Regional Tier 1 — 4 buyers');
    });

    it('updates stage buyerListId and buyerListName when a buyer list is selected', () => {
      const store = createMockStore({
        core: {
          buyerLists: mockBuyerLists,
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

      // Change selection to Northeast Regional Tier 1
      fireEvent.change(listDropdown, { target: { value: 'list-custom-1' } });

      expect(listDropdown.value).toBe('list-custom-1');
    });

    it('returns 0 buyers and disables Eye button when selected buyer list has empty buyerIds array', () => {
      const emptyBuyerList = [
        { _id: 'list-empty', name: 'Primary Buyers', type: 'primary', buyerIds: [] }
      ];
      const store = createMockStore({
        core: {
          buyerLists: emptyBuyerList,
          buyers: [{ _id: 'b-1', name: 'Global Buyer', email: 'g@test.com', tier: 'tier1' }],
          suppliers: [],
          activeTab: 'workflows',
        }
      });

      render(
        <Provider store={store}>
          <LiquidationAutomationStudio
            supplierId={mockSupplierId}
            inventoryLots={sampleLots}
            buyers={[{ _id: 'b-1', name: 'Global Buyer', email: 'g@test.com', tier: 'tier1' }]}
            apiBaseUrl="http://localhost:5000/api"
          />
        </Provider>
      );

      // Verify list count returns 0 (not 1 from global buyers fallback)
      const stage = { stageIndex: 1, buyerMode: 'list' as const, buyerListId: 'list-empty', customBuyers: [] };
      expect(getStageBuyerCount(stage as any, emptyBuyerList, [{ _id: 'b-1', name: 'Global Buyer', email: 'g@test.com', tier: 'tier1' }])).toBe(0);

      // Verify Eye button is disabled
      const eyeBtns = screen.getAllByTitle(/Selected buyer list has 0 buyers configured/i);
      expect(eyeBtns.length).toBeGreaterThan(0);
      expect((eyeBtns[0] as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('resolveStagesWithBuyerLists function', () => {
    it('maps placeholder primary and secondary stage buyerListIds to real MongoDB _ids from buyerLists', () => {
      const stages: any[] = [
        { stageIndex: 1, buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers' },
        { stageIndex: 2, buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators' }
      ];

      const resolved = resolveStagesWithBuyerLists(stages, mockBuyerLists);
      expect(resolved[0].buyerListId).toBe('list-primary');
      expect(resolved[0].buyerListName).toBe('Primary Buyers');
      expect(resolved[1].buyerListId).toBe('list-secondary');
      expect(resolved[1].buyerListName).toBe('Secondary Liquidators');
    });

    it('preserves existing stage _id if already matching a buyer list', () => {
      const stages: any[] = [
        { stageIndex: 1, buyerMode: 'list', buyerListId: 'list-custom-1', buyerListName: 'Northeast Regional Tier 1' }
      ];

      const resolved = resolveStagesWithBuyerLists(stages, mockBuyerLists);
      expect(resolved[0].buyerListId).toBe('list-custom-1');
      expect(resolved[0].buyerListName).toBe('Northeast Regional Tier 1');
    });
  });

  describe('Backward compatibility', () => {
    it('handles legacy buyerSegment field gracefully without crashing', () => {
      const store = createMockStore({
        core: {
          buyerLists: mockBuyerLists,
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

      // Pass legacy stage data in getStageBuyerCount
      const legacyStage: any = {
        stageIndex: 1,
        name: 'Stage 1',
        buyerMode: 'segment',
        buyerSegment: 'tier1_retailers',
        customBuyers: [],
      };

      // Should not throw exception
      expect(() => getStageBuyerCount(legacyStage, mockBuyerLists)).not.toThrow();
    });
  });
});
