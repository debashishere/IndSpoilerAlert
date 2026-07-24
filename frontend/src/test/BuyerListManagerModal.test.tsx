import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setBuyers, setBuyerLists, type BuyerList } from '../store/slices/coreSlice';
import { BuyerListManagerModal } from '../components/domain/ingestion/BuyerListManagerModal';
import { BuyerRegistryPanel } from '../components/domain/ingestion/BuyerRegistryPanel';
import networkService, { createBuyerList, updateBuyerList, deleteBuyerList, updateBuyerListMembers } from '../services/networkService';

vi.mock('../services/networkService', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      getBuyerLists: vi.fn().mockResolvedValue([]),
      createBuyerList: vi.fn(),
      updateBuyerList: vi.fn(),
      deleteBuyerList: vi.fn(),
      updateBuyerListMembers: vi.fn(),
    },
    getBuyerLists: vi.fn().mockResolvedValue([]),
    createBuyerList: vi.fn(),
    updateBuyerList: vi.fn(),
    deleteBuyerList: vi.fn(),
    updateBuyerListMembers: vi.fn(),
  };
});

describe('BuyerListManagerModal — Slice 1: Modal Rendering & System/Custom Lists', () => {
  const mockLists: BuyerList[] = [
    {
      _id: 'sys-1',
      name: 'Primary Tier Buyers',
      type: 'primary',
      buyerIds: ['b-1', 'b-2'],
      description: 'System default primary list',
    },
    {
      _id: 'sys-2',
      name: 'Secondary Tier Buyers',
      type: 'secondary',
      buyerIds: [],
      description: 'System default secondary list',
    },
    {
      _id: 'cust-1',
      name: 'Northeast Retailers',
      type: 'custom',
      buyerIds: ['b-1'],
      description: 'Custom group for NE region',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(setBuyers([
      { _id: 'b-1', name: 'Acme Markets', email: 'acme@test.com', tier: 'tier1' },
      { _id: 'b-2', name: 'Beta Foods', email: 'beta@test.com', tier: 'tier2' },
    ]));
    store.dispatch(setBuyerLists(mockLists));
  });

  it('should render modal with header, directory of system & custom lists, and lock icons for system lists', () => {
    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText('Buyer List Manager')).toBeDefined();
    expect(screen.getByText('Primary Tier Buyers')).toBeDefined();
    expect(screen.getByText('Secondary Tier Buyers')).toBeDefined();
    expect(screen.getByText('Northeast Retailers')).toBeDefined();

    expect(screen.getAllByText('System').length).toBe(2);
    expect(screen.getByText('Custom')).toBeDefined();

    expect(screen.getByTestId('lock-icon-sys-1')).toBeDefined();
    expect(screen.queryByTestId('edit-list-sys-1')).toBeNull();
    expect(screen.queryByTestId('delete-list-sys-1')).toBeNull();

    expect(screen.getByTestId('edit-list-cust-1')).toBeDefined();
    expect(screen.getByTestId('delete-list-cust-1')).toBeDefined();
  });

  it('should render "Buyer Lists" button in BuyerRegistryPanel header and open modal when clicked', () => {
    render(
      <Provider store={store}>
        <BuyerRegistryPanel />
      </Provider>
    );

    const buyerListsBtn = screen.getByRole('button', { name: /Buyer Lists/i });
    expect(buyerListsBtn).toBeDefined();

    fireEvent.click(buyerListsBtn);

    expect(screen.getByText('Buyer List Manager')).toBeDefined();
  });
});

describe('BuyerListManagerModal — Slice 2: Custom List Directory CRUD', () => {
  const mockLists: BuyerList[] = [
    {
      _id: 'sys-1',
      name: 'Primary Tier Buyers',
      type: 'primary',
      buyerIds: ['b-1'],
    },
    {
      _id: 'cust-1',
      name: 'Northeast Retailers',
      type: 'custom',
      buyerIds: ['b-1'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(setBuyers([
      { _id: 'b-1', name: 'Acme Markets', email: 'acme@test.com', tier: 'tier1' },
    ]));
    store.dispatch(setBuyerLists(mockLists));
  });

  it('should create a new custom list on inline form submit', async () => {
    const createdList = { _id: 'cust-2', name: 'Southwest Distributors', type: 'custom', buyerIds: [] };
    vi.mocked(networkService.createBuyerList).mockResolvedValue(createdList);
    vi.mocked(createBuyerList).mockResolvedValue(createdList);

    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    const newListBtn = screen.getByRole('button', { name: /New List/i });
    fireEvent.click(newListBtn);

    const input = screen.getByPlaceholderText('List name...');
    fireEvent.change(input, { target: { value: 'Southwest Distributors' } });

    const saveBtn = screen.getByTestId('save-new-list-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(networkService.createBuyerList).toHaveBeenCalledWith({ name: 'Southwest Distributors' });
    });
  });

  it('should rename a custom list inline', async () => {
    const updatedList = { _id: 'cust-1', name: 'Northeast & Mid-Atlantic', type: 'custom', buyerIds: ['b-1'] };
    vi.mocked(networkService.updateBuyerList).mockResolvedValue(updatedList);
    vi.mocked(updateBuyerList).mockResolvedValue(updatedList);

    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    const editBtn = screen.getByTestId('edit-list-cust-1');
    fireEvent.click(editBtn);

    const input = screen.getByDisplayValue('Northeast Retailers');
    fireEvent.change(input, { target: { value: 'Northeast & Mid-Atlantic' } });

    const saveEditBtn = screen.getByTestId('save-edit-list-cust-1');
    fireEvent.click(saveEditBtn);

    await waitFor(() => {
      expect(networkService.updateBuyerList).toHaveBeenCalledWith('cust-1', { name: 'Northeast & Mid-Atlantic' });
    });
  });

  it('should delete a custom list after confirmation', async () => {
    vi.mocked(networkService.deleteBuyerList).mockResolvedValue({ success: true });
    vi.mocked(deleteBuyerList).mockResolvedValue({ success: true });

    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    const deleteBtn = screen.getByTestId('delete-list-cust-1');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Are you sure you want to delete/i)).toBeDefined();

    const confirmDeleteBtn = screen.getByTestId('confirm-delete-btn');
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(networkService.deleteBuyerList).toHaveBeenCalledWith('cust-1');
    });
  });
});

