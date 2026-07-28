import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { MarketplaceLandingView } from '../views/marketplace/MarketplaceLandingView';

describe('0085 — MarketplaceLandingView Public Buyer Catalog Grid', () => {
  const mockListings = [
    {
      _id: 'listing-1',
      publicTitle: 'Organic Oat Milk 64oz',
      category: 'Dairy',
      remainingShelfLife: 0.75, // 75% RSL
      availableQuantity: 250,
      publicPrice: 14.50,
      startingPrice: 14.50,
      minimumPrice: 10.00,
      coaVerified: true,
      sanitized: true,
      status: 'published',
      warehouseRegion: 'Midwest',
      discountTier: 'moderate',
      allergens: ['Oats'],
      certifications: ['USDA Organic'],
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'
    },
    {
      _id: 'listing-2',
      publicTitle: 'Sparkling Mineral Water 24-Pack',
      category: 'Beverages',
      remainingShelfLife: 0.30, // 30% RSL - Urgent
      availableQuantity: 800,
      publicPrice: 9.00,
      startingPrice: 9.00,
      minimumPrice: 6.00,
      coaVerified: true,
      sanitized: true,
      status: 'published',
      warehouseRegion: 'East Coast',
      discountTier: 'steep',
      allergens: [],
      certifications: ['Kosher'],
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400'
    }
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/marketplace/listings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, listings: mockListings })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    }));
  });

  it('renders high-converting hero banner, search bar, facet filters, and listing grid with RSL badges', async () => {
    render(
      <Provider store={store}>
        <MarketplaceLandingView />
      </Provider>
    );

    // Hero banner assertion
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Direct-from-Supplier Surplus Inventory Marketplace/i);

    // Listing items rendered
    await waitFor(() => {
      expect(screen.getByText('Organic Oat Milk 64oz')).toBeInTheDocument();
      expect(screen.getByText('Sparkling Mineral Water 24-Pack')).toBeInTheDocument();
    });

    // RSL badges rendered
    expect(screen.getByText('75% RSL')).toBeInTheDocument();
    expect(screen.getByText('30% RSL')).toBeInTheDocument();
  });

  it('filters catalog items dynamically via search input', async () => {
    render(
      <Provider store={store}>
        <MarketplaceLandingView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Organic Oat Milk 64oz')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search catalog by keyword, brand, or SKU.../i);
    fireEvent.change(searchInput, { target: { value: 'Oat Milk' } });

    expect(screen.getByText('Organic Oat Milk 64oz')).toBeInTheDocument();
    expect(screen.queryByText('Sparkling Mineral Water 24-Pack')).not.toBeInTheDocument();
  });

  it('opens slide-over detail drawer when clicking on a listing card', async () => {
    const handleOpenBidModal = vi.fn();

    render(
      <Provider store={store}>
        <MarketplaceLandingView onOpenBidModal={handleOpenBidModal} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Organic Oat Milk 64oz')).toBeInTheDocument();
    });

    // Click on listing card to open drawer
    const card = screen.getByText('Organic Oat Milk 64oz');
    fireEvent.click(card);

    // Drawer opens showing full specs, allergens, and CTA
    await waitFor(() => {
      expect(screen.getByTestId('listing-detail-drawer')).toBeInTheDocument();
      expect(screen.getByText(/Product Specifications/i)).toBeInTheDocument();
      expect(screen.getByText('Oats')).toBeInTheDocument();
      expect(screen.getByText('USDA Organic')).toBeInTheDocument();
    });

    // Click "Place Bid" CTA button inside drawer
    const placeBidBtn = screen.getByTestId('drawer-place-bid-btn');
    fireEvent.click(placeBidBtn);
    expect(handleOpenBidModal).toHaveBeenCalledWith(mockListings[0]);
  });

  it('opens BuyerBidModal when clicking Place Bid button on catalog item card', async () => {
    render(
      <Provider store={store}>
        <MarketplaceLandingView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Organic Oat Milk 64oz')).toBeInTheDocument();
    });

    const placeBidBtns = screen.getAllByTestId('card-place-bid-btn');
    fireEvent.click(placeBidBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Submit Marketplace Bid/i)).toBeInTheDocument();
    });
  });
});
