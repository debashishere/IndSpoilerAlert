import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import RSLDistributionChart from '../components/analytics/RSLDistributionChart';

describe('RSLDistributionChart — Stock Disposition and CPG Category Breakdown (Ticket 03)', () => {
  function createTestStore({
    analyticsSummary = null,
    analyticsLoading = false,
  }: {
    analyticsSummary?: any;
    analyticsLoading?: boolean;
  } = {}) {
    return configureStore({
      reducer: {
        core: coreReducer,
        inventory: inventoryReducer,
      },
      preloadedState: {
        core: {
          activeTab: 'inventory',
          returnTab: null,
          sidebarExpanded: false,
          backendHealthy: true,
          sidecarHealthy: true,
          suppliers: [],
          buyers: [],
          buyerLists: [],
          loading: false,
          error: null,
          analyticsSummary,
          analyticsLoading,
        } as any,
      },
    });
  }

  it('renders clean initializing loading state when backend telemetry is loading', () => {
    const store = createTestStore({ analyticsLoading: true, analyticsSummary: null });

    render(
      <Provider store={store}>
        <RSLDistributionChart />
      </Provider>
    );

    expect(screen.getByTestId('rsl-distribution-loading')).toBeInTheDocument();
    expect(screen.getByText(/loading stock disposition telemetry/i)).toBeInTheDocument();
  });

  it('renders clean zero-state placeholders when disposition and categories are empty', () => {
    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: {
        summary: {
          caseStats: {
            total: 0,
            sold: 0,
            donated: 0,
            recycled: 0,
            expired: 0,
            leftoverRate: 0,
          },
        },
        categoryBreakdown: [],
      },
    });

    render(
      <Provider store={store}>
        <RSLDistributionChart />
      </Provider>
    );

    // Product Stock Disposition zero-state
    expect(screen.getByTestId('disposition-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no stock disposition data recorded yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId('disposition-stacked-bar')).not.toBeInTheDocument();

    // Volume Distribution by CPG Category zero-state
    expect(screen.getByText(/no category volume distribution recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText('0 Categories')).toBeInTheDocument();
  });

  it('calculates stacked bar segment widths accurately and suppresses 0-count segments', () => {
    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: {
        summary: {
          caseStats: {
            total: 5000,
            sold: 3500,
            donated: 900,
            recycled: 0, // suppressed segment
            expired: 600,
            leftoverRate: 12,
          },
        },
        categoryBreakdown: [
          { category: 'Dairy & Refrigerated', volume: 2200 },
        ],
      },
    });

    render(
      <Provider store={store}>
        <RSLDistributionChart />
      </Provider>
    );

    const bar = screen.getByTestId('disposition-stacked-bar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('role', 'group');
    expect(bar).toHaveAttribute('aria-label', 'Product stock disposition percentage breakdown');

    // Segments: 3500/5000 = 70%, 900/5000 = 18%, 600/5000 = 12%
    const soldSegment = screen.getByTestId('disposition-segment-sold');
    expect(soldSegment).toHaveStyle({ width: '70%' });
    expect(soldSegment).toHaveAttribute('title', 'Sold: 3,500 cases (70%)');

    const donSegment = screen.getByTestId('disposition-segment-donated');
    expect(donSegment).toHaveStyle({ width: '18%' });
    expect(donSegment).toHaveAttribute('title', 'Donated: 900 cases (18%)');

    // Recycled has 0 cases -> must be suppressed
    expect(screen.queryByTestId('disposition-segment-recycled')).not.toBeInTheDocument();

    const expSegment = screen.getByTestId('disposition-segment-expired');
    expect(expSegment).toHaveStyle({ width: '12%' });
    expect(expSegment).toHaveAttribute('title', 'Expired/Leftover: 600 cases (12%)');

    // Leftovers badge check
    expect(screen.getByText('Leftovers Rate: 12%')).toBeInTheDocument();
  });

  it('renders CPG category volume breakdown bars scaled relative to max category volume', () => {
    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: {
        summary: {
          caseStats: {
            total: 3800,
            sold: 2500,
            donated: 800,
            recycled: 300,
            expired: 200,
            leftoverRate: 5,
          },
        },
        categoryBreakdown: [
          { category: 'Dairy & Refrigerated', volume: 2000 },
          { category: 'Fresh Produce', volumeCases: 1000 }, // using volumeCases fallback
          { category: 'Dry Grocery', volume: 500 },
        ],
      },
    });

    render(
      <Provider store={store}>
        <RSLDistributionChart />
      </Provider>
    );

    // Verify category header count badge
    expect(screen.getByText('3 Categories')).toBeInTheDocument();

    // Verify category breakdown container is a vertical flex list
    const categoryList = screen.getByTestId('category-breakdown-list');
    expect(categoryList).toBeInTheDocument();
    expect(categoryList).toHaveClass('flex', 'flex-col');

    // Verify category labels and formatted cases
    expect(screen.getByText('Dairy & Refrigerated')).toBeInTheDocument();
    expect(screen.getByText('2,000 Cases')).toBeInTheDocument();
    expect(screen.getByText('Fresh Produce')).toBeInTheDocument();
    expect(screen.getByText('1,000 Cases')).toBeInTheDocument();
    expect(screen.getByText('Dry Grocery')).toBeInTheDocument();
    expect(screen.getByText('500 Cases')).toBeInTheDocument();

    // Verify relative bar scaling (max is 2000)
    // Category 0: 2000/2000 = 100%
    const bar0 = screen.getByTestId('category-bar-0');
    expect(bar0).toHaveStyle({ width: '100%' });

    // Category 1: 1000/2000 = 50%
    const bar1 = screen.getByTestId('category-bar-1');
    expect(bar1).toHaveStyle({ width: '50%' });

    // Category 2: 500/2000 = 25%
    const bar2 = screen.getByTestId('category-bar-2');
    expect(bar2).toHaveStyle({ width: '25%' });
  });

  it('formats fractional percentages under 1% as <1% instead of 0%', () => {
    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: {
        summary: {
          caseStats: {
            total: 1000,
            sold: 996,
            donated: 2, // 0.2%
            recycled: 2, // 0.2%
            expired: 0,
            leftoverRate: 0,
          },
        },
        categoryBreakdown: [],
      },
    });

    render(
      <Provider store={store}>
        <RSLDistributionChart />
      </Provider>
    );

    const donSegment = screen.getByTestId('disposition-segment-donated');
    expect(donSegment).toHaveAttribute('title', 'Donated: 2 cases (<1%)');

    const recSegment = screen.getByTestId('disposition-segment-recycled');
    expect(recSegment).toHaveAttribute('title', 'Recycled: 2 cases (<1%)');
  });
});
