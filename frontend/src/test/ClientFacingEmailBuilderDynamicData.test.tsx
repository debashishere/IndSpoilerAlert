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

    // Dynamic Data Context panel header exists
    expect(screen.getByText('Dynamic Data Context & Preview Overrides')).toBeInTheDocument();

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

    // Multi-lot title formatting
    const lotTitleInput = screen.getByDisplayValue(/Organic Whole Milk \(\+1 additional lot\)/i);
    expect(lotTitleInput).toBeInTheDocument();

    // Change Lot Title override
    fireEvent.change(lotTitleInput, { target: { value: 'Custom Surplus Lot Title' } });
    expect(lotTitleInput).toHaveValue('Custom Surplus Lot Title');

    // Reset button appears when override is active
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

    // Verify raw hex ID is NOT rendered as Supplier Org
    expect(screen.queryByDisplayValue('6a61abe7b15358bc3')).not.toBeInTheDocument();
    // Verify fallback human-readable Supplier Org is rendered instead
    expect(screen.getByDisplayValue('Unilever Supply Operations')).toBeInTheDocument();
  });
});

