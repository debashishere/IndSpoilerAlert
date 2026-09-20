import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer, { setBuyers, type Buyer } from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { BuyerRegistryPanel } from '../components/domain/ingestion/BuyerRegistryPanel';
import { PipelineSwitcherBar } from '../components/domain/ingestion/subcomponents/PipelineSwitcherBar';
import type { BuyerRecord } from '../components/domain/ingestion/types/ingestion.types';

const createTestStore = (preloadedBuyers?: Buyer[]) => {
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
      core: {
        ...coreReducer(undefined, { type: '@@INIT' }),
        buyers: preloadedBuyers || [],
      },
      ingestion: {
        ...ingestionReducer(undefined, { type: '@@INIT' }),
        pipelineTab: 'buyers',
      },
    },
  });
};

const mockBuyerRecords: BuyerRecord[] = [
  {
    _id: 'buyer-row-1',
    buyerId: 'BYR-ALB-001',
    companyName: 'Albertsons Pacific Northwest',
    name: 'Albertsons Pacific Northwest',
    email: 's.lin@albertsons-pnw.com',
    tier: 'Tier 1',
    networkSubtitle: 'ID: BYR-ALB-001 • 148 Stores',
    preferencesPrimary: 'Chilled & Frozen Priority',
    preferencesSecondary: 'Full Opt-In • SQF Level 3',
    createDate: '01/14/2025',
    updateDate: '09/17/2026',
    status: 'Active Compliant',
    isActive: true,
    optInBidding: true,
    optInSales: true,
    procurementOfficers: [
      { name: 'Sarah Lin', title: 'Director of Remediation', email: 's.lin@albertsons-pnw.com' },
    ],
    categories: ['Dairy & Chilled', 'Frozen Meat'],
    hubFacilities: ['DC #19 (Auburn, WA)'],
    tenderActionType: 'Send Lot Tender',
  },
  {
    _id: 'buyer-row-2',
    buyerId: 'BYR-APP-009',
    companyName: 'Appalachian Fresh Outlets',
    name: 'Appalachian Fresh Outlets',
    email: 'm.callahan@app-fresh.com',
    tier: 'Tier 2',
    networkSubtitle: 'ID: BYR-APP-009 • 34 Discount Stores',
    preferencesPrimary: 'Deep Discount & Salvage',
    preferencesSecondary: 'Dry & Ambient (Short RSL <7d)',
    createDate: '03/22/2025',
    updateDate: '09/15/2026',
    status: 'Active Compliant',
    isActive: true,
    optInBidding: true,
    optInSales: true,
    procurementOfficers: [
      { name: 'Mark Callahan', title: 'Buyer', email: 'm.callahan@app-fresh.com' },
    ],
    categories: ['Specialty Remnants', 'Dry & Ambient (Short RSL <7d)'],
    hubFacilities: ['Roanoke Regional Depot, VA'],
    tenderActionType: 'Forward Short-Dated Offers',
  },
  {
    _id: 'buyer-row-3',
    buyerId: 'BYR-FB-ATL',
    companyName: 'Atlanta Community Food Bank',
    name: 'Atlanta Community Food Bank',
    email: 'e.rostova@acfb.org',
    tier: 'Custom',
    networkSubtitle: 'ID: BYR-FB-ATL • 700+ Agencies',
    preferencesPrimary: 'Zero-Waste Donation Channel',
    preferencesSecondary: 'IRC 170(e)(3) • Allergen Filter',
    createDate: '05/10/2025',
    updateDate: '09/18/2026',
    status: 'Active Compliant',
    isActive: true,
    optInBidding: false,
    optInSales: false,
    procurementOfficers: [
      { name: 'Elena Rostova', title: 'Donation Officer', email: 'e.rostova@acfb.org' },
    ],
    categories: ['Zero-Waste Donation Channel', 'Form 8283 Auto Generation'],
    hubFacilities: ['Free 24h carrier dispatch'],
    tenderActionType: 'Route Zero-Waste Donation',
  },
  {
    _id: 'buyer-row-4',
    buyerId: 'BYR-INACTIVE-1',
    companyName: 'Inactive Salvage Partner',
    name: 'Inactive Salvage Partner',
    email: 'inactive@salvage.org',
    tier: 'Liquidator',
    networkSubtitle: 'ID: BYR-INA-99 • Warehouse Closed',
    preferencesPrimary: 'Ambient Liquidation',
    preferencesSecondary: 'Inactive Account',
    createDate: '02/01/2025',
    updateDate: '08/01/2026',
    status: 'Inactive',
    isActive: false,
    optInBidding: false,
    optInSales: false,
    procurementOfficers: [
      { name: 'John Doe', title: 'Former Agent', email: 'inactive@salvage.org' },
    ],
    categories: ['Surplus Closeout'],
    hubFacilities: ['Inactive Depot'],
    tenderActionType: 'Send Lot Tender',
  },
];

