import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { SalesRegistryPanel } from '../components/domain/ingestion/SalesRegistryPanel';
import { setSalesRecords, setSalesParsedResult } from '../store/slices/ingestionSlice';

describe('SalesRegistryPanel Component', () => {
  beforeEach(() => {
    store.dispatch(setSalesRecords([]));
    store.dispatch(setSalesParsedResult(null));
  });

  it('should render Sales Data Ingestion header and sales records count badge', () => {
    render(
      <Provider store={store}>
        <SalesRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Sales Data Ingestion')).toBeDefined();
    expect(screen.getByText('0 Sales Records')).toBeDefined();
    expect(screen.getByRole('button', { name: /Upload Sales Report/i })).toBeDefined();
  });

  it('should open Upload Sales Report modal when action button is clicked', () => {
    render(
      <Provider store={store}>
        <SalesRegistryPanel />
      </Provider>
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload Sales Report/i });
    fireEvent.click(uploadBtn);

    expect(screen.getByText('Upload Sales Report')).toBeDefined();
    expect(screen.getByText('CPG Supplier Company *')).toBeDefined();
  });

  it('should render loaded sales records in the sales data frame', () => {
    store.dispatch(
      setSalesRecords([
        {
          _id: 's-101',
          productName: 'Organic Almond Milk 32oz',
          sku: 'SKU-ALM-01',
          buyerEmail: 'buyer@costco.com',
          warehouse: 'Dallas DC',
          quantitySold: 120,
          pricePerCase: 24.5,
          totalValue: 2940,
          invoiceNumber: 'INV-9001',
          createdAt: new Date().toISOString(),
        },
      ])
    );

    render(
      <Provider store={store}>
        <SalesRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('1 Sales Records')).toBeDefined();
    expect(screen.getByText('Organic Almond Milk 32oz')).toBeDefined();
    expect(screen.getByText('INV-9001')).toBeDefined();
    expect(screen.getByText('$2,940.00')).toBeDefined();
  });

  it('should render column mapping preview frame when salesParsedResult is present', () => {
    store.dispatch(
      setSalesParsedResult({
        documentId: 'doc-sales-test',
        fileName: 'distributor_closeout.csv',
        rawGrid: [
          ['SKU Header', 'Cases Sold', 'Unit Price'],
          ['SKU-100', '50', '30'],
        ],
        suggestedMapping: { sku: 'SKU Header', quantity: 'Cases Sold', price: 'Unit Price' },
      })
    );

    render(
      <Provider store={store}>
        <SalesRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Confirm Sales CSV Mapping')).toBeDefined();
    expect(screen.getByText('distributor_closeout.csv')).toBeDefined();
    expect(screen.getByRole('button', { name: /Confirm & Reconcile Sales/i })).toBeDefined();
  });

  it('should render the sales-tailored collapsible-filters-panel with all filter controls', () => {
    render(
      <Provider store={store}>
        <SalesRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Search Sales')).toBeDefined();
    expect(screen.getByPlaceholderText('Search SKU, product, buyer name, email...')).toBeDefined();
    expect(screen.getByText('Buyer')).toBeDefined();
    expect(screen.getByText('Distribution Center')).toBeDefined();
    expect(screen.getByText('Create Date')).toBeDefined();
    expect(screen.getByText('Price Range')).toBeDefined();
    expect(screen.getByText('Sales Status')).toBeDefined();
  });
});
