import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setPipelineTab, setInventoryParsedResult } from '../store/slices/ingestionSlice';

describe('Issue #37 Tracer Bullet 3: IngestionView & Domain Sub-Components', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?tab=ingestion');
    store.dispatch(setPipelineTab('inventory'));
    store.dispatch(setInventoryParsedResult(null));
  });

  it('should render IngestionView with pipeline sub-tabs and switch tabs cleanly', async () => {
    // Dynamically import IngestionView so test fails RED when file is missing
    const IngestionViewModule = await import('../views/IngestionView');
    const IngestionView = IngestionViewModule.default || IngestionViewModule.IngestionView;

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Verify main header
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
    expect(screen.getByText('📦 Inventory Pipeline')).toBeDefined();
    expect(screen.getByText('💰 Sales Pipeline')).toBeDefined();
    expect(screen.getByText('👥 Buyer List')).toBeDefined();

    // Default inventory tab should render panel-inventory workbench
    expect(document.querySelector('#panel-inventory')).toBeDefined();

    // Click Sales Pipeline tab
    fireEvent.click(screen.getByText('💰 Sales Pipeline'));
    expect((store.getState() as any).ingestion.pipelineTab).toBe('sales');
    expect(document.querySelector('#panel-sales')).toBeDefined();

    // Click Buyer List tab
    fireEvent.click(screen.getByText('👥 Buyer List'));
    expect((store.getState() as any).ingestion.pipelineTab).toBe('buyers');
    expect(document.querySelector('#panel-buyer')).toBeDefined();
  });

  it('should render GridMapperTable and SemanticRulesEditor when inventoryParsedResult is in store', async () => {
    const IngestionViewModule = await import('../views/IngestionView');
    const IngestionView = IngestionViewModule.default || IngestionViewModule.IngestionView;

    store.dispatch(
      setInventoryParsedResult({
        documentId: 'doc-ui-test',
        fileName: 'ui_test.csv',
        rawGrid: [
          ['SKU Header', 'Case Qty'],
          ['TEST-SKU-1', '50'],
        ],
        suggestedMapping: { sku: 'SKU Header', quantity: 'Case Qty' },
      })
    );

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Inventory mapping header check
    expect(screen.getByText('Confirm Inventory Data Mapping')).toBeDefined();
    expect(screen.getByText('ui_test.csv')).toBeDefined();
    expect(screen.getAllByText('SKU Header').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Case Qty').length).toBeGreaterThan(0);

    // SemanticRulesEditor header check
    expect(screen.getByText('Dynamic Semantic Attribute Translation Rules')).toBeDefined();
    expect(screen.getByText('+ Add Rule')).toBeDefined();
  });

  it('should disable Confirm & Import button once imported in GridMapperTable', async () => {
    const IngestionViewModule = await import('../views/IngestionView');
    const IngestionView = IngestionViewModule.default || IngestionViewModule.IngestionView;
    const { setSelectedSupplier, setInventoryImportSuccess } = await import('../store/slices/ingestionSlice');

    store.dispatch(setSelectedSupplier('60c72b2f9b1d8b0015f8e001'));
    store.dispatch(
      setInventoryParsedResult({
        documentId: 'doc-ui-test-2',
        fileName: 'import_test.csv',
        rawGrid: [
          ['SKU Header', 'Case Qty'],
          ['TEST-SKU-2', '100'],
        ],
        suggestedMapping: { sku: 'SKU Header', quantity: 'Case Qty' },
      })
    );

    const { rerender } = render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Import Lots/i }) as HTMLButtonElement;
    expect(confirmBtn).toBeDefined();
    expect(confirmBtn.disabled).toBe(false);

    // Full screen button check
    const fullscreenBtn = screen.getByRole('button', { name: /Full Screen/i });
    expect(fullscreenBtn).toBeDefined();
    fireEvent.click(fullscreenBtn);
    expect(screen.getByRole('button', { name: /Exit Fullscreen/i })).toBeDefined();

    // Mark as imported in store
    store.dispatch(setInventoryImportSuccess({ count: 10, lotIds: ['LOT-100'] }));
    rerender(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    const importedBtn = screen.getByRole('button', { name: /Lots Imported ✓/i }) as HTMLButtonElement;
    expect(importedBtn).toBeDefined();
    expect(importedBtn.disabled).toBe(true);
  });

  it('should handle Sales Pipeline file upload and trigger Run Sales Extraction button', async () => {
    const IngestionViewModule = await import('../views/IngestionView');
    const IngestionView = IngestionViewModule.default || IngestionViewModule.IngestionView;

    store.dispatch(setPipelineTab('sales'));

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Verify Sales Pipeline view is displayed
    expect(document.querySelector('#panel-sales')).toBeDefined();

    // Select file in sales file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    const mockFile = new File(['Invoice#,Buyer,Qty,Total\nINV-001,Buyer A,10,500'], 'sales_report.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Open upload workflow via open-ingestion-upload-modal event
    window.dispatchEvent(new CustomEvent('open-ingestion-upload-modal', { detail: { target: 'sales' } }));

    // Deep-links to CSV integration suite with sales target
    expect(await screen.findByTestId('connector-csv-upload-workspace')).toBeDefined();
  });

  it('does NOT display CSV ingestion Mapping window above Inventory Data List Section when Navigated back from Integration Management Section after opening a Mapper', async () => {
    const IngestionViewModule = await import('../views/IngestionView');
    const IngestionView = IngestionViewModule.default || IngestionViewModule.IngestionView;

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // 1. Operator is on Ingestion View (inventory pipeline)
    expect(document.querySelector('#panel-inventory')).toBeDefined();

    // 2. Navigate to CSV / Excel Upload in Integration Management Suite
    window.dispatchEvent(new CustomEvent('open-ingestion-batch-suite', { detail: { target: 'inventory' } }));
    expect(await screen.findByTestId('connector-csv-upload-workspace')).toBeDefined();

    // 3. User opens a mapper (e.g. by re-staging an inventory batch)
    const restageBtn = screen.getByTestId('restage-batch-batch-inv-01');
    fireEvent.click(restageBtn);

    // Verify in-situ schema field mapper is open in Integration Management Section
    expect(screen.getByTestId('csv-quadrant-4-mapper')).toBeDefined();
    expect(screen.getByText('Inventory Data Schema Mapping')).toBeDefined();

    // 4. Operator navigates back from Integration Management Section via "← Back to Ingestion Pipeline"
    const backBtn = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
    fireEvent.click(backBtn);

    // 5. Verify returned to Inventory Data List Section
    expect(screen.queryByTestId('connector-csv-upload-workspace')).toBeNull();
    expect(document.querySelector('#panel-inventory')).toBeDefined();

    // CRITICAL: The CSV ingestion Mapping window must NOT appear above Inventory Data List Section
    expect(screen.queryByText('Confirm Inventory Data Mapping')).toBeNull();
    expect(screen.queryByTestId('csv-quadrant-4-mapper')).toBeNull();
    expect(store.getState().ingestion.inventoryParsedResult).toBeNull();
  });

  it('does NOT display Mapping window above Inventory Data List Section when browser back (popstate) occurs from Integration Management Section', async () => {
    const IngestionViewModule = await import('../views/IngestionView');
    const IngestionView = IngestionViewModule.default || IngestionViewModule.IngestionView;

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Navigate to Integration Management Section
    window.dispatchEvent(new CustomEvent('open-ingestion-batch-suite', { detail: { target: 'inventory' } }));
    expect(await screen.findByTestId('connector-csv-upload-workspace')).toBeDefined();

    // Open mapper
    const restageBtn = screen.getByTestId('restage-batch-batch-inv-01');
    fireEvent.click(restageBtn);
    expect(screen.getByText('Inventory Data Schema Mapping')).toBeDefined();

    // Simulate browser Back button: URL query param connector removed and popstate fired
    const { act } = await import('react');
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Verify returned to Inventory Data List Section without mapping window
    expect(screen.queryByTestId('connector-csv-upload-workspace')).toBeNull();
    expect(document.querySelector('#panel-inventory')).toBeDefined();
    expect(screen.queryByText('Confirm Inventory Data Mapping')).toBeNull();
    expect(screen.queryByTestId('csv-quadrant-4-mapper')).toBeNull();
    expect(store.getState().ingestion.inventoryParsedResult).toBeNull();
  });
});

