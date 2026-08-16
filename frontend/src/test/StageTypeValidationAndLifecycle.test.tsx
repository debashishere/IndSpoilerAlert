import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  { _id: 'b-1', companyName: 'Tier 1 Primary Retails', email: 'purchasing@primaryretails.com', tier: 1, createdAt: '2026-05-10T10:00:00.000Z' },
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

describe('0093 — Slice 4: Stage-Type Validation Guardrails & Persistence Verification', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch = vi.fn(async (url: string, init?: any) => {
      if (url.includes('/liquidation-cycles')) {
        return new Response(JSON.stringify({ _id: 'cycle-999' }), { status: 200 });
      }
      if (url.includes('/liquidation-automations')) {
        const body = init?.body ? JSON.parse(init.body) : {};
        return new Response(JSON.stringify({ _id: 'auto-999', ...body }), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('alert', vi.fn());
  });

  describe('Seam 1: Stage-Specific Validation Rules and Error Banners', () => {
    it('displays validation error banner for Donation stage with 0 targeted partners or 0 allocated lots', () => {
      renderWithStore(
        <LiquidationAutomationStudio
          supplierId="sup-101"
          inventoryLots={mockInventoryLots}
          buyers={mockBuyers}
        />
      );

      // Switch Stage 1 to Donation
      fireEvent.click(screen.getByTestId('stage-1-type-donation'));

      // Switch audience mode to custom and ensure 0 partners selected
      const customModeBtn = screen.getByTestId('stage-audience-mode-custom');
      fireEvent.click(customModeBtn);

      // Should show validation error banner for Donation stage requiring at least 1 partner
      expect(screen.getByTestId('stage-1-validation-error')).toBeInTheDocument();
      expect(screen.getByText(/Donation Stage 1 requires at least 1 targeted charity or non-profit partner/i)).toBeInTheDocument();
    });

    it('displays validation error banner for Landfill stage when disposal deadline is missing', () => {
      renderWithStore(
        <LiquidationAutomationStudio
          supplierId="sup-101"
          inventoryLots={mockInventoryLots}
          buyers={mockBuyers}
        />
      );

      // Switch Stage 1 to Landfill
      fireEvent.click(screen.getByTestId('stage-1-type-landfill'));

      // Since default disposalDeadline is empty or if cleared
      const dateInput = screen.getByTestId('stage-1-disposal-deadline-input');
      fireEvent.change(dateInput, { target: { value: '' } });

      expect(screen.getByTestId('stage-1-validation-error')).toBeInTheDocument();
      expect(screen.getByText(/Landfill Stage 1 requires a valid disposal deadline date/i)).toBeInTheDocument();
    });

    it('bypasses commercial discount validation for Donation and Landfill stages', () => {
      renderWithStore(
        <LiquidationAutomationStudio
          supplierId="sup-101"
          inventoryLots={mockInventoryLots}
          buyers={mockBuyers}
        />
      );

      // Switch Stage 1 to Donation
      fireEvent.click(screen.getByTestId('stage-1-type-donation'));

      // Ensure that discount validation errors are not present for Donation
      expect(screen.queryByText(/requires a valid discount value/i)).not.toBeInTheDocument();

      // Switch to Landfill
      fireEvent.click(screen.getByTestId('stage-1-type-landfill'));
      expect(screen.queryByText(/requires a valid discount value/i)).not.toBeInTheDocument();
    });
  });

  describe('Seam 2: Pre-Flight Launch Audit and Save Action Validation Guardrails', () => {
    it('disables launch button and prevents save when a polymorphic stage has validation errors', () => {
      renderWithStore(
        <LiquidationAutomationStudio
          supplierId="sup-101"
          inventoryLots={mockInventoryLots}
          buyers={mockBuyers}
        />
      );

      // Switch Stage 1 to Landfill without setting a disposal deadline
      fireEvent.click(screen.getByTestId('stage-1-type-landfill'));
      const dateInput = screen.getByTestId('stage-1-disposal-deadline-input');
      fireEvent.change(dateInput, { target: { value: '' } });

      // Launch Preflight button should be disabled
      const preFlightBtn = screen.getByTestId('open-preflight-btn');
      expect(preFlightBtn).toBeDisabled();

      // Save Draft button alerts validation error when clicked
      const saveDraftBtn = screen.getByTestId('save-campaign-btn');
      fireEvent.click(saveDraftBtn);
      expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/disposal deadline/i));
    });
  });

  describe('Seam 3: End-to-End Polymorphic Workflow Save & Persistence', () => {
    it('successfully validates and persists a 3-stage polymorphic workflow (Liquidation -> Donation -> Landfill)', async () => {
      renderWithStore(
        <LiquidationAutomationStudio
          supplierId="sup-101"
          inventoryLots={mockInventoryLots}
          buyers={mockBuyers}
        />
      );

      // Set workflow name
      const nameInput = screen.getByTestId('workflow-name-input');
      fireEvent.change(nameInput, { target: { value: 'Complete Polymorphic Escalation Flow' } });

      // Initial state has Stage 1 (Liquidation) and Stage 2 (Secondary Liquidators).
      // Switch Stage 2 to Donation
      fireEvent.click(screen.getByTestId('stage-2-type-donation'));

      // Add Stage 3
      const addStageBtn = screen.getByText(/Add Escalation Stage/i);
      fireEvent.click(addStageBtn);

      // Switch Stage 3 to Landfill
      fireEvent.click(screen.getByTestId('stage-3-type-landfill'));

      // Set valid disposal deadline for Stage 3
      const dateInput = screen.getByTestId('stage-3-disposal-deadline-input');
      fireEvent.change(dateInput, { target: { value: '2026-12-31' } });

      // Click Save Draft
      const saveDraftBtn = screen.getByTestId('save-campaign-btn');
      expect(saveDraftBtn).not.toBeDisabled();
      fireEvent.click(saveDraftBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/liquidation-automations'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"Complete Polymorphic Escalation Flow"')
          })
        );
      });

      // Verify the persisted stages payload has correct stageTypes
      const call = mockFetch.mock.calls.find((c: any) => c[0].includes('/liquidation-automations'));
      expect(call).toBeDefined();
      const payload = JSON.parse(call[1].body);
      expect(payload.stages).toHaveLength(3);
      expect(payload.stages[0].stageType).toBe('liquidation');
      expect(payload.stages[1].stageType).toBe('donation');
      expect(payload.stages[2].stageType).toBe('landfill');
      expect(payload.stages[2].disposalDeadline).toBe('2026-12-31');
    });
  });
});
