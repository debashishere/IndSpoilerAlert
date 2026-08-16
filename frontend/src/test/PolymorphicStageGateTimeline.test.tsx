import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Slice 1: Stage Type Switcher & Polymorphic Stage Panel Transformation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  });

  it('renders stage type switcher segmented pills on each stage card', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Stage 1 switcher buttons
    const stage1LiquidationBtn = screen.getByTestId('stage-1-type-liquidation');
    const stage1DonationBtn = screen.getByTestId('stage-1-type-donation');
    const stage1LandfillBtn = screen.getByTestId('stage-1-type-landfill');

    expect(stage1LiquidationBtn).toBeInTheDocument();
    expect(stage1DonationBtn).toBeInTheDocument();
    expect(stage1LandfillBtn).toBeInTheDocument();
  });

  it('transforms stage panel to Donation mode: hides pricing rules, displays Offer Expiration Window, and shows Donation badge', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Click Donation button on Stage 1
    const stage1DonationBtn = screen.getByTestId('stage-1-type-donation');
    fireEvent.click(stage1DonationBtn);

    // Collapsed chip should show Donation Transfer (Complimentary)
    expect(screen.getByText(/Donation Transfer \(Complimentary\)/i)).toBeInTheDocument();

    // Expand Stage 1
    const stage1Circle = screen.getAllByText('1')[0];
    fireEvent.click(stage1Circle);

    // Pricing Rule dropdown should NOT be in the document
    expect(screen.queryByText(/Pricing Rule/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Yield Optimizer/i)).not.toBeInTheDocument();

    // Should display Offer Expiration Window
    expect(screen.getByText(/Offer Expiration Window/i)).toBeInTheDocument();
  });

  it('transforms stage panel to Landfill mode: hides pricing rules, displays Disposal & Removal Deadline date picker, and shows deadline chip', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Click Landfill button on Stage 1
    const stage1LandfillBtn = screen.getByTestId('stage-1-type-landfill');
    fireEvent.click(stage1LandfillBtn);

    // Expand Stage 1
    const stage1Circle = screen.getAllByText('1')[0];
    fireEvent.click(stage1Circle);

    // Pricing rules should NOT be present
    expect(screen.queryByText(/Pricing Rule/i)).not.toBeInTheDocument();

    // Should display Disposal & Removal Deadline section
    expect(screen.getByText(/Disposal & Removal Deadline/i)).toBeInTheDocument();

    // Date picker input for disposal deadline
    const dateInput = screen.getByTestId('stage-1-disposal-deadline-input');
    expect(dateInput).toBeInTheDocument();

    fireEvent.change(dateInput, { target: { value: '2026-09-01' } });
    expect((dateInput as HTMLInputElement).value).toBe('2026-09-01');

    // Summary chip should reflect Disposal Deadline
    expect(screen.getByText(/Disposal Deadline: 2026-09-01/i)).toBeInTheDocument();
  });
});

describe('Slice 2: Granular Per-Stage Inventory Allocation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  });

  it('renders Inventory Allocation section inside stage panel with All vs Custom selection', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Stage 1 collapsed badge should show All Lots
    expect(screen.getByTestId('stage-1-lot-allocation-chip')).toHaveTextContent(/All Lots \(2\)/i);

    // Expand Stage 1
    const stage1Circle = screen.getAllByText('1')[0];
    fireEvent.click(stage1Circle);

    // Inventory Allocation controls
    expect(screen.getByTestId('stage-1-allocation-all-btn')).toBeInTheDocument();
    expect(screen.getByTestId('stage-1-allocation-custom-btn')).toBeInTheDocument();
  });

  it('allows toggling to Custom Lot Selection and selecting specific lots', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Expand Stage 1
    const stage1Circle = screen.getAllByText('1')[0];
    fireEvent.click(stage1Circle);

    // Switch to Custom Lot Subset mode
    const customBtn = screen.getByTestId('stage-1-allocation-custom-btn');
    fireEvent.click(customBtn);

    // Lot checkboxes should now be rendered
    const lot101Checkbox = screen.getByTestId('stage-1-lot-checkbox-lot-101');
    const lot102Checkbox = screen.getByTestId('stage-1-lot-checkbox-lot-102');

    expect(lot101Checkbox).toBeInTheDocument();
    expect(lot102Checkbox).toBeInTheDocument();

    // Select lot-101 only
    fireEvent.click(lot101Checkbox);

    // Header chip should update to reflect 1 of 2 Lots Allocated
    expect(screen.getByTestId('stage-1-lot-allocation-chip')).toHaveTextContent(/1 of 2 Lots/i);
  });
});

