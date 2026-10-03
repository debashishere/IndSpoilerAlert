import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import coreReducer from '../store/slices/coreSlice';
import { PipelineSwitcherBar } from '../components/domain/ingestion/subcomponents/PipelineSwitcherBar';
import { CreateInventoryModal } from '../components/domain/ingestion/subcomponents/CreateInventoryModal';
import { CreateSalesModal } from '../components/domain/ingestion/subcomponents/CreateSalesModal';
import { SalesModernTable } from '../components/domain/ingestion/subcomponents/SalesModernTable';
import type { SalesRecord } from '../components/domain/ingestion/types/ingestion.types';
import IngestionView from '../views/IngestionView';

import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { setPipelineTab, addSalesRecord } from '../store/slices/ingestionSlice';

const createTestStore = (initialTab: 'inventory' | 'sales' | 'buyers' = 'inventory') => {
  const store = configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
    },
  });
  store.dispatch(setPipelineTab(initialTab));
  return store;
};

describe('Contextual Record Creation & Streamlined Tab Naming', () => {
  it('PipelineSwitcherBar displays clean tab names "Inventory", "Sales", "Buyers" without "Pipeline" postfix', () => {
    const store = createTestStore('inventory');
    render(
      <Provider store={store}>
        <PipelineSwitcherBar
          activeTab="inventory"
          onTabChange={vi.fn()}
        />
      </Provider>
    );

    expect(screen.getByText('Inventory')).toBeDefined();
    expect(screen.getByText('Sales')).toBeDefined();
    expect(screen.getByText('Buyers')).toBeDefined();

    // Verify "Create Inventory" button is present on inventory tab
    expect(screen.getByRole('button', { name: /Create Inventory/i })).toBeDefined();
  });

  it('PipelineSwitcherBar renders "Create Sales" button on sales tab and "Create Buyer" button on buyers tab', () => {
    const store = createTestStore('sales');
    const { rerender } = render(
      <Provider store={store}>
        <PipelineSwitcherBar
          activeTab="sales"
          onTabChange={vi.fn()}
        />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Create Sales/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Create Inventory/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Create Buyer/i })).toBeNull();

    // Rerender on buyers tab
    rerender(
      <Provider store={store}>
        <PipelineSwitcherBar
          activeTab="buyers"
          onTabChange={vi.fn()}
        />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Create Buyer/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Create Inventory/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Create Sales/i })).toBeNull();
  });

  it('CreateInventoryModal creates new lot and dispatches to Redux store', async () => {
    const store = createTestStore('inventory');
    const handleClose = vi.fn();
    const handleCreated = vi.fn();

    render(
      <Provider store={store}>
        <CreateInventoryModal
          isOpen={true}
          onClose={handleClose}
          supplierId="supp-1"
          onLotCreated={handleCreated}
        />
      </Provider>
    );

    expect(screen.getByText('Create Inventory Record')).toBeDefined();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Organic Strawberry/i), {
      target: { value: 'Organic Greek Yogurt Vanilla' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. SKU-YOG-8821/i), {
      target: { value: 'SKU-YOG-1001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 450/i), {
      target: { value: '250' },
    });
    fireEvent.change(screen.getByLabelText(/Expiration Date/i), {
      target: { value: '2026-11-15' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 18\.50/i), {
      target: { value: '16.00' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Inventory Lot/i }));

    await waitFor(() => {
      expect(handleCreated).toHaveBeenCalled();
      const createdLot = handleCreated.mock.calls[0][0];
      expect(createdLot.title).toBe('Organic Greek Yogurt Vanilla');
      expect(createdLot.sku).toBe('SKU-YOG-1001');
      expect(createdLot.quantityCases).toBe(250);
      expect(createdLot._id).toBeDefined();
      expect(createdLot._id.startsWith('lot-manual-')).toBe(true);
      expect(store.getState().inventory.inventoryList.length).toBe(1);
    });
  });

  it('CreateInventoryModal displays error when required fields are missing', async () => {
    const store = createTestStore('inventory');
    render(
      <Provider store={store}>
        <CreateInventoryModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </Provider>
    );

    // Click submit with empty form
    fireEvent.click(screen.getByRole('button', { name: /Create Inventory Lot/i }));
    expect(screen.getByText(/Please provide a product title\/description\./i)).toBeDefined();
  });

  it('CreateSalesModal creates new sales record and dispatches to Redux store', async () => {
    const store = createTestStore('sales');
    const handleClose = vi.fn();
    const handleCreated = vi.fn();

    render(
      <Provider store={store}>
        <CreateSalesModal
          isOpen={true}
          onClose={handleClose}
          onSalesCreated={handleCreated}
        />
      </Provider>
    );

    expect(screen.getByText('Create Sales Record')).toBeDefined();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Artisanal Almond Milk/i), {
      target: { value: 'Artisanal Oat Milk' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. SKU-MLK-4001/i), {
      target: { value: 'SKU-OAT-99' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Grocery Outlet Wholesale/i), {
      target: { value: 'Metro Foods Liquidation' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 350/i), {
      target: { value: '180' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 14\.50/i), {
      target: { value: '12.00' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Record Sales Clearance/i }));

    await waitFor(() => {
      expect(handleCreated).toHaveBeenCalled();
      const record = handleCreated.mock.calls[0][0];
      expect(record.productName).toBe('Artisanal Oat Milk');
      expect(record.sku).toBe('SKU-OAT-99');
      expect(record.buyerName).toBe('Metro Foods Liquidation');
      expect(record.quantitySold).toBe(180);
      expect(record.quantity).toBe(180);
      expect(record._id).toBeDefined();
      expect(record._id.startsWith('sale-manual-')).toBe(true);
      expect(record.pricePerCase).toBe(12);
      expect(record.totalRevenue).toBe(2160);
      expect(store.getState().ingestion.salesRecords.length).toBe(1);
    });
  });

  it('CreateSalesModal displays validation error when product title or required fields are missing', async () => {
    const store = createTestStore('sales');
    render(
      <Provider store={store}>
        <CreateSalesModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </Provider>
    );

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /Record Sales Clearance/i }));
    expect(screen.getByText(/Please provide a product title\/description\./i)).toBeDefined();
  });

  it('IngestionView opens Create Inventory and Create Sales modals when clicking respective action buttons', async () => {
    const store = createTestStore('inventory');
    const { container } = render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // 1. Click Create Inventory button in Switcher Bar
    const createInvBtn = container.querySelector('#create-inventory-btn') as HTMLElement;
    expect(createInvBtn).toBeDefined();
    fireEvent.click(createInvBtn);

    expect(screen.getByText('Create Inventory Record')).toBeDefined();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // 2. Switch to Sales tab
    fireEvent.click(screen.getByText('Sales'));

    // Click Create Sales button in Switcher Bar
    const createSalesBtn = container.querySelector('#create-sales-btn') as HTMLElement;
    expect(createSalesBtn).toBeDefined();
    fireEvent.click(createSalesBtn);

    expect(screen.getByText('Create Sales Record')).toBeDefined();
  });

  it('manually created sales records support row toggling via _id in SalesModernTable and provide quantity', () => {
    const store = createTestStore('sales');
    const manualSaleId = 'sale-manual-12345';
    const manualSale: SalesRecord = {
      _id: manualSaleId,
      id: manualSaleId,
      sku: 'SKU-TEST-1',
      lotNumber: 'LOT-TEST-1',
      productName: 'Surplus Milk Item',
      quantitySold: 100,
      quantity: 100,
      pricePerCase: 10,
      totalRevenue: 1000,
      status: 'Settled',
      dc: 'DC-East (Edison, NJ)',
    };
    store.dispatch(addSalesRecord(manualSale));

    const toggleFn = vi.fn();
    const expandedRows = new Set<string>();

    render(
      <Provider store={store}>
        <SalesModernTable
          records={[manualSale]}
          expandedRowIds={expandedRows}
          onToggleRow={toggleFn}
        />
      </Provider>
    );

    // Clicking row triggers onToggleRow with record._id
    const rowTitle = screen.getByText('Surplus Milk Item');
    expect(rowTitle).toBeDefined();
    fireEvent.click(rowTitle);
    expect(toggleFn).toHaveBeenCalledWith(manualSaleId);
  });
});
