import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setPipelineTab, setInventoryParsedResult } from '../store/slices/ingestionSlice';

describe('Issue #37 Tracer Bullet 3: IngestionView & Domain Sub-Components', () => {
  beforeEach(() => {
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

    // Default inventory tab should show Inventory Data Ingestion
    expect(screen.getByText('Inventory Data Ingestion')).toBeDefined();

    // Click Sales Pipeline tab
    fireEvent.click(screen.getByText('💰 Sales Pipeline'));
    expect((store.getState() as any).ingestion.pipelineTab).toBe('sales');
    expect(screen.getByText('Sales Data Ingestion')).toBeDefined();

    // Click Buyer List tab
    fireEvent.click(screen.getByText('👥 Buyer List'));
    expect((store.getState() as any).ingestion.pipelineTab).toBe('buyers');
    expect(screen.getByText('Buyer List Ingestion')).toBeDefined();
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

    // GridMapperTable header check
    expect(screen.getByText('Extract Preview: ui_test.csv')).toBeDefined();
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
    expect(screen.getByText('Sales Data Ingestion')).toBeDefined();

    // Select file in sales file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    const mockFile = new File(['Invoice#,Buyer,Qty,Total\nINV-001,Buyer A,10,500'], 'sales_report.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Open upload modal
    const uploadModalBtn = screen.getByRole('button', { name: /Upload Sales Report/i });
    fireEvent.click(uploadModalBtn);

    // Run Sales Extraction button should now be rendered inside modal
    const extractionBtn = screen.getByRole('button', { name: /Run Sales Extraction/i });
    expect(extractionBtn).toBeDefined();

    // Click extraction button
    fireEvent.click(extractionBtn);
  });
});

