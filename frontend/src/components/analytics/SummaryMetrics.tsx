import React, { useState } from 'react';
import { DollarSign, Recycle, Award, Leaf, Info, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCOGSRecoveryMetrics } from '../../store/slices/coreSlice';

export const SummaryMetrics: React.FC = () => {
  const metrics = useSelector(selectCOGSRecoveryMetrics);
  const [showTooltip1, setShowTooltip1] = useState(false);
  const [showTooltip2, setShowTooltip2] = useState(false);
  const [showTooltip3, setShowTooltip3] = useState(false);
  const [showTooltip4, setShowTooltip4] = useState(false);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      {/* COGS Recovery Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--primary))', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              COGS Recovery Rate
            </span>
            <button aria-label="More information about COGS Recovery Rate" onClick={() => setShowTooltip1(!showTooltip1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: 0 }}>
              <Info size={14} />
            </button>
          </div>
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
        {showTooltip1 && (
          <div data-testid="info-overlay" style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: '8px', padding: '12px', background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '220px', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ color: 'hsl(var(--text-primary))' }}>COGS Recovery Rate Info</strong>
              <button aria-label="Close modal" onClick={() => setShowTooltip1(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}><X size={12} /></button>
            </div>
            Percentage of original cost of goods sold recovered through secondary market sales.
          </div>
        )}
      </div>

      {/* Landfill Waste Diverted Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--success))', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Landfill Waste Diverted
            </span>
            <button aria-label="More information about Landfill Waste Diverted" onClick={() => setShowTooltip2(!showTooltip2)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: 0 }}>
              <Info size={14} />
            </button>
          </div>
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
        {showTooltip2 && (
          <div data-testid="info-overlay" style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: '8px', padding: '12px', background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '220px', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ color: 'hsl(var(--text-primary))' }}>Landfill Waste Diverted Info</strong>
              <button aria-label="Close modal" onClick={() => setShowTooltip2(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}><X size={12} /></button>
            </div>
            Total volume of product prevented from going to landfill, measured in tons.
          </div>
        )}
      </div>

      {/* Financial Savings Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--warning))', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fees & Tax Benefit Saved
            </span>
            <button aria-label="More information about Fees & Tax Benefit Saved" onClick={() => setShowTooltip3(!showTooltip3)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: 0 }}>
              <Info size={14} />
            </button>
          </div>
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
        {showTooltip3 && (
          <div data-testid="info-overlay" style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: '8px', padding: '12px', background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '220px', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ color: 'hsl(var(--text-primary))' }}>Fees & Tax Benefit Saved Info</strong>
              <button aria-label="Close modal" onClick={() => setShowTooltip3(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}><X size={12} /></button>
            </div>
            Estimated financial savings from avoided landfill tipping fees and potential tax deductions for donations.
          </div>
        )}
      </div>

      {/* CO2 Emissions Prevented Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid hsl(var(--secondary))', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CO2 Emissions Saved
            </span>
            <button aria-label="More information about CO2 Emissions Saved" onClick={() => setShowTooltip4(!showTooltip4)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: 0 }}>
              <Info size={14} />
            </button>
          </div>
          <Leaf size={16} style={{ color: 'hsl(var(--secondary))' }} />
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--text-primary))', background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--secondary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {metrics.co2SavedTons} Tons
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            Reduced greenhouse gas impact
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--border-color))', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
          <div style={{ width: `${Math.min(100, ((metrics.co2SavedTons || 0) / 100) * 100)}%`, height: '100%', backgroundColor: 'hsl(var(--secondary))', borderRadius: '3px' }} />
        </div>
        {showTooltip4 && (
          <div data-testid="info-overlay" style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: '8px', padding: '12px', background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '220px', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ color: 'hsl(var(--text-primary))' }}>CO2 Emissions Saved Info</strong>
              <button aria-label="Close modal" onClick={() => setShowTooltip4(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}><X size={12} /></button>
            </div>
            Estimated reduction in greenhouse gas emissions from diverting organic waste from landfills.
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryMetrics;
