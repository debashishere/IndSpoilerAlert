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

const { mockUploadInventoryFile } = vi.hoisted(() => ({
  mockUploadInventoryFile: vi.fn(),
}));

vi.mock('../services/ingestionService', () => {
  const service = {
    uploadInventoryFile: mockUploadInventoryFile,
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
  it('renders all four architectural quadrants conforming to ADR 0071', () => {
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
    expect(screen.getByText(/Optical Confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Parse Latency/i)).toBeInTheDocument();

    // Quadrant 2: AI OCR Upload Dropzone
    expect(screen.getByTestId('doc-scanner-quadrant-2-dropzone')).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop manifests, invoices, or packing slips/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run AI Extraction/i })).toBeInTheDocument();

    // Quadrant 3: Scanned Documents Roster
    expect(screen.getByTestId('doc-scanner-quadrant-3-roster')).toBeInTheDocument();
    expect(screen.getByText(/Scanned Documents Roster/i)).toBeInTheDocument();

    // Quadrant 4: In-Situ Schema Field Mapper
    expect(screen.getByTestId('doc-scanner-quadrant-4-mapper')).toBeInTheDocument();
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

  it('handles file selection and triggers upload extraction', async () => {
    mockUploadInventoryFile.mockResolvedValueOnce({
      documentId: 'doc-ocr-123',
      fileName: 'manifest-batch-44.pdf',
      rawGrid: [
        ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
        ['Organic Romaine Hearts', 'ROM-2026-9', '250', '28.00'],
      ],
      previewRows: [
        ['Organic Romaine Hearts', 'ROM-2026-9', '250', '28.00'],
      ],
      rawHeaders: ['Item Description', 'Lot Code', 'Quantity Cases', 'Price / Case'],
      suggestedMapping: {
        description: 'Item Description',
        lotNumber: 'Lot Code',
        availableQuantity: 'Quantity Cases',
        unitPrice: 'Price / Case',
      },
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
        <DocScannerIntegrationView supplierId="sup-1" supplierName="Fresh Greens Co" />
      </Provider>
    );

    const file = new File(['dummy-pdf-content'], 'manifest-batch-44.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('doc-scanner-file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('manifest-batch-44.pdf')).toBeInTheDocument();

    const extractBtn = screen.getByRole('button', { name: /Run AI Extraction/i });
    expect(extractBtn).not.toBeDisabled();
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockUploadInventoryFile).toHaveBeenCalled();
    });
  });
});
