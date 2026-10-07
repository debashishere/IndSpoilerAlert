import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, { setPipelineTab } from '../store/slices/ingestionSlice';
import inventoryReducer, {
  setInventoryList,
  setSelectedLot,
} from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { PipelineSwitcherBar } from '../components/domain/ingestion/subcomponents/PipelineSwitcherBar';
import { InventoryRowInspectionDrawer } from '../components/domain/ingestion/subcomponents/InventoryRowInspectionDrawer';
import { EditInventoryModal } from '../components/domain/ingestion/subcomponents/EditInventoryModal';
import { isLotListedInBidding } from '../components/domain/ingestion/utils/inventoryUtils';
import IngestionView from '../views/IngestionView';

const createTestStore = (initialLots: any[] = []) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
    },
    preloadedState: {
      ingestion: {
        ...ingestionReducer(undefined, { type: '@@INIT' }),
        pipelineTab: 'inventory',
      },
      inventory: {
        ...inventoryReducer(undefined, { type: '@@INIT' }),
        inventoryList: initialLots,
      },
    },
  });
};

const mockAvailableLot = {
  _id: 'lot-avail-01',
  id: 'lot-avail-01',
  lotNumber: 'LOT-AVAIL-01',
  productName: 'Organic Greek Yogurt',
  title: 'Organic Greek Yogurt',
  sku: 'YOG-001',
  quantityCases: 500,
  availableQty: 500,
  availableCases: 500,
  costPerCase: 12.0,
  standardSellPrice: 18.0,
  expirationDate: '2026-10-15T00:00:00.000Z',
  storageTemp: 'Ambient',
  status: 'Available',
  warehouse: 'DC-East (Edison, NJ)',
};

const mockBiddingLot = {
  _id: 'lot-bid-02',
  id: 'lot-bid-02',
  lotNumber: 'LOT-BID-02',
  productName: 'Premium Ice Cream Tubs',
  title: 'Premium Ice Cream Tubs',
  sku: 'ICE-002',
  quantityCases: 300,
  availableQty: 300,
  costPerCase: 15.0,
  standardSellPrice: 22.0,
  expirationDate: '2026-09-30T00:00:00.000Z',
  storageTemp: 'Refrigerated',
  status: 'Bidding',
  isListedInBidding: true,
  listing: {
    _id: 'listing-02',
    allowBidding: true,
    status: 'active',
  },
  warehouse: 'DC-West (Stockton, CA)',
};

