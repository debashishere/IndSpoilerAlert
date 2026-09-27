import React from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectLandfillDiversionStats, selectAnalyticsLoading } from '../../store/slices/coreSlice';

export const COGSRecoveryDashboard: React.FC = () => {
  const { trends, maxTons } = useSelector(selectLandfillDiversionStats);
  const analyticsLoading = useSelector(selectAnalyticsLoading);

  const hasTrends = trends && trends.length > 0;
  const safeMaxTons = Math.max(maxTons || 30, 1);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between"
      id="cogs-recovery-dashboard"
      data-testid="cogs-recovery-dashboard"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider m-0">
              COGS Recovery Rate &amp; Waste Diverted Trends
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            6-Month Trajectory
          </span>
        </div>

        {/* Loading and Empty State handling */}
        {analyticsLoading ? (
          <div
            className="flex flex-col items-center justify-center h-[220px] text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg animate-pulse"
            data-testid="cogs-recovery-loading"
          >
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Loading recovery telemetry...
            </p>
          </div>
        ) : !hasTrends ? (
          <div
            className="flex flex-col items-center justify-center h-[220px] text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg"
            data-testid="cogs-recovery-empty-state"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No historical recovery trend data available yet.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Trends calculate dynamically as closeout sales and donations occur.
            </p>
          </div>
        ) : (
          <div className="relative w-full h-[220px] mt-2">
            <svg
              width="100%"
              height="220"
              viewBox="0 0 500 220"
              preserveAspectRatio="none"
              role="img"
              aria-label="COGS Recovery Rate &amp; Waste Diverted Trends Chart"
              className="overflow-visible"
              data-testid="cogs-recovery-svg"
            >
              {/* Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" strokeWidth="1" />
              <line x1="40" y1="65" x2="480" y2="65" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" strokeWidth="1" />
              <line x1="40" y1="110" x2="480" y2="110" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" strokeWidth="1" />
              <line x1="40" y1="155" x2="480" y2="155" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" strokeWidth="1" />
              <line x1="40" y1="200" x2="480" y2="200" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1.5" />

              {/* Month labels */}
              {trends.map((t: any, idx: number) => {
                const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
                return (
                  <text
                    key={idx}
                    x={x}
                    y="215"
                    fill="currentColor"
                    className="text-[9px] font-mono text-slate-400 dark:text-slate-500"
                    textAnchor="middle"
                  >
                    {t.month}
                  </text>
                );
              })}

              {/* Y-Axis values (Left: Recovery %, Right: Waste Diverted Tons) */}
              <g data-testid="percentage-axis-labels">
                <text x="32" y="24" fill="currentColor" className="text-[9px] font-mono text-slate-400 dark:text-slate-500" textAnchor="end">100%</text>
                <text x="32" y="114" fill="currentColor" className="text-[9px] font-mono text-slate-400 dark:text-slate-500" textAnchor="end">50%</text>
                <text x="32" y="204" fill="currentColor" className="text-[9px] font-mono text-slate-400 dark:text-slate-500" textAnchor="end">0%</text>
              </g>
              <g data-testid="tonnage-axis-labels">
                <text x="488" y="24" fill="currentColor" className="text-[9px] font-mono text-slate-400 dark:text-slate-500" textAnchor="start">{safeMaxTons}t</text>
                <text x="488" y="114" fill="currentColor" className="text-[9px] font-mono text-slate-400 dark:text-slate-500" textAnchor="start">{Math.round(safeMaxTons / 2)}t</text>
                <text x="488" y="204" fill="currentColor" className="text-[9px] font-mono text-slate-400 dark:text-slate-500" textAnchor="start">0t</text>
              </g>

              {/* Recovery Rate Line & Dots (Blue) */}
              {(() => {
                let linePath = '';
                trends.forEach((t: any, idx: number) => {
                  const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
                  const y = 200 - (Math.min(100, Math.max(0, t.recoveryRate || 0)) / 100) * 180;
                  if (idx === 0) linePath = `M ${x} ${y}`;
                  else linePath += ` L ${x} ${y}`;
                });

                return (
                  <g data-testid="recovery-rate-series">
                    <path
                      d={linePath}
                      fill="none"
                      className="stroke-blue-600 dark:stroke-blue-400"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {trends.map((t: any, idx: number) => {
                      const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
                      const y = 200 - (Math.min(100, Math.max(0, t.recoveryRate || 0)) / 100) * 180;
                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r="4.5"
                            className="fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-slate-900"
                            strokeWidth="1.5"
                          />
                          <text
                            x={x}
                            y={y - 8}
                            className="text-[9px] font-mono font-bold fill-blue-600 dark:fill-blue-400"
                            textAnchor="middle"
                          >
                            {t.recoveryRate}%
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}

              {/* Waste Diverted Line & Dots (Emerald) */}
              {(() => {
                let linePath = '';
                trends.forEach((t: any, idx: number) => {
                  const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
                  const y = 200 - (Math.min(safeMaxTons, Math.max(0, t.divertedTons || 0)) / safeMaxTons) * 180;
                  if (idx === 0) linePath = `M ${x} ${y}`;
                  else linePath += ` L ${x} ${y}`;
                });

                return (
                  <g data-testid="waste-diverted-series">
                    <path
                      d={linePath}
                      fill="none"
                      className="stroke-emerald-600 dark:stroke-emerald-400"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {trends.map((t: any, idx: number) => {
                      const x = 40 + (idx / Math.max(1, trends.length - 1 || 1)) * 440;
                      const y = 200 - (Math.min(safeMaxTons, Math.max(0, t.divertedTons || 0)) / safeMaxTons) * 180;
                      const isNearBottom = y > 185;
                      const labelY = isNearBottom ? y - 8 : y + 13;
                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r="4"
                            className="fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-slate-900"
                            strokeWidth="1.5"
                          />
                          <text
                            x={x}
                            y={labelY}
                            className="text-[9px] font-mono font-semibold fill-emerald-600 dark:fill-emerald-400"
                            textAnchor="middle"
                          >
                            {t.divertedTons}t
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      {hasTrends && !analyticsLoading && (
        <div
          className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs"
          data-testid="cogs-recovery-legend"
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
            <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
              Recovery Rate (%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600 dark:border-emerald-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
              Waste Diverted (Tons)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default COGSRecoveryDashboard;
