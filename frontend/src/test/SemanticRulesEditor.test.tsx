import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SemanticRulesEditor } from '../components/domain/ingestion/SemanticRulesEditor';
import { ingestionSlice } from '../store/slices/ingestionSlice';

function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      ingestion: ingestionSlice.reducer,
    },
    preloadedState: preloadedState
      ? {
          ingestion: {
            ...ingestionSlice.getInitialState(),
            ...preloadedState,
          },
        }
      : undefined,
  });
}

describe('SemanticRulesEditor Component', () => {
  const mockHeaders = ['SKU', 'CaseQty', 'SalePrice', 'TempC'];
  const mockGrid = [
    ['SKU', 'CaseQty', 'SalePrice', 'TempC'],
    ['SKU-001', '10', '$100.00', '4'],
    ['SKU-002', '20', '$200.00', '5'],
    ['SKU-003', '30', '$200.00', '6'],
    ['SKU-004', '40', '$500.00', '7'],
  ];

  it('renders title, description and options for inventory pipeline by default', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SemanticRulesEditor rawHeaders={mockHeaders} rawGrid={mockGrid} />
      </Provider>
    );

    expect(screen.getByText('Dynamic Semantic Attribute Translation Rules')).toBeDefined();
    expect(screen.getByText('+ Add Rule')).toBeDefined();
    expect(screen.getByText('Percentage of Total (%)')).toBeDefined();
    expect(screen.getByText('Mean / Average')).toBeDefined();
    expect(screen.getByText('Median')).toBeDefined();
    expect(screen.getByText('Mode (Most Frequent)')).toBeDefined();
  });

  it('adds an inventory semantic rule with a calculation transform and displays live computed value', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SemanticRulesEditor
          rawHeaders={mockHeaders}
          rawGrid={mockGrid}
          pipelineType="inventory"
        />
      </Provider>
    );

    // Select source column 'CaseQty'
    const sourceSelect = screen.getByLabelText(/source column/i);
    fireEvent.change(sourceSelect, { target: { value: 'CaseQty' } });

    // Enter target key
    const targetInput = screen.getByPlaceholderText(/Target Key/i);
    fireEvent.change(targetInput, { target: { value: 'avgCases' } });

    // Select 'mean' calculation transform
    const transformSelect = screen.getByLabelText(/transformation or calculation/i);
    fireEvent.change(transformSelect, { target: { value: 'mean' } });

    // Check that live preview indicates mean calculation
    expect(screen.getByText(/Live Metric Preview/i)).toBeDefined();
    expect(screen.getByText(/25.00/)).toBeDefined();

    // Click Add Rule
    const addBtn = screen.getByRole('button', { name: /\+ Add Rule/i });
    fireEvent.click(addBtn);

    // Rule should be dispatched to Redux and displayed in the table
    const state = store.getState().ingestion;
    expect(state.inventorySemanticRules.length).toBe(1);
    expect(state.inventorySemanticRules[0]).toEqual({
      sourceKey: 'CaseQty',
      targetKey: 'avgCases',
      transform: 'mean',
    });

    // Table displays computed value
    expect(screen.getByText('avgCases')).toBeDefined();
    expect(screen.getAllByText(/25.00/).length).toBeGreaterThan(0);
  });

  it('works seamlessly for sales pipeline and updates salesSemanticRules in Redux', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SemanticRulesEditor
          rawHeaders={mockHeaders}
          rawGrid={mockGrid}
          pipelineType="sales"
        />
      </Provider>
    );

    // Select source column 'SalePrice'
    const sourceSelect = screen.getByLabelText(/source column/i);
    fireEvent.change(sourceSelect, { target: { value: 'SalePrice' } });

    // Enter target key
    const targetInput = screen.getByPlaceholderText(/Target Key/i);
    fireEvent.change(targetInput, { target: { value: 'medianPrice' } });

    // Select 'median'
    const transformSelect = screen.getByLabelText(/transformation or calculation/i);
    fireEvent.change(transformSelect, { target: { value: 'median' } });

    // Add Rule
    const addBtn = screen.getByRole('button', { name: /\+ Add Rule/i });
    fireEvent.click(addBtn);

    const state = store.getState().ingestion;
    expect(state.salesSemanticRules.length).toBe(1);
    expect(state.salesSemanticRules[0]).toEqual({
      sourceKey: 'SalePrice',
      targetKey: 'medianPrice',
      transform: 'median',
    });
    expect(state.inventorySemanticRules.length).toBe(0);

    // Remove the sales rule
    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeBtn);
    expect(store.getState().ingestion.salesSemanticRules.length).toBe(0);
  });
});
