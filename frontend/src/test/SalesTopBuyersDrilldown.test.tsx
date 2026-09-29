import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { coreSlice, type SalesBuyerSummary } from '../store/slices/coreSlice';
import { ingestionSlice } from '../store/slices/ingestionSlice';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';

const mockTopBuyers: SalesBuyerSummary[] = [
  {
    rank: 1,
    buyerId: 'buyer-1',
    buyerName: 'Bargain Hunt Liquidation',
    segment: 'Regional Off-Price Retailer',
    totalSpent: 45200,
    totalVolume: 3200,
    revenueSharePct: 45.2,
    transactionCount: 2,
    transactions: [
      {
        id: 'tx-1',
        saleDate: '2026-09-20T10:00:00Z',
        lotId: 'lot-101',
        lotNumber: 'LOT-2026-09-101',
        invoiceNumber: 'INV-1001',
        sku: 'SKU-DAIRY-01',
        product: 'Organic Whole Milk 1gal',
        brand: 'Organic Valley',
        buyer: 'Bargain Hunt Liquidation',
        warehouse: 'Midwest DC (Chicago, IL)',
        quantityCases: 150,
        pricePerCase: 14.5,
        revenue: 2175,
        recoveryPct: 82.5,
        status: 'delivered',
      },
      {
        id: 'tx-2',
        saleDate: '2026-09-22T14:30:00Z',
        lotId: 'lot-102',
        lotNumber: 'LOT-2026-09-102',
        invoiceNumber: 'INV-1002',
        sku: 'SKU-BEV-02',
        product: 'Cold Brew Coffee 12pk',
        brand: 'Chameleon',
        buyer: 'Bargain Hunt Liquidation',
        warehouse: 'Midwest DC (Chicago, IL)',
        quantityCases: 200,
        pricePerCase: 18.0,
        revenue: 3600,
        recoveryPct: 76.0,
        status: 'in_transit',
      },
    ],
  },
  {
    rank: 2,
    buyerId: 'buyer-2',
    buyerName: 'Daily Harvest Outlets',
    segment: 'Discount Grocery Chain',
    totalSpent: 28500,
    totalVolume: 1950,
    revenueSharePct: 28.5,
    transactionCount: 1,
    transactions: [
      {
        id: 'tx-3',
        saleDate: '2026-09-25T09:15:00Z',
        lotId: 'lot-103',
        lotNumber: 'LOT-2026-09-103',
        invoiceNumber: 'INV-1003',
        sku: 'SKU-SNK-03',
        product: 'Almond Butter Granola',
        brand: 'Purely Elizabeth',
        buyer: 'Daily Harvest Outlets',
        warehouse: 'Southwest DC (Dallas, TX)',
        quantityCases: 120,
        pricePerCase: 22.0,
        revenue: 2640,
        recoveryPct: 91.0,
        status: 'delivered',
      },
    ],
  },
];

