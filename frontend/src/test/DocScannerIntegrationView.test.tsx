import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { DocScannerIntegrationView } from '../components/domain/ingestion/subcomponents/DocScannerIntegrationView';
import { ingestionService } from '../services/ingestionService';

const {
  mockUploadInventoryFile,
  mockUploadSalesFile,
  mockUploadBuyerFile,
  mockConfirmInventoryIngestion,
  mockConfirmSalesIngestion,
  mockConfirmBuyerIngestion,
} = vi.hoisted(() => ({
  mockUploadInventoryFile: vi.fn(),
  mockUploadSalesFile: vi.fn(),
  mockUploadBuyerFile: vi.fn(),
  mockConfirmInventoryIngestion: vi.fn(),
  mockConfirmSalesIngestion: vi.fn(),
  mockConfirmBuyerIngestion: vi.fn(),
}));

vi.mock('../services/ingestionService', () => {
  const service = {
    uploadInventoryFile: mockUploadInventoryFile,
    uploadSalesFile: mockUploadSalesFile,
    uploadBuyerFile: mockUploadBuyerFile,
    confirmInventoryIngestion: mockConfirmInventoryIngestion,
    confirmSalesIngestion: mockConfirmSalesIngestion,
    confirmBuyerIngestion: mockConfirmBuyerIngestion,
  };
  return {
    ingestionService: service,
    default: service,
  };
});

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
    },
    preloadedState,
  });
};

