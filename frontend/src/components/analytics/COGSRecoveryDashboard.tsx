import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectLandfillDiversionStats } from '../../store/slices/coreSlice';

export const COGSRecoveryDashboard: React.FC = () => {
  const { trends, maxTons } = useSelector(selectLandfillDiversionStats);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'stretch' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={18} style={{ color: 'hsl(var(--primary))' }} />
        <span>COGS Recovery Rate & Waste Diverted Trends</span>
      </h3>

      {/* SVG Line Chart for trends */}
      <div style={{ position: 'relative', width: '100%', height: '220px', marginTop: '10px' }}>
        <svg width="100%" height="220" viewBox="0 0 500 220" style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1="40" y1="20" x2="480" y2="20" stroke="hsl(var(--border-color))" strokeOpacity="0.2" />
          <line x1="40" y1="65" x2="480" y2="65" stroke="hsl(var(--border-color))" strokeOpacity="0.2" />
          <line x1="40" y1="110" x2="480" y2="110" stroke="hsl(var(--border-color))" strokeOpacity="0.2" />
          <line x1="40" y1="155" x2="480" y2="155" stroke="hsl(var(--border-color))" strokeOpacity="0.2" />
          <line x1="40" y1="200" x2="480" y2="200" stroke="hsl(var(--border-color))" />

          {/* Months labels */}
          {trends.map((t: any, idx: number) => {
            const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
            return (
              <text key={idx} x={x} y="215" fill="hsl(var(--text-muted))" fontSize="9" textAnchor="middle">
                {t.month}
              </text>
            );
          })}

          {/* Y-Axis values */}
          <text x="32" y="24" fill="hsl(var(--text-muted))" fontSize="9" textAnchor="end">100%</text>
          <text x="32" y="114" fill="hsl(var(--text-muted))" fontSize="9" textAnchor="end">50%</text>
          <text x="32" y="204" fill="hsl(var(--text-muted))" fontSize="9" textAnchor="end">0%</text>

          {/* Recovery Rate Line & Dots */}
          {(() => {
            if (trends.length === 0) return null;
            let linePath = "";
            trends.forEach((t: any, idx: number) => {
              const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
              const y = 200 - ((t.recoveryRate || 0) / 100) * 180;
              if (idx === 0) linePath = `M ${x} ${y}`;
              else linePath += ` L ${x} ${y}`;
            });

            return (
              <>
                <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
                {trends.map((t: any, idx: number) => {
                  const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
                  const y = 200 - ((t.recoveryRate || 0) / 100) * 180;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5" />
                      <text x={x} y={y - 8} fill="hsl(var(--primary))" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {t.recoveryRate}%
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}

          {/* Waste Diverted Line & Dots */}
          {(() => {
            if (trends.length === 0) return null;
            let linePath = "";
            trends.forEach((t: any, idx: number) => {
              const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
              const y = 200 - ((t.divertedTons || 0) / maxTons) * 180;
              if (idx === 0) linePath = `M ${x} ${y}`;
              else linePath += ` L ${x} ${y}`;
            });

            return (
              <>
                <path d={linePath} fill="none" stroke="hsl(var(--success))" strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round" />
                {trends.map((t: any, idx: number) => {
                  const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
                  const y = 200 - ((t.divertedTons || 0) / maxTons) * 180;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="4" fill="hsl(var(--success))" stroke="white" strokeWidth="1" />
                      <text x={x} y={y + 12} fill="hsl(var(--success))" fontSize="8" textAnchor="middle">
                        {t.divertedTons}t
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '15px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '3px', backgroundColor: 'hsl(var(--primary))', borderRadius: '2px' }} />
          <span style={{ color: 'hsl(var(--text-secondary))' }}>Recovery Rate (%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '0px', borderTop: '2px dotted hsl(var(--success))' }} />
          <span style={{ color: 'hsl(var(--text-secondary))' }}>Waste Diverted (Tons)</span>
        </div>
      </div>
    </div>
  );
};

export default COGSRecoveryDashboard;
