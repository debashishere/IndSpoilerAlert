import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InventoryMappingPreview } from '../components/domain/ingestion/subcomponents/InventoryMappingPreview';
import { SalesMappingPreview } from '../components/domain/ingestion/subcomponents/SalesMappingPreview';
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

describe('MappingPreview Components with Dynamic Semantic Translation Rules', () => {
  const inventoryParsed = {
    fileName: 'surplus_inventory_manifest.csv',
    rawGrid: [
      ['SKU', 'AvailableCases', 'StandardPrice', 'StorageTempC'],
      ['PRD-01', '50', '$25.00', '4'],
      ['PRD-02', '150', '$35.00', '5'],
      ['PRD-03', '100', '$40.00', '6'],
    ],
    suggestedMapping: {
      sku: 'SKU',
      quantity: 'AvailableCases',
      price: 'StandardPrice',
    },
  };

  const salesParsed = {
    fileName: 'distributor_sales_report.csv',
    rawGrid: [
      ['SKU', 'UnitsSold', 'GrossRevenue', 'RebatePercent'],
      ['PRD-01', '20', '$500.00', '5%'],
      ['PRD-02', '80', '$2000.00', '10%'],
      ['PRD-03', '50', '$1250.00', '5%'],
    ],
    suggestedMapping: {
      sku: 'SKU',
      quantity: 'UnitsSold',
      price: 'GrossRevenue',
    },
  };

  describe('InventoryMappingPreview', () => {
    it('renders Dynamic Semantic Attribute Translation Rules ABOVE Confirm Inventory Data Mapping', () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <InventoryMappingPreview
            inventoryParsedResult={inventoryParsed}
            inventoryMappings={inventoryParsed.suggestedMapping}
            inventoryLoading={false}
            inventoryIsImported={false}
            isFullscreen={false}
            onToggleFullscreen={vi.fn()}
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
            onMappingChange={vi.fn()}
          />
        </Provider>
      );

      const rulesHeading = screen.getByText('Dynamic Semantic Attribute Translation Rules');
      const confirmHeading = screen.getByText('Confirm Inventory Data Mapping');

      expect(rulesHeading).toBeDefined();
      expect(confirmHeading).toBeDefined();

      // Verify DOM ordering: rulesHeading must appear before confirmHeading in document order
      const positionComparison = rulesHeading.compareDocumentPosition(confirmHeading);
      // Node.DOCUMENT_POSITION_FOLLOWING is 4, meaning confirmHeading follows rulesHeading
      expect(positionComparison & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      // Verify calculation options exist in the select dropdown
      expect(screen.getByText('Mean / Average')).toBeDefined();
      expect(screen.getByText('Median')).toBeDefined();
      expect(screen.getByText('Mode (Most Frequent)')).toBeDefined();
      expect(screen.getByText('Percentage of Total (%)')).toBeDefined();
    });

    it('computes live metric when calculation option is selected on Inventory data', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <InventoryMappingPreview
            inventoryParsedResult={inventoryParsed}
            inventoryMappings={inventoryParsed.suggestedMapping}
            inventoryLoading={false}
            inventoryIsImported={false}
            isFullscreen={false}
            onToggleFullscreen={vi.fn()}
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
            onMappingChange={vi.fn()}
          />
        </Provider>
      );

      // Select AvailableCases (50, 150, 100 -> mean 100)
      const sourceSelect = screen.getByLabelText(/source column/i);
      fireEvent.change(sourceSelect, { target: { value: 'AvailableCases' } });

      const transformSelect = screen.getByLabelText(/transformation or calculation/i);
      fireEvent.change(transformSelect, { target: { value: 'mean' } });

      expect(screen.getByText(/Live Metric Preview/i)).toBeDefined();
      expect(screen.getByText(/100.00/)).toBeDefined();
    });
  });

  describe('SalesMappingPreview', () => {
    it('renders Dynamic Semantic Attribute Translation Rules ABOVE Confirm Sales Data Mapping', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SalesMappingPreview
            salesParsedResult={salesParsed}
            salesMappings={salesParsed.suggestedMapping}
            salesLoading={false}
            isFullscreen={false}
            onToggleFullscreen={vi.fn()}
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
            onMappingChange={vi.fn()}
          />
        </Provider>
      );

      const rulesHeading = screen.getByText('Dynamic Semantic Attribute Translation Rules');
      const confirmHeading = screen.getByText('Confirm Sales Data Mapping');

      expect(rulesHeading).toBeDefined();
      expect(confirmHeading).toBeDefined();

      // Verify DOM ordering: rulesHeading must appear before confirmHeading in document order
      const positionComparison = rulesHeading.compareDocumentPosition(confirmHeading);
      expect(positionComparison & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('allows configuring statistical calculation rule on Sales data and saves to salesSemanticRules', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SalesMappingPreview
            salesParsedResult={salesParsed}
            salesMappings={salesParsed.suggestedMapping}
            salesLoading={false}
            isFullscreen={false}
            onToggleFullscreen={vi.fn()}
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
            onMappingChange={vi.fn()}
          />
        </Provider>
      );

      // UnitsSold values: 20, 80, 50 -> sum: 150
      const sourceSelect = screen.getByLabelText(/source column/i);
      fireEvent.change(sourceSelect, { target: { value: 'UnitsSold' } });

      const targetInput = screen.getByPlaceholderText(/Target Key/i);
      fireEvent.change(targetInput, { target: { value: 'unitsSoldTotal' } });

      const transformSelect = screen.getByLabelText(/transformation or calculation/i);
      fireEvent.change(transformSelect, { target: { value: 'percentage' } });

      expect(screen.getByText(/Live Metric Preview/i)).toBeDefined();
      expect(screen.getAllByText(/150.00/).length).toBeGreaterThan(0);

      const addBtn = screen.getByRole('button', { name: /\+ Add Rule/i });
      fireEvent.click(addBtn);

      const state = store.getState().ingestion;
      expect(state.salesSemanticRules.length).toBe(1);
      expect(state.salesSemanticRules[0]).toEqual({
        sourceKey: 'UnitsSold',
        targetKey: 'unitsSoldTotal',
        transform: 'percentage',
      });
    });
  });
});
