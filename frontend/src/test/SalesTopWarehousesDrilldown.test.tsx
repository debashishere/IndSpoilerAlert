import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { coreSlice, type SalesWarehouseSummary } from '../store/slices/coreSlice';
import { ingestionSlice } from '../store/slices/ingestionSlice';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';

const mockTopWarehouses: SalesWarehouseSummary[] = [
  {
    rank: 1,
    warehouse: 'Unilever Midwest DC (Chicago, IL)',
    clearedRevenue: 154200,
    casesCleared: 5200,
    recoveryPct: 76.5,
    transactionCount: 2,
    transactions: [
      {
        id: 'tx-wh-1',
        saleDate: '2026-09-21T11:00:00Z',
        lotId: 'lot-wh-101',
        lotNumber: 'LOT-CHI-101',
        invoiceNumber: 'INV-CHI-2001',
        sku: 'SKU-DAIRY-01',
        product: 'Organic Whole Milk 1gal',
        brand: 'Organic Valley',
        buyer: 'Bargain Hunt Liquidation',
        buyerSegment: 'Regional Off-Price Retailer',
        warehouse: 'Unilever Midwest DC (Chicago, IL)',
        quantityCases: 2200,
        pricePerCase: 35.0,
        revenue: 77000,
        recoveryPct: 78.0,
        status: 'delivered',
      },
      {
        id: 'tx-wh-2',
        saleDate: '2026-09-23T15:30:00Z',
        lotId: 'lot-wh-102',
        lotNumber: 'LOT-CHI-102',
        invoiceNumber: 'INV-CHI-2002',
        sku: 'SKU-BEV-02',
        product: 'Cold Brew Coffee 12pk',
        brand: 'Chameleon',
        buyer: 'Daily Harvest Outlets',
        buyerSegment: 'Discount Grocery Chain',
        warehouse: 'Unilever Midwest DC (Chicago, IL)',
        quantityCases: 3000,
        pricePerCase: 25.73,
        revenue: 77200,
        recoveryPct: 75.0,
        status: 'in_transit',
      },
    ],
  },
  {
    rank: 2,
    warehouse: 'Kraft Heinz DC (Dallas, TX)',
    clearedRevenue: 118400,
    casesCleared: 4100,
    recoveryPct: 72.8,
    transactionCount: 1,
    transactions: [
      {
        id: 'tx-wh-3',
        saleDate: '2026-09-24T09:45:00Z',
        lotId: 'lot-wh-103',
        lotNumber: 'LOT-DFW-103',
        invoiceNumber: 'INV-DFW-2003',
        sku: 'SKU-SNK-03',
        product: 'Almond Butter Granola',
        brand: 'Purely Elizabeth',
        buyer: 'Ollie’s Bargain Outlet',
        buyerSegment: 'Closeout Specialist',
        warehouse: 'Kraft Heinz DC (Dallas, TX)',
        quantityCases: 4100,
        pricePerCase: 28.88,
        revenue: 118400,
        recoveryPct: 72.8,
        status: 'pending',
      },
    ],
  },
];

function createMockStore(topWarehouses: SalesWarehouseSummary[] = mockTopWarehouses) {
  return configureStore({
    reducer: {
      core: coreSlice.reducer,
      ingestion: ingestionSlice.reducer,
    },
    preloadedState: {
      core: {
        activeTab: 'inventory' as any,
        returnTab: null,
        sidebarExpanded: false,
        backendHealthy: true,
        sidecarHealthy: true,
        suppliers: [],
        buyers: [],
        buyerLists: [],
        loading: false,
        error: null,
        analyticsSummary: null,
        analyticsLoading: false,
        salesAnalytics: {
          totalRevenue: 272600,
          revenueGrowthPct: 15.0,
          totalVolume: 9300,
          avgPrice: 29.31,
          reconciledCount: 3,
          totalCount: 3,
          categories: ['Dairy', 'Beverages', 'Snacks'],
          warehouses: ['Unilever Midwest DC (Chicago, IL)', 'Kraft Heinz DC (Dallas, TX)'],
          trajectory: [],
          topBuyers: [],
          topWarehouses,
        },
        salesAnalyticsLoading: false,
      },
      ingestion: {
        inventoryList: [],
        salesRecords: [],
        buyers: [],
        selectedSupplier: 'supp-123',
        selectedBuyer: '',
        supplierStats: null,
        buyerStats: null,
        channelDistribution: null,
        cogsSummary: null,
        recentActivity: [],
        loading: false,
        error: null,
      },
    },
  });
}