describe('Issue #0123: Slice 5 - Buyer Pipeline Modern Grid & Progressive Inspection Drawer', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    testStore = createTestStore(mockBuyerRecords);
  });

  describe('1. Dedicated Buyer Filter Bar', () => {
    it('renders all filter controls (Search, Buyer Tier, Status & Channel, Show Inactive Buyers checkbox)', () => {
      render(
        <Provider store={testStore}>
          <BuyerRegistryPanel />
        </Provider>
      );

      expect(screen.getByPlaceholderText(/Search by name, company, email.../i)).toBeDefined();
      expect(screen.getByRole('combobox', { name: /buyer tier/i })).toBeDefined();
      expect(screen.getByRole('combobox', { name: /status & channel/i })).toBeDefined();
      expect(screen.getByLabelText(/Show Inactive Buyers/i)).toBeDefined();
    });

    it('filters buyers dynamically by search, tier, status & channel, and show inactive', () => {
      render(
        <Provider store={testStore}>
          <BuyerRegistryPanel />
        </Provider>
      );

      // Initially active 3 are visible, inactive is hidden
      expect(screen.getByText('Albertsons Pacific Northwest')).toBeDefined();
      expect(screen.getByText('Appalachian Fresh Outlets')).toBeDefined();
      expect(screen.getByText('Atlanta Community Food Bank')).toBeDefined();
      expect(screen.queryByText('Inactive Salvage Partner')).toBeNull();

      // Filter by Search
      const searchInput = screen.getByPlaceholderText(/Search by name, company, email.../i);
      fireEvent.change(searchInput, { target: { value: 'Albertsons' } });

      expect(screen.getByText('Albertsons Pacific Northwest')).toBeDefined();
      expect(screen.queryByText('Appalachian Fresh Outlets')).toBeNull();
      expect(screen.queryByText('Atlanta Community Food Bank')).toBeNull();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Filter by Tier (Tier 2)
      const tierSelect = screen.getByRole('combobox', { name: /buyer tier/i });
      fireEvent.change(tierSelect, { target: { value: 'Tier 2' } });

      expect(screen.queryByText('Albertsons Pacific Northwest')).toBeNull();
      expect(screen.getByText('Appalachian Fresh Outlets')).toBeDefined();
      expect(screen.queryByText('Atlanta Community Food Bank')).toBeNull();

      // Reset tier filter
      fireEvent.change(tierSelect, { target: { value: '' } });

      // Filter by Status & Channel (Allergen Filter or Opt-Out)
      const statusSelect = screen.getByRole('combobox', { name: /status & channel/i });
      fireEvent.change(statusSelect, { target: { value: 'Allergen Filter' } });

      expect(screen.queryByText('Albertsons Pacific Northwest')).toBeNull();
      expect(screen.queryByText('Appalachian Fresh Outlets')).toBeNull();
      expect(screen.getByText('Atlanta Community Food Bank')).toBeDefined();

      // Reset status filter
      fireEvent.change(statusSelect, { target: { value: '' } });

      // Toggle Show Inactive Buyers
      const inactiveToggle = screen.getByLabelText(/Show Inactive Buyers/i);
      fireEvent.click(inactiveToggle);

      expect(screen.getByText('Inactive Salvage Partner')).toBeDefined();
    });

    it('renders "Clear Filters" button when any filter is active and resets when clicked', () => {
      render(
        <Provider store={testStore}>
          <BuyerRegistryPanel />
        </Provider>
      );

      expect(screen.queryByRole('button', { name: /clear filters/i })).toBeNull();

      const searchInput = screen.getByPlaceholderText(/Search by name, company, email.../i);
      fireEvent.change(searchInput, { target: { value: 'Food Bank' } });

      const clearBtn = screen.getByRole('button', { name: /clear filters/i });
      expect(clearBtn).toBeDefined();

      fireEvent.click(clearBtn);

      expect((searchInput as HTMLInputElement).value).toBe('');
      expect(screen.getByText('Albertsons Pacific Northwest')).toBeDefined();
      expect(screen.getByText('Appalachian Fresh Outlets')).toBeDefined();
      expect(screen.getByText('Atlanta Community Food Bank')).toBeDefined();
    });
  });

  describe('2. Subheader Action Buttons & Modal Launches', () => {
    it('renders subheader with title, count, and launches BuyerListManagerModal, UnifiedIngestionModal, and AddBuyerModal', () => {
      const uploadHandler = vi.fn();
      window.addEventListener('open-ingestion-upload-modal', uploadHandler);

      render(
        <Provider store={testStore}>
          <BuyerRegistryPanel />
        </Provider>
      );

      // Subheader text
      expect(screen.getByText(/Buyer Network & Allocation Accounts/i)).toBeDefined();

      // 1. "Buyer Lists" button opens BuyerListManagerModal
      const buyerListsBtn = screen.getByRole('button', { name: /Buyer Lists/i });
      fireEvent.click(buyerListsBtn);
      expect(screen.getByText('Buyer List Manager')).toBeDefined();

      // Close modal
      const closeBuyerListsBtn = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeBuyerListsBtn);

      // 2. "Import CSV" button dispatches open-ingestion-upload-modal with target 'buyers'
      const importBtn = screen.getByRole('button', { name: /Import CSV|Bulk Import via CSV/i });
      fireEvent.click(importBtn);
      expect(uploadHandler).toHaveBeenCalled();

      // 3. "+ Add Buyer" button opens AddBuyerModal
      const addBuyerBtn = screen.getByRole('button', { name: /\+ Add Buyer|Add Buyer Manually/i });
      fireEvent.click(addBuyerBtn);
      expect(screen.getByText(/Register a new buyer into your global network/i)).toBeDefined();

      // Clean up
      window.removeEventListener('open-ingestion-upload-modal', uploadHandler);
    });
  });

  describe('3. Modern Table Header and Rows', () => {
    it('renders 12-column Stitch headers and buyer rows with visual badges', () => {
      render(
        <Provider store={testStore}>
          <BuyerRegistryPanel />
        </Provider>
      );

      // Headers
      expect(screen.getByText('Company / Buyer Name')).toBeDefined();
      expect(screen.getByText('Contact Email')).toBeDefined();
      expect(screen.getAllByText('Buyer Tier').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Preferences & Channel')).toBeDefined();
      expect(screen.getByText('Create Date')).toBeDefined();
      expect(screen.getByText('Update Date')).toBeDefined();
      expect(screen.getByText('Status')).toBeDefined();
      expect(screen.getByText('Inspect')).toBeDefined();

      // Row elements for Albertsons
      expect(screen.getByText('Albertsons Pacific Northwest')).toBeDefined();
      expect(screen.getByText('ID: BYR-ALB-001 • 148 Stores')).toBeDefined();
      expect(screen.getByText('s.lin@albertsons-pnw.com')).toBeDefined();
      expect(screen.getAllByText('Tier 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Chilled & Frozen Priority')).toBeDefined();
      expect(screen.getByText('Full Opt-In • SQF Level 3')).toBeDefined();
      expect(screen.getByText('01/14/2025')).toBeDefined();
      expect(screen.getByText('09/17/2026')).toBeDefined();
      expect(screen.getAllByText('Active Compliant').length).toBeGreaterThanOrEqual(1);

      // Opt-Out Badges on Atlanta Community Food Bank
      expect(screen.getByText('No Bidding')).toBeDefined();
      expect(screen.getByText('No Sales')).toBeDefined();
    });
  });

  describe('4. Progressive Row Inspection Drawer & Contextual Action CTAs', () => {
    it('toggles the in-situ inspection drawer showing procurement officers, categories, hub facilities, tender CTAs, and Edit Buyer Profile button', () => {
      render(
        <Provider store={testStore}>
          <BuyerRegistryPanel />
        </Provider>
      );

      // Initially drawer is closed
      expect(screen.queryByText(/Procurement Officers/i)).toBeNull();

      // Click row 1 (Albertsons)
      const row1 = screen.getByText('Albertsons Pacific Northwest').closest('.lot-row');
      expect(row1).not.toBeNull();
      fireEvent.click(row1!);

      // Drawer contents revealed
      expect(screen.getByText(/Procurement Officers/i)).toBeDefined();
      expect(screen.getByText('Sarah Lin • Director of Remediation')).toBeDefined();
      expect(screen.getByText('Dairy & Chilled')).toBeDefined();
      expect(screen.getByText('DC #19 (Auburn, WA)')).toBeDefined();

      // Tender Action CTA
      expect(screen.getByRole('button', { name: /Send Lot Tender/i })).toBeDefined();

      // Explicit "Edit Buyer Profile" button (ADR 0043)
      const editProfileBtn = screen.getByRole('button', { name: /Edit Buyer Profile/i });
      expect(editProfileBtn).toBeDefined();

      // Click Edit Buyer Profile -> opens BuyerDetailDrawer slide-over
      fireEvent.click(editProfileBtn);
      expect(screen.getByTestId('buyer-detail-drawer')).toBeDefined();

      // Close drawer
      const closeBtn = screen.getByTestId('buyer-drawer-close-btn');
      fireEvent.click(closeBtn);
      expect(screen.queryByTestId('buyer-detail-drawer')).toBeNull();
    });
  });

  describe('5. Master "Toggle All" Synchronization', () => {
    it('master Toggle All button expands all visible rows if any are closed, and collapses all if all are open', () => {
      render(
        <Provider store={testStore}>
          <div>
            <PipelineSwitcherBar activeTab="buyers" onTabChange={() => {}} />
            <BuyerRegistryPanel />
          </div>
        </Provider>
      );

      const toggleAllBtn = screen.getByRole('button', { name: /toggle all/i });
      expect(toggleAllBtn).toBeDefined();
      expect(screen.getByText('Toggle All')).toBeDefined();

      // Initially no inspection drawers open
      expect(screen.queryAllByText(/Procurement Officers/i)).toHaveLength(0);

      // Click Toggle All -> expands all 3 active rows
      fireEvent.click(toggleAllBtn);

      expect(screen.getAllByText(/Procurement Officers/i)).toHaveLength(3);
      expect(screen.getByText('Collapse All')).toBeDefined();

      // Click again -> collapses all rows
      fireEvent.click(toggleAllBtn);

      expect(screen.queryAllByText(/Procurement Officers/i)).toHaveLength(0);
      expect(screen.getByText('Toggle All')).toBeDefined();
    });
  });

  describe('6. Pagination', () => {
    it('handles pagination properly when buyer records exceed page size', () => {
      const manyBuyers: BuyerRecord[] = Array.from({ length: 15 }, (_, i) => ({
        _id: `buyer-page-${i}`,
        buyerId: `BYR-PG-${100 + i}`,
        companyName: `Buyer Enterprise #${i + 1}`,
        name: `Buyer Enterprise #${i + 1}`,
        email: `buyer${i + 1}@enterprise.com`,
        tier: 'Tier 1',
        status: 'Active Compliant',
        isActive: true,
        optInBidding: true,
        optInSales: true,
      }));

      const paginatedStore = createTestStore(manyBuyers);

      render(
        <Provider store={paginatedStore}>
          <BuyerRegistryPanel />
        </Provider>
      );

      // 10 items per page by default: item #1 visible, item #11 not visible
      expect(screen.getByText('Buyer Enterprise #1')).toBeDefined();
      expect(screen.getByText('Buyer Enterprise #10')).toBeDefined();
      expect(screen.queryByText('Buyer Enterprise #11')).toBeNull();

      // Next page button
      const nextPageBtn = screen.getByRole('button', { name: /next/i });
      expect(nextPageBtn).toBeDefined();
      fireEvent.click(nextPageBtn);

      // On page 2: item #11 visible, item #1 not visible
      expect(screen.queryByText('Buyer Enterprise #1')).toBeNull();
      expect(screen.getByText('Buyer Enterprise #11')).toBeDefined();
    });
  });
});
