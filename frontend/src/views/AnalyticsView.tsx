import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAnalyticsSummary,
  selectAnalyticsLoading,
  fetchAnalyticsSummaryThunk,
} from '../store/slices/coreSlice';
import SummaryMetrics from '../components/analytics/SummaryMetrics';
import COGSRecoveryDashboard from '../components/analytics/COGSRecoveryDashboard';
import RSLDistributionChart from '../components/analytics/RSLDistributionChart';

export const AnalyticsView: React.FC = () => {
  const dispatch = useDispatch();
  const analyticsSummary = useSelector(selectAnalyticsSummary);
  const analyticsLoading = useSelector(selectAnalyticsLoading);

  useEffect(() => {
    if (!analyticsSummary && !analyticsLoading) {
      dispatch(fetchAnalyticsSummaryThunk() as any);
    }
  }, [dispatch, analyticsSummary, analyticsLoading]);

  return (
    <>
      <header className="header">
        <div>
          <h1 className="header-title">Distressed Inventory Analytics</h1>
          <p className="header-subtitle">
            Real-time tracking of COGS recovery rates, landfill waste diversion, and environmental impact across all CPG categories.
          </p>
        </div>
      </header>

      {analyticsLoading && !analyticsSummary ? (
        <div className="loader-container" style={{ minHeight: '300px' }}>
          <div className="loader" />
          <p>Aggregating sustainability and recovery KPIs...</p>
        </div>
      ) : analyticsSummary ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
          {/* 1. Metric Cards Grid */}
          <SummaryMetrics />

          {/* 2. Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'stretch' }}>
            <COGSRecoveryDashboard />
            <RSLDistributionChart />
          </div>
        </div>
      ) : (
        <div className="card empty-state" style={{ padding: '60px' }}>
          <p>No analytics summary data available.</p>
        </div>
      )}
    </>
  );
};

export default AnalyticsView;
