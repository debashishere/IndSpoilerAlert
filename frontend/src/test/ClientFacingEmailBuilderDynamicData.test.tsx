import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

describe('Client-Facing Simple Email Builder & Dynamic Data Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, templates: [] }), { status: 200 })));
  });

  it('renders Client-Facing Simple Builder tag and dynamic token chips', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Verify Client-Facing Simple Builder indicator badge
    expect(screen.getByText('Client-Facing Simple Builder')).toBeInTheDocument();

    // Verify Centralized Email Attachment section header exists
    expect(screen.getByText(/4\. (Email Template|Attach Centralized Email Template)/i)).toBeInTheDocument();
    expect(screen.getByTestId('attach-email-template-select')).toBeInTheDocument();

    // Verify Insert Dynamic Merge Tags is hidden for internal automated handling
    expect(screen.queryByText('Insert Dynamic Merge Tags')).not.toBeInTheDocument();
  });

  it('renders explicit empty placeholders when 0 inventory or buyers are active', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Token Config button exists
    expect(screen.getAllByText('Token Config')[0]).toBeInTheDocument();

    // Open Token Config modal
    fireEvent.click(screen.getAllByRole('button', { name: /Token Config/i })[0]);

    // When 0 inventory/buyers are selected, explicit empty placeholders are rendered
    expect(screen.getByDisplayValue('[No Inventory Selected]')).toBeInTheDocument();
  });

  it('renders dynamic lot title and allows editing preview values with reset control', async () => {
    const mockLots = [
      { id: 'lot-1', title: 'Organic Whole Milk', availableQty: 100, remainingShelfLife: 0.10, productId: { sku: 'SKU-MILK' } },
      { id: 'lot-2', title: 'Greek Yogurt Pack', availableQty: 50, remainingShelfLife: 0.05, productId: { sku: 'SKU-YOGURT' } }
    ];

    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('inventory')) {
        return new Response(JSON.stringify(mockLots), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true, templates: [] }), { status: 200 });
    }));

    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockLots}
        buyers={[{ id: 'b1', companyName: 'Closeout Buyers LLC' }]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Open Token Config modal
    fireEvent.click(screen.getAllByRole('button', { name: /Token Config/i })[0]);

    // Multi-lot title formatting
    const lotTitleInput = screen.getByDisplayValue(/Organic Whole Milk \(\+1 additional lot\)/i);
    expect(lotTitleInput).toBeInTheDocument();

    // Change Lot Title override
    fireEvent.change(lotTitleInput, { target: { value: 'Custom Surplus Lot Title' } });
    expect(lotTitleInput).toHaveValue('Custom Surplus Lot Title');

    // Reset button appears when override is active inside modal
    const resetButton = screen.getByRole('button', { name: /Reset to Workflow Values/i });
    expect(resetButton).toBeInTheDocument();

    // Click Reset to Workflow Values
    fireEvent.click(resetButton);
    expect(screen.getByDisplayValue(/Organic Whole Milk \(\+1 additional lot\)/i)).toBeInTheDocument();
  });

  it('sanitizes raw database hex IDs for supplier_name', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="6a61abe7b15358bc3"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Open Token Config modal
    fireEvent.click(screen.getAllByRole('button', { name: /Token Config/i })[0]);

    // Verify raw hex ID is NOT rendered as Supplier Org
    expect(screen.queryByDisplayValue('6a61abe7b15358bc3')).not.toBeInTheDocument();
    // Verify fallback human-readable Supplier Org is rendered instead
    expect(screen.getByDisplayValue('Unilever Supply Operations')).toBeInTheDocument();
  });

  it('renders Token Config button beside token Tags button inside Edit Workflow Email Body HTML', () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Verify editor toolbar has Token Config button beside token Tags button
    const editorTokenConfigBtn = screen.getByTestId('editor-dynamic-token-config-button');
    expect(editorTokenConfigBtn).toBeInTheDocument();

    // Click button from inside email body toolbar
    fireEvent.click(editorTokenConfigBtn);
    expect(screen.getByText('Dynamic Token Config', { selector: 'h3' })).toBeInTheDocument();
  });
});

