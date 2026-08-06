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
  }
];

const mockBuyers = [
  { _id: 'b-1', companyName: 'Tier 1 Primary Retails', email: 'purchasing@primaryretails.com', createdAt: '2026-05-10T10:00:00.000Z' }
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

describe('Stage-Gate Escalation Timeline: Response Window Days Option', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  });

  it('renders Days option alongside Hours and Mins in Response Window dropdown and updates duration on change', () => {
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

    // Find all unit select dropdowns in the timeline
    const selectElements = screen.getAllByRole('combobox');
    const unitSelect = selectElements.find(select => {
      const options = Array.from(select.querySelectorAll('option'));
      return options.some(opt => opt.value === 'd' && opt.textContent === 'Days');
    });

    expect(unitSelect).toBeDefined();

    if (unitSelect) {
      const options = Array.from(unitSelect.querySelectorAll('option')).map(opt => opt.textContent);
      expect(options).toContain('Days');
      expect(options).toContain('Hours');
      expect(options).toContain('Mins');

      // Change unit select to Days
      fireEvent.change(unitSelect, { target: { value: 'd' } });
      expect((unitSelect as HTMLSelectElement).value).toBe('d');

      // Find sibling input for duration value
      const numInput = unitSelect.previousElementSibling as HTMLInputElement;
      expect(numInput).not.toBeNull();
      if (numInput) {
        fireEvent.change(numInput, { target: { value: '3' } });
        expect(numInput.value).toBe('3');
      }
    }
  });
});
