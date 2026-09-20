import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer, {
  setInventoryList,
  setFilterSearch,
  setFilterSupplier,
  setFilterDC,
  setFilterCategory,
  setFilterStatus,
} from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { InventoryRegistryPanel } from '../components/domain/ingestion/InventoryRegistryPanel';
import { PipelineSwitcherBar } from '../components/domain/ingestion/subcomponents/PipelineSwitcherBar';
import IngestionView from '../views/IngestionView';

const createTestStore = (preloadedInventoryState?: any) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
    },
    preloadedState: {
      inventory: {
        ...inventoryReducer(undefined, { type: '@@INIT' }),
        ...(preloadedInventoryState || {}),
      },
    },
  });
};

const mockInventoryLots = [
  {
    _id: 'lot-001',
    productId: {
      _id: 'prod-001',
      description: 'Breyers Premium Surplus Item #1 (Yogurt)',
      sku: 'ULVR-YOG-001',
      brand: 'Breyers',
      category: 'Chilled & Dairy',
      subCategory: 'Yogurt',
      shelfLifeDays: 45,
    },
    lotNumber: 'LOT-2026-001',
    supplierId: { _id: 'sup-001', name: 'Unilever Direct' },
    distributionCenterId: { _id: 'dc-001', name: 'Northeast Hub' },
    warehouse: 'Northeast Hub, Newark, NJ',
    availableQty: 1200,
    totalCases: 1200,
    costPerCase: 11.0,
    standardSellPrice: 18.0,
    expirationDate: '2026-08-23T00:00:00.000Z',
    productionDate: '2026-07-13T00:00:00.000Z',
    createdAt: '2026-08-19T00:00:00.000Z',
    temperatureMin: 34,
    temperatureMax: 38,
    status: 'Sold',
    palletCount: 80,
  },
  {
    _id: 'lot-002',
    productId: {
      _id: 'prod-002',
      description: 'Pure Leaf Premium Surplus Item #3 (Tea)',
      sku: 'ULVR-TEA-003',
      brand: 'Pure Leaf',
      category: 'Ambient / Beverages',
      subCategory: 'Tea',
      shelfLifeDays: 120,
    },
    lotNumber: 'LOT-2026-003',
    supplierId: { _id: 'sup-002', name: 'PepsiCo Supply' },
    distributionCenterId: { _id: 'dc-002', name: 'Texas Central' },
    warehouse: 'Texas Central Facility, Dallas, TX',
    availableQty: 2899,
    totalCases: 3000,
    costPerCase: 13.0,
    standardSellPrice: 21.0,
    expirationDate: '2026-09-30T00:00:00.000Z',
    productionDate: '2026-07-11T00:00:00.000Z',
    createdAt: '2026-08-19T00:00:00.000Z',
    temperatureMin: 50,
    temperatureMax: 72,
    status: 'Active List',
    palletCount: 14,
  },
  {
    _id: 'lot-003',
    productId: {
      _id: 'prod-003',
      description: 'Heinz Premium Surplus Item #4 (Condiments)',
      sku: 'KHC-KET-004',
      brand: 'Heinz',
      category: 'Condiments',
      subCategory: 'Ketchup',
      shelfLifeDays: 180,
    },
    lotNumber: 'LOT-2026-004',
    supplierId: { _id: 'sup-003', name: 'Kraft Heinz Co' },
    distributionCenterId: { _id: 'dc-003', name: 'Pacific Northwest' },
    warehouse: 'Pacific Northwest Hub, Seattle, WA',
    availableQty: 1080,
    totalCases: 1080,
    costPerCase: 14.0,
    standardSellPrice: 22.0,
    expirationDate: '2026-08-30T00:00:00.000Z',
    productionDate: '2026-07-10T00:00:00.000Z',
    createdAt: '2026-08-19T00:00:00.000Z',
    temperatureMin: 50,
    temperatureMax: 72,
    status: 'Critical RSL',
    palletCount: 36,
  },
];

