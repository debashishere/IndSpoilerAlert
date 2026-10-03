import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, { setPipelineTab } from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import zapierSyncReducer from '../store/slices/zapierSyncSlice';
import IngestionView from '../views/IngestionView';
import ingestionService from '../services/ingestionService';

vi.mock('../services/ingestionService', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      uploadInventoryFile: vi.fn(),
      uploadSalesFile: vi.fn(),
      uploadBuyerFile: vi.fn(),
      confirmInventoryIngestion: vi.fn(),
      confirmSalesIngestion: vi.fn(),
      confirmBuyerIngestion: vi.fn(),
    },
  };
});

const createFullTestStore = (preloadedState?: any) => {
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
    preloadedState: {
      core: {
        suppliers: [
          { _id: 'sup-alpha', name: 'Apex Foods International', companyCode: 'AFI' },
        ],
        buyers: [
          { _id: 'buy-1', companyName: 'Costco Wholesale', email: 'buyer@costco.com', tier: 'tier1' },
        ],
      },
      ingestion: {
        selectedSupplier: 'sup-alpha',
        pipelineTab: 'inventory',
        inventoryList: [
          {
            _id: 'lot-1',
            lotNumber: 'LOT-99',
            description: 'Organic Apples',
            quantity: 50,
            originalPrice: 20,
            status: 'active',
          },
        ],
        salesRecords: [
          {
            _id: 'sale-1',
            invoiceNumber: 'INV-100',
            buyerName: 'Costco',
            revenue: 500,
            saleDate: '2026-10-01',
          },
        ],
      },
      ...preloadedState,
    },
  });
};

