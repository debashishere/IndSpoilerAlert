import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';

const mockInventoryLots = [
  {
    _id: 'lot-101',
    lotNumber: 'LOT-MILK-101',
    availableQty: 400,
    quantityCases: 400,
    remainingShelfLife: 0.12,
    unitCogs: 12.50,
    status: 'active',
    productId: { sku: 'MILK-ORGANIC', description: 'Organic Whole Milk 1 Gallon', category: 'Dairy' }
  },
  {
    _id: 'lot-102',
    lotNumber: 'LOT-YOGURT-102',
    availableQty: 250,
    quantityCases: 250,
    remainingShelfLife: 0.08,
    unitCogs: 8.00,
    status: 'active',
    productId: { sku: 'YOGURT-GREEK', description: 'Greek Yogurt 32oz', category: 'Dairy' }
  }
];

const mockBuyers = [
  { _id: 'b-1', companyName: 'Tier 1 Primary Retails', email: 'purchasing@primaryretails.com', createdAt: '2026-05-10T10:00:00.000Z' }
];

function renderWithStore(ui: React.ReactElement, preloadedWorkflowState = {}) {
  const store = configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer
    },
    preloadedState: {
      workflow: {
        liquidationCycles: [],
        liquidationAutomations: [],
        automationRuns: [],
        loading: false,
        error: null,
        editingCampaignId: null,
        showCampaignDrawer: false,
        campaignWizardStep: 1,
        workflowSubTab: 'builder',
        runsFilter: 'all',
        selectedAutomationTemplate: '',
        stageGates: [],
        categoryFilter: '',
        maxRslFilter: 0.2,
        minCasesFilter: 0,
        explicitLotIds: [],
        excludedLotIds: [],
        selectorMode: 'automatic',
        showPreFlightModal: false,
        previewHtml: null,
        previewLoading: false,
        selectedCycleId: null,
        selectedRunDetails: null,
        showRunDetailsModal: false,
        ...preloadedWorkflowState
      } as any
    }
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('Issue 0103 — Slice 1: Edit-Mode Inventory Drift Detection & Alert Banner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-automations/camp-drift-1')) {
        return new Response(JSON.stringify({
          _id: 'camp-drift-1',
          name: 'Short Dated Dairy Clearance',
          templateKey: 'short_dated_clearance',
          inventoryFilters: { category: 'Dairy', maxRsl: 0.10, minCases: 0, selectorMode: 'automatic' },
          stages: [
            {
              stageNumber: 1,
              name: 'Primary Tier Bargain',
              discountType: 'percentage_off_wholesale',
              discountValue: 15,
              waitHours: 24,
              buyerMode: 'all',
              customBuyers: [],
              autoExecute: true
            }
          ]
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ _id: 'camp-default' }), { status: 200 });
    }));
  });

  it('renders drift alert banner when historical run snapshot count differs from live matched lots count', async () => {
    const historicalRuns = [
      {
        _id: 'run-historical-1',
        automationId: 'camp-drift-1',
        executedAt: '2026-08-10T14:30:00.000Z',
        status: 'awarded',
        snapshotInventoryIds: ['lot-101', 'lot-102', 'lot-historical-old']
      }
    ];

    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
        editingCampaignId="camp-drift-1"
      />,
      { automationRuns: historicalRuns }
    );

    // Wait for campaign fetch hydration
    await waitFor(() => {
      expect(screen.getByTestId('inventory-drift-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('inventory-drift-banner');
    expect(banner).toHaveTextContent(/Inventory Scope Updated \(Live Re-evaluation\)/i);
    // With maxRsl = 0.10, lot-102 (0.08) matches, while lot-101 (0.12) does not. So live matched count = 1.
    // Historical run had 3 lots. Drift difference = 3 - 1 = 2 lots.
    expect(banner).toHaveTextContent(/1 lot\(s\) are eligible/i);
    expect(banner).toHaveTextContent(/2 previously processed lots are no longer active/i);

    // Verify action buttons
    expect(screen.getByTestId('drift-review-breakdown-btn')).toBeInTheDocument();
    expect(screen.getByTestId('drift-dismiss-banner-btn')).toBeInTheDocument();
  });

  it('dismisses the drift banner when [Dismiss] button is clicked', async () => {
    const historicalRuns = [
      {
        _id: 'run-historical-1',
        automationId: 'camp-drift-1',
        executedAt: '2026-08-10T14:30:00.000Z',
        status: 'awarded',
        snapshotInventoryIds: ['lot-101', 'lot-102', 'lot-historical-old']
      }
    ];

    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
        editingCampaignId="camp-drift-1"
      />,
      { automationRuns: historicalRuns }
    );

    await waitFor(() => {
      expect(screen.getByTestId('inventory-drift-banner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('drift-dismiss-banner-btn'));

    expect(screen.queryByTestId('inventory-drift-banner')).not.toBeInTheDocument();
  });

  it('does NOT render drift banner when counts match or there is no previous execution run', async () => {
    // No runs for this campaign
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
        editingCampaignId="camp-drift-1"
      />,
      { automationRuns: [] }
    );

    await waitFor(() => {
      expect(screen.queryByTestId('inventory-drift-banner')).not.toBeInTheDocument();
    });
  });
});

describe('Issue 0103 — Slice 2: Inventory Scope Diff Modal & Lot Status Breakdown', () => {
  const extendedInventoryLots = [
    {
      _id: 'lot-101',
      lotNumber: 'LOT-MILK-101',
      availableQty: 400,
      quantityCases: 400,
      remainingShelfLife: 0.12,
      unitCogs: 12.50,
      status: 'active',
      productId: { sku: 'MILK-ORGANIC', description: 'Organic Whole Milk 1 Gallon', category: 'Dairy' }
    },
    {
      _id: 'lot-102',
      lotNumber: 'LOT-YOGURT-102',
      availableQty: 250,
      quantityCases: 250,
      remainingShelfLife: 0.08,
      unitCogs: 8.00,
      status: 'active',
      productId: { sku: 'YOGURT-GREEK', description: 'Greek Yogurt 32oz', category: 'Dairy' }
    },
    {
      _id: 'lot-103',
      lotNumber: 'LOT-CHEESE-103',
      availableQty: 0,
      quantityCases: 0,
      remainingShelfLife: 0.05,
      unitCogs: 15.00,
      status: 'sold',
      productId: { sku: 'CHEESE-CHEDDAR', description: 'Sharp Cheddar Block', category: 'Dairy' }
    },
    {
      _id: 'lot-104',
      lotNumber: 'LOT-BUTTER-104',
      availableQty: 100,
      quantityCases: 100,
      remainingShelfLife: 0.00,
      unitCogs: 6.00,
      status: 'expired',
      productId: { sku: 'BUTTER-SALTED', description: 'Salted Butter 1lb', category: 'Dairy' }
    }
  ];

  const historicalRuns = [
    {
      _id: 'run-historical-1',
      automationId: 'camp-drift-1',
      executedAt: '2026-08-10T14:30:00.000Z',
      status: 'awarded',
      snapshotInventoryIds: ['lot-101', 'lot-103', 'lot-104']
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-automations/camp-drift-1')) {
        return new Response(JSON.stringify({
          _id: 'camp-drift-1',
          name: 'Short Dated Dairy Clearance',
          templateKey: 'short_dated_clearance',
          inventoryFilters: { category: 'Dairy', maxRsl: 0.10, minCases: 0, selectorMode: 'automatic' },
          stages: [
            {
              stageNumber: 1,
              name: 'Primary Tier Bargain',
              discountType: 'percentage_off_wholesale',
              discountValue: 15,
              waitHours: 24,
              buyerMode: 'all',
              customBuyers: [],
              autoExecute: true
            }
          ]
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ _id: 'camp-default' }), { status: 200 });
    }));
  });

  it('opens the diff modal when clicking [Review Lot Breakdown] and displays categorization chips and table', async () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={extendedInventoryLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
        editingCampaignId="camp-drift-1"
      />,
      { automationRuns: historicalRuns }
    );

    await waitFor(() => {
      expect(screen.getByTestId('drift-review-breakdown-btn')).toBeInTheDocument();
    });

    // Click Review Lot Breakdown
    fireEvent.click(screen.getByTestId('drift-review-breakdown-btn'));

    // Modal should be visible
    const modal = await screen.findByTestId('inventory-diff-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent(/Inventory Re-evaluation Diff Breakdown/i);

    // Summary chips
    expect(screen.getByTestId('diff-chip-eligible')).toHaveTextContent(/1 Currently Eligible/i);
    expect(screen.getByTestId('diff-chip-liquidated')).toHaveTextContent(/1 Liquidated/i);
    expect(screen.getByTestId('diff-chip-expired')).toHaveTextContent(/1 Expired/i);
    expect(screen.getByTestId('diff-chip-newly-added')).toHaveTextContent(/1 Newly Added/i);

    // Table rows
    expect(screen.getByTestId('diff-row-lot-102')).toBeInTheDocument(); // Newly eligible (0.08 RSL, Dairy)
    expect(screen.getByTestId('diff-row-lot-103')).toBeInTheDocument(); // Liquidated (0 cases / sold)
    expect(screen.getByTestId('diff-row-lot-104')).toBeInTheDocument(); // Expired (0 RSL / expired)

    // Filter tabs
    fireEvent.click(screen.getByTestId('diff-tab-eligible'));
    expect(screen.getByTestId('diff-row-lot-102')).toBeInTheDocument();
    expect(screen.queryByTestId('diff-row-lot-103')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('diff-tab-unavailable'));
    expect(screen.getByTestId('diff-row-lot-103')).toBeInTheDocument();
    expect(screen.getByTestId('diff-row-lot-104')).toBeInTheDocument();
    expect(screen.queryByTestId('diff-row-lot-102')).not.toBeInTheDocument();

    // Close button
    fireEvent.click(screen.getByTestId('diff-close-modal-btn'));
    expect(screen.queryByTestId('inventory-diff-modal')).not.toBeInTheDocument();
  });
});