function createMockStore(topBuyers: SalesBuyerSummary[] = mockTopBuyers) {
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
          totalRevenue: 100000,
          revenueGrowthPct: 12.5,
          totalVolume: 6000,
          avgPrice: 20,
          reconciledCount: 50,
          totalCount: 50,
          categories: ['Dairy', 'Beverages', 'Snacks'],
          warehouses: ['Midwest DC (Chicago, IL)', 'Southwest DC (Dallas, TX)'],
          trajectory: [],
          topBuyers,
          topWarehouses: [],
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

describe('Seam: Top Buyers Expandable Accordion & Drilldown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ranked buyer summary cards with rank, company name, segment badge, total spent, volume, share % badge, and transaction count', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Switch to Top Buyers subtab
    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    fireEvent.click(buyersTab);

    // Should find the ranked cards container
    const buyersPanel = screen.getByTestId('sales-subview-buyers');
    expect(buyersPanel).toBeInTheDocument();

    // Verify Buyer 1 Summary Card
    const buyer1Card = screen.getByTestId('buyer-card-buyer-1');
    expect(buyer1Card).toBeInTheDocument();
    expect(within(buyer1Card).getByText('#1')).toBeInTheDocument();
    expect(within(buyer1Card).getByText('Bargain Hunt Liquidation')).toBeInTheDocument();
    expect(within(buyer1Card).getByText('Regional Off-Price Retailer')).toBeInTheDocument();
    expect(within(buyer1Card).getByText(/\$45,200/)).toBeInTheDocument();
    expect(within(buyer1Card).getByText(/3,200/)).toBeInTheDocument();
    expect(within(buyer1Card).getByText(/45\.2%/)).toBeInTheDocument();
    expect(within(buyer1Card).getByText(/2 transactions/i)).toBeInTheDocument();

    // Verify Buyer 2 Summary Card
    const buyer2Card = screen.getByTestId('buyer-card-buyer-2');
    expect(buyer2Card).toBeInTheDocument();
    expect(within(buyer2Card).getByText('#2')).toBeInTheDocument();
    expect(within(buyer2Card).getByText('Daily Harvest Outlets')).toBeInTheDocument();
    expect(within(buyer2Card).getByText('Discount Grocery Chain')).toBeInTheDocument();
    expect(within(buyer2Card).getByText(/\$28,500/)).toBeInTheDocument();
    expect(within(buyer2Card).getByText(/1,950/)).toBeInTheDocument();
    expect(within(buyer2Card).getByText(/28\.5%/)).toBeInTheDocument();
    expect(within(buyer2Card).getByText(/1 transaction/i)).toBeInTheDocument();
  });

  it('renders a friendly empty state when no top buyers are returned', () => {
    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    fireEvent.click(buyersTab);

    expect(screen.getByTestId('top-buyers-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no buyer closeout sales recorded/i)).toBeInTheDocument();
  });

  it('expands and collapses inline accordions independently across multiple buyer cards', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    fireEvent.click(buyersTab);

    // Initially, transaction ledgers should not be visible
    expect(screen.queryByTestId('buyer-transactions-panel-buyer-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('buyer-transactions-panel-buyer-2')).not.toBeInTheDocument();

    const buyer1Trigger = screen.getByRole('button', { name: /bargain hunt liquidation/i });
    const buyer2Trigger = screen.getByRole('button', { name: /daily harvest outlets/i });

    // Expand Buyer 1
    fireEvent.click(buyer1Trigger);
    expect(screen.getByTestId('buyer-transactions-panel-buyer-1')).toBeInTheDocument();
    expect(screen.queryByTestId('buyer-transactions-panel-buyer-2')).not.toBeInTheDocument();

    // Expand Buyer 2: both should now be expanded simultaneously
    fireEvent.click(buyer2Trigger);
    expect(screen.getByTestId('buyer-transactions-panel-buyer-1')).toBeInTheDocument();
    expect(screen.getByTestId('buyer-transactions-panel-buyer-2')).toBeInTheDocument();

    // Collapse Buyer 1: Buyer 2 remains expanded
    fireEvent.click(buyer1Trigger);
    expect(screen.queryByTestId('buyer-transactions-panel-buyer-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('buyer-transactions-panel-buyer-2')).toBeInTheDocument();

    // Collapse Buyer 2
    fireEvent.click(buyer2Trigger);
    expect(screen.queryByTestId('buyer-transactions-panel-buyer-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('buyer-transactions-panel-buyer-2')).not.toBeInTheDocument();
  });

  it('renders child transaction table with all required columns and metrics', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    fireEvent.click(buyersTab);

    const buyer1Trigger = screen.getByRole('button', { name: /bargain hunt liquidation/i });
    fireEvent.click(buyer1Trigger);

    const panel = screen.getByTestId('buyer-transactions-panel-buyer-1');
    expect(panel).toBeInTheDocument();

    // Verify Table Headers
    const saleDateHeader = within(panel).getByText('Sale Date');
    expect(saleDateHeader).toBeInTheDocument();
    expect(saleDateHeader).toHaveClass('uppercase', 'tracking-wider');
    expect(within(panel).getByText('Invoice / Lot #')).toBeInTheDocument();
    expect(within(panel).getByText('Product Description & Brand')).toBeInTheDocument();
    expect(within(panel).getByText('Cases')).toBeInTheDocument();
    expect(within(panel).getByText('Price/Case')).toBeInTheDocument();
    expect(within(panel).getByText('Total Revenue')).toBeInTheDocument();
    expect(within(panel).getByText('Fulfillment Facility')).toBeInTheDocument();
    expect(within(panel).getByText('COGS Recovery %')).toBeInTheDocument();
    expect(within(panel).getByText('Delivery Status')).toBeInTheDocument();

    // Verify row 1 details
    expect(within(panel).getByText('LOT-2026-09-101')).toBeInTheDocument();
    expect(within(panel).getByText(/Inv: INV-1001/)).toBeInTheDocument();
    expect(within(panel).getByText('Organic Whole Milk 1gal')).toBeInTheDocument();
    expect(within(panel).getByText('Organic Valley')).toBeInTheDocument();
    expect(within(panel).getByText('SKU-DAIRY-01')).toBeInTheDocument();
    expect(within(panel).getByText('150')).toBeInTheDocument();
    expect(within(panel).getByText('$14.50')).toBeInTheDocument();
    expect(within(panel).getByText('$2,175.00')).toBeInTheDocument();
    expect(within(panel).getAllByText('Midwest DC (Chicago, IL)')).toHaveLength(2);
    expect(within(panel).getByText('82.5%')).toBeInTheDocument();
    expect(within(panel).getByText('Delivered')).toBeInTheDocument();

    // Verify row 2 details
    expect(within(panel).getByText('LOT-2026-09-102')).toBeInTheDocument();
    expect(within(panel).getByText(/Inv: INV-1002/)).toBeInTheDocument();
    expect(within(panel).getByText('Cold Brew Coffee 12pk')).toBeInTheDocument();
    expect(within(panel).getByText('Chameleon')).toBeInTheDocument();
    expect(within(panel).getByText('SKU-BEV-02')).toBeInTheDocument();
    expect(within(panel).getByText('200')).toBeInTheDocument();
    expect(within(panel).getByText('$18.00')).toBeInTheDocument();
    expect(within(panel).getByText('$3,600.00')).toBeInTheDocument();
    expect(within(panel).getByText('76.0%')).toBeInTheDocument();
    expect(within(panel).getByText('In Transit')).toBeInTheDocument();
  });

  it('filters child transactions in real time by SKU, lot number, or product name via embedded search input', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    fireEvent.click(buyersTab);

    // Expand Buyer 1
    const buyer1Trigger = screen.getByRole('button', { name: /bargain hunt liquidation/i });
    fireEvent.click(buyer1Trigger);

    const panel = screen.getByTestId('buyer-transactions-panel-buyer-1');
    const searchInput = within(panel).getByPlaceholderText(/filter transactions by sku/i);

    // Initially 2 transactions
    expect(within(panel).getByText('LOT-2026-09-101')).toBeInTheDocument();
    expect(within(panel).getByText('LOT-2026-09-102')).toBeInTheDocument();
    expect(within(panel).getByText(/showing 2 of 2 transactions/i)).toBeInTheDocument();

    // Filter by SKU "SKU-BEV"
    fireEvent.change(searchInput, { target: { value: 'SKU-BEV' } });
    expect(within(panel).queryByText('LOT-2026-09-101')).not.toBeInTheDocument();
    expect(within(panel).getByText('LOT-2026-09-102')).toBeInTheDocument();
    expect(within(panel).getByText(/showing 1 of 2 transactions/i)).toBeInTheDocument();

    // Filter by product description "Cold Brew"
    fireEvent.change(searchInput, { target: { value: 'Cold Brew' } });
    expect(within(panel).queryByText('LOT-2026-09-101')).not.toBeInTheDocument();
    expect(within(panel).getByText('LOT-2026-09-102')).toBeInTheDocument();

    // Filter by lot number "101"
    fireEvent.change(searchInput, { target: { value: '101' } });
    expect(within(panel).getByText('LOT-2026-09-101')).toBeInTheDocument();
    expect(within(panel).queryByText('LOT-2026-09-102')).not.toBeInTheDocument();

    // Filter non-matching term
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });
    expect(within(panel).getByText(/no transactions matched the search query/i)).toBeInTheDocument();
    expect(within(panel).getByText(/showing 0 of 2 transactions/i)).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(within(panel).getByText('LOT-2026-09-101')).toBeInTheDocument();
    expect(within(panel).getByText('LOT-2026-09-102')).toBeInTheDocument();
  });

  it('invokes onOpenLotHub with lot details when a Lot # is clicked in the transaction table', () => {
    const handleOpenLotHub = vi.fn();
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView onOpenLotHub={handleOpenLotHub} />
      </Provider>
    );

    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    fireEvent.click(buyersTab);

    // Expand Buyer 1
    const buyer1Trigger = screen.getByRole('button', { name: /bargain hunt liquidation/i });
    fireEvent.click(buyer1Trigger);

    const panel = screen.getByTestId('buyer-transactions-panel-buyer-1');
    const lot101Btn = within(panel).getByRole('button', { name: /LOT-2026-09-101/i });

    expect(handleOpenLotHub).not.toHaveBeenCalled();

    fireEvent.click(lot101Btn);

    expect(handleOpenLotHub).toHaveBeenCalledTimes(1);
    expect(handleOpenLotHub).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'lot-101',
        lotNumber: 'LOT-2026-09-101',
        productName: 'Organic Whole Milk 1gal',
        sku: 'SKU-DAIRY-01',
        facility: 'Midwest DC (Chicago, IL)',
      })
    );
  });

  it('preserves expanded buyer accordions and search filter state when navigating across sub-tabs', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });

    // 1. Switch to Top Buyers
    fireEvent.click(buyersTab);

    // 2. Expand Buyer 1
    const buyer1Trigger = screen.getByRole('button', { name: /bargain hunt liquidation/i });
    fireEvent.click(buyer1Trigger);

    const panel = screen.getByTestId('buyer-transactions-panel-buyer-1');
    expect(panel).toBeInTheDocument();

    // 3. Enter search query
    const searchInput = within(panel).getByPlaceholderText(/filter transactions by sku/i);
    fireEvent.change(searchInput, { target: { value: 'Cold Brew' } });
    expect(within(panel).getByText('LOT-2026-09-102')).toBeInTheDocument();
    expect(within(panel).queryByText('LOT-2026-09-101')).not.toBeInTheDocument();

    // 4. Switch to Overview & Analytics sub-tab
    fireEvent.click(overviewTab);

    // 5. Switch back to Top Buyers sub-tab
    fireEvent.click(buyersTab);

    // 6. Assert Buyer 1 is still expanded and search query is still intact
    const restoredPanel = screen.getByTestId('buyer-transactions-panel-buyer-1');
    expect(restoredPanel).toBeInTheDocument();
    const restoredSearchInput = within(restoredPanel).getByPlaceholderText(
      /filter transactions by sku/i
    ) as HTMLInputElement;
    expect(restoredSearchInput.value).toBe('Cold Brew');
    expect(within(restoredPanel).getByText('LOT-2026-09-102')).toBeInTheDocument();
    expect(within(restoredPanel).queryByText('LOT-2026-09-101')).not.toBeInTheDocument();
  });
});