describe('Issue 04: Pipeline Triggers, Modal Deprecation & End-to-End Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/?tab=ingestion');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  describe('Slice 1: Pipeline Triggers & URL Deep-Linking Seam', () => {
    it('redirects to CSV integration suite with pre-selected target via direct URL search params', () => {
      window.history.replaceState({}, '', '/?tab=ingestion&connector=csv-upload&target=sales');
      const store = createFullTestStore();

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Workspace mounts CsvExcelIntegrationView
      expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /Integration Management Suite/i })).toBeInTheDocument();

      // Sales destination card is selected (active styling / aria-pressed or checked)
      const salesCard = screen.getByTestId('target-card-sales');
      expect(salesCard).toHaveAttribute('data-active', 'true');
    });

    it('navigates to CSV integration suite with buyers target pre-selected when open-ingestion-upload-modal event is dispatched', async () => {
      const store = createFullTestStore();

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      act(() => {
        window.dispatchEvent(new CustomEvent('open-ingestion-upload-modal', { detail: { target: 'buyers' } }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      });

      expect(window.location.search).toContain('connector=csv-upload');
      expect(window.location.search).toContain('target=buyers');

      const buyersCard = screen.getByTestId('target-card-buyers');
      expect(buyersCard).toHaveAttribute('data-active', 'true');
    });

    it('navigates to CSV integration suite from Sales Registry import button with sales target pre-selected', async () => {
      const store = createFullTestStore({
        ingestion: {
          pipelineTab: 'sales',
          selectedSupplier: 'sup-alpha',
        },
      });

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Click the sales upload button
      const uploadSalesBtn = screen.getByRole('button', { name: /Upload Sales Report/i });
      fireEvent.click(uploadSalesBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      });

      expect(window.location.search).toContain('connector=csv-upload');
      expect(window.location.search).toContain('target=sales');

      const salesCard = screen.getByTestId('target-card-sales');
      expect(salesCard).toHaveAttribute('data-active', 'true');
    });

    it('navigates to CSV integration suite from Buyer Registry import button with buyers target pre-selected', async () => {
      const store = createFullTestStore({
        ingestion: {
          pipelineTab: 'buyers',
          selectedSupplier: 'sup-alpha',
        },
      });

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      const importBuyersBtn = screen.getByRole('button', { name: /Bulk Import via CSV/i });
      fireEvent.click(importBuyersBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      });

      expect(window.location.search).toContain('connector=csv-upload');
      expect(window.location.search).toContain('target=buyers');

      const buyersCard = screen.getByTestId('target-card-buyers');
      expect(buyersCard).toHaveAttribute('data-active', 'true');
    });
  });

  describe('Slice 2: UnifiedIngestionModal Retirement & Hub Card Direct Suite Navigation Seam', () => {
    it('navigates directly to CSV integration suite when clicking Upload File on Hub Card 4 without rendering legacy modal', async () => {
      const store = createFullTestStore();

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Verify hub is present and modal is not present
      expect(screen.queryByRole('heading', { level: 2, name: /Unified Surplus Data Ingestion/i })).toBeNull();

      // Click "Upload File" on Hub Card 4
      const uploadFileBtn = screen.getByRole('button', { name: /Upload File/i });
      fireEvent.click(uploadFileBtn);

      // Should mount full-page CSV Integration Suite
      await waitFor(() => {
        expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      });

      expect(window.location.search).toContain('connector=csv-upload');

      // Legacy UnifiedIngestionModal is NOT mounted anywhere in the DOM
      expect(screen.queryByRole('heading', { level: 2, name: /Unified Surplus Data Ingestion/i })).toBeNull();
      expect(screen.queryByText('Batch Import Workbench')).toBeNull();
    });

    it('ensures IngestionView does not mount UnifiedIngestionModal in connector workspace or pipeline view', () => {
      window.history.replaceState({}, '', '/?tab=ingestion&connector=csv-upload');
      const store = createFullTestStore();

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      expect(screen.queryByText('Unified Surplus Data Ingestion')).toBeNull();
      expect(screen.queryByTestId('unified-ingestion-file-input')).toBeNull();
    });
  });

  describe('Slice 3: End-to-End Ingress Workflow & Registry Hydration Seam', () => {
    it('completes full sales journey: Trigger from Sales -> Upload CSV -> In-Situ Mapping -> Confirm -> Hydrate Sales Registry', async () => {
      (ingestionService.uploadSalesFile as any).mockResolvedValueOnce({
        documentId: 'doc-sales-full-e2e',
        fileName: 'october_sales_closeout.csv',
        rawHeaders: ['Invoice Number', 'Buyer Company', 'Settlement Amount', 'Transaction Date'],
        rawGrid: [
          ['Invoice Number', 'Buyer Company', 'Settlement Amount', 'Transaction Date'],
          ['INV-OCT-9901', 'Kroger Salvage', '1850.00', '2026-10-02'],
        ],
        suggestedMapping: {
          invoiceNumber: 'Invoice Number',
          buyerName: 'Buyer Company',
          revenue: 'Settlement Amount',
          saleDate: 'Transaction Date',
        },
      });

      (ingestionService.confirmSalesIngestion as any).mockResolvedValueOnce({
        countImported: 1,
        createdCount: 1,
        importedLotIds: ['SALE-REC-9901'],
        lotIds: ['SALE-REC-9901'],
      });

      const store = createFullTestStore({
        ingestion: {
          pipelineTab: 'sales',
          selectedSupplier: 'sup-alpha',
          salesRecords: [
            { _id: 'sale-init-1', invoiceNumber: 'INV-PREV-01', buyerName: 'Costco', revenue: 400, saleDate: '2026-09-20' },
          ],
        },
      });

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // 1. Operator starts at Sales Pipeline Registry Panel
      expect(screen.getByText('Sales Pipeline')).toBeInTheDocument();
      expect(document.querySelector('#panel-sales')).toBeInTheDocument();

      // 2. Click Upload Sales Report trigger
      const uploadSalesBtn = screen.getByRole('button', { name: /Upload Sales Report/i });
      fireEvent.click(uploadSalesBtn);

      // 3. Smoothly redirects to CSV Integration Suite with sales target active
      await waitFor(() => {
        expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      });
      expect(window.location.search).toContain('connector=csv-upload');
      expect(window.location.search).toContain('target=sales');

      const salesCard = screen.getByTestId('target-card-sales');
      expect(salesCard).toHaveAttribute('data-active', 'true');

      // 4. Operator stages CSV file in dropzone
      const fileInput = screen.getByTestId('csv-file-input') as HTMLInputElement;
      const testFile = new File(
        ['Invoice Number,Buyer Company,Settlement Amount,Transaction Date\nINV-OCT-9901,Kroger Salvage,1850.00,2026-10-02'],
        'october_sales_closeout.csv',
        { type: 'text/csv' }
      );
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Dropzone shows staged file name
      expect(screen.getAllByText('october_sales_closeout.csv').length).toBeGreaterThanOrEqual(1);

      // 5. Click "Ingest Dataset" parser action
      const ingestBtn = screen.getByTestId('csv-submit-button');
      fireEvent.click(ingestBtn);

      // In-situ mapper in Quadrant 4 hydrates with staged headers
      await waitFor(() => {
        expect(screen.getByTestId('csv-quadrant-4-mapper')).toBeInTheDocument();
      });
      expect(screen.getByText('Sales Data Schema Mapping')).toBeInTheDocument();

      // 6. Operator confirms mapping via confirm button
      const confirmBtn = screen.getByRole('button', { name: /Confirm & Reconcile Sales|Confirm & Ingest Sales Data/i });
      fireEvent.click(confirmBtn);

      // In-situ completion banner renders with record counts and IDs
      await waitFor(() => {
        expect(screen.getByTestId('csv-ingestion-success-banner')).toBeInTheDocument();
      });
      expect(screen.getByText(/Ingestion Completed: 1 records ingested successfully!/i)).toBeInTheDocument();
      expect(screen.getByText('SALE-REC-9901')).toBeInTheDocument();

      // 7. Click "View in Pipeline Table →" to transition back to Sales Registry Table
      const viewPipelineBtn = screen.getByTestId('cta-view-pipeline');
      fireEvent.click(viewPipelineBtn);

      // Operator is redirected back to the Sales Registry panel
      await waitFor(() => {
        expect(screen.queryByTestId('connector-csv-upload-workspace')).toBeNull();
      });
      expect(document.querySelector('#panel-sales')).toBeInTheDocument();
      expect(window.location.search).not.toContain('connector=');
    });

    it('completes full inventory journey: Hub Card -> Upload CSV -> In-Situ Mapping -> Confirm -> Hydrate Inventory Registry', async () => {
      (ingestionService.uploadInventoryFile as any).mockResolvedValueOnce({
        documentId: 'doc-inv-full-e2e',
        fileName: 'harvest_manifest_batch.csv',
        rawHeaders: ['SKU', 'Description', 'Quantity', 'Unit Price'],
        rawGrid: [
          ['SKU', 'Description', 'Quantity', 'Unit Price'],
          ['SKU-HARV-01', 'Organic Honeycrisp Apples', '250', '24.00'],
        ],
        suggestedMapping: {
          sku: 'SKU',
          description: 'Description',
          quantity: 'Quantity',
          originalPrice: 'Unit Price',
        },
      });

      (ingestionService.confirmInventoryIngestion as any).mockResolvedValueOnce({
        countImported: 1,
        createdCount: 1,
        importedLotIds: ['LOT-HARV-001'],
        lotIds: ['LOT-HARV-001'],
      });

      const store = createFullTestStore({
        ingestion: {
          pipelineTab: 'inventory',
          selectedSupplier: 'sup-alpha',
          inventoryList: [
            { _id: 'lot-existing-1', lotNumber: 'LOT-EXIST-01', description: 'Existing Lot', quantity: 20, originalPrice: 15, status: 'active' },
          ],
        },
      });

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // 1. Click Hub Card 4 "Upload File"
      const uploadFileBtn = screen.getByRole('button', { name: /Upload File/i });
      fireEvent.click(uploadFileBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
      });

      // Target defaults to inventory
      const invCard = screen.getByTestId('target-card-inventory');
      expect(invCard).toHaveAttribute('data-active', 'true');

      // 2. Stage file
      const fileInput = screen.getByTestId('csv-file-input') as HTMLInputElement;
      const testFile = new File(
        ['SKU,Description,Quantity,Unit Price\nSKU-HARV-01,Organic Honeycrisp Apples,250,24.00'],
        'harvest_manifest_batch.csv',
        { type: 'text/csv' }
      );
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // 3. Ingest Dataset
      const ingestBtn = screen.getByTestId('csv-submit-button');
      fireEvent.click(ingestBtn);

      // 4. Verify in-situ mapper
      await waitFor(() => {
        expect(screen.getByTestId('csv-quadrant-4-mapper')).toBeInTheDocument();
      });
      expect(screen.getByText('Inventory Data Schema Mapping')).toBeInTheDocument();

      // 5. Confirm mapping
      const confirmBtn = screen.getByRole('button', { name: /Confirm & Import Lots|Confirm & Ingest Inventory Data/i });
      fireEvent.click(confirmBtn);

      // 6. Completion banner
      await waitFor(() => {
        expect(screen.getByTestId('csv-ingestion-success-banner')).toBeInTheDocument();
      });
      expect(screen.getByText('LOT-HARV-001')).toBeInTheDocument();

      // 7. Return to pipeline
      const viewPipelineBtn = screen.getByTestId('cta-view-pipeline');
      fireEvent.click(viewPipelineBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('connector-csv-upload-workspace')).toBeNull();
      });
      expect(document.querySelector('#panel-inventory')).toBeInTheDocument();
      expect(window.location.search).not.toContain('connector=');
    });
  });
});
