import React from 'react';
import { DollarSign, Recycle, Award, Leaf } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCOGSRecoveryMetrics } from '../../store/slices/coreSlice';

export const SummaryMetrics: React.FC = () => {
  const metrics = useSelector(selectCOGSRecoveryMetrics);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      {/* COGS Recovery Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--primary))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            COGS Recovery Rate
          </span>
          <DollarSign size={16} style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
            {metrics.cogsRecoveryRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            Recovered: <strong>${(metrics.totalRecoveredValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> of ${(metrics.totalSoldCOGS || metrics.totalCOGS || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} sold COGS
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--border-color))', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
          <div style={{ width: `${metrics.cogsRecoveryRate}%`, height: '100%', backgroundColor: 'hsl(var(--primary))', borderRadius: '3px' }} />
        </div>
      </div>

      {/* Landfill Waste Diverted Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--success))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Landfill Waste Diverted
          </span>
          <Recycle size={16} style={{ color: 'hsl(var(--success))' }} />
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--success))' }}>
            {metrics.wasteDivertedTons} Tons
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            Diverted surplus stock from landfills to charity/recyclers
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--border-color))', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
          <div style={{ width: `${Math.min(100, ((metrics.wasteDivertedTons || 0) / 50) * 100)}%`, height: '100%', backgroundColor: 'hsl(var(--success))', borderRadius: '3px' }} />
        </div>
      </div>

      {/* Financial Savings Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--warning))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fees & Tax Benefit Saved
          </span>
          <Award size={16} style={{ color: 'hsl(var(--warning))' }} />
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--warning))' }}>
            ${(metrics.landfillFeesSaved || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            Avoided tipping fees + tax incentives
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--border-color))', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
          <div style={{ width: `${Math.min(100, ((metrics.landfillFeesSaved || 0) / 10000) * 100)}%`, height: '100%', backgroundColor: 'hsl(var(--warning))', borderRadius: '3px' }} />
        </div>
      </div>

      {/* CO2 Emissions Prevented Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--secondary))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CO2 Emissions Saved
          </span>
          <Leaf size={16} style={{ color: 'hsl(var(--secondary))' }} />
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--text-primary))', background: 'linear-gradient(135deg, hsl(var(--secondary)), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {metrics.co2SavedTons} Tons
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            Reduced greenhouse gas impact
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--border-color))', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
          <div style={{ width: `${Math.min(100, ((metrics.co2SavedTons || 0) / 100) * 100)}%`, height: '100%', backgroundColor: 'hsl(var(--secondary))', borderRadius: '3px' }} />
        </div>
      </div>
    </div>
  );
};

export default SummaryMetrics;
