import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer, { setBuyers } from '../store/slices/coreSlice';
import ingestionReducer, {
  setPipelineTab,
  setInventoryParsedResult,
  setSalesRecords,
} from '../store/slices/ingestionSlice';
import inventoryReducer, { setInventoryList } from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import IngestionView from '../views/IngestionView';

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
    },
    preloadedState,
  });
};

describe('Issue #0124: Slice 6 - End-to-End Integration, Styling Polish & Test Suite', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore({
      core: {
        ...coreReducer(undefined, { type: '@@INIT' }),
        suppliers: [
          { _id: 'sup-1', name: 'Unilever Direct', companyCode: 'ULVR', preferredDisposition: 'liquidation' },
        ],
        buyers: [
          {
            _id: 'b-e2e-1',
            buyerId: 'BYR-KRO-001',
            companyName: 'Kroger Salvage Network',
            name: 'Kroger Salvage Network',
            email: 'salvage@kroger.com',
            tier: 'tier1',
            isActive: true,
            optInBidding: true,
            optInSales: true,
            categories: ['Chilled & Dairy', 'Frozen'],
            hubFacilities: ['Midwest Distribution Hub'],
            address: '1014 Vine St, Cincinnati, OH',
          },
        ],
      },
      inventory: {
        ...inventoryReducer(undefined, { type: '@@INIT' }),
        inventoryList: [
          {
            _id: 'lot-e2e-1',
            lotNumber: 'LOT-E2E-2026',
            productId: {
              _id: 'prod-e2e-1',
              description: 'Organic Greek Yogurt 32oz',
              sku: 'ULVR-YOG-E2E',
              brand: 'Breyers Organic',
              category: 'Chilled & Dairy',
              shelfLifeDays: 60,
              standardSellPrice: 18.5,
            },
            supplierId: { _id: 'sup-1', name: 'Unilever Direct' },
            distributionCenterId: { _id: 'dc-1', name: 'Northeast Hub' },
            availableQty: 500,
            totalCases: 500,
            costPerCase: 9.5,
            standardSellPrice: 18.5,
            expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'critical',
          },
        ],
      },
      ingestion: {
        ...ingestionReducer(undefined, { type: '@@INIT' }),
        pipelineTab: 'inventory',
        selectedSupplier: 'sup-1',
        salesRecords: [
          {
            _id: 'sale-e2e-1',
            lotNumber: 'LOT-SALE-99',
            productName: 'Ben & Jerrys Cookie Dough 16oz',
            sku: 'ULVR-ICE-99',
            buyerName: 'Grocery Outlet Bargain Market',
            casesSold: 250,
            pricePerCase: 14.5,
            grossSale: 3625,
            status: 'settled',
            warehouse: 'Dallas Central DC',
            trackingCarrier: 'C.H. Robinson Dedicated',
            invoiceNumber: 'INV-2026-9912',
          },
        ],
      },
    });
  });

  describe('1. Visual Tokens, Dark/Light Mode & Typography Hierarchy', () => {
    it('renders the IngestionView container with responsive styling and dark mode support', () => {
      const { container } = render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      const root = container.querySelector('#ingestion-view');
      expect(root).toBeDefined();
      expect(root?.className).toContain('font-sans');
      expect(root?.className).toContain('dark:bg-slate-950');
      expect(root?.className).toContain('dark:text-slate-100');

      // Verify header typography classes
      const headerTitle = screen.getByText('Surplus Ingestion Pipeline');
      expect(headerTitle.className).toContain('font-bold');
      expect(headerTitle.className).toContain('tracking-tight');
    });

    it('renders Telemetry bar with semantic color classes and Material Symbols icons', () => {
      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Verify KPI metric cards
      expect(screen.getByText('Active Portfolio Value')).toBeDefined();
      expect(screen.getByText('Critical RSL (<14 Days)')).toBeDefined();
      expect(screen.getByText('Liquidation Velocity')).toBeDefined();
      expect(screen.getByText('Matched Buyer Network')).toBeDefined();

      // Material symbols icons rendered
      expect(screen.getByText('account_balance_wallet')).toBeDefined();
      expect(screen.getByText('warning')).toBeDefined();
      expect(screen.getByText('speed')).toBeDefined();
      expect(screen.getByText('verified_user')).toBeDefined();
    });
  });

  describe('2. Responsive Breakpoints & Pipeline Switcher Bar', () => {
    it('renders Pipeline Switcher Bar with inventory, sales, and buyer tabs', () => {
      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      expect(screen.getByRole('tab', { name: /Inventory Pipeline/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /Sales Pipeline/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /Buyer Pipeline/i })).toBeDefined();
    });

    it('switches between inventory, sales, and buyer pipelines cleanly', () => {
      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Default is inventory
      expect(screen.getByText('Inventory Data Ingestion')).toBeDefined();

      // Switch to sales
      fireEvent.click(screen.getByRole('tab', { name: /Sales Pipeline/i }));
      expect(screen.getByText('Sales Data Ingestion')).toBeDefined();

      // Switch to buyers
      fireEvent.click(screen.getByRole('tab', { name: /Buyer Pipeline/i }));
      expect(screen.getByText('Buyer List Ingestion')).toBeDefined();
    });
  });

  describe('3. End-to-End Workflow: Ingest CSV -> In-Situ Mapping Window -> Confirmation', () => {
    it('opens Unified Surplus Data Ingestion Modal from Connectors and simulates CSV mapping handoff', async () => {
      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Ingestion Hub & Connectors exists
      expect(screen.getByText('Ingestion Hub & Connectors')).toBeDefined();

      // Click Upload File button in Connectors card
      const uploadFileBtn = screen.getByRole('button', { name: /Upload File/i });
      fireEvent.click(uploadFileBtn);

      // Unified Ingestion Modal should open
      expect(screen.getByText('Unified Surplus Data Ingestion')).toBeDefined();
      expect(screen.getByText('1. Select Destination Pipeline')).toBeDefined();

      // Simulate parsing result injection into store (in-situ mapping window)
      store.dispatch(
        setInventoryParsedResult({
          documentId: 'doc-e2e-test',
          fileName: 'surplus_e2e_manifest.csv',
          rawGrid: [
            ['Item SKU', 'Case Qty', 'MSRP Unit'],
            ['E2E-ITEM-1', '100', '22.50'],
          ],
          suggestedMapping: {
            sku: 'Item SKU',
            quantity: 'Case Qty',
            price: 'MSRP Unit',
          },
        })
      );

      // In-situ Mapping preview header appears in the Inventory Registry
      await waitFor(() => {
        expect(screen.getByText(/Extract Preview: surplus_e2e_manifest.csv/i)).toBeDefined();
      });
      expect(screen.getByText('Dynamic Semantic Attribute Translation Rules')).toBeDefined();
      expect(screen.getByRole('button', { name: /Confirm & Import Lots/i })).toBeDefined();
    });
  });

  describe('4. End-to-End Workflow: Expand Lot -> Open Operations Hub Transition', () => {
    it('expands inventory lot row drawer and triggers onOpenLotHub callback', () => {
      const handleOpenLotHub = vi.fn();

      render(
        <Provider store={store}>
          <IngestionView onOpenLotHub={handleOpenLotHub} />
        </Provider>
      );

      // Click on the inventory lot row to expand drawer
      const lotDescription = screen.getByText('Organic Greek Yogurt 32oz');
      fireEvent.click(lotDescription);

      // Inspection drawer should be visible with Open Operations Hub button
      const openHubBtn = screen.getByRole('button', { name: /Open Operations Hub/i });
      expect(openHubBtn).toBeDefined();

      // Clicking Open Operations Hub triggers callback with lot details
      fireEvent.click(openHubBtn);
      expect(handleOpenLotHub).toHaveBeenCalledTimes(1);
      expect(handleOpenLotHub).toHaveBeenCalledWith(
        expect.objectContaining({
          lotNumber: 'LOT-E2E-2026',
        })
      );
    });
  });

  describe('5. End-to-End Workflow: Expand Buyer -> Edit Buyer Profile Drawer', () => {
    it('expands buyer row drawer and opens Edit Buyer Profile drawer', async () => {
      store.dispatch(setPipelineTab('buyers'));

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Buyer row rendered
      const buyerName = screen.getByText('Kroger Salvage Network');
      expect(buyerName).toBeDefined();

      // Expand row drawer
      fireEvent.click(buyerName);

      // Click Edit Buyer Profile -> opens BuyerDetailDrawer slide-over
      const editProfileBtn = screen.getByRole('button', { name: /Edit Buyer Profile/i });
      expect(editProfileBtn).toBeDefined();
      fireEvent.click(editProfileBtn);

      // BuyerDetailDrawer opens with buyer information
      await waitFor(() => {
        expect(screen.getByTestId('buyer-detail-drawer')).toBeDefined();
      });
      expect(screen.getAllByText('salvage@kroger.com').length).toBeGreaterThan(0);
    });
  });

  describe('6. Master "Toggle All" State Synchronization', () => {
    it('synchronizes Toggle All button across rows and updates label from Toggle All to Collapse All', () => {
      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      const toggleAllBtn = screen.getByRole('button', { name: /Toggle All/i });
      expect(toggleAllBtn).toBeDefined();
      expect(screen.getByText('Toggle All')).toBeDefined();

      // Click Toggle All to expand all visible rows
      fireEvent.click(toggleAllBtn);

      // Toggle text should update to Collapse All
      expect(screen.getByText('Collapse All')).toBeDefined();

      // Click again to collapse
      fireEvent.click(toggleAllBtn);
      expect(screen.getByText('Toggle All')).toBeDefined();
    });

    it('maintains clean Toggle All synchronization state when switching tabs', () => {
      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      const toggleAllBtn = screen.getByRole('button', { name: /Toggle All/i });
      fireEvent.click(toggleAllBtn);
      expect(screen.getByText('Collapse All')).toBeDefined();

      // Switch to Sales Pipeline
      fireEvent.click(screen.getByRole('tab', { name: /Sales Pipeline/i }));

      // Button resets gracefully to Toggle All
      expect(screen.getByText('Toggle All')).toBeDefined();
    });
  });
});
