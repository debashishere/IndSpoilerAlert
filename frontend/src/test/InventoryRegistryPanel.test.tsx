import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { InventoryRegistryPanel } from '../components/domain/ingestion/InventoryRegistryPanel';
import { setInventoryList } from '../store/slices/inventorySlice';
import { setInventoryParsedResult } from '../store/slices/ingestionSlice';

describe('InventoryRegistryPanel Component', () => {
  beforeEach(() => {
    store.dispatch(setInventoryList([]));
    store.dispatch(setInventoryParsedResult(null));
  });

  it('should render Inventory Data Ingestion header and inventory lots count badge', () => {
    render(
      <Provider store={store}>
        <InventoryRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Inventory Data Ingestion')).toBeDefined();
    expect(screen.getByText('0 Inventory Lots')).toBeDefined();
    expect(screen.getByRole('button', { name: /Upload Inventory Document/i })).toBeDefined();
  });

  it('should open Upload Inventory Document modal when action button is clicked', () => {
    render(
      <Provider store={store}>
        <InventoryRegistryPanel />
      </Provider>
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload Inventory Document/i });
    fireEvent.click(uploadBtn);

    expect(screen.getByText('Upload Inventory Document')).toBeDefined();
    expect(screen.getByText('CPG Supplier Company *')).toBeDefined();
  });

  it('should render loaded inventory lots in the inventory data frame', () => {
    store.dispatch(
      setInventoryList([
        {
          _id: 'lot-101',
          productId: {
            description: 'Organic Greek Yogurt 24oz',
            sku: 'SKU-YOG-01',
            category: 'Dairy',
          },
          lotNumber: 'LOT-YOG-99',
          distributionCenterId: { name: 'Dallas Warehouse' },
          availableQty: 550,
          costPerCase: 18.75,
          expirationDate: new Date('2026-09-01').toISOString(),
          status: 'Active',
        },
      ])
    );

    render(
      <Provider store={store}>
        <InventoryRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('1 Inventory Lots')).toBeDefined();
    expect(screen.getByText('Organic Greek Yogurt 24oz')).toBeDefined();
    expect(screen.getByText('Lot: LOT-YOG-99')).toBeDefined();
    expect(screen.getByText('550 cases')).toBeDefined();
  });

  it('should render column mapping preview frame and semantic rules editor when inventoryParsedResult is present', () => {
    store.dispatch(
      setInventoryParsedResult({
        documentId: 'doc-inv-test',
        fileName: 'supplier_manifest.csv',
        rawGrid: [
          ['SKU Code', 'Cases', 'Cost'],
          ['SKU-200', '100', '15.50'],
        ],
        suggestedMapping: { sku: 'SKU Code', quantity: 'Cases', originalPrice: 'Cost' },
      })
    );

    render(
      <Provider store={store}>
        <InventoryRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Extract Preview: supplier_manifest.csv')).toBeDefined();
    expect(screen.getByRole('button', { name: /Confirm & Import Lots/i })).toBeDefined();
    expect(screen.getByText('Dynamic Semantic Attribute Translation Rules')).toBeDefined();
  });

  it('should render the migrated collapsible-filters-panel with all filter controls', () => {
    render(
      <Provider store={store}>
        <InventoryRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Search Product')).toBeDefined();
    expect(screen.getByPlaceholderText('Search SKU, product description...')).toBeDefined();
    expect(screen.getByText('Supplier')).toBeDefined();
    expect(screen.getByText('Distribution Center')).toBeDefined();
    expect(screen.getByText('Category')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
  });
});
