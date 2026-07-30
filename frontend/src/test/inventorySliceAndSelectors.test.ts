import { describe, it, expect } from 'vitest';
import { store } from '../store';

describe('Issue #38 Tracer Bullet 1: Inventory Slice & Memoized Selectors', () => {
  it('should initialize store with inventorySlice containing default inventory and marketplace state', async () => {
    // Dynamically import slice so test fails RED when missing
    const { 
      setFilterSearch, 
      setFilterSupplier, 
      setFilterDC, 
      setFilterCategory, 
      setFilterStatus,
      setSort,
      setSelectedBuyerEmail,
      openAwardModal,
      closeAllGlobalModals
    } = await import('../store/slices/inventorySlice');

    const state = (store.getState() as any).inventory;
    expect(state).toBeDefined();
    expect(state.inventoryList).toEqual([]);
    expect(state.listFilterSearch).toBe('');
    expect(state.sortField).toBe('expirationDate');
    expect(state.sortDirection).toBe('asc');
    expect(state.modals.showAwardModal).toBe(false);

    // Dispatch filter updates
    store.dispatch(setFilterSearch('yogurt'));
    store.dispatch(setFilterSupplier('Danone'));
    store.dispatch(setFilterDC('DC - Chicago'));
    store.dispatch(setFilterCategory('Dairy'));
    store.dispatch(setFilterStatus('active'));
    expect((store.getState() as any).inventory.listFilterSearch).toBe('yogurt');
    expect((store.getState() as any).inventory.listFilterSupplier).toBe('Danone');

    // Dispatch sorting updates
    store.dispatch(setSort({ field: 'sku', direction: 'desc' }));
    expect((store.getState() as any).inventory.sortField).toBe('sku');
    expect((store.getState() as any).inventory.sortDirection).toBe('desc');

    // Dispatch buyer selection
    store.dispatch(setSelectedBuyerEmail('buyer@costco.com'));
    expect((store.getState() as any).inventory.selectedBuyerEmail).toBe('buyer@costco.com');

    // Dispatch modal control
    const mockBid = { _id: 'bid-1', bidPrice: 25 };
    const mockLot = { _id: 'lot-1', availableQty: 100 };
    store.dispatch(openAwardModal({ bid: mockBid, lot: mockLot }));
    expect((store.getState() as any).inventory.modals.showAwardModal).toBe(true);
    expect((store.getState() as any).inventory.modals.selectedBidToAward?._id).toBe('bid-1');
    expect((store.getState() as any).inventory.selectedLot?._id).toBe('lot-1');

    store.dispatch(closeAllGlobalModals());
    expect((store.getState() as any).inventory.modals.showAwardModal).toBe(false);
  });

  it('should filter lots accurately using selectFilteredInventoryLots memoized selector without recalculating on unrelated re-renders', async () => {
    const { setInventoryList, setFilterSearch, setFilterSupplier, setFilterDC, setFilterCategory, setFilterStatus, selectFilteredInventoryLots } = await import('../store/slices/inventorySlice');

    const mockLots = [
      {
        _id: 'lot-1',
        status: 'active',
        expirationDate: '2026-10-01T00:00:00Z',
        productId: { sku: 'SKU-001', description: 'Greek Yogurt 12pk', category: 'Dairy' },
        supplierId: { name: 'Danone' },
        distributionCenterId: { name: 'DC - Chicago' },
        quantityCases: 100,
        availableQty: 100
      },
      {
        _id: 'lot-2',
        status: 'pending',
        expirationDate: '2026-11-01T00:00:00Z',
        productId: { sku: 'SKU-002', description: 'Almond Milk 6pk', category: 'Beverages' },
        supplierId: { name: 'Danone' },
        distributionCenterId: { name: 'DC - Dallas' },
        quantityCases: 50,
        availableQty: 50
      },
      {
        _id: 'lot-3',
        status: 'active',
        expirationDate: '2026-09-01T00:00:00Z',
        productId: { sku: 'SKU-003', description: 'Strawberry Yogurt Case', category: 'Dairy' },
        supplierId: { name: 'Kraft' },
        distributionCenterId: { name: 'DC - Chicago' },
        quantityCases: 200,
        availableQty: 200
      }
    ];

    // Reset filters and inject inventory list
    store.dispatch(setFilterSearch(''));
    store.dispatch(setFilterSupplier(''));
    store.dispatch(setFilterDC(''));
    store.dispatch(setFilterCategory(''));
    store.dispatch(setFilterStatus(''));
    store.dispatch(setInventoryList(mockLots));

    // Get initial filtered result (all 3 sorted by expiration date asc: lot-3, lot-1, lot-2)
    const initialResult = selectFilteredInventoryLots(store.getState() as any);
    expect(initialResult.length).toBe(3);
    expect(initialResult[0]._id).toBe('lot-3');

    // Check memoization identity when calling selector again without state changes
    const secondResult = selectFilteredInventoryLots(store.getState() as any);
    expect(secondResult).toBe(initialResult);

    // Filter by supplier = Danone and category = Dairy
    store.dispatch(setFilterSupplier('Danone'));
    store.dispatch(setFilterCategory('Dairy'));
    const filteredResult = selectFilteredInventoryLots(store.getState() as any);
    expect(filteredResult.length).toBe(1);
    expect(filteredResult[0]._id).toBe('lot-1');
  });

  it('should filter active marketplace listings and exclude allergen conflicts via selectActiveMarketplaceListings', async () => {
    const { setInventoryList, setSelectedBuyerEmail, selectActiveMarketplaceListings } = await import('../store/slices/inventorySlice');

    const { setBuyers } = await import('../store/slices/coreSlice');
    const mockBuyers: any[] = [
      { email: 'safe@buyer.com', companyName: 'Safe Co', excludedAllergens: [] },
      { email: 'allergic@buyer.com', companyName: 'Allergic Co', excludedAllergens: ['Dairy', 'Nuts'] }
    ];

    const mockLots = [
      {
        _id: 'lot-m1',
        status: 'active',
        availableQty: 50,
        listing: { _id: 'list-1', allowBidding: true },
        productId: { sku: 'M-SKU-1', allergens: ['Dairy'] }
      },
      {
        _id: 'lot-m2',
        status: 'active',
        availableQty: 10,
        listing: { _id: 'list-2', allowBidding: true },
        productId: { sku: 'M-SKU-2', allergens: ['Gluten'] }
      },
      {
        _id: 'lot-m3',
        status: 'sold', // Not active
        availableQty: 0,
        listing: { _id: 'list-3', allowBidding: true },
        productId: { sku: 'M-SKU-3', allergens: [] }
      }
    ];

    store.dispatch(setBuyers(mockBuyers));
    store.dispatch(setInventoryList(mockLots));

    // When no buyer selected, returns all 2 active listings
    store.dispatch(setSelectedBuyerEmail(''));
    expect(selectActiveMarketplaceListings(store.getState() as any).length).toBe(2);

    // When allergic@buyer.com is selected, Dairy lot (lot-m1) must be excluded!
    store.dispatch(setSelectedBuyerEmail('allergic@buyer.com'));
    const allergicListings = selectActiveMarketplaceListings(store.getState() as any);
    expect(allergicListings.length).toBe(1);
    expect(allergicListings[0]._id).toBe('lot-m2');
  });
});