describe('Seam: Top Warehouses / DCs Expandable Accordion & Drilldown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ranked summary cards showing rank badge, warehouse name/location, cleared revenue, case volume, recovery % badge, and cleared transaction count', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Switch to Top Warehouses / DCs subtab
    const warehousesTab = screen.getByRole('tab', { name: /top warehouses \/ dcs/i });
    fireEvent.click(warehousesTab);

    // Verify subview container
    const warehousesPanel = screen.getByTestId('sales-subview-warehouses');
    expect(warehousesPanel).toBeInTheDocument();

    // Verify Warehouse 1 Summary Card
    const wh1Card = screen.getByTestId('warehouse-card-warehouse-1');
    expect(wh1Card).toBeInTheDocument();
    expect(within(wh1Card).getByText('#1')).toBeInTheDocument();
    expect(within(wh1Card).getByText('Unilever Midwest DC (Chicago, IL)')).toBeInTheDocument();
    expect(within(wh1Card).getByText(/\$154,200/)).toBeInTheDocument();
    expect(within(wh1Card).getAllByText(/5,200 cases/i)).toHaveLength(2);
    expect(within(wh1Card).getByText(/76\.5% recovery/i)).toBeInTheDocument();
    expect(within(wh1Card).getByText(/2 transactions/i)).toBeInTheDocument();

    // Verify Warehouse 2 Summary Card
    const wh2Card = screen.getByTestId('warehouse-card-warehouse-2');
    expect(wh2Card).toBeInTheDocument();
    expect(within(wh2Card).getByText('#2')).toBeInTheDocument();
    expect(within(wh2Card).getByText('Kraft Heinz DC (Dallas, TX)')).toBeInTheDocument();
    expect(within(wh2Card).getByText(/\$118,400/)).toBeInTheDocument();
    expect(within(wh2Card).getAllByText(/4,100 cases/i)).toHaveLength(2);
    expect(within(wh2Card).getByText(/72\.8% recovery/i)).toBeInTheDocument();
    expect(within(wh2Card).getByText(/1 transaction/i)).toBeInTheDocument();
  });

  it('renders a friendly empty state when no top warehouses are returned', () => {
    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const warehousesTab = screen.getByRole('tab', { name: /top warehouses \/ dcs/i });
    fireEvent.click(warehousesTab);

    expect(screen.getByTestId('top-warehouses-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no warehouse clearing activity recorded/i)).toBeInTheDocument();
  });

  it('expands and collapses inline accordions independently across multiple warehouse cards', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const warehousesTab = screen.getByRole('tab', { name: /top warehouses \/ dcs/i });
    fireEvent.click(warehousesTab);

    // Initially, transaction ledgers should not be visible
    expect(screen.queryByTestId('warehouse-transactions-panel-warehouse-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warehouse-transactions-panel-warehouse-2')).not.toBeInTheDocument();

    const wh1Trigger = screen.getByRole('button', { name: /unilever midwest dc/i });
    const wh2Trigger = screen.getByRole('button', { name: /kraft heinz dc/i });

    // Expand Warehouse 1
    fireEvent.click(wh1Trigger);
    expect(screen.getByTestId('warehouse-transactions-panel-warehouse-1')).toBeInTheDocument();
    expect(screen.queryByTestId('warehouse-transactions-panel-warehouse-2')).not.toBeInTheDocument();

    // Expand Warehouse 2: both should now be expanded simultaneously
    fireEvent.click(wh2Trigger);
    expect(screen.getByTestId('warehouse-transactions-panel-warehouse-1')).toBeInTheDocument();
    expect(screen.getByTestId('warehouse-transactions-panel-warehouse-2')).toBeInTheDocument();

    // Collapse Warehouse 1: Warehouse 2 remains expanded
    fireEvent.click(wh1Trigger);
    expect(screen.queryByTestId('warehouse-transactions-panel-warehouse-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('warehouse-transactions-panel-warehouse-2')).toBeInTheDocument();

    // Collapse Warehouse 2
    fireEvent.click(wh2Trigger);
    expect(screen.queryByTestId('warehouse-transactions-panel-warehouse-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warehouse-transactions-panel-warehouse-2')).not.toBeInTheDocument();
  });

  it('renders child transaction table with all required columns and metrics', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const warehousesTab = screen.getByRole('tab', { name: /top warehouses \/ dcs/i });
    fireEvent.click(warehousesTab);

    const wh1Trigger = screen.getByRole('button', { name: /unilever midwest dc/i });
    fireEvent.click(wh1Trigger);

    const panel = screen.getByTestId('warehouse-transactions-panel-warehouse-1');
    expect(panel).toBeInTheDocument();

    // Verify Table Headers
    const saleDateHeader = within(panel).getByText('Sale Date');
    expect(saleDateHeader).toBeInTheDocument();
    expect(saleDateHeader).toHaveClass('uppercase', 'tracking-wider');
    expect(within(panel).getByText('Invoice / Lot #')).toBeInTheDocument();
    expect(within(panel).getByText('Product Description & Brand')).toBeInTheDocument();
    expect(within(panel).getByText('Purchasing Buyer')).toBeInTheDocument();
    expect(within(panel).getByText('Cases Cleared')).toBeInTheDocument();
    expect(within(panel).getByText('Price/Case')).toBeInTheDocument();
    expect(within(panel).getByText('Cleared Revenue')).toBeInTheDocument();
    expect(within(panel).getByText('Recovery %')).toBeInTheDocument();
    expect(within(panel).getByText('Delivery Status')).toBeInTheDocument();

    // Verify row 1 details
    expect(within(panel).getByText('LOT-CHI-101')).toBeInTheDocument();
    expect(within(panel).getByText(/Inv: INV-CHI-2001/)).toBeInTheDocument();
    expect(within(panel).getByText('Organic Whole Milk 1gal')).toBeInTheDocument();
    expect(within(panel).getByText('Organic Valley')).toBeInTheDocument();
    expect(within(panel).getByText('SKU-DAIRY-01')).toBeInTheDocument();
    expect(within(panel).getByText('Bargain Hunt Liquidation')).toBeInTheDocument();
    expect(within(panel).getByText('Regional Off-Price Retailer')).toBeInTheDocument();
    expect(within(panel).getByText('2,200')).toBeInTheDocument();
    expect(within(panel).getByText('$35.00')).toBeInTheDocument();
    expect(within(panel).getByText('$77,000.00')).toBeInTheDocument();
    expect(within(panel).getByText('78.0%')).toBeInTheDocument();
    expect(within(panel).getByText('Delivered')).toBeInTheDocument();

    // Verify row 2 details
    expect(within(panel).getByText('LOT-CHI-102')).toBeInTheDocument();
    expect(within(panel).getByText(/Inv: INV-CHI-2002/)).toBeInTheDocument();
    expect(within(panel).getByText('Cold Brew Coffee 12pk')).toBeInTheDocument();
    expect(within(panel).getByText('Chameleon')).toBeInTheDocument();
    expect(within(panel).getByText('SKU-BEV-02')).toBeInTheDocument();
    expect(within(panel).getByText('Daily Harvest Outlets')).toBeInTheDocument();
    expect(within(panel).getByText('Discount Grocery Chain')).toBeInTheDocument();
    expect(within(panel).getByText('3,000')).toBeInTheDocument();
    expect(within(panel).getByText('$25.73')).toBeInTheDocument();
    expect(within(panel).getByText('$77,200.00')).toBeInTheDocument();
    expect(within(panel).getByText('75.0%')).toBeInTheDocument();
    expect(within(panel).getByText('In Transit')).toBeInTheDocument();
  });

  it('filters child transactions in real time by SKU, lot number, product name, or buyer via embedded search input', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const warehousesTab = screen.getByRole('tab', { name: /top warehouses \/ dcs/i });
    fireEvent.click(warehousesTab);

    // Expand Warehouse 1
    const wh1Trigger = screen.getByRole('button', { name: /unilever midwest dc/i });
    fireEvent.click(wh1Trigger);

    const panel = screen.getByTestId('warehouse-transactions-panel-warehouse-1');
    const searchInput = within(panel).getByPlaceholderText(/filter transactions by sku/i);

    // Initially 2 transactions
    expect(within(panel).getByText('LOT-CHI-101')).toBeInTheDocument();
    expect(within(panel).getByText('LOT-CHI-102')).toBeInTheDocument();
    expect(within(panel).getByText(/showing 2 of 2 transactions/i)).toBeInTheDocument();

    // Filter by SKU "SKU-BEV"
    fireEvent.change(searchInput, { target: { value: 'SKU-BEV' } });
    expect(within(panel).queryByText('LOT-CHI-101')).not.toBeInTheDocument();
    expect(within(panel).getByText('LOT-CHI-102')).toBeInTheDocument();
    expect(within(panel).getByText(/showing 1 of 2 transactions/i)).toBeInTheDocument();

    // Filter by product description "Cold Brew"
    fireEvent.change(searchInput, { target: { value: 'Cold Brew' } });
    expect(within(panel).queryByText('LOT-CHI-101')).not.toBeInTheDocument();
    expect(within(panel).getByText('LOT-CHI-102')).toBeInTheDocument();

    // Filter by lot number "CHI-101"
    fireEvent.change(searchInput, { target: { value: 'CHI-101' } });
    expect(within(panel).getByText('LOT-CHI-101')).toBeInTheDocument();
    expect(within(panel).queryByText('LOT-CHI-102')).not.toBeInTheDocument();

    // Filter by purchasing buyer "Daily Harvest"
    fireEvent.change(searchInput, { target: { value: 'Daily Harvest' } });
    expect(within(panel).queryByText('LOT-CHI-101')).not.toBeInTheDocument();
    expect(within(panel).getByText('LOT-CHI-102')).toBeInTheDocument();

    // Filter non-matching term
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });
    expect(within(panel).getByText(/no transactions matched the search query/i)).toBeInTheDocument();
    expect(within(panel).getByText(/showing 0 of 2 transactions/i)).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(within(panel).getByText('LOT-CHI-101')).toBeInTheDocument();
    expect(within(panel).getByText('LOT-CHI-102')).toBeInTheDocument();
  });

  it('invokes onOpenLotHub with lot details when a Lot # is clicked in the transaction table', () => {
    const handleOpenLotHub = vi.fn();
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView onOpenLotHub={handleOpenLotHub} />
      </Provider>
    );

    const warehousesTab = screen.getByRole('tab', { name: /top warehouses \/ dcs/i });
    fireEvent.click(warehousesTab);

    // Expand Warehouse 1
    const wh1Trigger = screen.getByRole('button', { name: /unilever midwest dc/i });
    fireEvent.click(wh1Trigger);

    const panel = screen.getByTestId('warehouse-transactions-panel-warehouse-1');
    const lot101Btn = within(panel).getByRole('button', { name: /LOT-CHI-101/i });

    expect(handleOpenLotHub).not.toHaveBeenCalled();

    fireEvent.click(lot101Btn);

    expect(handleOpenLotHub).toHaveBeenCalledTimes(1);
    expect(handleOpenLotHub).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'lot-wh-101',
        lotNumber: 'LOT-CHI-101',
        productName: 'Organic Whole Milk 1gal',
        sku: 'SKU-DAIRY-01',
        facility: 'Unilever Midwest DC (Chicago, IL)',
      })
    );
  });

  it('preserves expanded warehouse accordions and search filter state when navigating across sub-tabs', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const warehousesTab = screen.getByRole('tab', { name: /top warehouses \/ dcs/i });
    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });

    // 1. Switch to Top Warehouses
    fireEvent.click(warehousesTab);

    // 2. Expand Warehouse 1
    const wh1Trigger = screen.getByRole('button', { name: /unilever midwest dc/i });
    fireEvent.click(wh1Trigger);

    const panel = screen.getByTestId('warehouse-transactions-panel-warehouse-1');
    expect(panel).toBeInTheDocument();

    // 3. Enter search query
    const searchInput = within(panel).getByPlaceholderText(/filter transactions by sku/i);
    fireEvent.change(searchInput, { target: { value: 'Cold Brew' } });
    expect(within(panel).getByText('LOT-CHI-102')).toBeInTheDocument();
    expect(within(panel).queryByText('LOT-CHI-101')).not.toBeInTheDocument();

    // 4. Switch to Overview & Analytics sub-tab
    fireEvent.click(overviewTab);

    // 5. Switch back to Top Warehouses / DCs sub-tab
    fireEvent.click(warehousesTab);

    // 6. Assert Warehouse 1 is still expanded and search query is still intact
    const restoredPanel = screen.getByTestId('warehouse-transactions-panel-warehouse-1');
    expect(restoredPanel).toBeInTheDocument();
    const restoredSearchInput = within(restoredPanel).getByPlaceholderText(
      /filter transactions by sku/i
    ) as HTMLInputElement;
    expect(restoredSearchInput.value).toBe('Cold Brew');
    expect(within(restoredPanel).getByText('LOT-CHI-102')).toBeInTheDocument();
    expect(within(restoredPanel).queryByText('LOT-CHI-101')).not.toBeInTheDocument();
  });
});