describe('DocScannerIntegrationView 4-Quadrant Architecture', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders all four architectural quadrants conforming to ADR 0071 & ADR 0081', () => {
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co', companyCode: 'FGC' }],
      },
      ingestion: {
        selectedSupplier: 'sup-1',
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" supplierName="Fresh Greens Co" />
      </Provider>
    );

    // Quadrant 1: Header & Health Telemetry
    expect(screen.getByTestId('doc-scanner-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByText(/Docling AI & Tesseract OCR/i)).toBeInTheDocument();
    expect(screen.getByTestId('kpi-active-target')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-optical-confidence')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-avg-latency')).toBeInTheDocument();

    // Quadrant 2: AI OCR Multi-Pipeline Intake & Dropzone
    expect(screen.getByTestId('doc-scanner-quadrant-2-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-target-selector')).toBeInTheDocument();
    expect(screen.getByTestId('target-card-inventory')).toBeInTheDocument();
    expect(screen.getByTestId('target-card-sales')).toBeInTheDocument();
    expect(screen.getByTestId('target-card-buyers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run AI Extraction/i })).toBeInTheDocument();

    // Quadrant 3: Scanned Documents Roster
    expect(screen.getByTestId('doc-scanner-quadrant-3-roster')).toBeInTheDocument();
    expect(screen.getByText(/Scanned Documents Roster/i)).toBeInTheDocument();

    // Quadrant 4: In-Situ Schema Field Mapper
    expect(screen.getByTestId('doc-scanner-quadrant-4-mapper')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Inventory Data');
  });

  it('switches destination pipeline target when user clicks target cards', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" supplierName="Fresh Greens Co" />
      </Provider>
    );

    // Default target is inventory
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Inventory Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Inventory Data');

    // Switch to Sales Data
    fireEvent.click(screen.getByTestId('target-card-sales'));
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Sales Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Sales Data');

    // Switch to Buyer Data
    fireEvent.click(screen.getByTestId('target-card-buyers'));
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Buyer Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Buyer Data');
  });

  it('respects initialTarget prop on mount', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" initialTarget="sales" />
      </Provider>
    );

    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Sales Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Sales Data');
  });

  it('pre-selects active target from URL query parameter when initialTarget prop is not provided', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=doc-scanner&target=buyers');

    try {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <DocScannerIntegrationView supplierId="sup-1" />
        </Provider>
      );

      expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Buyer Data');
      expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Buyer Data');
      expect(screen.getByTestId('target-card-buyers')).toHaveAttribute('data-active', 'true');
    } finally {
      window.history.replaceState({}, '', '/');
    }
  });

  it('updates the browser URL target query parameter when user switches pipeline targets', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=doc-scanner&target=inventory');
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    try {
      const store = createTestStore();

      render(
        <Provider store={store}>
          <DocScannerIntegrationView supplierId="sup-1" />
        </Provider>
      );

      fireEvent.click(screen.getByTestId('target-card-sales'));

      expect(pushStateSpy).toHaveBeenCalled();
      const lastCallUrl = pushStateSpy.mock.calls[pushStateSpy.mock.calls.length - 1][2] as string;
      expect(lastCallUrl).toContain('target=sales');
    } finally {
      pushStateSpy.mockRestore();
      window.history.replaceState({}, '', '/');
    }
  });

  it('runs diagnostic OCR ping when Test OCR Engine button is clicked', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" supplierName="Fresh Greens Co" />
      </Provider>
    );

    const pingBtn = screen.getByRole('button', { name: /Test OCR Engine/i });
    fireEvent.click(pingBtn);

    await waitFor(() => {
      expect(screen.getByText(/Engine Active/i)).toBeInTheDocument();
    });
  });

  it('dispatches uploadInventoryThunk when extracting with Inventory target', async () => {
    mockUploadInventoryFile.mockResolvedValueOnce({
      documentId: 'doc-ocr-123',
      fileName: 'manifest-batch-44.pdf',
      rawGrid: [
        ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
        ['Organic Romaine Hearts', 'ROM-2026-9', '250', '28.00'],
      ],
      rawHeaders: ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
      suggestedMapping: {
        description: 'Item Description',
        lotNumber: 'Lot Code',
      },
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" />
      </Provider>
    );

    const file = new File(['dummy-pdf-content'], 'manifest-batch-44.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('doc-scanner-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const extractBtn = screen.getByTestId('doc-scanner-run-extraction-button');
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockUploadInventoryFile).toHaveBeenCalled();
    });
  });

  it('dispatches uploadSalesThunk when extracting with Sales target', async () => {
    mockUploadSalesFile.mockResolvedValueOnce({
      documentId: 'doc-ocr-sales-1',
      fileName: 'photo_sales_receipt.jpg',
      rawGrid: [
        ['Invoice', 'Amount', 'Date'],
        ['INV-889', '450.00', '2026-10-02'],
      ],
      rawHeaders: ['Invoice', 'Amount', 'Date'],
      suggestedMapping: {
        invoiceNumber: 'Invoice',
        revenue: 'Amount',
      },
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" />
      </Provider>
    );

    // Switch to Sales Data target
    fireEvent.click(screen.getByTestId('target-card-sales'));

    const file = new File(['dummy-img'], 'photo_sales_receipt.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('doc-scanner-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const extractBtn = screen.getByTestId('doc-scanner-run-extraction-button');
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockUploadSalesFile).toHaveBeenCalled();
    });
  });

  it('dispatches uploadBuyerThunk when extracting with Buyer target', async () => {
    mockUploadBuyerFile.mockResolvedValueOnce({
      documentId: 'doc-ocr-buyer-1',
      fileName: 'buyer_leads.png',
      rawGrid: [
        ['Company Name', 'Contact Email'],
        ['Metro Foods LLC', 'buyer@metrofoods.com'],
      ],
      rawHeaders: ['Company Name', 'Contact Email'],
      suggestedMapping: {
        companyName: 'Company Name',
        email: 'Contact Email',
      },
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" />
      </Provider>
    );

    // Switch to Buyer Data target
    fireEvent.click(screen.getByTestId('target-card-buyers'));

    const file = new File(['dummy-img'], 'buyer_leads.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('doc-scanner-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const extractBtn = screen.getByTestId('doc-scanner-run-extraction-button');
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockUploadBuyerFile).toHaveBeenCalled();
    });
  });

  it('selects a scanned document from roster, switches target, and saves schema mapping', async () => {
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }],
      },
      ingestion: {
        selectedSupplier: 'sup-1',
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" supplierName="Fresh Greens Co" />
      </Provider>
    );

    // Click "Map Schema" for the second document in roster (sales document)
    const mapSalesBtn = screen.getByTestId('map-schema-doc-ocr-002');
    fireEvent.click(mapSalesBtn);

    // Target should switch to Sales Data
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Sales Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Sales Data');

    // Click "Save Schema Mapping"
    const saveBtn = screen.getByRole('button', { name: /Save Schema Mapping/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Schema mapping saved successfully/i)).toBeInTheDocument();
    });
  });

  it('renders ingestion completion banner and navigates to pipeline on success', async () => {
    mockConfirmInventoryIngestion.mockResolvedValueOnce({
      countImported: 48,
      importedLotIds: ['LOT-101', 'LOT-102'],
    });

    const onNavigateToPipeline = vi.fn();
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }],
      },
      ingestion: {
        selectedSupplier: 'sup-1',
        inventoryParsedResult: {
          documentId: 'doc-ocr-001',
          fileName: 'Sysco_Inbound_Manifest_Oct2026.pdf',
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
        },
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView
          supplierId="sup-1"
          initialTarget="inventory"
          onNavigateToPipeline={onNavigateToPipeline}
        />
      </Provider>
    );

    // Click Confirm button inside GridMapperTable
    const confirmButton = screen.getByRole('button', { name: /Confirm & (Import Lots|Ingest Inventory Data)/i });
    fireEvent.click(confirmButton);

    // Success banner should appear
    await waitFor(() => {
      expect(screen.getByTestId('doc-scanner-ingestion-success-banner')).toBeInTheDocument();
    });
    expect(screen.getByText(/48 records ingested successfully!/i)).toBeInTheDocument();
    expect(screen.getByText('LOT-101')).toBeInTheDocument();
    expect(screen.getByText('LOT-102')).toBeInTheDocument();

    // Click "View in Pipeline Table →"
    const viewPipelineBtn = screen.getByTestId('cta-view-pipeline');
    fireEvent.click(viewPipelineBtn);
    expect(onNavigateToPipeline).toHaveBeenCalledWith('inventory');

    // Click "Scan Another Document"
    const scanAnotherBtn = screen.getByTestId('cta-scan-another');
    fireEvent.click(scanAnotherBtn);
    expect(screen.queryByTestId('doc-scanner-ingestion-success-banner')).not.toBeInTheDocument();
  });

  it('executes in-situ commit handshake for Sales and Buyers pipelines, surfacing accurate counts and generated IDs in the completion banner', async () => {
    mockConfirmSalesIngestion.mockResolvedValueOnce({
      countImported: 16,
      saleIds: ['SAL-801', 'SAL-802'],
    });

    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }],
      },
      ingestion: {
        selectedSupplier: 'sup-1',
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" initialTarget="sales" />
      </Provider>
    );

    // Re-stage doc-ocr-002 (Sales document)
    const restageSalesBtn = screen.getByTestId('map-schema-doc-ocr-002');
    fireEvent.click(restageSalesBtn);

    // Click confirm in GridMapperTable for sales
    const confirmSalesBtn = screen.getByRole('button', { name: /Confirm & Ingest Sales Data/i });
    fireEvent.click(confirmSalesBtn);

    await waitFor(() => {
      expect(mockConfirmSalesIngestion).toHaveBeenCalled();
    });

    const salesBanner = await screen.findByTestId('doc-scanner-ingestion-success-banner');
    expect(salesBanner).toBeInTheDocument();
    expect(salesBanner).toHaveTextContent(/16 records ingested successfully!/i);
    expect(salesBanner).toHaveTextContent('SAL-801');
    expect(salesBanner).toHaveTextContent('SAL-802');
    expect(salesBanner).toHaveTextContent('Fresh_Harvest_Photo_PackingSlip.jpg');

    // Now test buyers commit
    mockConfirmBuyerIngestion.mockResolvedValueOnce({
      createdCount: 24,
      buyerIds: ['BUY-901', 'BUY-902'],
    });

    const restageBuyerBtn = screen.getByTestId('map-schema-doc-ocr-003');
    fireEvent.click(restageBuyerBtn);

    const confirmBuyerBtn = screen.getByRole('button', { name: /Confirm & Ingest Buyer Data/i });
    fireEvent.click(confirmBuyerBtn);

    await waitFor(() => {
      expect(mockConfirmBuyerIngestion).toHaveBeenCalled();
    });

    const buyerBanner = await screen.findByTestId('doc-scanner-ingestion-success-banner');
    expect(buyerBanner).toBeInTheDocument();
    expect(buyerBanner).toHaveTextContent(/24 records ingested successfully!/i);
    expect(buyerBanner).toHaveTextContent('BUY-901');
    expect(buyerBanner).toHaveTextContent('BUY-902');
    expect(buyerBanner).toHaveTextContent('Regional_Buyer_Directory_Scan.pdf');
  });

  it('"Scan Another Document" CTA clears staging state, resets active mapper, renders empty state in Quadrant 4, and enables immediate re-scan', async () => {
    mockConfirmInventoryIngestion.mockResolvedValueOnce({
      countImported: 48,
      importedLotIds: ['LOT-101'],
    });

    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }],
      },
      ingestion: {
        selectedSupplier: 'sup-1',
        inventoryParsedResult: {
          documentId: 'doc-ocr-001',
          fileName: 'Sysco_Inbound_Manifest_Oct2026.pdf',
          rawGrid: [
            ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
            ['Organic Fuji Apples', 'LOT-AP-99', '120', '18.50'],
          ],
          suggestedMapping: {
            description: 'Item Description',
            lotNumber: 'Lot Code',
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" initialTarget="inventory" />
      </Provider>
    );

    // Initial check: activeDoc is doc-ocr-001
    expect(screen.getByTestId('doc-scanner-mapper-file-badge')).toHaveTextContent('Sysco_Inbound_Manifest_Oct2026.pdf');
    expect(screen.getByTestId('map-schema-doc-ocr-001')).toHaveTextContent('Active Mapper');

    // Confirm ingestion
    const confirmButton = screen.getByRole('button', { name: /Confirm & (Import Lots|Ingest Inventory Data)/i });
    fireEvent.click(confirmButton);

    const banner = await screen.findByTestId('doc-scanner-ingestion-success-banner');
    expect(banner).toBeInTheDocument();

    // Click "Scan Another Document" CTA
    const scanAnotherBtn = screen.getByTestId('cta-scan-another');
    fireEvent.click(scanAnotherBtn);

    // Banner should be dismissed
    expect(screen.queryByTestId('doc-scanner-ingestion-success-banner')).not.toBeInTheDocument();

    // Redux staging state should be cleared
    expect(store.getState().ingestion.inventoryParsedResult).toBeNull();
    expect(store.getState().ingestion.salesParsedResult).toBeNull();
    expect(store.getState().ingestion.buyerParsedResult).toBeNull();
    expect(store.getState().ingestion.inventoryIsImported).toBe(false);

    // Quadrant 4 Mapper header badge should show "No Document Staged"
    expect(screen.getByTestId('doc-scanner-mapper-file-badge')).toHaveTextContent(/No Document Staged/i);

    // Quadrant 4 should display mapper empty state
    expect(screen.getByTestId('doc-scanner-mapper-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/No Document Staged for Mapping/i)).toBeInTheDocument();

    // In Quadrant 3 roster, no document should be 'Active Mapper'
    expect(screen.getByTestId('map-schema-doc-ocr-001')).toHaveTextContent(/Re-stage/i);
    expect(screen.getByTestId('map-schema-doc-ocr-002')).toHaveTextContent(/Re-stage/i);
    expect(screen.getByTestId('map-schema-doc-ocr-003')).toHaveTextContent(/Re-stage/i);

    // Dropzone should show standard empty intake UI ready for re-scan
    expect(screen.getByText(/Drag & drop manifests, invoices, or packing slips/i)).toBeInTheDocument();
  });

  it('"View in Pipeline Table →" CTA dispatches pipeline tab update to Redux and invokes onNavigateToPipeline callback for Sales and Buyers pipelines', async () => {
    mockConfirmSalesIngestion.mockResolvedValueOnce({
      countImported: 12,
      saleIds: ['SAL-101'],
    });

    const onNavigateToPipeline = vi.fn();
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }],
      },
      ingestion: {
        selectedSupplier: 'sup-1',
        pipelineTab: 'inventory',
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView
          supplierId="sup-1"
          initialTarget="sales"
          onNavigateToPipeline={onNavigateToPipeline}
        />
      </Provider>
    );

    // Re-stage doc-ocr-002
    fireEvent.click(screen.getByTestId('map-schema-doc-ocr-002'));

    // Confirm sales ingestion
    const confirmButton = screen.getByRole('button', { name: /Confirm & Ingest Sales Data/i });
    fireEvent.click(confirmButton);

    const banner = await screen.findByTestId('doc-scanner-ingestion-success-banner');
    expect(banner).toBeInTheDocument();

    // Click "View in Pipeline Table →"
    const viewPipelineBtn = screen.getByTestId('cta-view-pipeline');
    fireEvent.click(viewPipelineBtn);

    // Should update Redux pipelineTab to 'sales'
    expect(store.getState().ingestion.pipelineTab).toBe('sales');

    // Should invoke callback with 'sales'
    expect(onNavigateToPipeline).toHaveBeenCalledWith('sales');
  });

  it('"View in Pipeline Table →" CTA triggers URL pushState and pipeline-tab-changed event when onNavigateToPipeline is omitted', async () => {
    mockConfirmBuyerIngestion.mockResolvedValueOnce({
      createdCount: 8,
      buyerIds: ['BUY-101'],
    });

    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const eventListener = vi.fn();
    window.addEventListener('pipeline-tab-changed', eventListener);

    try {
      const store = createTestStore({
        core: {
          suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }],
        },
        ingestion: {
          selectedSupplier: 'sup-1',
          pipelineTab: 'inventory',
        },
      });

      render(
        <Provider store={store}>
          <DocScannerIntegrationView supplierId="sup-1" initialTarget="buyers" />
        </Provider>
      );

      fireEvent.click(screen.getByTestId('map-schema-doc-ocr-003'));

      const confirmButton = screen.getByRole('button', { name: /Confirm & Ingest Buyer Data/i });
      fireEvent.click(confirmButton);

      await screen.findByTestId('doc-scanner-ingestion-success-banner');

      const viewPipelineBtn = screen.getByTestId('cta-view-pipeline');
      fireEvent.click(viewPipelineBtn);

      expect(store.getState().ingestion.pipelineTab).toBe('buyers');
      expect(pushStateSpy).toHaveBeenCalled();
      const lastCallUrl = pushStateSpy.mock.calls[pushStateSpy.mock.calls.length - 1][2] as string;
      expect(lastCallUrl).toContain('pipeline=buyers');
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { target: 'buyers' },
        })
      );
    } finally {
      pushStateSpy.mockRestore();
      window.removeEventListener('pipeline-tab-changed', eventListener);
    }
  });

  it('renders target lineage badges with distinct colors (blue for inventory, emerald for sales, purple for buyers) in Quadrant 3 roster', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" />
      </Provider>
    );

    const inventoryBadge = screen.getByTestId('doc-target-badge-doc-ocr-001');
    expect(inventoryBadge).toHaveTextContent('Inventory Data');
    expect(inventoryBadge.className).toContain('text-blue-700');

    const salesBadge = screen.getByTestId('doc-target-badge-doc-ocr-002');
    expect(salesBadge).toHaveTextContent('Sales Data');
    expect(salesBadge.className).toContain('text-emerald-700');

    const buyerBadge = screen.getByTestId('doc-target-badge-doc-ocr-003');
    expect(buyerBadge).toHaveTextContent('Buyer Data');
    expect(buyerBadge.className).toContain('text-purple-700');
  });

  it('re-stages historical buyer document: switches workbench target to buyers and hydrates buyerParsedResult in Redux', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" />
      </Provider>
    );

    // Initial state check
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Inventory Data');

    // Click "Map Schema / Re-stage" for doc-ocr-003 (buyers)
    const restageBuyerBtn = screen.getByTestId('map-schema-doc-ocr-003');
    expect(restageBuyerBtn).toHaveTextContent(/Re-stage/i);
    fireEvent.click(restageBuyerBtn);

    // UI target switches
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Buyer Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Buyer Data');
    expect(screen.getByTestId('target-card-buyers')).toHaveAttribute('data-active', 'true');

    // Button should now indicate active mapping
    expect(restageBuyerBtn).toHaveTextContent('Active Mapper');

    // Redux slice hydration check
    const buyerResult = store.getState().ingestion.buyerParsedResult;
    expect(buyerResult).not.toBeNull();
    expect(buyerResult?.documentId).toBe('doc-ocr-003');
    expect(buyerResult?.fileName).toBe('Regional_Buyer_Directory_Scan.pdf');
    expect(buyerResult?.rawHeaders).toEqual(['Company Name', 'Contact Email']);
    expect(buyerResult?.suggestedMapping).toEqual({
      companyName: 'Company Name',
      email: 'Contact Email',
    });
  });

  it('supports sequential re-staging across all pipelines (sales -> buyers -> inventory) with accurate target switching and slice hydration', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" />
      </Provider>
    );

    // 1. Re-stage Sales Document (doc-ocr-002)
    const restageSalesBtn = screen.getByTestId('map-schema-doc-ocr-002');
    fireEvent.click(restageSalesBtn);

    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Sales Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Sales Data');
    expect(store.getState().ingestion.salesParsedResult?.documentId).toBe('doc-ocr-002');
    expect(restageSalesBtn).toHaveTextContent('Active Mapper');
    expect(screen.getByTestId('map-schema-doc-ocr-001')).toHaveTextContent(/Re-stage/i);
    expect(screen.getByTestId('map-schema-doc-ocr-003')).toHaveTextContent(/Re-stage/i);

    // 2. Re-stage Buyer Document (doc-ocr-003)
    const restageBuyerBtn = screen.getByTestId('map-schema-doc-ocr-003');
    fireEvent.click(restageBuyerBtn);

    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Buyer Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Buyer Data');
    expect(store.getState().ingestion.buyerParsedResult?.documentId).toBe('doc-ocr-003');
    expect(restageBuyerBtn).toHaveTextContent('Active Mapper');
    expect(screen.getByTestId('map-schema-doc-ocr-001')).toHaveTextContent(/Re-stage/i);
    expect(screen.getByTestId('map-schema-doc-ocr-002')).toHaveTextContent(/Re-stage/i);

    // 3. Re-stage Inventory Document (doc-ocr-001)
    const restageInventoryBtn = screen.getByTestId('map-schema-doc-ocr-001');
    fireEvent.click(restageInventoryBtn);

    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Inventory Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Inventory Data');
    expect(store.getState().ingestion.inventoryParsedResult?.documentId).toBe('doc-ocr-001');
    expect(restageInventoryBtn).toHaveTextContent('Active Mapper');
    expect(screen.getByTestId('map-schema-doc-ocr-002')).toHaveTextContent(/Re-stage/i);
    expect(screen.getByTestId('map-schema-doc-ocr-003')).toHaveTextContent(/Re-stage/i);
  });

  it('rejects files larger than 50MB and displays an error alert banner', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" />
      </Provider>
    );

    const oversizedFile = new File(['x'.repeat(100)], 'huge_manifest.pdf', { type: 'application/pdf' });
    Object.defineProperty(oversizedFile, 'size', { value: 55 * 1024 * 1024 });

    const input = screen.getByTestId('doc-scanner-file-input');
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(screen.getByTestId('scanner-error-notice')).toHaveTextContent(/File size exceeds the 50MB limit/i);
    expect(screen.getByTestId('doc-scanner-run-extraction-button')).toBeDisabled();
  });

  it('closes mapper view and clears staged mapping state when Close Mapper is clicked', () => {
    const store = createTestStore({
      core: { suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }] },
      ingestion: {
        selectedSupplier: 'sup-1',
        inventoryParsedResult: {
          documentId: 'doc-ocr-001',
          fileName: 'Produce_Invoice_Scan.pdf',
          rawHeaders: ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
          rawGrid: [['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'], ['Apples', 'LOT-1', '10', '20.00']],
          suggestedMapping: { description: 'Item Description' },
        },
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView supplierId="sup-1" initialTarget="inventory" />
      </Provider>
    );

    // Header close mapper button
    const closeBtn = screen.getByTestId('doc-scanner-close-mapper-button');
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);

    // Mapper empty state should now be displayed
    expect(screen.getByTestId('doc-scanner-mapper-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('doc-scanner-close-mapper-button')).not.toBeInTheDocument();

    // Redux inventoryParsedResult should be cleared
    expect(store.getState().ingestion.inventoryParsedResult).toBeNull();
  });

  it('preserves target selection and does not switch to Buyer Data when image extraction is run', async () => {
    mockUploadInventoryFile.mockResolvedValueOnce({
      documentId: 'doc-ocr-inv-new',
      fileName: 'Supplier_Invoice.pdf',
      rawHeaders: ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
      rawGrid: [['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'], ['Organic Kale', 'KALE-01', '40', '15.00']],
      suggestedMapping: { description: 'Item Description' },
    });

    const onTargetChange = vi.fn();
    const store = createTestStore({
      core: { suppliers: [{ _id: 'sup-1', name: 'Fresh Greens Co' }] },
      ingestion: {
        selectedSupplier: 'sup-1',
        pipelineTab: 'inventory',
      },
    });

    render(
      <Provider store={store}>
        <DocScannerIntegrationView
          supplierId="sup-1"
          initialTarget="inventory"
          onTargetChange={onTargetChange}
        />
      </Provider>
    );

    // Active target should be inventory
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Inventory Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Inventory Data');

    // Select a file
    const file = new File(['dummy invoice content'], 'Supplier_Invoice.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('doc-scanner-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Run extraction
    const extractBtn = screen.getByTestId('doc-scanner-run-extraction-button');
    expect(extractBtn).not.toBeDisabled();
    fireEvent.click(extractBtn);

    // Wait for extraction to complete
    await waitFor(() => {
      expect(screen.queryByText(/Extracting OCR Entities/i)).not.toBeInTheDocument();
    });

    // Verify target remains inventory, not buyers!
    expect(screen.getByTestId('kpi-active-target')).toHaveTextContent('Inventory Data');
    expect(screen.getByTestId('doc-scanner-mapper-target-pill')).toHaveTextContent('Target: Inventory Data');
    expect(screen.getByTestId('target-card-inventory')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('target-card-buyers')).toHaveAttribute('data-active', 'false');
    expect(onTargetChange).toHaveBeenCalledWith('inventory');
  });
});