describe('Slice 3: Context-Aware Stage Email Presets & Dynamic Token Interpolation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  });

  it('pre-populates Donation email template and subject when opening StageEmailModal for a Donation stage', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Switch Stage 1 to Donation
    const stage1DonationBtn = screen.getByTestId('stage-1-type-donation');
    fireEvent.click(stage1DonationBtn);

    // Stage 1 is expanded by default, open Configure Stage Email modal
    const configBtn = screen.getByTestId('configure-stage-email-btn-1');
    fireEvent.click(configBtn);

    // Should load the donation template and subject
    const subjectInput = screen.getByTestId('stage-modal-subject-input');
    expect(subjectInput).toHaveValue('Surplus Inventory Donation Transfer Offer: {{lot_title}}');
  });

  it('pre-populates Landfill email template and subject when opening StageEmailModal for a Landfill stage', () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Switch Stage 1 to Landfill
    const stage1LandfillBtn = screen.getByTestId('stage-1-type-landfill');
    fireEvent.click(stage1LandfillBtn);

    // Stage 1 is expanded by default, open Configure Stage Email modal
    const configBtn = screen.getByTestId('configure-stage-email-btn-1');
    fireEvent.click(configBtn);

    // Should load the landfill/disposal template and subject
    const subjectInput = screen.getByTestId('stage-modal-subject-input');
    expect(subjectInput).toHaveValue('Disposal & Removal Authorization Notice: {{lot_title}}');
  });
});

describe('Slice 4: Stage-Type Validation Guardrails & Persistence Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ _id: 'auto-123', status: 'active' }), { status: 201 })));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('blocks saving a workflow if a Landfill stage has missing disposal deadline', async () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Switch Stage 1 to Landfill
    const stage1LandfillBtn = screen.getByTestId('stage-1-type-landfill');
    fireEvent.click(stage1LandfillBtn);

    // Leave disposal deadline empty and try to save
    const saveDraftBtn = screen.getByTestId('save-campaign-btn');
    fireEvent.click(saveDraftBtn);

    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/disposal deadline/i));
  });

  it('blocks saving a workflow if a Donation stage has custom lot allocation with 0 lots selected', async () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Switch Stage 1 to Donation
    const stage1DonationBtn = screen.getByTestId('stage-1-type-donation');
    fireEvent.click(stage1DonationBtn);

    // Select Custom Lot subset but uncheck all lots
    const customBtn = screen.getByTestId('stage-1-allocation-custom-btn');
    fireEvent.click(customBtn);

    const chk1 = screen.getByTestId('stage-1-lot-checkbox-lot-101');
    const chk2 = screen.getByTestId('stage-1-lot-checkbox-lot-102');
    fireEvent.click(chk1);
    fireEvent.click(chk2);

    // Save Draft
    const saveDraftBtn = screen.getByTestId('save-campaign-btn');
    fireEvent.click(saveDraftBtn);

    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/allocated inventory lot/i));
  });

  it('successfully submits a valid polymorphic workflow with Liquidation and Donation stages', async () => {
    renderWithStore(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
      />
    );

    // Set stage 1 to donation with full lots
    const stage1DonationBtn = screen.getByTestId('stage-1-type-donation');
    fireEvent.click(stage1DonationBtn);

    // Save Draft
    const saveDraftBtn = screen.getByTestId('save-campaign-btn');
    fireEvent.click(saveDraftBtn);

    expect(window.fetch).toHaveBeenCalled();
  });
});


