import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import zapierSyncReducer from '../store/slices/zapierSyncSlice';
import { CsvExcelIntegrationView } from '../components/domain/ingestion/subcomponents/CsvExcelIntegrationView';

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
      zapierSync: zapierSyncReducer,
    },
    preloadedState,
  });
};

describe('CsvExcelIntegrationView Seams', () => {
  describe('Slice 1: Quadrant 1 Header & Operational Health Telemetry Seam', () => {
    it('renders quadrant 1 header with Manual Ingress Active pill and 4 live telemetry KPI cards', () => {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView supplierName="Apex Organics Ltd" />
        </Provider>
      );

      // Verify Quadrant 1 Section & Title
      const telemetrySection = screen.getByTestId('csv-quadrant-1-telemetry');
      expect(telemetrySection).toBeDefined();

      expect(screen.getByRole('heading', { level: 2, name: /CSV & Excel Batch Ingress Suite/i })).toBeDefined();
      expect(screen.getByText(/Apex Organics Ltd/i)).toBeDefined();

      // Verify Live Status Badge
      const statusPill = screen.getByTestId('csv-ingress-status-pill');
      expect(statusPill.textContent).toContain('Manual Ingress Active');

      // Verify Telemetry Metric Cards
      const totalBatchesCard = screen.getByTestId('kpi-total-batches');
      expect(totalBatchesCard.textContent).toContain('Total Batches Ingested');

      const totalRowsCard = screen.getByTestId('kpi-total-rows');
      expect(totalRowsCard.textContent).toContain('Total Rows Processed');

      const activeTargetCard = screen.getByTestId('kpi-active-target');
      expect(activeTargetCard.textContent).toContain('Active Pipeline Target');
      // Default initial target should be Inventory Data
      expect(activeTargetCard.textContent).toContain('Inventory Data');

      const latencyCard = screen.getByTestId('kpi-parse-latency');
      expect(latencyCard.textContent).toContain('Avg Parse Latency');
    });
  });

  describe('Slice 2: Quadrant 2 Destination Target Selector Seam', () => {
    it('renders 3-way destination pipeline cards and updates active target upon selection', () => {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView initialTarget="inventory" />
        </Provider>
      );

      // Verify Quadrant 2 Section
      const intakeSection = screen.getByTestId('csv-quadrant-2-intake');
      expect(intakeSection).toBeDefined();

      // Verify radio inputs for all 3 targets
      const inventoryRadio = screen.getByRole('radio', { name: /Inventory Data/i }) as HTMLInputElement;
      const salesRadio = screen.getByRole('radio', { name: /Sales Data/i }) as HTMLInputElement;
      const buyersRadio = screen.getByRole('radio', { name: /Buyer Data/i }) as HTMLInputElement;

      expect(inventoryRadio).toBeDefined();
      expect(salesRadio).toBeDefined();
      expect(buyersRadio).toBeDefined();

      // Inventory should initially be checked
      expect(inventoryRadio.checked).toBe(true);
      expect(salesRadio.checked).toBe(false);
      expect(buyersRadio.checked).toBe(false);

      // Verify Active Target KPI initially says Inventory Data
      expect(screen.getByTestId('kpi-active-target').textContent).toContain('Inventory Data');

      // Click Sales Data card/radio
      const salesCard = screen.getByTestId('target-card-sales');
      fireEvent.click(salesCard);

      expect(salesRadio.checked).toBe(true);
      expect(inventoryRadio.checked).toBe(false);
      expect(screen.getByTestId('kpi-active-target').textContent).toContain('Sales Data');

      // Click Buyer Data card/radio
      const buyersCard = screen.getByTestId('target-card-buyers');
      fireEvent.click(buyersCard);

      expect(buyersRadio.checked).toBe(true);
      expect(salesRadio.checked).toBe(false);
      expect(screen.getByTestId('kpi-active-target').textContent).toContain('Buyer Data');
    });
  });

  describe('Slice 3: Intake Dropzone Staging & Validation Seam', () => {
    it('stages a valid CSV file dropped into dropzone with formatted size and readiness indicator', () => {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView />
        </Provider>
      );

      const dropzone = screen.getByTestId('csv-intake-dropzone');
      expect(dropzone).toBeDefined();

      const validCsvFile = new File(['sku,description,qty\nA101,Organic Milk,40'], 'surplus_inventory.csv', {
        type: 'text/csv',
      });

      // Simulate drop event
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [validCsvFile],
        },
      });

      // Staged file details should be visible
      expect(screen.getAllByText('surplus_inventory.csv').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Ready for Ingestion/i)).toBeDefined();
    });

    it('rejects unsupported file formats with error message', () => {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView />
        </Provider>
      );

      const dropzone = screen.getByTestId('csv-intake-dropzone');
      const invalidFile = new File(['binary payload'], 'malware.exe', {
        type: 'application/x-msdownload',
      });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [invalidFile],
        },
      });

      // Error message should be displayed
      const errorNotice = screen.getByTestId('dropzone-error-notice');
      expect(errorNotice.textContent).toMatch(/unsupported file format/i);
      expect(screen.queryByText(/Ready for Ingestion/i)).toBeNull();
    });

    it('rejects oversized files exceeding 100 MB limit', () => {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView />
        </Provider>
      );

      const dropzone = screen.getByTestId('csv-intake-dropzone');
      // Create a mock File with size > 100MB
      const hugeFile = new File(['content'], 'giant_catalog.csv', { type: 'text/csv' });
      Object.defineProperty(hugeFile, 'size', { value: 101 * 1024 * 1024 });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [hugeFile],
        },
      });

      const errorNotice = screen.getByTestId('dropzone-error-notice');
      expect(errorNotice.textContent).toMatch(/exceeds 100 MB/i);
    });
  });

  describe('Slice 4: Parser Dispatch Seam', () => {
    it('dispatches uploadInventoryThunk when target is inventory and stages parsedResult in store', async () => {
      const { ingestionService } = await import('../services/ingestionService');
      const uploadInventorySpy = vi.spyOn(ingestionService, 'uploadInventoryFile').mockResolvedValueOnce({
        documentId: 'doc-inv-123',
        fileName: 'inventory_batch.csv',
        rawHeaders: ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
        rawGrid: [
          ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
          ['Organic Fuji Apples', 'LOT-AP-99', '120', '18.50'],
        ],
        suggestedMapping: {
          description: 'Item Description',
          lotNumber: 'Lot Code',
          availableQuantity: 'Quantity Cases',
          unitPrice: 'Price / Case',
        },
      } as any);

      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView supplierId="sup-apex" initialTarget="inventory" />
        </Provider>
      );

      const dropzone = screen.getByTestId('csv-intake-dropzone');
      const validCsv = new File(['content'], 'inventory_batch.csv', { type: 'text/csv' });
      fireEvent.drop(dropzone, { dataTransfer: { files: [validCsv] } });

      const submitButton = screen.getByTestId('csv-submit-button');
      expect(submitButton).toBeDefined();

      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Verify that uploadInventoryFile was called with the file and supplierId
      expect(uploadInventorySpy).toHaveBeenCalledWith(
        validCsv,
        'sup-apex',
        expect.any(Function)
      );

      // Verify parsedResult is staged in the store
      await vi.waitFor(() => {
        const state = store.getState();
        expect(state.ingestion.inventoryParsedResult?.documentId).toBe('doc-inv-123');
        expect(state.ingestion.inventoryParsedResult?.rawHeaders).toEqual([
          'Item Description',
          'Lot Code',
          'Quantity Cases',
          'Price / Case',
        ]);
      });
    });

    it('dispatches uploadSalesThunk when target is sales', async () => {
      const { ingestionService } = await import('../services/ingestionService');
      const uploadSalesSpy = vi.spyOn(ingestionService, 'uploadSalesFile').mockResolvedValueOnce({
        documentId: 'doc-sales-456',
        fileName: 'sales_closeouts.csv',
        rawHeaders: ['Invoice', 'Amount', 'Date'],
        rawGrid: [['Invoice', 'Amount', 'Date'], ['INV-001', '1200', '2026-10-01']],
      } as any);

      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView supplierId="sup-apex" initialTarget="sales" />
        </Provider>
      );

      const dropzone = screen.getByTestId('csv-intake-dropzone');
      const validCsv = new File(['sales data'], 'sales_closeouts.csv', { type: 'text/csv' });
      fireEvent.drop(dropzone, { dataTransfer: { files: [validCsv] } });

      const submitButton = screen.getByTestId('csv-submit-button');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(uploadSalesSpy).toHaveBeenCalledWith(
        validCsv,
        'sup-apex',
        expect.any(Function)
      );
    });

    it('dispatches uploadBuyerThunk when target is buyers', async () => {
      const { ingestionService } = await import('../services/ingestionService');
      const uploadBuyerSpy = vi.spyOn(ingestionService, 'uploadBuyerFile').mockResolvedValueOnce({
        documentId: 'doc-buyers-789',
        fileName: 'buyer_roster.xlsx',
        rawHeaders: ['Company Name', 'Contact Email'],
        rawGrid: [['Company Name', 'Contact Email'], ['Discount Mart', 'buyer@dm.com']],
      } as any);

      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView supplierId="sup-apex" initialTarget="buyers" />
        </Provider>
      );

      const dropzone = screen.getByTestId('csv-intake-dropzone');
      const validXlsx = new File(['buyer data'], 'buyer_roster.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fireEvent.drop(dropzone, { dataTransfer: { files: [validXlsx] } });

      const submitButton = screen.getByTestId('csv-submit-button');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(uploadBuyerSpy).toHaveBeenCalledWith(
        validXlsx,
        'sup-apex',
        expect.any(Function)
      );
    });

    it('displays error boundary notice when parser dispatch fails', async () => {
      const { ingestionService } = await import('../services/ingestionService');
      vi.spyOn(ingestionService, 'uploadInventoryFile').mockRejectedValueOnce(
        new Error('Corrupted spreadsheet header rows.')
      );

      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView supplierId="sup-apex" initialTarget="inventory" />
        </Provider>
      );

      const dropzone = screen.getByTestId('csv-intake-dropzone');
      const validCsv = new File(['corrupt data'], 'corrupt.csv', { type: 'text/csv' });
      fireEvent.drop(dropzone, { dataTransfer: { files: [validCsv] } });

      const submitButton = screen.getByTestId('csv-submit-button');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await vi.waitFor(() => {
        const errorNotice = screen.getByTestId('dropzone-error-notice');
        expect(errorNotice.textContent).toContain('Corrupted spreadsheet header rows.');
      });
    });
  });

  describe('Slice 5: Quadrant 3 Batch Ingestion History & Audit Roster Seam', () => {
    it('renders quadrant 3 roster with historical batches and allows re-staging a batch', () => {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView initialTarget="inventory" />
        </Provider>
      );

      // Verify Quadrant 3 Section
      const rosterSection = screen.getByTestId('csv-quadrant-3-roster');
      expect(rosterSection).toBeDefined();

      expect(
        screen.getByRole('heading', { level: 3, name: /Batch Ingestion History & Audit Roster/i })
      ).toBeDefined();

      // Verify table headers
      expect(screen.getByText('File Name')).toBeDefined();
      expect(screen.getByText('Pipeline Target')).toBeDefined();
      expect(screen.getByText('Records Ingested')).toBeDefined();
      expect(screen.getByText('Ingestion Status')).toBeDefined();
      expect(screen.getByText('Timestamp')).toBeDefined();

      // Verify initial historical batch records are visible
      expect(screen.getByText('q3_inventory_manifest.csv')).toBeDefined();
      expect(screen.getByText('sept_sales_closeout.xlsx')).toBeDefined();

      // Verify Re-stage button exists and clicking it updates active target
      const restageSalesBtn = screen.getByTestId('restage-batch-batch-sales-01');
      expect(restageSalesBtn).toBeDefined();

      fireEvent.click(restageSalesBtn);

      // Active Target KPI should now reflect Sales Data
      expect(screen.getByTestId('kpi-active-target').textContent).toContain('Sales Data');
    });
  });

  describe('Slice 6: Quadrant 4 In-Situ Schema Field Mapper Seam', () => {
    it('renders quadrant 4 mapper with GridMapperTable displaying staged headers for inventory target', () => {
      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
        ingestion: {
          inventoryParsedResult: {
            documentId: 'doc-inv-99',
            fileName: 'inventory_preview.csv',
            rawHeaders: ['SKU Code', 'Product Title', 'Qty On Hand'],
            rawGrid: [
              ['SKU Code', 'Product Title', 'Qty On Hand'],
              ['SKU-001', 'Organic Apples', '150'],
            ],
            suggestedMapping: {
              sku: 'SKU Code',
              description: 'Product Title',
              quantity: 'Qty On Hand',
            },
          },
          inventoryMappings: {
            sku: 'SKU Code',
            description: 'Product Title',
            quantity: 'Qty On Hand',
          },
        },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView initialTarget="inventory" supplierId="sup-apex" />
        </Provider>
      );

      // Verify Quadrant 4 Section exists
      const mapperSection = screen.getByTestId('csv-quadrant-4-mapper');
      expect(mapperSection).toBeDefined();

      expect(
        screen.getByRole('heading', { level: 3, name: /In-Situ Schema Field Mapper/i })
      ).toBeDefined();

      // Verify GridMapperTable rendered with column headers
      expect(screen.getAllByText('SKU Code').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Product Title').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Qty On Hand').length).toBeGreaterThanOrEqual(1);

      // Verify table cell data rendered
      expect(screen.getByText('Organic Apples')).toBeDefined();
    });

    it('renders GridMapperTable configured for buyers target with buyer domain fields', () => {
      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
        ingestion: {
          buyerParsedResult: {
            documentId: 'doc-buy-88',
            fileName: 'buyers_preview.csv',
            rawHeaders: ['Org Name', 'Buyer Contact'],
            rawGrid: [
              ['Org Name', 'Buyer Contact'],
              ['SuperStore LLC', 'ops@superstore.com'],
            ],
            suggestedMapping: {
              companyName: 'Org Name',
              email: 'Buyer Contact',
            },
          },
          buyerMappings: {
            companyName: 'Org Name',
            email: 'Buyer Contact',
          },
        },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView initialTarget="buyers" supplierId="sup-apex" />
        </Provider>
      );

      const mapperSection = screen.getByTestId('csv-quadrant-4-mapper');
      expect(mapperSection).toBeDefined();

      // Headers rendered
      expect(screen.getAllByText('Org Name').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Buyer Contact').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('SuperStore LLC')).toBeDefined();
    });
  });

  describe('Slice 7: Confirmation Dispatch & In-Situ Post-Ingestion Success Banner Seam', () => {
    it('dispatches confirmInventoryThunk and renders in-situ success banner with created lot count and IDs, updating Quadrant 3 roster', async () => {
      const { ingestionService } = await import('../services/ingestionService');
      vi.spyOn(ingestionService, 'confirmInventoryIngestion').mockResolvedValueOnce({
        success: true,
        countImported: 3,
        importedLotIds: ['LOT-CR-101', 'LOT-CR-102', 'LOT-CR-103'],
      } as any);

      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
        ingestion: {
          inventoryParsedResult: {
            documentId: 'doc-inv-batch-101',
            fileName: 'fresh_produce_manifest.csv',
            rawHeaders: ['Description', 'Qty', 'Lot #'],
            rawGrid: [
              ['Description', 'Qty', 'Lot #'],
              ['Organic Blueberries', '50', 'L-BLU-1'],
              ['Organic Strawberries', '65', 'L-STR-2'],
              ['Organic Raspberries', '40', 'L-RAS-3'],
            ],
            suggestedMapping: {
              description: 'Description',
              quantity: 'Qty',
              lotNumber: 'Lot #',
            },
          },
          inventoryMappings: {
            description: 'Description',
            quantity: 'Qty',
            lotNumber: 'Lot #',
          },
        },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView initialTarget="inventory" supplierId="sup-apex" />
        </Provider>
      );

      // Locate confirm button in GridMapperTable
      const confirmButton = screen.getByRole('button', { name: /Confirm & Import Lots/i });
      expect(confirmButton).toBeDefined();

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // Verify in-situ success banner renders
      await vi.waitFor(() => {
        const banner = screen.getByTestId('csv-ingestion-success-banner');
        expect(banner).toBeDefined();
        expect(banner.textContent).toContain('3 records ingested');
        expect(banner.textContent).toContain('LOT-CR-101');
        expect(banner.textContent).toContain('LOT-CR-102');
        expect(banner.textContent).toContain('LOT-CR-103');
      });

      // Verify Quadrant 3 Batch History Roster was updated with the new completed batch
      const roster = screen.getByTestId('csv-quadrant-3-roster');
      expect(roster.textContent).toContain('fresh_produce_manifest.csv');
    });
  });

  describe('Slice 8: Post-Ingestion Action CTAs & Dropzone Reset Seam', () => {
    it('executes View in Pipeline Table CTA calling onNavigateToPipeline and updating pipeline tab', async () => {
      const { ingestionService } = await import('../services/ingestionService');
      vi.spyOn(ingestionService, 'confirmInventoryIngestion').mockResolvedValueOnce({
        countImported: 5,
        importedLotIds: ['LOT-001'],
      } as any);

      const onNavigateSpy = vi.fn();
      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
        ingestion: {
          inventoryParsedResult: {
            documentId: 'doc-inv-cta',
            fileName: 'manifest_cta.csv',
            rawHeaders: ['SKU', 'Qty'],
            rawGrid: [['SKU', 'Qty'], ['A1', '10']],
            suggestedMapping: { sku: 'SKU', quantity: 'Qty' },
          },
          inventoryMappings: { sku: 'SKU', quantity: 'Qty' },
        },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView
            initialTarget="inventory"
            supplierId="sup-apex"
            onNavigateToPipeline={onNavigateSpy}
          />
        </Provider>
      );

      const confirmBtn = screen.getByRole('button', { name: /Confirm & Import Lots/i });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      // Banner visible
      const viewPipelineBtn = await screen.findByTestId('cta-view-pipeline');
      expect(viewPipelineBtn).toBeDefined();

      fireEvent.click(viewPipelineBtn);

      expect(onNavigateSpy).toHaveBeenCalledWith('inventory');
      expect(store.getState().ingestion.pipelineTab).toBe('inventory');
    });

    it('resets dropzone and clears mapper state when Ingest Another File is clicked', async () => {
      const { ingestionService } = await import('../services/ingestionService');
      vi.spyOn(ingestionService, 'confirmInventoryIngestion').mockResolvedValueOnce({
        countImported: 5,
        importedLotIds: ['LOT-001'],
      } as any);

      const store = createTestStore({
        core: { suppliers: [{ _id: 'sup-apex', name: 'Apex Foods' }] },
        ingestion: {
          inventoryParsedResult: {
            documentId: 'doc-inv-reset',
            fileName: 'manifest_reset.csv',
            rawHeaders: ['SKU', 'Qty'],
            rawGrid: [['SKU', 'Qty'], ['A1', '10']],
            suggestedMapping: { sku: 'SKU', quantity: 'Qty' },
          },
          inventoryMappings: { sku: 'SKU', quantity: 'Qty' },
        },
      });

      render(
        <Provider store={store}>
          <CsvExcelIntegrationView initialTarget="inventory" supplierId="sup-apex" />
        </Provider>
      );

      const confirmBtn = screen.getByRole('button', { name: /Confirm & Import Lots/i });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      const ingestAnotherBtn = await screen.findByTestId('cta-ingest-another');
      expect(ingestAnotherBtn).toBeDefined();

      fireEvent.click(ingestAnotherBtn);

      // Success banner should disappear
      expect(screen.queryByTestId('csv-ingestion-success-banner')).toBeNull();

      // Dropzone should be reset to default prompt
      expect(screen.getByText(/Drag & drop spreadsheet or click to browse/i)).toBeDefined();

      // Parsed result in store should be reset
      expect(store.getState().ingestion.inventoryParsedResult).toBeNull();
    });
  });
});




