import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, {
  setPipelineTab,
  setInventoryParsedResult,
  setSalesParsedResult,
  setBuyerParsedResult,
} from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import IngestionView from '../views/IngestionView';
import { UnifiedIngestionModal } from '../components/domain/ingestion/subcomponents/UnifiedIngestionModal';
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

describe('Issue #0120: Slice 2 - Unified Ingestion Modal & In-Situ Mapping Handoff', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createTestStore({
      core: {
        activeTab: 'ingestion',
        returnTab: null,
        sidebarExpanded: false,
        backendHealthy: true,
        sidecarHealthy: true,
        suppliers: [{ _id: 'sup-1', name: 'Acme Organics', companyCode: 'ACM' }],
        buyers: [],
        buyerLists: [],
        loading: false,
        error: null,
        analyticsSummary: null,
        analyticsLoading: false,
      },
    });
  });

  describe('UnifiedIngestionModal Unit Tests', () => {
    it('renders Step 1 (3-card target destination selector) and Step 2 (drag-and-drop file uploader) when open', () => {
      render(
        <Provider store={testStore}>
          <UnifiedIngestionModal
            isOpen={true}
            onClose={vi.fn()}
          />
        </Provider>
      );

      // Modal Title
      expect(screen.getByText('Unified Surplus Data Ingestion')).toBeDefined();

      // Step 1: 3 destination cards
      expect(screen.getByText('1. Select Destination Pipeline')).toBeDefined();
      expect(screen.getByText('Inventory Data')).toBeDefined();
      expect(screen.getByText('Sales Data')).toBeDefined();
      expect(screen.getByText('Buyer Data')).toBeDefined();

      // Step 2: Drag & drop uploader
      expect(screen.getByText('2. Upload Spreadsheet or Manifest')).toBeDefined();
      expect(screen.getByText(/Drag & drop spreadsheet or click to browse/i)).toBeDefined();
      expect(screen.getByText(/Supports .csv, .xlsx, and .xls files/i)).toBeDefined();

      // Ingest Dataset submit button
      const submitBtn = screen.getByRole('button', { name: /Ingest Dataset/i });
      expect(submitBtn).toBeDefined();
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('pre-selects the corresponding pipeline radio when passing initialTarget', () => {
      render(
        <Provider store={testStore}>
          <UnifiedIngestionModal
            isOpen={true}
            initialTarget="buyers"
            onClose={vi.fn()}
          />
        </Provider>
      );

      const buyerRadio = screen.getByRole('radio', { name: /Buyer Data/i }) as HTMLInputElement;
      expect(buyerRadio.checked).toBe(true);

      const inventoryRadio = screen.getByRole('radio', { name: /Inventory Data/i }) as HTMLInputElement;
      expect(inventoryRadio.checked).toBe(false);
    });

    it('allows changing destination pipeline selection', () => {
      render(
        <Provider store={testStore}>
          <UnifiedIngestionModal
            isOpen={true}
            initialTarget="inventory"
            onClose={vi.fn()}
          />
        </Provider>
      );

      const salesCard = screen.getByText('Sales Data');
      fireEvent.click(salesCard);

      const salesRadio = screen.getByRole('radio', { name: /Sales Data/i }) as HTMLInputElement;
      expect(salesRadio.checked).toBe(true);
    });

    it('displays file preview with formatted size when a file is selected', () => {
      render(
        <Provider store={testStore}>
          <UnifiedIngestionModal
            isOpen={true}
            onClose={vi.fn()}
          />
        </Provider>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDefined();

      const testFile = new File(['mock content'], 'test_surplus_manifest.csv', { type: 'text/csv' });
      Object.defineProperty(testFile, 'size', { value: 1024 * 45 }); // 45 KB

      fireEvent.change(fileInput, { target: { files: [testFile] } });

      expect(screen.getByText('test_surplus_manifest.csv')).toBeDefined();
      expect(screen.getByText(/45.0 KB/i)).toBeDefined();

      const submitBtn = screen.getByRole('button', { name: /Ingest Dataset/i }) as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(false);
    });

    it('submits the modal, invokes parsing thunk, closes modal, and triggers tab switch', async () => {
      const onClose = vi.fn();
      (ingestionService.uploadInventoryFile as any).mockResolvedValueOnce({
        documentId: 'doc-inv-99',
        fileName: 'inventory_seed.csv',
        rawGrid: [['SKU', 'Quantity'], ['SKU-1', '100']],
        suggestedMapping: { sku: 'SKU', quantity: 'Quantity' },
      });

      render(
        <Provider store={testStore}>
          <UnifiedIngestionModal
            isOpen={true}
            initialTarget="inventory"
            onClose={onClose}
          />
        </Provider>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = new File(['SKU,Quantity\nSKU-1,100'], 'inventory_seed.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      const submitBtn = screen.getByRole('button', { name: /Ingest Dataset/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(ingestionService.uploadInventoryFile).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('In-Situ Mapping Handoff & Pipeline Integration', () => {
    it('opens UnifiedIngestionModal from CSV / Excel connector card and pre-selects current pipeline', async () => {
      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      // Click "Upload File" in CSV / Excel connector card
      const uploadConnectorBtn = screen.getByRole('button', { name: /Upload File/i });
      fireEvent.click(uploadConnectorBtn);

      // Modal should open
      expect(screen.getByText('Unified Surplus Data Ingestion')).toBeDefined();

      // Current active tab is inventory, so inventory should be selected
      const inventoryRadio = screen.getByRole('radio', { name: /Inventory Data/i }) as HTMLInputElement;
      expect(inventoryRadio.checked).toBe(true);
    });

    it('opens UnifiedIngestionModal from pipeline import button and pre-selects target pipeline', async () => {
      // Set active tab to sales
      testStore.dispatch(setPipelineTab('sales'));

      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      const importBtn = screen.getByRole('button', { name: /Upload Sales Report/i });
      fireEvent.click(importBtn);

      expect(screen.getByText('Unified Surplus Data Ingestion')).toBeDefined();
      const salesRadio = screen.getByRole('radio', { name: /Sales Data/i }) as HTMLInputElement;
      expect(salesRadio.checked).toBe(true);
    });

    it('submitting modal with Buyer target switches tab to buyers and mounts in-situ mapping window above table', async () => {
      (ingestionService.uploadBuyerFile as any).mockResolvedValueOnce({
        documentId: 'doc-buyer-auto',
        fileName: 'buyers_network.csv',
        rawGrid: [
          ['Company Name', 'Contact Email', 'Tier'],
          ['Costco Wholesale', 'buyer@costco.com', 'tier1'],
        ],
        suggestedMapping: {
          companyName: 'Company Name',
          email: 'Contact Email',
          tier: 'Tier',
        },
      });

      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      // Open modal via connector card
      const uploadConnectorBtn = screen.getByRole('button', { name: /Upload File/i });
      fireEvent.click(uploadConnectorBtn);

      // Select Buyer Data card
      fireEvent.click(screen.getByText('Buyer Data'));

      // Attach file
      const fileInput = screen.getByTestId('unified-ingestion-file-input') as HTMLInputElement;
      const testFile = new File(['dummy'], 'buyers_network.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Click Ingest Dataset
      fireEvent.click(screen.getByRole('button', { name: /Ingest Dataset/i }));

      // Wait for thunk and state updates
      await waitFor(() => {
        expect(testStore.getState().ingestion.pipelineTab).toBe('buyers');
      });

      // The Ingestion Mapping Window should be mounted in-situ in the buyers panel
      await waitFor(() => {
        expect(screen.getByText('Confirm Buyer Data Mapping')).toBeDefined();
        expect(screen.getByText('buyers_network.csv')).toBeDefined();
        expect(screen.getByRole('button', { name: /Confirm & Ingest Buyers/i })).toBeDefined();
      });
    });

    it('cancelling the in-situ mapping window dismisses the mapping preview and restores normal table display', () => {
      testStore.dispatch(setPipelineTab('inventory'));
      testStore.dispatch(
        setInventoryParsedResult({
          documentId: 'doc-test-cancel',
          fileName: 'cancel_me.csv',
          rawGrid: [['SKU', 'Cases'], ['SKU-101', '50']],
          suggestedMapping: { sku: 'SKU' },
        })
      );

      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      expect(screen.getByText('Confirm Inventory Data Mapping')).toBeDefined();
      expect(screen.getByText('cancel_me.csv')).toBeDefined();

      // Click cancel button on mapping header
      const cancelBtn = screen.getByTitle('Cancel');
      fireEvent.click(cancelBtn);

      // Result should be cleared from store and mapping window unmounted
      expect(testStore.getState().ingestion.inventoryParsedResult).toBe(null);
      expect(screen.queryByText('Confirm Inventory Data Mapping')).toBeNull();
    });

    it('confirming the in-situ mapping window commits records and clears mapping window', async () => {
      (ingestionService.confirmInventoryIngestion as any).mockResolvedValueOnce({
        countImported: 5,
        importedLotIds: ['LOT-1', 'LOT-2'],
      });

      testStore.dispatch(setPipelineTab('inventory'));
      testStore.dispatch(
        setInventoryParsedResult({
          documentId: 'doc-test-confirm',
          fileName: 'confirm_me.csv',
          rawGrid: [['SKU', 'Quantity'], ['SKU-200', '10']],
          suggestedMapping: { sku: 'SKU', quantity: 'Quantity' },
        })
      );

      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      const confirmBtn = screen.getByRole('button', { name: /Confirm & Import Lots/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(ingestionService.confirmInventoryIngestion).toHaveBeenCalled();
        expect(testStore.getState().ingestion.inventoryParsedResult).toBe(null);
      });
    });
  });
});
