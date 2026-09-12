import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';
import { dealService } from '../services/dealService';

describe('App Top-Level Route Integration: Standalone Deal Portal (/deal/:dealId)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({})
      } as Response;
    });
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the standalone Deal Settlement Portal and omits supplier sidebar when navigating to /deal/:dealId?token=valid', async () => {
    window.history.pushState({}, '', '/deal/deal-777?token=valid-deal-token-hmac');

    vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce({
      _id: 'deal-777',
      awardedQty: 200,
      price: 15.00,
      totalAmount: 3000.00,
      pickupLocation: 'Denver Central Depot, 7400 E 40th Ave',
      pickupHours: '08:00 AM - 04:30 PM CST',
      paymentStatus: 'pending',
      signatureStatus: 'pending',
      product: {
        name: 'Cold Pressed Orange Juice 1L',
        sku: 'SKU-ORANGE-01'
      }
    });

    render(
      <Provider store={store}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('deal-settlement-portal')).toBeInTheDocument();
    });

    expect(screen.getByText('Cold Pressed Orange Juice 1L')).toBeInTheDocument();
    expect(screen.getByText('SKU-ORANGE-01')).toBeInTheDocument();
    expect(screen.getAllByText(/\$3,000\.00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Denver Central Depot, 7400 E 40th Ave')).toBeInTheDocument();

    // Verify omission of internal supplier navigation and sidebar controls
    expect(screen.queryByTestId('supplier-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByText('Workflow Automation')).not.toBeInTheDocument();
    expect(screen.queryByText('Ingestion')).not.toBeInTheDocument();
  });

  it('renders standalone access-denied state when visiting unauthorized deal route', async () => {
    window.history.pushState({}, '', '/deal/deal-unauthorized');

    vi.spyOn(dealService, 'getDeal').mockRejectedValueOnce(
      new Error('Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.')
    );

    render(
      <Provider store={store}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('deal-access-denied')).toBeInTheDocument();
    });

    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    expect(screen.queryByTestId('supplier-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByText('Ingestion')).not.toBeInTheDocument();
  });

  it('renders the standalone Deal Settlement Portal when navigating via alternate route /portal/deal/:dealId', async () => {
    window.history.pushState({}, '', '/portal/deal/deal-888?token=valid-portal-token');

    vi.spyOn(dealService, 'getDeal').mockResolvedValueOnce({
      _id: 'deal-888',
      awardedQty: 100,
      price: 25.00,
      totalAmount: 2500.00,
      pickupLocation: 'Chicago Logistics Hub, 1000 S Halsted',
      pickupHours: '07:00 AM - 03:30 PM CST',
      paymentStatus: 'pending',
      signatureStatus: 'pending',
      product: {
        name: 'Organic Almond Milk 1L',
        sku: 'SKU-ALMOND-01'
      }
    });

    render(
      <Provider store={store}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('deal-settlement-portal')).toBeInTheDocument();
    });

    expect(screen.getByText('Organic Almond Milk 1L')).toBeInTheDocument();
    expect(screen.queryByTestId('supplier-sidebar')).not.toBeInTheDocument();
  });
});
