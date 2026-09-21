import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { setAllBids, setInventoryList } from '../store/slices/inventorySlice';
import { InventoryService } from '../services/inventoryService';
import { BiddingDataView } from '../components/domain/inventory/BiddingDataView';

describe('BiddingDataView Action Buttons', () => {
  const mockLot = {
    _id: 'lot-101',
    status: 'active',
    lotNumber: 'LOT-101',
    productId: { sku: 'SKU-001', description: 'Greek Yogurt 32oz', category: 'Dairy' },
    supplierId: { name: 'Chobani' }
  };

  const mockBids = [
    {
      _id: 'bid-1',
      status: 'pending',
      quantity: 50,
      price: 12.5,
      buyerId: { companyName: 'Costco Wholesale', email: 'procurement@costco.com' },
      inventoryLotId: mockLot,
      submittedAt: '2026-09-19T10:00:00Z'
    },
    {
      _id: 'bid-2',
      status: 'submitted',
      quantity: 100,
      price: 11.0,
      buyerId: { companyName: 'Kroger Distribution', email: 'deals@kroger.com' },
      lotId: 'lot-101',
      submittedAt: '2026-09-18T14:00:00Z'
    },
    {
      _id: 'bid-3',
      status: 'awarded',
      quantity: 80,
      price: 15.0,
      buyerId: { companyName: 'Trader Joe’s', email: 'buyer@traderjoes.com' },
      inventoryLotId: mockLot,
      submittedAt: '2026-09-17T09:00:00Z'
    }
  ];

  it('renders only the "Operation Hub" button and removes "Award Bid"', async () => {
    vi.spyOn(InventoryService, 'fetchAllBids').mockResolvedValue(mockBids as any);
    const handleOpenLotHub = vi.fn();

    store.dispatch(setInventoryList([mockLot]));
    store.dispatch(setAllBids(mockBids));

    render(
      <Provider store={store}>
        <BiddingDataView onOpenLotHub={handleOpenLotHub} />
      </Provider>
    );

    // Wait for the table to load and Operation Hub buttons to appear
    const opHubButtons = await screen.findAllByRole('button', { name: /Operation Hub/i });
    expect(opHubButtons.length).toBe(3);

    // "Award Bid" button must NOT exist anywhere in the view
    expect(screen.queryByRole('button', { name: /Award Bid/i })).toBeNull();
    expect(screen.queryByText('Award Bid')).toBeNull();

    // Clicking the first "Operation Hub" button calls onOpenLotHub with the lot
    fireEvent.click(opHubButtons[0]);
    expect(handleOpenLotHub).toHaveBeenCalledWith(mockLot);
  });
});
