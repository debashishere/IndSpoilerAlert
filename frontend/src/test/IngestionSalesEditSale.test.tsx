import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import ingestionService from '../services/ingestionService';
import { SalesRowInspectionDrawer } from '../components/domain/ingestion/subcomponents/SalesRowInspectionDrawer';
import { SalesModernTable } from '../components/domain/ingestion/subcomponents/SalesModernTable';
import { SalesRegistryPanel } from '../components/domain/ingestion/SalesRegistryPanel';
import { EditSaleModal } from '../components/domain/ingestion/subcomponents/EditSaleModal';
import type { SalesRecord } from '../components/domain/ingestion/types/ingestion.types';

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
    saleDate: '2026-09-18',
    dateRecorded: 'Sep 18, 2026',
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
    saleDate: '2026-09-18',
    dateRecorded: 'Sep 18, 2026',
    pickupTerms: 'Customer Pickup (CPU)',
    appointmentTerms: 'Dock Door #4 (14:30 EST)',
    grossSale: 52920.0,
    escrowStatus: '100% Funded',
  },
];

const createTestStore = (records: SalesRecord[] = mockSalesRecords) => {
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
        salesRecords: records,
        pipelineTab: 'sales',
      },
    },
  });
};

describe('Sales Tab: Row-Level "Edit Sale" Button in OPERATIONAL ACTIONS', () => {
  it('renders an "Edit Sale" button within the "OPERATIONAL ACTIONS" section of SalesRowInspectionDrawer', () => {
    const handleEditSale = vi.fn();
    render(
      <SalesRowInspectionDrawer
        record={mockSalesRecords[0]}
        onEditSale={handleEditSale}
      />
    );

    // Verify "Operational Actions" section heading
    expect(screen.getByText(/Operational Actions/i)).toBeDefined();

    // Verify "Edit Sale" button exists
    const editBtn = screen.getByRole('button', { name: /Edit Sale/i });
    expect(editBtn).toBeDefined();
    expect(editBtn.getAttribute('id')).toBe('edit-sale-btn-sales-row-1');

    // Click "Edit Sale" and ensure onEditSale callback fires
    fireEvent.click(editBtn);
    expect(handleEditSale).toHaveBeenCalledTimes(1);
    expect(handleEditSale).toHaveBeenCalledWith(mockSalesRecords[0]);
  });

  it('renders a dedicated "Edit Sale" button for each row when rows are expanded in SalesModernTable', () => {
    const handleEditSale = vi.fn();
    render(
      <SalesModernTable
        records={mockSalesRecords}
        expandedRowIds={new Set(['sales-row-1', 'sales-row-2'])}
        onToggleRow={vi.fn()}
        onEditSale={handleEditSale}
      />
    );

    // Both rows are expanded and each row has its own "Edit Sale" button
    const editBtns = screen.getAllByRole('button', { name: /Edit Sale/i });
    expect(editBtns).toHaveLength(2);

    expect(screen.getByTestId('edit-sale-btn-sales-row-1')).toBeDefined();
    expect(screen.getByTestId('edit-sale-btn-sales-row-2')).toBeDefined();

    // Clicking row 2's button passes row 2's record
    fireEvent.click(screen.getByTestId('edit-sale-btn-sales-row-2'));
    expect(handleEditSale).toHaveBeenCalledWith(mockSalesRecords[1]);
  });

  it('opens EditSaleModal from SalesRegistryPanel and allows updating a sale record', async () => {
    // Return empty on fetchSalesRecords so preloaded state is preserved or mock returns updated
    vi.spyOn(ingestionService, 'fetchSalesRecords').mockImplementation(async () => mockSalesRecords);

    const store = createTestStore(mockSalesRecords);

    render(
      <Provider store={store}>
        <SalesRegistryPanel />
      </Provider>
    );

    // Await initial fetch so subsequent actions are not overwritten by mount effect
    await waitFor(() => {
      expect(screen.getByText('Oscar Mayer Deli Slices')).toBeDefined();
    });

    // Expand row 1
    const row1 = screen.getByText('Oscar Mayer Deli Slices').closest('.lot-row');
    expect(row1).not.toBeNull();
    fireEvent.click(row1!);

    // Click "Edit Sale" in OPERATIONAL ACTIONS
    const editBtn = screen.getByTestId('edit-sale-btn-sales-row-1');
    fireEvent.click(editBtn);

    // EditSaleModal opens
    expect(screen.getByText('Edit Sale Record')).toBeDefined();
    expect(screen.getByDisplayValue('Oscar Mayer Deli Slices')).toBeDefined();
    expect(screen.getByDisplayValue('OM-DEL-3310')).toBeDefined();
    expect(screen.getByDisplayValue('5400')).toBeDefined();

    // Modify the product name and quantity
    const nameInput = screen.getByDisplayValue('Oscar Mayer Deli Slices');
    fireEvent.change(nameInput, { target: { value: 'Oscar Mayer Premium Deli Slices' } });

    const qtyInput = screen.getByDisplayValue('5400');
    fireEvent.change(qtyInput, { target: { value: '6000' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    // Check success feedback
    await waitFor(() => {
      expect(screen.getByText(/Successfully updated sale record/i)).toBeDefined();
    });

    // Verify Redux store updated
    await waitFor(() => {
      const updatedState = store.getState().ingestion.salesRecords;
      const target = updatedState.find((r: SalesRecord) => r._id === 'sales-row-1');
      expect(target?.productName).toBe('Oscar Mayer Premium Deli Slices');
      expect(target?.quantitySold).toBe(6000);
      expect(target?.totalRevenue).toBe(85200);
    });
  });

  it('EditSaleModal validates required fields and displays error', () => {
    const store = createTestStore(mockSalesRecords);
    render(
      <Provider store={store}>
        <EditSaleModal
          isOpen={true}
          onClose={vi.fn()}
          saleRecord={mockSalesRecords[0]}
        />
      </Provider>
    );

    // Clear product name
    const nameInput = screen.getByDisplayValue('Oscar Mayer Deli Slices');
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/Please provide a product title\/description/i)).toBeDefined();
  });
});
