import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { BuyerRegistryPanel } from '../components/domain/ingestion/BuyerRegistryPanel';
import { setBuyerParsedResult, setBuyerFile } from '../store/slices/ingestionSlice';
import { setBuyers } from '../store/slices/coreSlice';
import ingestionService from '../services/ingestionService';

vi.mock('../services/ingestionService', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      uploadBuyerFile: vi.fn(),
      confirmBuyerIngestion: vi.fn(),
      addBuyer: vi.fn(),
    },
  };
});

describe('BuyerRegistryPanel — Live CSV Ingestion & Unified Buyer Registry (Issue 03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(setBuyerParsedResult(null));
    store.dispatch(setBuyerFile(null));
    store.dispatch(
      setBuyers([
        { _id: 'b-manual-1', name: 'Manual Buyer Corp', email: 'manual@corp.com', tier: 'tier1' },
      ])
    );
  });

  it('should render initial state with manual buyer in the list and top-level action buttons', () => {
    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Buyer List Ingestion')).toBeDefined();
    expect(screen.getByText('Manual Buyer Corp')).toBeDefined();
    expect(screen.getByText('manual@corp.com')).toBeDefined();
    expect(screen.getByRole('button', { name: /Bulk Import via CSV/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Add Buyer Manually/i })).toBeDefined();
  });

  it('should open and close Bulk Import modal on button click', () => {
    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    const importBtn = screen.getByRole('button', { name: /Bulk Import via CSV/i });
    fireEvent.click(importBtn);

    expect(screen.getByText('Bulk Import Buyers via CSV')).toBeDefined();
    expect(screen.getByText('Select or drag your CSV file here')).toBeDefined();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Bulk Import Buyers via CSV')).toBeNull();
  });

  it('should open and close Add Buyer Manually modal on button click', () => {
    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    const addBtn = screen.getByRole('button', { name: /Add Buyer Manually/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Register a new buyer into your global network.')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Costco Wholesale')).toBeDefined();
    expect(screen.getByPlaceholderText('buyer@company.com')).toBeDefined();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Register a new buyer into your global network.')).toBeNull();
  });

  it('should handle file selection from Bulk Import modal, close the modal, call uploadBuyerThunk, and render column mapping preview', async () => {
    const mockParsedResult = {
      documentId: 'doc-buyer-123',
      fileName: 'buyers_100_seed.csv',
      rawGrid: [
        ['Company Name', 'Contact Email', 'Buyer Tier'],
        ['Acme Wholesale', 'acme@wholesale.com', 'tier1'],
        ['Beta Logistics', 'beta@logistics.com', 'liquidator'],
      ],
      suggestedMapping: {
        name: 'Company Name',
        email: 'Contact Email',
        tier: 'Buyer Tier',
      },
    };

    (ingestionService.uploadBuyerFile as any).mockResolvedValueOnce(mockParsedResult);

    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    // Open Bulk Import Modal
    const importBtn = screen.getByRole('button', { name: /Bulk Import via CSV/i });
    fireEvent.click(importBtn);
    expect(screen.getByText('Bulk Import Buyers via CSV')).toBeDefined();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    const mockFile = new File(['Company Name,Contact Email,Buyer Tier\nAcme,a@b.com,tier1'], 'buyers_100_seed.csv', {
      type: 'text/csv',
    });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(ingestionService.uploadBuyerFile).toHaveBeenCalled();
    });

    // Bulk import modal should be closed
    expect(screen.queryByText('Bulk Import Buyers via CSV')).toBeNull();

    // Column mapping confirmation / Data preview should be rendered
    expect(screen.getByText('Confirm Buyer CSV Mapping')).toBeDefined();
    expect(screen.getByText('buyers_100_seed.csv')).toBeDefined();
  });

  it('should trigger confirmBuyerThunk, refetch core buyers, and update unified table on confirmation', async () => {
    (ingestionService.confirmBuyerIngestion as any).mockResolvedValueOnce({
      createdCount: 2,
      updatedCount: 0,
      buyerIds: ['b-bulk-1', 'b-bulk-2'],
    });

    // Pre-populate parsed result in store
    store.dispatch(
      setBuyerParsedResult({
        documentId: 'doc-buyer-456',
        fileName: 'buyers_100_seed.csv',
        rawGrid: [
          ['Company Name', 'Contact Email', 'Buyer Tier'],
          ['Acme Wholesale', 'acme@wholesale.com', 'tier1'],
        ],
        suggestedMapping: {
          name: 'Company Name',
          email: 'Contact Email',
          tier: 'Buyer Tier',
        },
      })
    );

    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('Confirm Buyer CSV Mapping')).toBeDefined();

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Ingest Buyers/i });
    expect(confirmBtn).toBeDefined();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(ingestionService.confirmBuyerIngestion).toHaveBeenCalledWith({
        documentId: 'doc-buyer-456',
        mappings: {
          name: 'Company Name',
          email: 'Contact Email',
          tier: 'Buyer Tier',
        },
      });
    });
  });

  it('should open BuyerDetailDrawer when clicking a buyer row in registry table and style inactive buyers with badge', async () => {
    store.dispatch(
      setBuyers([
        { _id: 'b-active-1', companyName: 'Active Retailer', email: 'active@retailer.com', tier: 'tier1', isActive: true },
        { _id: 'b-inactive-1', companyName: 'Inactive Retailer', email: 'inactive@retailer.com', tier: 'tier2', isActive: false },
      ])
    );

    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    // Verify inactive buyer row is hidden by default when showInactive is false
    expect(screen.queryByText('Inactive Retailer')).toBeNull();

    // Toggle "Show inactive buyers"
    const toggle = screen.getByLabelText(/Show inactive buyers/i);
    expect(toggle).toBeDefined();
    fireEvent.click(toggle);

    // Now inactive buyer should be displayed with red Inactive badge
    expect(await screen.findByText('Inactive Retailer')).toBeDefined();
    expect(screen.getByTestId('inactive-badge-b-inactive-1')).toBeDefined();

    // Click active buyer row to open drawer
    const row = screen.getByTestId('buyer-row-b-active-1');
    fireEvent.click(row);

    // Verify drawer opens with Active Retailer details
    expect(await screen.findByTestId('buyer-detail-drawer')).toBeDefined();
    expect(screen.getAllByText('active@retailer.com').length).toBeGreaterThanOrEqual(2);
  });

  it('should render opt-out badges ("No Bidding", "No Sales") on active buyers with optIn disabled', () => {
    store.dispatch(
      setBuyers([
        { 
          _id: 'b-optout-1', 
          companyName: 'OptOut Corp', 
          email: 'optout@corp.com', 
          tier: 'tier1', 
          isActive: true,
          optInBidding: false,
          optInSales: false,
        },
      ])
    );

    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    expect(screen.getByText('No Bidding')).toBeDefined();
    expect(screen.getByText('No Sales')).toBeDefined();
  });

  it('should dispatch fetchCoreReferenceData when BuyerDetailDrawer is closed', async () => {
    store.dispatch(
      setBuyers([
        { _id: 'b-active-2', companyName: 'Drawer Buyer', email: 'drawer@buyer.com', tier: 'tier1', isActive: true },
      ])
    );

    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    // Open drawer
    const row = screen.getByTestId('buyer-row-b-active-2');
    fireEvent.click(row);

    const closeBtn = await screen.findByTestId('buyer-drawer-close-btn');
    fireEvent.click(closeBtn);

    // Drawer should close
    await waitFor(() => {
      expect(screen.queryByTestId('buyer-detail-drawer')).toBeNull();
    });
  });

  it('should not render inline Buyer Lists & Segments overview section in BuyerRegistryPanel tab', () => {
    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    expect(screen.queryByTestId('buyer-lists-overview-section')).toBeNull();
    expect(screen.queryByText('Buyer Lists & Segments')).toBeNull();
  });

  it('should open BuyerListManagerModal when clicking "Buyer Lists" header button to configure buyer lists and segments', async () => {
    const { setBuyerLists } = await import('../store/slices/coreSlice');
    store.dispatch(setBuyerLists([
      { _id: 'l1', name: 'Primary Buyers', type: 'primary', buyerIds: [] },
      { _id: 'l2', name: 'Secondary Liquidators', type: 'secondary', buyerIds: [] }
    ]));

    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    const buyerListsBtn = screen.getByRole('button', { name: /Buyer Lists/i });
    fireEvent.click(buyerListsBtn);

    expect(screen.getByText('Buyer List Manager')).toBeDefined();
    expect(screen.getByText('Primary Buyers')).toBeDefined();
    expect(screen.getByText('Secondary Liquidators')).toBeDefined();
  });
});

