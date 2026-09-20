import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, { setSalesRecords } from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { SalesRegistryPanel } from '../components/domain/ingestion/SalesRegistryPanel';
import { PipelineSwitcherBar } from '../components/domain/ingestion/subcomponents/PipelineSwitcherBar';
import type { SalesRecord } from '../components/domain/ingestion/types/ingestion.types';

const createTestStore = (preloadedSalesRecords?: SalesRecord[]) => {
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
      ingestion: {
        ...ingestionReducer(undefined, { type: '@@INIT' }),
        salesRecords: preloadedSalesRecords || [],
        pipelineTab: 'sales',
      },
    },
  });
};

const mockSalesRecords: SalesRecord[] = [
  {
    _id: 'sales-row-1',
    contractNumber: 'ORD-2026-9941',
    invoiceNumber: 'INV-2026-9941',
    productName: 'Oscar Mayer Deli Slices',
    description: 'Oscar Mayer Deli Slices',
    sku: 'OM-DEL-3310',
    lotNumber: '#001',
    buyerName: 'Whole Foods Market Regional',
    buyerCompany: 'Whole Foods Market Regional',
    buyerNode: 'Mid-Atlantic Hub',
    warehouse: 'Northeast Logistics Hub, Newark',
    dc: 'Northeast Logistics Hub, Newark',
    storageTemp: 'Reefer 36°F',
    dockType: 'Reefer 36°F',
    quantitySold: 5400,
    pricePerCase: 14.2,
    totalRevenue: 76680,
    totalValue: 76680,
    status: 'Completed / Settled',
    saleDate: '09/18/2026',
    dateRecorded: 'Sep 18, 2026',
    createdAt: '2026-09-18T09:30:00.000Z',
    updatedAt: '2026-09-19T14:15:00.000Z',
    trackingCarrier: 'SWF-90214-VA • Swift Cold Logistics',
    deliveryWindow: 'Mar 21, 08:00 EST',
    grossSale: 76680.0,
    netRemitted: 73612.8,
  },
  {
    _id: 'sales-row-2',
    contractNumber: 'ORD-2026-9942',
    invoiceNumber: 'INV-2026-9942',
    productName: 'Kraft Dressings Bulk Pack',
    description: 'Kraft Dressings Bulk Pack',
    sku: 'KF-DRS-1102',
    lotNumber: '#004',
    buyerName: 'Metro Salvage Provisions',
    buyerCompany: 'Metro Salvage Provisions',
    buyerNode: 'Southeast Node',
    warehouse: 'Texas Central Facility, Dallas',
    dc: 'Texas Central Facility, Dallas',
    storageTemp: 'Ambient Dock',
    dockType: 'Ambient Dock',
    quantitySold: 9800,
    pricePerCase: 5.4,
    totalRevenue: 52920,
    totalValue: 52920,
    status: 'Pending Escrow',
    saleDate: '09/18/2026',
    dateRecorded: 'Sep 18, 2026',
    createdAt: '2026-09-18T10:15:00.000Z',
    updatedAt: '2026-09-18T16:40:00.000Z',
    pickupTerms: 'Customer Pickup (CPU)',
    appointmentTerms: 'Dock Door #4 (14:30 EST)',
    grossSale: 52920.0,
    escrowStatus: '100% Funded',
  },
  {
    _id: 'sales-row-3',
    contractNumber: 'ORD-2026-9945',
    invoiceNumber: 'INV-2026-9945',
    productName: 'Pure Leaf Real Tea 18.5oz',
    description: 'Pure Leaf Real Tea 18.5oz',
    sku: 'PL-TEA-5542',
    lotNumber: '#003',
    buyerName: 'Appalachian Fresh Outlets',
    buyerCompany: 'Appalachian Fresh Outlets',
    buyerNode: 'Discount Network',
    warehouse: 'Pacific Northwest Hub',
    dc: 'Pacific Northwest Hub',
    storageTemp: 'Ambient Freight',
    dockType: 'Ambient Freight',
    quantitySold: 11200,
    pricePerCase: 8.9,
    totalRevenue: 99680,
    totalValue: 99680,
    status: 'Invoiced',
    saleDate: '09/18/2026',
    dateRecorded: 'Sep 18, 2026',
    createdAt: '2026-09-18T11:20:00.000Z',
    updatedAt: '2026-09-18T18:00:00.000Z',
    telemetryGps: 'I-80 Eastbound (Mile Marker 192)',
    telemetrySpeed: '62 mph • On schedule',
    settlementTerms: '$99,680.00 (Net 15 Days)',
    grossSale: 99680.0,
  },
];

