import React from 'react';
import { Database } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectRSLDistribution } from '../../store/slices/coreSlice';

export const RSLDistributionChart: React.FC = () => {
  const { caseStats, categoryBreakdown } = useSelector(selectRSLDistribution);
  const total = caseStats.total || 1;
  const soldPct = ((caseStats.sold || 0) / total) * 100;
  const donPct = ((caseStats.donated || 0) / total) * 100;
  const recPct = ((caseStats.recycled || 0) / total) * 100;
  const expPct = ((caseStats.expired || 0) / total) * 100;

  return (
    <>
      {/* Perishables Case Distribution & Breakdown */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} style={{ color: 'hsl(var(--primary))' }} />
          <span>Product Stock Disposition</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Cases Managed: <strong>{(caseStats.total || 0).toLocaleString()}</strong></span>
            <span style={{ color: 'hsl(var(--error))', fontWeight: 600 }}>Leftovers Rate: {caseStats.leftoverRate || 0}%</span>
          </div>

          {/* Stacked bar diagram */}
          <div style={{ width: '100%', height: '24px', borderRadius: '6px', overflow: 'hidden', display: 'flex', backgroundColor: 'hsl(var(--border-color) / 20%)', border: '1px solid hsl(var(--border-color))' }}>
            {caseStats.sold > 0 && <div style={{ width: `${soldPct}%`, height: '100%', backgroundColor: 'hsl(var(--success))' }} title={`Sold: ${caseStats.sold} cases (${soldPct.toFixed(0)}%)`} />}
            {caseStats.donated > 0 && <div style={{ width: `${donPct}%`, height: '100%', backgroundColor: 'hsl(var(--primary))' }} title={`Donated: ${caseStats.donated} cases (${donPct.toFixed(0)}%)`} />}
            {caseStats.recycled > 0 && <div style={{ width: `${recPct}%`, height: '100%', backgroundColor: 'hsl(var(--warning))' }} title={`Recycled: ${caseStats.recycled} cases (${recPct.toFixed(0)}%)`} />}
            {caseStats.expired > 0 && <div style={{ width: `${expPct}%`, height: '100%', backgroundColor: 'hsl(var(--error))' }} title={`Expired/Leftover: ${caseStats.expired} cases (${expPct.toFixed(0)}%)`} />}
          </div>

          {/* Legend details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', paddingBottom: '6px', borderBottom: '1px solid hsl(var(--border-color) / 40%)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--success))' }} />
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Sold (Awarded)</span>
              </span>
              <strong>{(caseStats.sold || 0).toLocaleString()} Cases</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', paddingBottom: '6px', borderBottom: '1px solid hsl(var(--border-color) / 40%)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))' }} />
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Donated to Food Banks</span>
              </span>
              <strong>{(caseStats.donated || 0).toLocaleString()} Cases</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', paddingBottom: '6px', borderBottom: '1px solid hsl(var(--border-color) / 40%)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--warning))' }} />
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Recycled (Bio-fuels/Feed)</span>
              </span>
              <strong>{(caseStats.recycled || 0).toLocaleString()} Cases</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--error))' }} />
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Expired (Spoilage)</span>
              </span>
              <strong>{(caseStats.expired || 0).toLocaleString()} Cases</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution Bar List */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Volume Distribution by CPG Category</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {categoryBreakdown.map((cat: any, idx: number) => {
            const vol = cat.volume ?? cat.volumeCases ?? 0;
            const maxVol = Math.max(...categoryBreakdown.map((c: any) => c.volume ?? c.volumeCases ?? 0), 100);
            const pct = (vol / maxVol) * 100;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>{cat.category}</span>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>{vol.toLocaleString()} Cases</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'hsl(var(--border-color) / 30%)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))', borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default RSLDistributionChart;
