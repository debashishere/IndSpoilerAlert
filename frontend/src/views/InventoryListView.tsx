import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, Award, Leaf, ShieldAlert } from 'lucide-react';
import type { RootState } from '../store';
import { RiskAssessmentModal } from '../components/domain/inventory/RiskAssessmentModal';
import { ComplianceModal } from '../components/domain/inventory/ComplianceModal';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';
import { BiddingDataView } from '../components/domain/inventory/BiddingDataView';
import { InventoryChartsDashboard } from '../components/domain/inventory/InventoryChartsDashboard';

export const InventoryListView: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const { inventoryList, analyticsData } = useSelector((state: RootState) => state.inventory);
  const [inventorySubTab, setInventorySubTab] = useState<'bidding' | 'charts' | 'sales'>('bidding');

  const calculateDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const criticalExpirations = inventoryList.filter((lot: any) => {
    if (lot.status === 'sold' || lot.status === 'donated' || lot.status === 'recycled') return false;
    const days = calculateDaysRemaining(lot.expirationDate);
    return days < 10;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>
            Surplus Inventory & Closeout Insight Hub
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
            Review real-time buyer bidding data, distressed surplus metrics, COGS expiration risk trajectories, and sales performance charts. Raw data lists are centralized under Ingestion Pipeline.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Total Inventory Value</span>
            <DollarSign size={16} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div className="kpi-card-value">
            $
            {(
              analyticsData?.summary?.totalCOGS ||
              inventoryList.reduce((sum: number, lot: any) => sum + lot.quantityCases * (lot.costPerCase ?? 0), 0)
            ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="kpi-card-footer">
            <span>Distressed COGS ingested</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Revenue Secured</span>
            <Award size={16} style={{ color: 'hsl(var(--success))' }} />
          </div>
          <div className="kpi-card-value" style={{ color: 'hsl(var(--success))' }}>
            ${(analyticsData?.summary?.totalRecoveredValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="kpi-card-footer">
            <span>From closed closeout sales</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Landfill Diversion Rate</span>
            <Leaf size={16} style={{ color: 'hsl(var(--secondary))' }} />
          </div>
          <div className="kpi-card-value" style={{ color: 'hsl(var(--secondary))' }}>
            {analyticsData?.summary?.caseStats?.total > 0
              ? Math.round(
                  (((analyticsData?.summary?.caseStats?.sold || 0) +
                    (analyticsData?.summary?.caseStats?.donated || 0) +
                    (analyticsData?.summary?.caseStats?.recycled || 0)) /
                    analyticsData.summary.caseStats.total) *
                    100
                )
              : 0}
            %
          </div>
          <div className="kpi-card-footer">
            <span>Sold, Donated, or Recycled</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: criticalExpirations > 0 ? 'hsl(var(--error) / 40%)' : '' }}>
          <div className="kpi-card-header">
            <span>Critical Expirations</span>
            <ShieldAlert size={16} style={{ color: criticalExpirations > 0 ? 'hsl(var(--error))' : 'hsl(var(--text-muted))' }} />
          </div>
          <div className="kpi-card-value" style={{ color: criticalExpirations > 0 ? 'hsl(var(--error))' : '' }}>
            {criticalExpirations}
          </div>
          <div className="kpi-card-footer">
            <span>Lots expiring in &lt; 10 days</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', marginTop: '20px', borderBottom: '2px solid hsl(var(--border))' }}>
        <button
          onClick={() => setInventorySubTab('bidding')}
          style={{
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: inventorySubTab === 'bidding' ? 700 : 500,
            color: inventorySubTab === 'bidding' ? 'hsl(45, 93%, 47%)' : 'hsl(var(--text-muted))',
            background: 'none',
            border: 'none',
            borderBottom: inventorySubTab === 'bidding' ? '3px solid hsl(45, 93%, 47%)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          🏷️ Current Bidding Data
        </button>
        <button
          onClick={() => setInventorySubTab('charts')}
          style={{
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: inventorySubTab === 'charts' ? 700 : 500,
            color: inventorySubTab === 'charts' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            background: 'none',
            border: 'none',
            borderBottom: inventorySubTab === 'charts' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          📊 Inventory Insights & Analytics
        </button>
        <button
          onClick={() => setInventorySubTab('sales')}
          style={{
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: inventorySubTab === 'sales' ? 700 : 500,
            color: inventorySubTab === 'sales' ? 'hsl(var(--success))' : 'hsl(var(--text-muted))',
            background: 'none',
            border: 'none',
            borderBottom: inventorySubTab === 'sales' ? '3px solid hsl(var(--success))' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          💰 Sales Insights & Revenue Charts
        </button>
      </div>

      {inventorySubTab === 'bidding' && <BiddingDataView onOpenLotHub={onOpenLotHub} />}

      {inventorySubTab === 'charts' && <InventoryChartsDashboard />}

      {inventorySubTab === 'sales' && <SalesDataView />}

      {/* Domain Modals */}
      <RiskAssessmentModal />
      <ComplianceModal />
    </div>
  );
};
