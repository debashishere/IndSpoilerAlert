import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import App from '../App';

describe('App Integration & Lazy Views (Logistics & Analytics)', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.clear();
    window.history.pushState({}, '', '/');

    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('/analytics/summary')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            summary: {
              cogsRecoveryRate: 78,
              totalSoldCOGS: 100000,
              totalRecoveredValue: 78000,
              wasteDivertedTons: 40,
              landfillFeesSaved: 5000,
              co2SavedTons: 15,
              caseStats: { total: 1000, sold: 700, donated: 150, recycled: 100, expired: 50, leftoverRate: 5 }
            },
            trends: [
              { month: 'Jun', recoveryRate: 75, divertedTons: 35 },
              { month: 'Jul', recoveryRate: 78, divertedTons: 40 }
            ],
            categoryBreakdown: [
              { category: 'Dairy', volume: 500 },
              { category: 'Produce', volume: 500 }
            ]
          })
        } as Response;
      }
      if (urlStr.includes('/shipments')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([
            {
              _id: 'ship-lazy-1',
              bolNumber: 'BOL-LAZY-001',
              status: 'scheduled',
              pickupLocation: 'Chicago DC',
              deliveryLocation: 'New York Warehouse',
              temperature: 'Refrigerated 34°F',
              awardId: {
                awardedQty: 100,
                buyerId: { companyName: 'FreshMarket Corp' },
                listingId: { opportunityId: { lotId: { productId: { sku: 'SKU-LAZY', description: 'Lazy Berries' } } } }
              }
            }
          ])
        } as Response;
      }
      if (urlStr.includes('/health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', mongodb: 'connected' })
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ([])
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should defer Distressed Analytics and Freight Logistics nav links for base version release', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.queryByText('Distressed Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Freight Logistics')).not.toBeInTheDocument();
  });

  it('should lazy load and render AnalyticsView component when mounted', async () => {
    const AnalyticsView = React.lazy(() => import('../views/AnalyticsView').then(m => ({ default: m.AnalyticsView || m.default })));

    render(
      <Provider store={store}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <AnalyticsView />
        </React.Suspense>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Distressed Inventory Analytics')).toBeInTheDocument();
    });
    expect(screen.getByText('COGS Recovery Rate')).toBeInTheDocument();
    expect(screen.getAllByText('78%')[0]).toBeInTheDocument();
  });

  it('should lazy load and render LogisticsView component when mounted', async () => {
    const LogisticsView = React.lazy(() => import('../views/LogisticsView').then(m => ({ default: m.LogisticsView || m.default })));

    render(
      <Provider store={store}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LogisticsView />
        </React.Suspense>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Freight Logistics & Dock Coordination')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/BOL-LAZY-001/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Active Dispatches/i)).toBeInTheDocument();
  });
});
