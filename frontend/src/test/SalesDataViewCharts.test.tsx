import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';

describe('SalesDataView Charts Dashboard', () => {
  it('renders sales analytics banner, KPI metrics, interactive filters and charts', () => {
    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Header & Banner
    expect(screen.getByText('Sales Data Analytics & Revenue Intelligence')).toBeInTheDocument();
    expect(screen.getByText(/Ingestion Sync Active/i)).toBeInTheDocument();

    // KPIs
    expect(screen.getByText('Total Realized Revenue')).toBeInTheDocument();
    expect(screen.getByText('Volume Sold')).toBeInTheDocument();
    expect(screen.getByText('Average Realized Price')).toBeInTheDocument();
    expect(screen.getByText('Reconciled Transactions')).toBeInTheDocument();

    // Interactive Charts
    expect(screen.getByText('Realized Closeout Revenue & Volume Trajectory')).toBeInTheDocument();
    expect(screen.getByText('COGS Recovery % by Product Category')).toBeInTheDocument();
    expect(screen.getByText('Sales Channel Revenue Share')).toBeInTheDocument();
    expect(screen.getByText('Price Realization vs. Days to Expiry (RSL Decay)')).toBeInTheDocument();

    // Leaderboard
    expect(screen.getByText('Sales Channel & Fulfillment Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Bargain Hunt Liquidation')).toBeInTheDocument();

    // Leaderboard Tab Switch
    const whTab = screen.getByRole('button', { name: /Top Warehouses \/ DCs/i });
    fireEvent.click(whTab);
    expect(screen.getAllByText(/Unilever Midwest DC/i).length).toBeGreaterThanOrEqual(1);
  });
});
