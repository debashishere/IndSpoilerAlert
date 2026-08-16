import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
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
    productId: { sku: 'MILK-ORGANIC', description: 'Organic Whole Milk 1 Gallon', category: 'Dairy' }
  },
  {
    _id: 'lot-102',
    lotNumber: 'LOT-YOGURT-102',
    availableQty: 250,
    quantityCases: 250,
    remainingShelfLife: 0.08,
    unitCogs: 8.00,
    productId: { sku: 'YOGURT-GREEK', description: 'Greek Yogurt 32oz', category: 'Dairy' }
  }
];

const mockBuyers = [
  { _id: 'b-1', companyName: 'Tier 1 Primary Retails', email: 'purchasing@primaryretails.com', createdAt: '2026-05-10T10:00:00.000Z' },
  { _id: 'b-2', companyName: 'City Food Bank', email: 'donations@cityfoodbank.org', tier: 'custom', createdAt: '2026-05-10T10:00:00.000Z' },
  { _id: 'b-3', companyName: 'EcoWaste Bio-Disposal', email: 'dispatch@ecowaste.com', tier: 'custom', createdAt: '2026-05-10T10:00:00.000Z' }
];

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer
    }
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('Issue 0091 — Slice 2: Granular Per-Stage Inventory Allocation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-cycles')) {
        return new Response(JSON.stringify({ _id: 'cycle-123' }), { status: 200 });
      }
      return new Response(JSON.stringify({ _id: 'camp-123', status: 'draft' }), { status: 200 });
    }));
    vi.stubGlobal('alert', vi.fn());
  });

  it('Slice 2.1: renders Inventory Allocation toggle inside expanded stage card and defaults to All Matching Lots', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Stage 1 is expanded by default (expandedStageIdx === 0)
    // Verify Inventory Allocation section is present
    const allocationSection = screen.getByTestId('stage-1-inventory-allocation-section');
    expect(allocationSection).toBeInTheDocument();
    expect(allocationSection).toHaveTextContent(/Inventory Allocation/i);

    // Check All Matching Lots and Custom Lot Subset buttons
    const allLotsBtn = screen.getByTestId('stage-1-allocation-all-btn');
    const customLotsBtn = screen.getByTestId('stage-1-allocation-custom-btn');

    expect(allLotsBtn).toBeInTheDocument();
    expect(allLotsBtn).toHaveTextContent(/All Matching Lots \(2\)/i);
    expect(customLotsBtn).toBeInTheDocument();
    expect(customLotsBtn).toHaveTextContent(/Custom Lot Subset/i);

    // Header badge shows All Lots (2)
    const headerChip = screen.getByTestId('stage-1-lot-allocation-chip');
    expect(headerChip).toHaveTextContent('All Lots (2)');
  });

  it('Slice 2.2: switches to Custom Lot Subset mode, lists selectable lots with details, and updates stage allocatedLotIds', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Click Custom Lot Subset button
    const customLotsBtn = screen.getByTestId('stage-1-allocation-custom-btn');
    fireEvent.click(customLotsBtn);

    // Verify lot checkboxes appear
    const lot101Checkbox = screen.getByTestId('stage-1-lot-checkbox-lot-101') as HTMLInputElement;
    const lot102Checkbox = screen.getByTestId('stage-1-lot-checkbox-lot-102') as HTMLInputElement;

    expect(lot101Checkbox).toBeInTheDocument();
    expect(lot102Checkbox).toBeInTheDocument();
    expect(lot101Checkbox.checked).toBe(true);
    expect(lot102Checkbox.checked).toBe(true);

    // Lot row details within Stage 1 inventory allocation section
    const allocationSection = screen.getByTestId('stage-1-inventory-allocation-section');
    expect(within(allocationSection).getByText('Organic Whole Milk 1 Gallon')).toBeInTheDocument();
    expect(within(allocationSection).getByText('(MILK-ORGANIC)')).toBeInTheDocument();
    expect(within(allocationSection).getByText('400 cs')).toBeInTheDocument();
    expect(within(allocationSection).getByText('Greek Yogurt 32oz')).toBeInTheDocument();
    expect(within(allocationSection).getByText('(YOGURT-GREEK)')).toBeInTheDocument();
    expect(within(allocationSection).getByText('250 cs')).toBeInTheDocument();

    // Deselect lot-102
    fireEvent.click(lot102Checkbox);
    expect(lot102Checkbox.checked).toBe(false);
    expect(lot101Checkbox.checked).toBe(true);

    // Verify collapsed header badge updates to '1 of 2 Lots Allocated'
    const headerChip = screen.getByTestId('stage-1-lot-allocation-chip');
    expect(headerChip).toHaveTextContent('1 of 2 Lots Allocated');

    // Switch back to All Matching Lots
    const allLotsBtn = screen.getByTestId('stage-1-allocation-all-btn');
    fireEvent.click(allLotsBtn);

    // Verify header badge returns to 'All Lots (2)'
    expect(headerChip).toHaveTextContent('All Lots (2)');
  });

  it('Slice 2.3: persists allocatedLotIds in workflow save / launch payload for configured stages', async () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Switch Stage 1 to Custom Lot Subset and pick only lot-101
    fireEvent.click(screen.getByTestId('stage-1-allocation-custom-btn'));
    const lot102Checkbox = screen.getByTestId('stage-1-lot-checkbox-lot-102');
    fireEvent.click(lot102Checkbox); // uncheck lot-102

    // Click Save campaign button
    const saveBtn = screen.getByTestId('save-campaign-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      const fetchMock = global.fetch as any;
      const calls = fetchMock.mock.calls.filter((c: any[]) => c[0].includes('/liquidation-automations'));
      expect(calls.length).toBeGreaterThan(0);
      const payload = JSON.parse(calls[0][1]?.body as string);
      expect(payload.stages[0].allocatedLotIds).toEqual(['lot-101']);
    });
  });
});
