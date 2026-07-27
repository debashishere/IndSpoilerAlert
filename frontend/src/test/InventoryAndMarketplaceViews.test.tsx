import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setInventoryList } from '../store/slices/inventorySlice';
import { setBuyers } from '../store/slices/coreSlice';

describe('Issue #38 Tracer Bullet 3: InventoryListView & MarketplaceView', () => {
  it('should render InventoryListView with charts dashboard, Coming Soon badges, and subtabs', async () => {
    const { InventoryListView } = await import('../views/InventoryListView');

    const mockLots = [
      {
        _id: 'lot-v1',
        status: 'active',
        expirationDate: '2026-10-15T00:00:00Z',
        quantityCases: 100,
        availableQty: 100,
        costPerCase: 20,
        lotNumber: 'LOT-999',
        productId: { sku: 'SKU-V1', description: 'Organic Granola 12pk', category: 'Dry Goods' },
        supplierId: { name: 'General Mills' },
        distributionCenterId: { name: 'DC - Chicago' },
        complianceDocs: []
      },
      {
        _id: 'lot-v2',
        status: 'pending',
        expirationDate: '2026-11-20T00:00:00Z',
        quantityCases: 50,
        availableQty: 50,
        costPerCase: 15,
        lotNumber: 'LOT-888',
        productId: { sku: 'SKU-V2', description: 'Cheddar Cheese Block', category: 'Dairy' },
        supplierId: { name: 'Kraft' },
        distributionCenterId: { name: 'DC - Dallas' },
        complianceDocs: []
      }
    ];

    store.dispatch(setInventoryList(mockLots));

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    expect(screen.getByText(/Surplus Inventory/i)).toBeInTheDocument();
    expect(screen.getByText('Total Bids Received')).toBeInTheDocument();

    // Test switching to Inventory Insights subtab
    const inventoryChartsTabBtn = screen.getByText(/Inventory Insights/i);
    fireEvent.click(inventoryChartsTabBtn);
    expect(screen.getByText(/Inventory Performance & Analytics Suite/i)).toBeInTheDocument();
    expect(screen.getByText(/COGS & Expiration Risk Trajectory/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Coming Soon/i).length).toBeGreaterThanOrEqual(1);

    // Test switching to Sales Insights subtab
    const salesTabBtn = screen.getByText(/Sales Insights/i);
    fireEvent.click(salesTabBtn);
    expect(screen.getByText('Total Realized Revenue')).toBeInTheDocument();
  });

  it('should render MarketplaceView and filter cards based on buyer allergen conflicts', async () => {
    const { MarketplaceView } = await import('../views/MarketplaceView');

    const mockBuyers: any[] = [
      { email: 'buyer1@test.com', companyName: 'No Allergy Corp', excludedAllergens: [], transportRadius: 500, categories: ['Dairy'] },
      { email: 'buyer2@test.com', companyName: 'Allergy Corp', excludedAllergens: ['Peanuts'], transportRadius: 200, categories: ['Dry Goods'] }
    ];

    const mockLots = [
      {
        _id: 'lot-mkt-1',
        status: 'active',
        availableQty: 80,
        expirationDate: '2026-10-20T00:00:00Z',
        productId: { sku: 'MKT-1', description: 'Peanut Butter Jars', category: 'Dry Goods', allergens: ['Peanuts'] },
        listing: { _id: 'list-101', allowBidding: true, startingPrice: 12, reservePrice: 15 }
      },
      {
        _id: 'lot-mkt-2',
        status: 'active',
        availableQty: 40,
        expirationDate: '2026-10-25T00:00:00Z',
        productId: { sku: 'MKT-2', description: 'Apple Juice Cases', category: 'Beverages', allergens: [] },
        listing: { _id: 'list-102', allowBidding: true, startingPrice: 8, reservePrice: 10 }
      }
    ];

    store.dispatch(setBuyers(mockBuyers));
    store.dispatch(setInventoryList(mockLots));

    render(
      <Provider store={store}>
        <MarketplaceView />
      </Provider>
    );

    expect(screen.getByText('B2B Surplus Buyer Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Peanut Butter Jars')).toBeInTheDocument();
    expect(screen.getByText('Apple Juice Cases')).toBeInTheDocument();

    // Select buyer with Peanut allergy
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'buyer2@test.com' } });

    expect(screen.queryByText('Peanut Butter Jars')).not.toBeInTheDocument();
    expect(screen.getByText('Apple Juice Cases')).toBeInTheDocument();
  });
});