describe('BuyerListManagerModal — Slice 3 & 4: Two-Panel Member Assignment & Dirty State Guard', () => {
  const mockLists: BuyerList[] = [
    {
      _id: 'l-1',
      name: 'Primary Tier Buyers',
      type: 'primary',
      buyerIds: ['b-1'],
    },
    {
      _id: 'l-2',
      name: 'Secondary Tier Buyers',
      type: 'secondary',
      buyerIds: ['b-2'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(setBuyers([
      { _id: 'b-1', name: 'Acme Markets', email: 'acme@test.com', tier: 'tier1' },
      { _id: 'b-2', name: 'Beta Foods', email: 'beta@test.com', tier: 'tier2' },
      { _id: 'b-3', name: 'Gamma Grocers', email: 'gamma@test.com', tier: 'tier1' },
    ]));
    store.dispatch(setBuyerLists(mockLists));
  });

  it('should render two columns: current members on left, available buyers on right', () => {
    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText('Primary Tier Buyers — Members')).toBeDefined();

    // Left column: current member Acme Markets
    const currentSection = screen.getByTestId('current-members-column');
    expect(currentSection).toBeDefined();
    expect(screen.getByTestId('remove-member-b-1')).toBeDefined();

    // Right column: non-members Beta Foods & Gamma Grocers
    const availableSection = screen.getByTestId('available-buyers-column');
    expect(availableSection).toBeDefined();
    expect(screen.getByTestId('add-member-b-2')).toBeDefined();
    expect(screen.getByTestId('add-member-b-3')).toBeDefined();
  });

  it('should filter current members and available buyers using search inputs', () => {
    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    const availableSearch = screen.getByTestId('search-available-buyers');
    fireEvent.change(availableSearch, { target: { value: 'Gamma' } });

    expect(screen.queryByTestId('add-member-b-2')).toBeNull();
    expect(screen.getByTestId('add-member-b-3')).toBeDefined();
  });

  it('should update membership locally, mark dirty state, and batch save changes via PUT /buyer-lists/:id/members', async () => {
    const updatedList = { _id: 'l-1', name: 'Primary Tier Buyers', type: 'primary', buyerIds: ['b-1', 'b-3'] };
    vi.mocked(networkService.updateBuyerListMembers).mockResolvedValue(updatedList);
    vi.mocked(updateBuyerListMembers).mockResolvedValue(updatedList);

    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    // Add Gamma Grocers (b-3)
    const addBtn = screen.getByTestId('add-member-b-3');
    fireEvent.click(addBtn);

    // Dirty state indicator should be visible
    expect(screen.getByTestId('dirty-indicator')).toBeDefined();

    // Save changes
    const saveBtn = screen.getByTestId('save-members-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(networkService.updateBuyerListMembers).toHaveBeenCalledWith('l-1', ['b-1', 'b-3']);
    });
  });

  it('should prompt confirmation when switching list with unsaved changes', () => {
    render(
      <Provider store={store}>
        <BuyerListManagerModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    // Add Gamma Grocers to create dirty state
    fireEvent.click(screen.getByTestId('add-member-b-3'));
    expect(screen.getByTestId('dirty-indicator')).toBeDefined();

    // Attempt to switch to Secondary Tier Buyers (l-2)
    const secondaryListBtn = screen.getByText('Secondary Tier Buyers');
    fireEvent.click(secondaryListBtn);

    // Prompt dialog should appear
    expect(screen.getByText(/You have unsaved changes/i)).toBeDefined();

    // Confirm switch
    const confirmSwitchBtn = screen.getByTestId('confirm-switch-btn');
    fireEvent.click(confirmSwitchBtn);

    // Should now be on Secondary Tier Buyers
    expect(screen.getByText('Secondary Tier Buyers — Members')).toBeDefined();
  });
});
