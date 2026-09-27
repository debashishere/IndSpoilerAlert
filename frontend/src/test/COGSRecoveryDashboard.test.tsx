import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import COGSRecoveryDashboard from '../components/analytics/COGSRecoveryDashboard';

describe('COGSRecoveryDashboard — Modernized Recovery Trendline (Ticket 02)', () => {
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
          activeTab: 'analytics',
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
        <COGSRecoveryDashboard />
      </Provider>
    );

    // Expect dedicated loading indicator/placeholder instead of empty-data fallback
    expect(screen.getByTestId('cogs-recovery-loading')).toBeInTheDocument();
    expect(screen.getByText(/loading recovery telemetry/i)).toBeInTheDocument();
    expect(screen.queryByText(/no historical recovery trend data available yet/i)).not.toBeInTheDocument();
  });

  it('renders clean zero-state placeholder and omits active legend when trends are empty', () => {
    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: { trends: [] },
    });

    render(
      <Provider store={store}>
        <COGSRecoveryDashboard />
      </Provider>
    );

    expect(screen.getByTestId('cogs-recovery-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no historical recovery trend data available yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId('cogs-recovery-svg')).not.toBeInTheDocument();
    expect(screen.queryByText('Recovery Rate (%)')).not.toBeInTheDocument();
    expect(screen.queryByText('Waste Diverted (Tons)')).not.toBeInTheDocument();
  });

  it('renders SVG series with theme-safe dark-mode responsive classes on lines, dots, and text', () => {
    const mockTrends = [
      { month: 'Jan', recoveryRate: 60, divertedTons: 10 },
      { month: 'Feb', recoveryRate: 65, divertedTons: 15 },
      { month: 'Mar', recoveryRate: 70, divertedTons: 20 },
      { month: 'Apr', recoveryRate: 75, divertedTons: 25 },
      { month: 'May', recoveryRate: 80, divertedTons: 30 },
      { month: 'Jun', recoveryRate: 85, divertedTons: 35 },
    ];

    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: { trends: mockTrends },
    });

    render(
      <Provider store={store}>
        <COGSRecoveryDashboard />
      </Provider>
    );

    const recoverySeries = screen.getByTestId('recovery-rate-series');
    const wasteSeries = screen.getByTestId('waste-diverted-series');

    // Blue recovery rate line path has dark-mode responsive classes
    const recoveryPath = recoverySeries.querySelector('path');
    expect(recoveryPath).toHaveClass('stroke-blue-600', 'dark:stroke-blue-400');

    // Emerald waste diverted line path has dark-mode responsive classes
    const wastePath = wasteSeries.querySelector('path');
    expect(wastePath).toHaveClass('stroke-emerald-600', 'dark:stroke-emerald-400');

    // Circles have theme-adaptive fill and stroke
    const recoveryCircle = recoverySeries.querySelector('circle');
    expect(recoveryCircle).toHaveClass('fill-blue-600', 'dark:fill-blue-400', 'stroke-white', 'dark:stroke-slate-900');

    const wasteCircle = wasteSeries.querySelector('circle');
    expect(wasteCircle).toHaveClass('fill-emerald-600', 'dark:fill-emerald-400', 'stroke-white', 'dark:stroke-slate-900');

    // Text labels have theme-adaptive fill
    const recoveryText = recoverySeries.querySelector('text');
    expect(recoveryText).toHaveClass('fill-blue-600', 'dark:fill-blue-400');

    const wasteText = wasteSeries.querySelector('text');
    expect(wasteText).toHaveClass('fill-emerald-600', 'dark:fill-emerald-400');
  });

  it('renders dual Y-axis ticks for percentage (left) and waste diverted tonnage (right)', () => {
    const mockTrends = [
      { month: 'Jan', recoveryRate: 50, divertedTons: 10 },
      { month: 'Feb', recoveryRate: 60, divertedTons: 20 },
      { month: 'Mar', recoveryRate: 70, divertedTons: 30 },
      { month: 'Apr', recoveryRate: 80, divertedTons: 40 },
    ];

    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: { trends: mockTrends },
    });

    render(
      <Provider store={store}>
        <COGSRecoveryDashboard />
      </Provider>
    );

    // Left Y-axis percentage ticks
    const pctAxisGroup = screen.getByTestId('percentage-axis-labels');
    expect(pctAxisGroup).toBeInTheDocument();
    expect(pctAxisGroup).toHaveTextContent('100%');
    expect(pctAxisGroup).toHaveTextContent('50%');
    expect(pctAxisGroup).toHaveTextContent('0%');

    // Right Y-axis tonnage ticks (safeMaxTons = 40, so 40t, 20t, 0t)
    const tonnageAxisGroup = screen.getByTestId('tonnage-axis-labels');
    expect(tonnageAxisGroup).toBeInTheDocument();
    expect(tonnageAxisGroup).toHaveTextContent('40t');
    expect(tonnageAxisGroup).toHaveTextContent('20t');
    expect(tonnageAxisGroup).toHaveTextContent('0t');
  });

  it('prevents text collisions at zero tonnage and applies responsive SVG scaling attributes', () => {
    const mockTrends = [
      { month: 'Jan', recoveryRate: 70, divertedTons: 0 },
      { month: 'Feb', recoveryRate: 75, divertedTons: 15 },
    ];

    const store = createTestStore({
      analyticsLoading: false,
      analyticsSummary: { trends: mockTrends },
    });

    render(
      <Provider store={store}>
        <COGSRecoveryDashboard />
      </Provider>
    );

    const svg = screen.getByTestId('cogs-recovery-svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', 'COGS Recovery Rate & Waste Diverted Trends Chart');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');

    // For Jan (divertedTons: 0), verify the label Y coordinate is placed above the bottom line to avoid month label collision at y=215
    const wasteSeries = screen.getByTestId('waste-diverted-series');
    const zeroTonsLabel = wasteSeries.querySelectorAll('text')[0];
    expect(zeroTonsLabel).toHaveTextContent('0t');
    const yCoord = parseFloat(zeroTonsLabel.getAttribute('y') || '0');
    // Month label is at 215, so zero tonnage label must be positioned at or below 195 (above the axis) to avoid collision
    expect(yCoord).toBeLessThan(200);
  });
});




