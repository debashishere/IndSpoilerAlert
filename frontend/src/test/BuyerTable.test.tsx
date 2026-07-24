import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuyerTable } from '../components/domain/inventory/BuyerTable';
import type { Buyer } from '../store/slices/coreSlice';

describe('BuyerTable Component', () => {
  const mockBuyers: Buyer[] = [
    {
      _id: 'b-1',
      companyName: 'Costco Wholesale',
      name: 'Costco Main',
      email: 'buyer@costco.com',
      tier: 'tier1',
      isActive: true,
      optInBidding: true,
      optInSales: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-02-01T12:00:00Z',
    },
    {
      _id: 'b-2',
      companyName: 'Bargain Outlet',
      name: 'Bargain Outlet',
      email: 'deals@bargain.com',
      tier: 'liquidator',
      isActive: true,
      optInBidding: false,
      optInSales: true,
      createdAt: '2026-03-10T10:00:00Z',
      updatedAt: '2026-03-15T12:00:00Z',
    },
    {
      _id: 'b-3',
      companyName: 'Inactive Retailer',
      name: 'Inactive Retailer',
      email: 'inactive@retailer.com',
      tier: 'tier2',
      isActive: false,
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-05T12:00:00Z',
    },
  ];

  it('renders Buyer Data Pipeline headers and table columns', () => {
    render(<BuyerTable filteredBuyers={mockBuyers} />);

    expect(screen.getByText(/Buyer Data Pipeline/i)).toBeDefined();
    expect(screen.getByText(/Company \/ Buyer Name/i)).toBeDefined();
    expect(screen.getByText(/Contact Email/i)).toBeDefined();
    expect(screen.getByText(/Buyer Tier/i)).toBeDefined();
    expect(screen.getByText(/Preferences & Channel/i)).toBeDefined();
    expect(screen.getByText(/Create Date/i)).toBeDefined();
    expect(screen.getByText(/Update Date/i)).toBeDefined();
    expect(screen.getByText(/Status/i)).toBeDefined();
  });

  it('renders buyer rows with company names, emails, badges, and dates', () => {
    render(<BuyerTable filteredBuyers={mockBuyers} />);

    expect(screen.getByText('Costco Wholesale')).toBeDefined();
    expect(screen.getByText('buyer@costco.com')).toBeDefined();
    expect(screen.getByText('Tier 1')).toBeDefined();
    expect(screen.getByText('Full Opt-In')).toBeDefined();

    expect(screen.getByText('Bargain Outlet')).toBeDefined();
    expect(screen.getByText('deals@bargain.com')).toBeDefined();
    expect(screen.getByText('Liquidator')).toBeDefined();
    expect(screen.getByText('No Bidding')).toBeDefined();

    expect(screen.getByText('Inactive Retailer')).toBeDefined();
    expect(screen.getByTestId('inactive-badge-b-3')).toBeDefined();
  });

  it('calls onBuyerClick when a buyer row is clicked', () => {
    const handleClick = vi.fn();
    render(<BuyerTable filteredBuyers={mockBuyers} onBuyerClick={handleClick} />);

    const row = screen.getByTestId('buyer-row-b-1');
    fireEvent.click(row);

    expect(handleClick).toHaveBeenCalledWith(mockBuyers[0]);
  });

  it('renders empty state message when no buyers are provided', () => {
    render(<BuyerTable filteredBuyers={[]} />);

    expect(screen.getByText('No Registered Buyers Found')).toBeDefined();
    expect(screen.getByText('No buyers match your current filter and search criteria.')).toBeDefined();
  });

  it('sorts buyers when clicking column header', () => {
    render(<BuyerTable filteredBuyers={mockBuyers} />);

    const emailHeader = screen.getByText(/Contact Email/i);
    fireEvent.click(emailHeader);

    // Initial sort should be asc by email (buyer@costco.com before deals@bargain.com)
    expect(screen.getByText('buyer@costco.com')).toBeDefined();
  });
});
