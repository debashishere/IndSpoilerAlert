import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import SummaryMetrics from '../components/analytics/SummaryMetrics';

describe('SummaryMetrics — Recovery & Sustainability Panel Metric Cards (Ticket 01)', () => {
  const mockAnalyticsPayload = {
    summary: {
      cogsRecoveryRate: 72,
      totalRecoveredValue: 45000,
      totalSoldCOGS: 62500,
      totalCOGS: 80000,
      wasteDivertedTons: 22.4,
      landfillFeesSaved: 4480,
      co2SavedTons: 51.2,
      caseStats: {
        total: 4000,
        sold: 2800,
        donated: 700,
        recycled: 300,
        expired: 200,
        leftoverRate: 5,
      },
    },
    trends: [],
    categoryBreakdown: [],
  };

  let store: ReturnType<typeof createTestStore>;

  function createTestStore(analyticsData?: any, loading = false) {
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
          analyticsSummary: analyticsData || null,
          analyticsLoading: loading,
        } as any,
      },
    });
  }

  beforeEach(() => {
    store = createTestStore(mockAnalyticsPayload);
  });

  it('renders clean pulse loading skeleton when analytics telemetry is loading', () => {
    const loadingStore = createTestStore(null, true);
    render(
      <Provider store={loadingStore}>
        <SummaryMetrics />
      </Provider>
    );

    expect(screen.getByTestId('summary-metrics-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('recovery-metrics-grid')).not.toBeInTheDocument();
    expect(screen.getByText('COGS Recovery Rate')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(screen.queryByText('72%')).not.toBeInTheDocument();
  });

  it('renders all 4 recovery metric cards with correct live values and uppercase titles', () => {
    render(
      <Provider store={store}>
        <SummaryMetrics />
      </Provider>
    );

    expect(screen.getByText('COGS Recovery Rate')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();

    expect(screen.getByText('Landfill Waste Diverted')).toBeInTheDocument();
    expect(screen.getByText('22.4 Tons')).toBeInTheDocument();

    expect(screen.getByText('Fees & Tax Benefit Saved')).toBeInTheDocument();
    expect(screen.getByText('$4,480')).toBeInTheDocument();

    expect(screen.getByText('CO2 Emissions Saved')).toBeInTheDocument();
    expect(screen.getByText('51.2 Tons')).toBeInTheDocument();
  });

  it('positions the info trigger next to the title and displays detailed formula on click', () => {
    render(
      <Provider store={store}>
        <SummaryMetrics />
      </Provider>
    );

    const cogsInfoBtn = screen.getByRole('button', { name: /more information about cogs recovery rate/i });
    expect(cogsInfoBtn).toBeInTheDocument();

    // Click info button
    fireEvent.click(cogsInfoBtn);

    // Overlay appears with formula
    expect(screen.getByTestId('info-overlay')).toBeInTheDocument();
    expect(
      screen.getByText(/percentage of original cost of goods recovered via secondary closeouts/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/formula: \(total recovered value ÷ total sold cogs\) × 100/i)
    ).toBeInTheDocument();
  });

  it('enforces single-active exclusive disclosure across all 4 cards', () => {
    render(
      <Provider store={store}>
        <SummaryMetrics />
      </Provider>
    );

    const cogsInfoBtn = screen.getByRole('button', { name: /more information about cogs recovery rate/i });
    const wasteInfoBtn = screen.getByRole('button', { name: /more information about landfill waste diverted/i });

    // Open Card 1
    fireEvent.click(cogsInfoBtn);
    expect(screen.getByText(/COGS Recovery Rate Info/i)).toBeInTheDocument();
    expect(screen.queryByText(/Landfill Waste Diverted Info/i)).not.toBeInTheDocument();

    // Open Card 2 -> Card 1 automatically collapses
    fireEvent.click(wasteInfoBtn);
    expect(screen.getByText(/Landfill Waste Diverted Info/i)).toBeInTheDocument();
    expect(screen.queryByText(/COGS Recovery Rate Info/i)).not.toBeInTheDocument();
  });

  it('dismisses active popover on outside click and close button click', () => {
    render(
      <Provider store={store}>
        <div>
          <span data-testid="outside-area">Outside Container</span>
          <SummaryMetrics />
        </div>
      </Provider>
    );

    const cogsInfoBtn = screen.getByRole('button', { name: /more information about cogs recovery rate/i });
    fireEvent.click(cogsInfoBtn);
    expect(screen.getByTestId('info-overlay')).toBeInTheDocument();

    // Click Close button
    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();

    // Open again and click outside
    fireEvent.click(cogsInfoBtn);
    expect(screen.getByTestId('info-overlay')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByTestId('info-overlay')).not.toBeInTheDocument();
  });

  it('renders verified formula disclosures for Fees Saved and CO2 Saved metric cards', () => {
    render(
      <Provider store={store}>
        <SummaryMetrics />
      </Provider>
    );

    // Card 3: Fees & Tax Benefit Saved
    const feesInfoBtn = screen.getByRole('button', { name: /more information about fees & tax benefit saved/i });
    fireEvent.click(feesInfoBtn);
    expect(screen.getByText(/Fees & Tax Benefit Saved Info/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Net financial value preserved by avoiding municipal landfill tipping fees \(\$100\/ton\) plus Section 170\(e\)\(3\) tax deductions/i)
    ).toBeInTheDocument();

    // Card 4: CO2 Emissions Saved (auto-closes Card 3)
    const co2InfoBtn = screen.getByRole('button', { name: /more information about co2 emissions saved/i });
    fireEvent.click(co2InfoBtn);
    expect(screen.getByText(/CO2 Emissions Saved Info/i)).toBeInTheDocument();
    expect(screen.queryByText(/Fees & Tax Benefit Saved Info/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Total greenhouse gas emissions prevented by diverting perishable goods from anaerobic decomposition in landfills \(EPA WARM conversion factors\)/i)
    ).toBeInTheDocument();
  });

  it('falls back to totalCOGS baseline when totalSoldCOGS is absent in analytics payload', () => {
    const fallbackPayload = {
      summary: {
        cogsRecoveryRate: 40,
        totalRecoveredValue: 20000,
        totalSoldCOGS: 0,
        totalCOGS: 50000,
        wasteDivertedTons: 10,
        landfillFeesSaved: 1000,
        co2SavedTons: 15,
      },
      trends: [],
      categoryBreakdown: [],
    };

    const fallbackStore = createTestStore(fallbackPayload);

    render(
      <Provider store={fallbackStore}>
        <SummaryMetrics />
      </Provider>
    );

    expect(screen.getByText('Recovered: $20,000 of $50,000 sold COGS')).toBeInTheDocument();
  });

  it('configures right-alignment on right-hand cards (CO2 and Fees Saved) to prevent horizontal viewport overflow', () => {
    render(
      <Provider store={store}>
        <SummaryMetrics />
      </Provider>
    );

    const co2InfoBtn = screen.getByRole('button', { name: /more information about co2 emissions saved/i });
    fireEvent.click(co2InfoBtn);

    const overlay = screen.getByTestId('info-overlay');
    expect(overlay).toHaveClass('right-0');
  });
});

