import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer, { selectInventoryAnalyticsTelemetry } from '../store/slices/inventorySlice';
import coreReducer from '../store/slices/coreSlice';
import InventoryChartsDashboard from '../components/domain/inventory/InventoryChartsDashboard';

describe('Inventory Analytics Live Data Telemetry & Feature Flag (Issue #05)', () => {
  let store: any;

  const mockInventoryList = [
    {
      _id: 'lot-1',
      productId: { _id: 'p1', description: 'Organic Milk 1L', category: 'Dairy', sku: 'SKU-DAIRY-1' },
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 50,
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days (Critical <10d)
      status: 'active',
      distributionCenterId: { _id: 'dc-chicago', name: 'DC - Chicago' },
    },
    {
      _id: 'lot-2',
      productId: { _id: 'p2', description: 'Cereal Boxes 500g', category: 'Dry Goods', sku: 'SKU-DRY-1' },
      quantityCases: 200,
      availableQty: 200,
      costPerCase: 30,
      expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days (10-30d At Risk)
      status: 'active',
      distributionCenterId: { _id: 'dc-dallas', name: 'DC - Dallas' },
    },
    {
      _id: 'lot-3',
      productId: { _id: 'p3', description: 'Frozen Pizza Pack', category: 'Frozen', sku: 'SKU-FROZEN-1' },
      quantityCases: 150,
      availableQty: 150,
      costPerCase: 40,
      expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days (30-60d Moderate)
      status: 'active',
      distributionCenterId: { _id: 'dc-chicago', name: 'DC - Chicago' },
    },
    {
      _id: 'lot-4',
      productId: { _id: 'p4', description: 'Canned Soda 24-pack', category: 'Beverages', sku: 'SKU-BEV-1' },
      quantityCases: 300,
      availableQty: 300,
      costPerCase: 20,
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days (60+d Optimal)
      status: 'active',
      distributionCenterId: { _id: 'dc-atlanta', name: 'DC - Atlanta' },
    },
    {
      _id: 'lot-5',
      productId: { _id: 'p5', description: 'Greek Yogurt 500g', category: 'Dairy', sku: 'SKU-DAIRY-2' },
      quantityCases: 50,
      availableQty: 0,
      costPerCase: 25,
      expirationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'sold',
      distributionCenterId: { _id: 'dc-chicago', name: 'DC - Chicago' },
    },
  ];

  const mockBids = [
    { _id: 'b1', lotId: 'lot-1', category: 'Dairy', price: 35, status: 'submitted' },
    { _id: 'b2', lotId: 'lot-1', category: 'Dairy', price: 40, status: 'submitted' },
    { _id: 'b3', lotId: 'lot-2', category: 'Dry Goods', price: 25, status: 'accepted' },
  ];

  beforeEach(() => {
    store = configureStore({
      reducer: {
        inventory: inventoryReducer,
        core: coreReducer,
      },
      preloadedState: {
        inventory: {
          inventoryList: mockInventoryList,
          allBids: mockBids,
          loading: false,
          error: null,
        } as any,
      },
    });
  });

  describe('Selector Seam: selectInventoryAnalyticsTelemetry', () => {
    it('computes live inventory telemetry correctly from Redux state', () => {
      const telemetry = selectInventoryAnalyticsTelemetry(store.getState());

      // Total COGS: (100*50) + (200*30) + (150*40) + (300*20) + (50*25) = 5000 + 6000 + 6000 + 6000 + 1250 = 24250
      expect(telemetry.totalCOGS).toBe(24250);

      // At-Risk COGS (Critical expiration < 10 days active lots): lot-1 (100 * 50 = 5000)
      expect(telemetry.atRiskCOGS).toBe(5000);

      // RSL Tiers breakdown
      // lot-1: 5 days (<10d)
      // lot-2: 20 days (10-30d)
      // lot-3: 45 days (30-60d)
      // lot-4: 90 days (60+d)
      // Active lots count: 4
      expect(telemetry.rslTiers.critical.count).toBe(1);
      expect(telemetry.rslTiers.atRisk.count).toBe(1);
      expect(telemetry.rslTiers.moderate.count).toBe(1);
      expect(telemetry.rslTiers.optimal.count).toBe(1);
      expect(telemetry.rslTiers.totalActiveLots).toBe(4);

      // Category breakdown
      const dairy = telemetry.categoryBreakdown.find((c: any) => c.category === 'Dairy');
      expect(dairy).toBeDefined();
      expect(dairy?.lotCount).toBe(2);
      expect(dairy?.bidCount).toBe(2);
    });
  });

  describe('Component Seam: InventoryChartsDashboard Live Data & Feature Flag Gating', () => {
    it('renders live telemetry when VITE_ENABLE_ANALYTICS_PREVIEW is enabled', () => {
      // Mock import.meta.env
      vi.stubEnv('VITE_ENABLE_ANALYTICS_PREVIEW', 'true');

      render(
        <Provider store={store}>
          <InventoryChartsDashboard />
        </Provider>
      );

      // Check header and feature flag state badge
      expect(screen.getByText('Inventory Performance & Analytics Suite')).toBeInTheDocument();
      expect(screen.getByText('Live Telemetry Enabled')).toBeInTheDocument();

      // Check dynamic live numbers rendered in COGS chart summary
      expect(screen.getByText(/\$24,250/)).toBeInTheDocument();
      expect(screen.getByText(/\$5,000/)).toBeInTheDocument();

      vi.unstubAllEnvs();
    });

    it('renders gated feature state ("Coming Soon") when VITE_ENABLE_ANALYTICS_PREVIEW is false or unset', () => {
      vi.stubEnv('VITE_ENABLE_ANALYTICS_PREVIEW', 'false');

      render(
        <Provider store={store}>
          <InventoryChartsDashboard />
        </Provider>
      );

      expect(screen.getAllByText('Coming Soon')[0]).toBeInTheDocument();

      vi.unstubAllEnvs();
    });

    it('filters live telemetry when user selects a category filter', () => {
      vi.stubEnv('VITE_ENABLE_ANALYTICS_PREVIEW', 'true');

      render(
        <Provider store={store}>
          <InventoryChartsDashboard />
        </Provider>
      );

      const categoryDropdown = screen.getByDisplayValue('All Categories');
      fireEvent.change(categoryDropdown, { target: { value: 'Dairy' } });

      // Dairy total COGS: lot-1 (5000) + lot-5 (1250) = 6250
      expect(screen.getByText(/\$6,250/)).toBeInTheDocument();

      vi.unstubAllEnvs();
    });
  });
});
