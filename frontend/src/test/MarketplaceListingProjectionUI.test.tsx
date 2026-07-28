import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { LotOperationsHubView } from '../components/LotOperationsHubView';

describe('0084 — LotOperationsHubView Marketplace Publish Action Button', () => {
  it('should render "Publish to Marketplace" action button and trigger publish flow', () => {
    const mockLot = {
      _id: 'lot-123',
      lotNumber: 'LOT-999',
      status: 'active',
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      expirationDate: new Date().toISOString(),
      remainingShelfLife: 0.8,
      productId: { _id: 'p-1', sku: 'SKU-1', description: 'Product 1', category: 'Dairy' }
    };

    const handlePublishMarketplace = vi.fn();

    render(
      <Provider store={store}>
        <LotOperationsHubView
          lot={mockLot}
          onPublishMarketplace={handlePublishMarketplace}
        />
      </Provider>
    );

    const publishBtn = screen.getByRole('button', { name: /publish to marketplace/i });
    expect(publishBtn).toBeInTheDocument();

    fireEvent.click(publishBtn);
    expect(handlePublishMarketplace).toHaveBeenCalledWith(mockLot);
  });
});