describe('Issue #0122: Slice 4 - Sales Pipeline Modern Grid & Progressive Inspection Drawer', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    testStore = createTestStore(mockSalesRecords);
  });

  describe('1. Dedicated Sales Filter Bar', () => {
    it('renders all 7 filter controls and the Live ERP Clearing count badge', () => {
      render(
        <Provider store={testStore}>
          <SalesRegistryPanel />
        </Provider>
      );

      // Row 1 controls
      expect(screen.getByPlaceholderText(/Search SKU, product, lot #, buyer/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Search by Lot Number.../i)).toBeDefined();
      expect(screen.getByRole('combobox', { name: /buyer/i })).toBeDefined();
      expect(screen.getByRole('combobox', { name: /distribution center/i })).toBeDefined();
      expect(screen.getByLabelText(/create date/i)).toBeDefined();

      // Row 2 controls
      expect(screen.getByRole('combobox', { name: /price range/i })).toBeDefined();
      expect(screen.getByRole('combobox', { name: /sales status/i })).toBeDefined();

      // Live ERP clearing badge
      expect(screen.getByText(/Live ERP Clearing Connected/i)).toBeDefined();
    });

    it('filters sales records dynamically by search, lot number, buyer, DC, price range, and status', () => {
      render(
        <Provider store={testStore}>
          <SalesRegistryPanel />
        </Provider>
      );

      // Initially all 3 records are visible
      expect(screen.getByText('Oscar Mayer Deli Slices')).toBeDefined();
      expect(screen.getByText('Kraft Dressings Bulk Pack')).toBeDefined();
      expect(screen.getByText('Pure Leaf Real Tea 18.5oz')).toBeDefined();

      // Filter by Search
      const searchInput = screen.getByPlaceholderText(/Search SKU, product, lot #, buyer/i);
      fireEvent.change(searchInput, { target: { value: 'Oscar' } });

      expect(screen.getByText('Oscar Mayer Deli Slices')).toBeDefined();
      expect(screen.queryByText('Kraft Dressings Bulk Pack')).toBeNull();
      expect(screen.queryByText('Pure Leaf Real Tea 18.5oz')).toBeNull();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Filter by Lot Number
      const lotInput = screen.getByPlaceholderText(/Search by Lot Number.../i);
      fireEvent.change(lotInput, { target: { value: '#004' } });

      expect(screen.queryByText('Oscar Mayer Deli Slices')).toBeNull();
      expect(screen.getByText('Kraft Dressings Bulk Pack')).toBeDefined();
      expect(screen.queryByText('Pure Leaf Real Tea 18.5oz')).toBeNull();

      // Clear lot number
      fireEvent.change(lotInput, { target: { value: '' } });

      // Filter by Price Range (< $10/cs)
      const priceSelect = screen.getByRole('combobox', { name: /price range/i });
      fireEvent.change(priceSelect, { target: { value: '< $10/cs' } });

      // Kraft is $5.40/cs, Pure Leaf is $8.90/cs; Oscar Mayer is $14.20/cs
      expect(screen.queryByText('Oscar Mayer Deli Slices')).toBeNull();
      expect(screen.getByText('Kraft Dressings Bulk Pack')).toBeDefined();
      expect(screen.getByText('Pure Leaf Real Tea 18.5oz')).toBeDefined();

      // Filter by Sales Status (Completed / Settled)
      fireEvent.change(priceSelect, { target: { value: '' } });
      const statusSelect = screen.getByRole('combobox', { name: /sales status/i });
      fireEvent.change(statusSelect, { target: { value: 'Completed / Settled' } });

      expect(screen.getByText('Oscar Mayer Deli Slices')).toBeDefined();
      expect(screen.queryByText('Kraft Dressings Bulk Pack')).toBeNull();
      expect(screen.queryByText('Pure Leaf Real Tea 18.5oz')).toBeNull();
    });

    it('renders "Clear Filters" button when any filter is active and resets when clicked', () => {
      render(
        <Provider store={testStore}>
          <SalesRegistryPanel />
        </Provider>
      );

      expect(screen.queryByRole('button', { name: /clear filters/i })).toBeNull();

      const searchInput = screen.getByPlaceholderText(/Search SKU, product, lot #, buyer/i);
      fireEvent.change(searchInput, { target: { value: 'Kraft' } });

      const clearBtn = screen.getByRole('button', { name: /clear filters/i });
      expect(clearBtn).toBeDefined();

      fireEvent.click(clearBtn);

      expect((searchInput as HTMLInputElement).value).toBe('');
      expect(screen.getByText('Oscar Mayer Deli Slices')).toBeDefined();
      expect(screen.getByText('Kraft Dressings Bulk Pack')).toBeDefined();
      expect(screen.getByText('Pure Leaf Real Tea 18.5oz')).toBeDefined();
    });
  });

  describe('2. Modern Table Header and Rows', () => {
    it('renders table headers and Stitch visual badges (SKU badge, buyer node, monospace currency, chevrons)', () => {
      render(
        <Provider store={testStore}>
          <SalesRegistryPanel />
        </Provider>
      );

      // Table headers
      expect(screen.getByText('PRODUCT / SKU')).toBeDefined();
      expect(screen.getByText('LOT NUMBER')).toBeDefined();
      expect(screen.getByText('BUYER / CUSTOMER')).toBeDefined();
      expect(screen.getByText('DISTRIBUTION CENTER')).toBeDefined();
      expect(screen.getByText('QTY SOLD')).toBeDefined();
      expect(screen.getByText('PRICE DETAILS')).toBeDefined();
      expect(screen.getByText('TOTAL REVENUE')).toBeDefined();
      expect(screen.getByText('DATES')).toBeDefined();
      expect(screen.getByText('INSPECT')).toBeDefined();

      // Row elements for Row 1
      expect(screen.getByText('SKU: OM-DEL-3310')).toBeDefined();
      expect(screen.getByText('#001')).toBeDefined();
      expect(screen.getAllByText('Whole Foods Market Regional').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Mid-Atlantic Hub')).toBeDefined();
      expect(screen.getAllByText('Northeast Logistics Hub, Newark').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Reefer 36°F')).toBeDefined();
      expect(screen.getByText('5,400 cs')).toBeDefined();
      expect(screen.getByText('$14.20/cs')).toBeDefined();
      expect(screen.getByText('$76,680.00')).toBeDefined();
      expect(screen.getByText('Settled')).toBeDefined();
    });
  });

  describe('3. Progressive Row Inspection Drawer & Contextual Action CTAs', () => {
    it('clicking a sales row or chevron toggles the in-situ inspection drawer displaying logistics, audit logs, and remittance', () => {
      render(
        <Provider store={testStore}>
          <SalesRegistryPanel />
        </Provider>
      );

      // Initially drawer is not visible
      expect(screen.queryByText(/Logistics & Dispatch/i)).toBeNull();
      expect(screen.queryByText(/Audit & Date Logs/i)).toBeNull();
      expect(screen.queryByText(/Financial Remittance/i)).toBeNull();

      // Click on row 1
      const row1 = screen.getByText('Oscar Mayer Deli Slices').closest('.lot-row');
      expect(row1).not.toBeNull();
      fireEvent.click(row1!);

      // Drawer is now revealed
      expect(screen.getByText(/Logistics & Dispatch/i)).toBeDefined();
      expect(screen.getByText(/Audit & Date Logs/i)).toBeDefined();
      expect(screen.getByText(/Financial Remittance/i)).toBeDefined();

      // Verify content inside drawer
      expect(screen.getByText(/ORD-2026-9941/i)).toBeDefined();
      expect(screen.getByText(/SWF-90214-VA • Swift Cold Logistics/i)).toBeDefined();
      expect(screen.getByText(/Delivery Window: Mar 21, 08:00 EST/i)).toBeDefined();

      expect(screen.getByText(/Date Recorded:/i)).toBeDefined();
      expect(screen.getByText(/Create Date:/i)).toBeDefined();
      expect(screen.getByText(/Update Date:/i)).toBeDefined();

      expect(screen.getByText(/Gross Sale:/i)).toBeDefined();
      expect(screen.getByText(/Net Remitted:/i)).toBeDefined();
      expect(screen.getByText('$73,612.80')).toBeDefined();

      // Verify action buttons
      expect(screen.getByRole('button', { name: /Reconcile Invoice/i })).toBeDefined();

      // Click again to collapse
      fireEvent.click(row1!);
      expect(screen.queryByText(/Logistics & Dispatch/i)).toBeNull();
    });

    it('clicking contextual action CTAs invokes action feedback or callbacks without collapsing drawer', () => {
      render(
        <Provider store={testStore}>
          <SalesRegistryPanel />
        </Provider>
      );

      // Open row 1 drawer
      const row1 = screen.getByText('Oscar Mayer Deli Slices').closest('.lot-row');
      fireEvent.click(row1!);

      const reconcileBtn = screen.getByRole('button', { name: /Reconcile Invoice/i });
      fireEvent.click(reconcileBtn);

      // Drawer stays open and handles the CTA
      expect(screen.getByText(/Logistics & Dispatch/i)).toBeDefined();
    });
  });

  describe('4. Master "Toggle All" Synchronization', () => {
    it('master Toggle All button expands all visible rows if any are closed, and collapses all if all are open, synchronizing its label', () => {
      render(
        <Provider store={testStore}>
          <div>
            <PipelineSwitcherBar activeTab="sales" onTabChange={() => {}} />
            <SalesRegistryPanel />
          </div>
        </Provider>
      );

      const toggleAllBtn = screen.getByRole('button', { name: /toggle all/i });
      expect(toggleAllBtn).toBeDefined();
      expect(screen.getByText('Toggle All')).toBeDefined();

      // Initially no drawers are open
      expect(screen.queryAllByText(/Logistics & Dispatch/i)).toHaveLength(0);

      // Click Toggle All -> expands all 3 rows
      fireEvent.click(toggleAllBtn);

      expect(screen.getAllByText(/Logistics & Dispatch/i)).toHaveLength(3);
      expect(screen.getByText('Collapse All')).toBeDefined();

      // Click again -> collapses all rows
      fireEvent.click(toggleAllBtn);

      expect(screen.queryAllByText(/Logistics & Dispatch/i)).toHaveLength(0);
      expect(screen.getByText('Toggle All')).toBeDefined();
    });
  });

  describe('5. Pagination', () => {
    it('handles pagination properly when sales records exceed page size', () => {
      const manyRecords: SalesRecord[] = Array.from({ length: 15 }, (_, i) => ({
        _id: `sales-page-${i}`,
        contractNumber: `ORD-2026-${1000 + i}`,
        sku: `SKU-TEST-${i}`,
        lotNumber: `#${100 + i}`,
        productName: `Product Item #${i + 1}`,
        description: `Product Item #${i + 1}`,
        buyerName: 'Test Buyer',
        buyerCompany: 'Test Buyer',
        warehouse: 'Test DC',
        quantitySold: 100 * (i + 1),
        pricePerCase: 10.0,
        totalRevenue: 1000 * (i + 1),
        status: 'Completed / Settled',
        createdAt: '2026-09-18T10:00:00.000Z',
      }));

      const paginatedStore = createTestStore(manyRecords);

      render(
        <Provider store={paginatedStore}>
          <SalesRegistryPanel />
        </Provider>
      );

      // 10 items per page by default: item #1 visible, item #11 not visible
      expect(screen.getByText('Product Item #1')).toBeDefined();
      expect(screen.getByText('Product Item #10')).toBeDefined();
      expect(screen.queryByText('Product Item #11')).toBeNull();

      // Next page button
      const nextPageBtn = screen.getByRole('button', { name: /next/i });
      expect(nextPageBtn).toBeDefined();
      fireEvent.click(nextPageBtn);

      // On page 2: item #11 visible, item #1 not visible
      expect(screen.queryByText('Product Item #1')).toBeNull();
      expect(screen.getByText('Product Item #11')).toBeDefined();
    });
  });
});