describe('Ingestion Inventory Tab: Edit Inventory & Bidding Guard & Delete/Archive Rename', () => {
  describe('1. isLotListedInBidding utility verification', () => {
    it('returns false for available or normal lots not listed in bidding', () => {
      expect(isLotListedInBidding(mockAvailableLot)).toBe(false);
      expect(isLotListedInBidding({ ...mockAvailableLot, status: 'Active List' })).toBe(false);
      expect(isLotListedInBidding({ ...mockAvailableLot, status: 'Critical RSL' })).toBe(false);
    });

    it('returns true when lot has explicit isListedInBidding or listedInBidding or allowBidding', () => {
      expect(isLotListedInBidding({ ...mockAvailableLot, isListedInBidding: true })).toBe(true);
      expect(isLotListedInBidding({ ...mockAvailableLot, listedInBidding: true })).toBe(true);
      expect(isLotListedInBidding({ ...mockAvailableLot, allowBidding: true })).toBe(true);
      expect(isLotListedInBidding({ ...mockAvailableLot, biddingPushed: true })).toBe(true);
    });

    it('returns true when lot status is Bidding or contains bidding', () => {
      expect(isLotListedInBidding({ ...mockAvailableLot, status: 'Bidding' })).toBe(true);
      expect(isLotListedInBidding({ ...mockAvailableLot, status: 'In Bidding Round' })).toBe(true);
      expect(isLotListedInBidding({ ...mockAvailableLot, status: 'Listed in Bidding' })).toBe(true);
    });

    it('returns true when lot has marketplace listing with allowBidding or active status', () => {
      expect(isLotListedInBidding({ ...mockAvailableLot, listing: { allowBidding: true } })).toBe(true);
      expect(isLotListedInBidding({ ...mockAvailableLot, listing: { status: 'active' } })).toBe(true);
    });
  });

  describe('2. PipelineSwitcherBar Actions', () => {
    it('renders "Create Inventory" button on inventory tab and does NOT render redundant top-level "Edit Inventory"', () => {
      const onCreateInventory = vi.fn();
      const store = createTestStore();

      render(
        <Provider store={store}>
          <PipelineSwitcherBar
            activeTab="inventory"
            onTabChange={() => {}}
            onCreateInventory={onCreateInventory}
          />
        </Provider>
      );

      // Verify Create button
      const createBtn = screen.getByRole('button', { name: /Create Inventory/i });
      expect(createBtn).toBeDefined();

      // Verify top-level Edit button is not rendered (editing is contextual per inventory row)
      expect(screen.queryByRole('button', { name: /Edit Inventory/i })).toBeNull();
    });

    it('does not render "Edit Inventory" button on sales or buyers tabs', () => {
      const store = createTestStore();
      const { rerender } = render(
        <Provider store={store}>
          <PipelineSwitcherBar
            activeTab="sales"
            onTabChange={() => {}}
          />
        </Provider>
      );

      expect(screen.queryByRole('button', { name: /Edit Inventory/i })).toBeNull();

      rerender(
        <Provider store={store}>
          <PipelineSwitcherBar
            activeTab="buyers"
            onTabChange={() => {}}
          />
        </Provider>
      );

      expect(screen.queryByRole('button', { name: /Edit Inventory/i })).toBeNull();
    });
  });

  describe('3. EditInventoryModal: Rejection when listed in bidding', () => {
    it('rejects editing and disables save button when lot is listed in bidding', () => {
      const store = createTestStore([mockBiddingLot]);
      const onClose = vi.fn();

      render(
        <Provider store={store}>
          <EditInventoryModal
            isOpen={true}
            onClose={onClose}
            lot={mockBiddingLot}
          />
        </Provider>
      );

      // Verify Rejection alert banner is rendered
      expect(screen.getByRole('alert', { name: /Edit Rejected: Lot Listed in Bidding/i })).toBeDefined();
      expect(screen.getByText(/Cannot Edit: Lot Listed in Bidding/i)).toBeDefined();
      expect(screen.getByText(/Our system rejects edit requests when inventory is currently listed in active bidding/i)).toBeDefined();

      // Verify Save button is disabled and indicates locked state
      const saveBtn = screen.getByRole('button', { name: /Locked \(Listed in Bidding\)/i });
      expect(saveBtn).toBeDefined();
      expect((saveBtn as HTMLButtonElement).disabled).toBe(true);

      // Verify input fields are disabled
      const titleInput = screen.getByPlaceholderText(/e\.g\. Organic Strawberry/i);
      expect((titleInput as HTMLInputElement).disabled).toBe(true);
    });

    it('allows editing and successfully dispatches updates when lot is NOT listed in bidding', async () => {
      const store = createTestStore([mockAvailableLot]);
      const onClose = vi.fn();
      const onLotUpdated = vi.fn();

      render(
        <Provider store={store}>
          <EditInventoryModal
            isOpen={true}
            onClose={onClose}
            lot={mockAvailableLot}
            onLotUpdated={onLotUpdated}
          />
        </Provider>
      );

      // Verify no bidding rejection alert
      expect(screen.queryByRole('alert', { name: /Edit Rejected: Lot Listed in Bidding/i })).toBeNull();

      // Verify the dropdown 'Select Inventory Lot to Edit' is removed
      expect(screen.queryByLabelText(/Select Inventory Lot to Edit/i)).toBeNull();
      expect(screen.queryByText(/Select Inventory Lot to Edit/i)).toBeNull();

      // Inputs should be pre-populated
      const titleInput = screen.getByPlaceholderText(/e\.g\. Organic Strawberry/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Organic Greek Yogurt');
      expect(titleInput.disabled).toBe(false);

      // Modify title and cases
      fireEvent.change(titleInput, { target: { value: 'Organic Greek Yogurt Updated' } });
      const qtyInput = screen.getByPlaceholderText(/e\.g\. 450/i);
      fireEvent.change(qtyInput, { target: { value: '650' } });

      // Click Save Changes
      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(saveBtn);

      // Verify onLotUpdated called
      expect(onLotUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'lot-avail-01',
          title: 'Organic Greek Yogurt Updated',
          quantityCases: 650,
          availableQty: 650,
        })
      );

      // Verify Redux store updated
      const updatedInStore = store.getState().inventory.inventoryList.find((l) => l._id === 'lot-avail-01');
      expect(updatedInStore?.title).toBe('Organic Greek Yogurt Updated');
      expect(updatedInStore?.quantityCases).toBe(650);
    });
  });

  describe('4. InventoryRowInspectionDrawer: Rename Quarantine to Delete & Row Edit Button', () => {
    it('renames Quarantine button to Delete and calls handlers on click', () => {
      const onArchive = vi.fn();
      const onDelete = vi.fn();
      const onQuarantine = vi.fn();

      render(
        <InventoryRowInspectionDrawer
          lot={mockAvailableLot}
          onArchive={onArchive}
          onDelete={onDelete}
          onQuarantine={onQuarantine}
        />
      );

      // Quarantine button is now Delete
      const deleteBtn = screen.getByRole('button', { name: /^Delete$/i });
      expect(deleteBtn).toBeDefined();
      expect(screen.getByText('Delete')).toBeDefined();

      // Click button -> toggles to Archived
      fireEvent.click(deleteBtn);
      expect(onArchive).toHaveBeenCalledWith(mockAvailableLot);
      expect(onDelete).toHaveBeenCalledWith(mockAvailableLot);
      expect(onQuarantine).toHaveBeenCalledWith(mockAvailableLot);
      expect(screen.getByText('Archived')).toBeDefined();
    });

    it('rejects editing in drawer when lot is listed in bidding', () => {
      const onEditInventory = vi.fn();

      render(
        <InventoryRowInspectionDrawer
          lot={mockBiddingLot}
          onEditInventory={onEditInventory}
        />
      );

      const editBtn = screen.getByRole('button', { name: /Edit \(Locked in Bidding\)/i });
      expect(editBtn).toBeDefined();

      // Clicking it shows rejection notice and does not trigger onEditInventory
      fireEvent.click(editBtn);
      expect(screen.getByText('Cannot edit inventory: Lot is currently listed in bidding.')).toBeDefined();
      expect(onEditInventory).not.toHaveBeenCalled();
    });

    it('allows edit in drawer when lot is not listed in bidding', () => {
      const onEditInventory = vi.fn();

      render(
        <InventoryRowInspectionDrawer
          lot={mockAvailableLot}
          onEditInventory={onEditInventory}
        />
      );

      const editBtn = screen.getByRole('button', { name: /Edit Inventory/i });
      expect(editBtn).toBeDefined();

      fireEvent.click(editBtn);
      expect(onEditInventory).toHaveBeenCalledWith(mockAvailableLot);
    });
  });

  describe('5. IngestionView Integration: Row-level Edit Inventory modal trigger', () => {
    it('opens EditInventoryModal pre-filled with lot data when dispatched or triggered from row', async () => {
      const store = createTestStore([mockAvailableLot]);

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Verify top-level switcher bar does not have edit-inventory-btn
      expect(document.getElementById('edit-inventory-btn')).toBeNull();

      // Initially Edit modal is not open
      expect(screen.queryByText('Edit Inventory Record')).toBeNull();

      // Trigger open-edit-inventory-modal with mockAvailableLot
      fireEvent(
        window,
        new CustomEvent('open-edit-inventory-modal', { detail: { lot: mockAvailableLot } })
      );

      // Edit modal should open with the specific lot data
      expect(screen.getByText('Edit Inventory Record')).toBeDefined();
      const titleInput = screen.getByPlaceholderText(/e\.g\. Organic Strawberry/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Organic Greek Yogurt');

      // Dropdown selector should not exist in the modal
      expect(screen.queryByLabelText(/Select Inventory Lot to Edit/i)).toBeNull();
    });
  });
});