describe('Issue #0121: Slice 3 - Inventory Pipeline Modern Grid & Progressive Inspection Drawer', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    testStore = createTestStore({
      inventoryList: mockInventoryLots,
      listFilterSearch: '',
      listFilterSupplier: '',
      listFilterDC: '',
      listFilterCategory: '',
      listFilterStatus: '',
      currentPage: 1,
      itemsPerPage: 10,
      sortField: 'expirationDate',
      sortDirection: 'asc',
    });
  });

  describe('1. Dedicated Inventory Filter Bar', () => {
    it('renders all 5 filter controls with Stitch labels and placeholder', () => {
      render(
        <Provider store={testStore}>
          <InventoryRegistryPanel />
        </Provider>
      );

      // 1. Search input
      const searchInput = screen.getByPlaceholderText('Search SKU, product description...');
      expect(searchInput).toBeDefined();

      // 2. Supplier select
      expect(screen.getByRole('combobox', { name: /supplier/i })).toBeDefined();

      // 3. Distribution Center select
      expect(screen.getByRole('combobox', { name: /distribution center/i })).toBeDefined();

      // 4. Category select
      expect(screen.getByRole('combobox', { name: /category/i })).toBeDefined();

      // 5. Status select
      expect(screen.getByRole('combobox', { name: /status/i })).toBeDefined();
    });

    it('filters lots dynamically by search term, supplier, DC, category, and status', () => {
      render(
        <Provider store={testStore}>
          <InventoryRegistryPanel />
        </Provider>
      );

      // Initially all 3 lots are rendered
      expect(screen.getByText('Breyers Premium Surplus Item #1 (Yogurt)')).toBeDefined();
      expect(screen.getByText('Pure Leaf Premium Surplus Item #3 (Tea)')).toBeDefined();
      expect(screen.getByText('Heinz Premium Surplus Item #4 (Condiments)')).toBeDefined();

      // Search filter
      const searchInput = screen.getByPlaceholderText('Search SKU, product description...');
      fireEvent.change(searchInput, { target: { value: 'Breyers' } });

      expect(screen.getByText('Breyers Premium Surplus Item #1 (Yogurt)')).toBeDefined();
      expect(screen.queryByText('Pure Leaf Premium Surplus Item #3 (Tea)')).toBeNull();
      expect(screen.queryByText('Heinz Premium Surplus Item #4 (Condiments)')).toBeNull();

      // Clear search and filter by status
      fireEvent.change(searchInput, { target: { value: '' } });
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.change(statusSelect, { target: { value: 'Critical RSL' } });

      expect(screen.queryByText('Breyers Premium Surplus Item #1 (Yogurt)')).toBeNull();
      expect(screen.queryByText('Pure Leaf Premium Surplus Item #3 (Tea)')).toBeNull();
      expect(screen.getByText('Heinz Premium Surplus Item #4 (Condiments)')).toBeDefined();
    });

    it('renders "Clear Filters" button when any filter is active and resets filters when clicked', () => {
      render(
        <Provider store={testStore}>
          <InventoryRegistryPanel />
        </Provider>
      );

      // Initially no Clear Filters button
      expect(screen.queryByRole('button', { name: /clear filters/i })).toBeNull();

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search SKU, product description...');
      fireEvent.change(searchInput, { target: { value: 'Tea' } });

      const clearBtn = screen.getByRole('button', { name: /clear filters/i });
      expect(clearBtn).toBeDefined();

      // Click clear
      fireEvent.click(clearBtn);

      expect((searchInput as HTMLInputElement).value).toBe('');
      expect(screen.getByText('Breyers Premium Surplus Item #1 (Yogurt)')).toBeDefined();
      expect(screen.getByText('Pure Leaf Premium Surplus Item #3 (Tea)')).toBeDefined();
      expect(screen.getByText('Heinz Premium Surplus Item #4 (Condiments)')).toBeDefined();
    });
  });

  describe('2. Modern Table Header and Rows', () => {
    it('renders table headers and Stitch visual pill tags (SKU, brand, category, RSL progress bar, price details)', () => {
      render(
        <Provider store={testStore}>
          <InventoryRegistryPanel />
        </Provider>
      );

      // Headers
      expect(screen.getByText('PRODUCT / SKU')).toBeDefined();
      expect(screen.getByText('SUPPLIER')).toBeDefined();
      expect(screen.getByText('DISTRIBUTION CENTER')).toBeDefined();
      expect(screen.getByText('EXPIRATION & RSL')).toBeDefined();
      expect(screen.getByText('STORAGE TEMP')).toBeDefined();
      expect(screen.getByText('QUANTITY CASES')).toBeDefined();
      expect(screen.getByText('PRICE DETAILS')).toBeDefined();
      expect(screen.getByText('CREATE DATE')).toBeDefined();
      expect(screen.getByText('STATUS')).toBeDefined();

      // Row elements for lot-001
      expect(screen.getByText('ULVR-YOG-001')).toBeDefined();
      expect(screen.getByText('Breyers')).toBeDefined();
      expect(screen.getByText('Yogurt')).toBeDefined();
      expect(screen.getByText('Lot: LOT-2026-001')).toBeDefined();
      expect(screen.getAllByText('Unilever Direct').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('34°F to 38°F')).toBeDefined();
      expect(screen.getByText('1,200 cases')).toBeDefined();
      expect(screen.getByText('$11.00')).toBeDefined();
      expect(screen.getByText('SOLD')).toBeDefined();
    });
  });

  describe('3. Progressive Row Inspection Drawer & Batch Operations', () => {
    it('clicking a lot row expands the in-situ inspection drawer revealing cold-chain, FEFO, valuation, and batch operations without navigating away', () => {
      const onOpenLotHub = vi.fn();
      render(
        <Provider store={testStore}>
          <InventoryRegistryPanel onOpenLotHub={onOpenLotHub} />
        </Provider>
      );

      // Initially drawer is closed
      expect(screen.queryByText('Cold-Chain Telemetry')).toBeNull();
      expect(screen.queryByText('FEFO Lifecycle Matrix')).toBeNull();

      // Click on row 1
      const row1 = screen.getByText('Breyers Premium Surplus Item #1 (Yogurt)').closest('.lot-row');
      expect(row1).not.toBeNull();
      fireEvent.click(row1!);

      // Navigation should NOT be triggered on row click (ADR 0041)
      expect(onOpenLotHub).not.toHaveBeenCalled();

      // Drawer should now be visible
      expect(screen.getByText('Cold-Chain Telemetry')).toBeDefined();
      expect(screen.getByText('FEFO Lifecycle Matrix')).toBeDefined();
      expect(screen.getByText('Valuation & Recovery Margin')).toBeDefined();
      expect(screen.getByText('Batch Operations')).toBeDefined();

      // Verify Cold-Chain Telemetry details
      expect(screen.getByText(/34°F – 38°F/i)).toBeDefined();
      expect(screen.getByText(/80 Pallets/i)).toBeDefined();

      // Verify FEFO details
      expect(screen.getByText(/Pack Date:/i)).toBeDefined();
      expect(screen.getByText(/Exp. Date:/i)).toBeDefined();

      // Verify Valuation details
      expect(screen.getByText(/Original MSRP:/i)).toBeDefined();
      expect(screen.getByText(/Target Liquidation:/i)).toBeDefined();
      expect(screen.getByText(/Min Reserve:/i)).toBeDefined();

      // Verify Batch Operations CTA buttons
      expect(screen.getByRole('button', { name: /Open Operations Hub/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /COA/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Quarantine/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Push to Bidding/i })).toBeDefined();

      // Re-clicking collapses the drawer
      fireEvent.click(row1!);
      expect(screen.queryByText('Cold-Chain Telemetry')).toBeNull();
    });

    it('clicking "Open Operations Hub" in the expanded drawer dispatches onOpenLotHub(lot) with the selected lot', () => {
      const onOpenLotHub = vi.fn();
      render(
        <Provider store={testStore}>
          <InventoryRegistryPanel onOpenLotHub={onOpenLotHub} />
        </Provider>
      );

      // Open drawer
      const row1 = screen.getByText('Breyers Premium Surplus Item #1 (Yogurt)').closest('.lot-row');
      fireEvent.click(row1!);

      // Click "Open Operations Hub" button
      const openHubBtn = screen.getByRole('button', { name: /Open Operations Hub/i });
      fireEvent.click(openHubBtn);

      expect(onOpenLotHub).toHaveBeenCalledTimes(1);
      expect(onOpenLotHub).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'lot-001',
          lotNumber: 'LOT-2026-001',
        })
      );
    });
  });

  describe('4. Master "Toggle All" Synchronization', () => {
    it('master Toggle All button expands all visible rows if any are closed, and collapses all if all are open, synchronizing its label', () => {
      render(
        <Provider store={testStore}>
          <div>
            <PipelineSwitcherBar activeTab="inventory" onTabChange={() => {}} />
            <InventoryRegistryPanel />
          </div>
        </Provider>
      );

      const toggleAllBtn = screen.getByRole('button', { name: /toggle all/i });
      expect(toggleAllBtn).toBeDefined();
      expect(screen.getByText('Toggle All')).toBeDefined();

      // Initially no drawers are open
      expect(screen.queryAllByText('Cold-Chain Telemetry')).toHaveLength(0);

      // Click Toggle All -> expands all 3 rows
      fireEvent.click(toggleAllBtn);

      // All 3 drawers should be open
      expect(screen.getAllByText('Cold-Chain Telemetry')).toHaveLength(3);
      expect(screen.getByText('Collapse All')).toBeDefined();

      // Click again -> collapses all rows
      fireEvent.click(toggleAllBtn);

      expect(screen.queryAllByText('Cold-Chain Telemetry')).toHaveLength(0);
      expect(screen.getByText('Toggle All')).toBeDefined();
    });
  });
});