describe('Issue 0103 — Slice 3: Dynamic Rule vs. Pinned Scope Mode & Stage Allocation Sync', () => {
  const mockLots = [
    {
      _id: 'lot-101',
      lotNumber: 'LOT-MILK-101',
      availableQty: 400,
      quantityCases: 400,
      remainingShelfLife: 0.12,
      unitCogs: 12.50,
      status: 'active',
      productId: { sku: 'MILK-ORGANIC', description: 'Organic Whole Milk 1 Gallon', category: 'Dairy' }
    },
    {
      _id: 'lot-102',
      lotNumber: 'LOT-YOGURT-102',
      availableQty: 250,
      quantityCases: 250,
      remainingShelfLife: 0.08,
      unitCogs: 8.00,
      status: 'active',
      productId: { sku: 'YOGURT-GREEK', description: 'Greek Yogurt 32oz', category: 'Dairy' }
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('switches between Dynamic Rule (Sweep) and Pinned Lot Scope (Snapshot) mode in Section 2', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-automations/camp-mode-1')) {
        return new Response(JSON.stringify({
          _id: 'camp-mode-1',
          name: 'Mode Switching Campaign',
          inventoryFilters: { category: 'Dairy', maxRsl: 0.20, selectorMode: 'automatic' },
          stages: []
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ _id: 'camp-default' }), { status: 200 });
    }));

    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
        editingCampaignId="camp-mode-1"
      />
    );

    // Verify mode toggle buttons in Section 2
    const dynamicBtn = await screen.findByTestId('scope-mode-dynamic-btn');
    const pinnedBtn = screen.getByTestId('scope-mode-pinned-btn');
    const infoDynamicBtn = screen.getByTestId('info-dynamic-scope-btn');
    const infoPinnedBtn = screen.getByTestId('info-pinned-scope-btn');

    expect(dynamicBtn).toBeInTheDocument();
    expect(pinnedBtn).toBeInTheDocument();
    expect(infoDynamicBtn).toBeInTheDocument();
    expect(infoPinnedBtn).toBeInTheDocument();

    // Click info button for Dynamic Rule to open floating description popover
    fireEvent.click(infoDynamicBtn);
    const dynamicPopover = await screen.findByTestId('scope-mode-info-popover');
    expect(dynamicPopover).toBeInTheDocument();
    expect(dynamicPopover).toHaveTextContent(/Dynamic Rule \(Sweep Mode\)/i);
    expect(dynamicPopover).toHaveTextContent(/Live Dynamic Evaluation/i);
    expect(dynamicPopover).toHaveTextContent(/Evaluates filter criteria/i);

    // Close popover
    fireEvent.click(screen.getByTestId('close-scope-info-popover-btn'));
    expect(screen.queryByTestId('scope-mode-info-popover')).not.toBeInTheDocument();

    // Click info button for Pinned Lot Scope to open floating description popover
    fireEvent.click(infoPinnedBtn);
    const pinnedPopover = await screen.findByTestId('scope-mode-info-popover');
    expect(pinnedPopover).toBeInTheDocument();
    expect(pinnedPopover).toHaveTextContent(/Pinned Lot Scope \(Snapshot Mode\)/i);
    expect(pinnedPopover).toHaveTextContent(/Locked Lot Snapshot/i);
    expect(pinnedPopover).toHaveTextContent(/Freezes and pins a specific list of inventory lots/i);

    // Close popover
    fireEvent.click(screen.getByTestId('close-scope-info-popover-btn'));
    expect(screen.queryByTestId('scope-mode-info-popover')).not.toBeInTheDocument();

    // Click Pinned Lot Scope
    fireEvent.click(pinnedBtn);
    expect(pinnedBtn).toHaveAttribute('data-active', 'true');

    // Click Dynamic Rule
    fireEvent.click(dynamicBtn);
    expect(dynamicBtn).toHaveAttribute('data-active', 'true');
  });

  it('syncs stage allocations by removing defunct lot IDs when clicking [Sync Stage Allocations]', async () => {
    let savedPayload: any = null;

    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/liquidation-automations/camp-sync-1')) {
        if (init?.method === 'PUT' || init?.method === 'PATCH') {
          savedPayload = JSON.parse(init.body as string);
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({
          _id: 'camp-sync-1',
          name: 'Stage Allocation Sync Campaign',
          inventoryFilters: { category: 'Dairy', maxRsl: 0.20, selectorMode: 'automatic' },
          stages: [
            {
              stageNumber: 1,
              name: 'Primary Tier Bargain',
              discountType: 'percentage_off_wholesale',
              discountValue: 15,
              waitHours: 24,
              buyerMode: 'all',
              customBuyers: [],
              autoExecute: true,
              // Allocated lot-101 (valid) and lot-defunct (no longer active/available)
              allocatedLotIds: ['lot-101', 'lot-defunct']
            }
          ]
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ _id: 'camp-default' }), { status: 200 });
    }));

    const historicalRuns = [
      {
        _id: 'run-sync-1',
        automationId: 'camp-sync-1',
        executedAt: '2026-08-10T14:30:00.000Z',
        status: 'awarded',
        snapshotInventoryIds: ['lot-101', 'lot-defunct', 'lot-extra']
      }
    ];

    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
        editingCampaignId="camp-sync-1"
      />,
      { automationRuns: historicalRuns }
    );

    // Wait for hydration and drift banner
    const syncBtn = await screen.findByTestId('sync-stage-allocations-btn');
    expect(syncBtn).toBeInTheDocument();

    // Click Sync Stage Allocations
    fireEvent.click(syncBtn);

    // Save campaign
    const saveBtn = screen.getByTestId('studio-save-strategy-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(savedPayload).not.toBeNull();
    });

    // In saved payload, stage 1 allocatedLotIds should only contain valid lot-101, not lot-defunct
    expect(savedPayload.stages[0].allocatedLotIds).toEqual(['lot-101']);
  });
});
