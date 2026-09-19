import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import {
  calculateDaysRemaining,
  calculateRslRatio,
  getPricingForDay,
  generatePricingPoints,
  getBidStatusInfo,
  LotOperationsHubView,
} from '../components/domain/lot-operations-hub';

describe('LotOperationsHub Modular Architecture & Headless Math', () => {
  describe('pricing and decay calculations', () => {
    it('calculates days remaining correctly for future and past dates', () => {
      const now = Date.now();
      const futureDate = new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString();
      const pastDate = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

      expect(calculateDaysRemaining(futureDate)).toBe(10);
      expect(calculateDaysRemaining(pastDate)).toBe(0);
      expect(calculateDaysRemaining('')).toBe(0);
    });

    it('calculates RSL ratio bounded between 0 and 100', () => {
      expect(calculateRslRatio(15, 30)).toBe(50);
      expect(calculateRslRatio(30, 30)).toBe(100);
      expect(calculateRslRatio(45, 30)).toBe(100);
      expect(calculateRslRatio(-5, 30)).toBe(0);
    });

    it('generates non-negative price and revenue points across categories', () => {
      const result = getPricingForDay(10, 100, 25.0, 'Dairy');
      expect(result.price).toBeGreaterThan(0);
      expect(result.price).toBeLessThanOrEqual(25.0);
      expect(result.revenue).toBeGreaterThan(0);
      expect(result.discount).toBeGreaterThanOrEqual(0.05);

      const curve = generatePricingPoints(100, 25.0, 'Dairy', 45);
      expect(curve.points.length).toBe(10); // 0, 5, 10, ..., 45
      expect(curve.maxRev).toBeGreaterThan(0);
    });

    it('maps raw bid statuses into normalized badge descriptions', () => {
      expect(getBidStatusInfo('countered').label).toBe('Countered');
      expect(getBidStatusInfo('fully_accepted').label).toBe('Awarded');
      expect(getBidStatusInfo('rejected').label).toBe('Declined');
      expect(getBidStatusInfo('pending').label).toBe('Pending');

      const buyerCounterBid = {
        status: 'pending',
        messages: [{ sender: 'buyer', proposedPrice: 22.0 }],
      };
      expect(getBidStatusInfo('pending', buyerCounterBid).label).toBe('Buyer Countered');
    });
  });

  describe('modular component stage rendering', () => {
    const mockLot = {
      _id: 'lot-mod-1',
      lotNumber: 'LOT-MOD-777',
      status: 'active',
      quantityCases: 200,
      availableQty: 180,
      costPerCase: 15.5,
      expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      productId: {
        _id: 'prod-mod-1',
        sku: 'SKU-MOD-777',
        description: 'Almond Milk Barista Edition',
        allergens: ['tree nuts'],
      },
    };

    it('renders details stage and allows removing an allergen tag', () => {
      const handleUpdateProductAllergens = vi.fn().mockResolvedValue(undefined);

      render(
        <Provider store={store}>
          <LotOperationsHubView
            lot={mockLot}
            subTab="details"
            handleUpdateProductAllergens={handleUpdateProductAllergens}
          />
        </Provider>
      );

      expect(screen.getByText('Almond Milk Barista Edition')).toBeDefined();
      expect(screen.getByText('Lot #LOT-MOD-777')).toBeDefined();
      expect(screen.getByText('tree nuts ✕')).toBeDefined();

      fireEvent.click(screen.getByText('tree nuts ✕'));
      expect(handleUpdateProductAllergens).toHaveBeenCalledWith('prod-mod-1', []);
    });

    it('filters bids by status and query within bids stage', () => {
      const testBids = [
        {
          _id: 'bid-1',
          buyerId: { companyName: 'Apex Grocery', email: 'apex@grocery.com' },
          price: 12.0,
          quantity: 50,
          status: 'pending',
        },
        {
          _id: 'bid-2',
          buyerId: { companyName: 'Beacon Foods', email: 'beacon@foods.com' },
          price: 14.0,
          quantity: 100,
          status: 'countered',
        },
      ];

      render(
        <Provider store={store}>
          <LotOperationsHubView
            lot={mockLot}
            subTab="bids"
            bidsList={testBids}
          />
        </Provider>
      );

      expect(screen.getByText('Apex Grocery')).toBeDefined();
      expect(screen.getByText('Beacon Foods')).toBeDefined();

      // Click Countered filter tab
      const counteredTab = screen.getByRole('tab', { name: 'Countered' });
      fireEvent.click(counteredTab);

      // Now only Beacon Foods should be shown
      expect(screen.queryByText('Apex Grocery')).toBeNull();
      expect(screen.getByText('Beacon Foods')).toBeDefined();

      // Test Search query filter
      const searchInput = screen.getByLabelText('Search bids');
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
      expect(screen.queryByText('Beacon Foods')).toBeNull();
      expect(screen.getByText('No bids match the selected filter or search.')).toBeDefined();
    });

    it('renders activities stage and allows composer input', () => {
      const mockActivities = [
        {
          type: 'Email',
          content: 'Dispatched surplus notification to buyer group',
          author: 'Automated Studio',
          timestamp: new Date().toISOString(),
        },
      ];

      const handleCreateLotActivity = vi.fn();

      render(
        <Provider store={store}>
          <LotOperationsHubView
            lot={mockLot}
            subTab="activities"
            lotActivities={mockActivities}
            handleCreateLotActivity={handleCreateLotActivity}
          />
        </Provider>
      );

      expect(screen.getByText('Dispatched surplus notification to buyer group')).toBeDefined();

      const input = screen.getByPlaceholderText(/Log new interaction/i);
      fireEvent.change(input, { target: { value: 'Spoke with buyer representative' } });

      const logBtn = screen.getByText('+ Log Activity');
      fireEvent.click(logBtn);
      expect(handleCreateLotActivity).toHaveBeenCalled();
    });
  });
});
