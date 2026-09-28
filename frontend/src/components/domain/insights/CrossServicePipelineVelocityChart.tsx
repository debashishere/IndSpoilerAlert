import React, { useState } from 'react';
import { Activity, Layers, Check } from 'lucide-react';
import type { VelocityTrendPoint } from '../../../store/slices/coreSlice';

interface CrossServicePipelineVelocityChartProps {
  data?: VelocityTrendPoint[];
  loading?: boolean;
  timeframe: string;
}

export const CrossServicePipelineVelocityChart: React.FC<CrossServicePipelineVelocityChartProps> = ({
  data = [],
  loading = false,
  timeframe,
}) => {
  const [visibleSeries, setVisibleSeries] = useState({
    lots: true,
    runs: true,
    dispatches: true,
  });

  const [hoveredPoint, setHoveredPoint] = useState<VelocityTrendPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const toggleSeries = (key: 'lots' | 'runs' | 'dispatches') => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const points = data || [];
  const hasEvents = points.some((p) => p.lots > 0 || p.runs > 0 || p.dispatches > 0);

  // Layout bounds for SVG
  const width = 720;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const baselineY = height - paddingBottom;

  // Compute maximum across visible series
  const maxMetric = Math.max(
    ...points.map((p) =>
      Math.max(
        visibleSeries.lots ? p.lots : 0,
        visibleSeries.runs ? p.runs : 0,
        visibleSeries.dispatches ? p.dispatches : 0
      )
    ),
    0
  );

  const safeMax = Math.max(maxMetric, 4);

  const getX = (index: number) => {
    if (points.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return baselineY - (Math.min(val, safeMax) / safeMax) * chartHeight;
  };

  // Generate SVG path for a metric
  const generatePath = (metricKey: 'lots' | 'runs' | 'dispatches') => {
    if (points.length === 0) return '';
    return points
      .map((p, idx) => {
        const x = getX(idx);
        const y = getY(p[metricKey]);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate SVG enclosed area path for a metric
  const generateAreaPath = (metricKey: 'lots' | 'runs' | 'dispatches') => {
    if (points.length === 0) return '';
    const linePath = points
      .map((p, idx) => {
        const x = getX(idx);
        const y = getY(p[metricKey]);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    const lastX = getX(points.length - 1);
    const firstX = getX(0);
    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4 relative"
      data-testid="cross-service-pipeline-velocity-container"
    >
      {/* Header and Legend Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Cross-Service Pipeline Velocity &amp; Throughput
              {loading && <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Synchronized volume trend across Ingested lots, Workflow execution runs, and Outbound buyer dispatches
            </p>
          </div>
        </div>

        {/* Interactive Legend Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Layers className="w-3 h-3" /> Channels:
          </span>
          <button
            type="button"
            onClick={() => toggleSeries('lots')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              visibleSeries.lots
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>Ingested Lots</span>
            {visibleSeries.lots && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('runs')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              visibleSeries.runs
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400" />
            <span>Workflow Runs</span>
            {visibleSeries.runs && <Check className="w-3 h-3 text-violet-600 dark:text-violet-400" />}
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('dispatches')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              visibleSeries.dispatches
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <span>Buyer Dispatches</span>
            {visibleSeries.dispatches && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* SVG Chart Surface */}
      <div className="relative w-full h-[240px]">
        <svg
          width="100%"
          height="240"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Cross-Service Pipeline Velocity Chart"
          className="overflow-visible"
          data-testid="cross-service-velocity-svg"
        >
          <defs>
            <linearGradient id="gradient-area-lots" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-area-runs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-area-dispatches" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800/80"
            strokeWidth="1"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight / 2}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight / 2}
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800/80"
            strokeWidth="1"
          />
          <line
            x1={paddingLeft}
            y1={baselineY}
            x2={width - paddingRight}
            y2={baselineY}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
            data-testid="baseline-zero-axis"
          />

          {/* Y-Axis Value Labels */}
          <g className="text-[9px] font-mono text-slate-400 dark:text-slate-500" fill="currentColor">
            <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end">
              {safeMax}
            </text>
            <text x={paddingLeft - 8} y={paddingTop + chartHeight / 2 + 4} textAnchor="end">
              {Math.round(safeMax / 2)}
            </text>
            <text x={paddingLeft - 8} y={baselineY + 4} textAnchor="end">
              0
            </text>
          </g>

          {/* X-Axis Date Labels */}
          {points.map((p, idx) => {
            // Show every label if <= 7, else skip labels to prevent clutter
            const step = points.length > 14 ? Math.ceil(points.length / 7) : 1;
            if (idx % step !== 0 && idx !== points.length - 1) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={baselineY + 18}
                fill="currentColor"
                className="text-[9px] font-mono text-slate-400 dark:text-slate-500"
                textAnchor="middle"
              >
                {p.label}
              </text>
            );
          })}

          {/* Curve 1: Ingestion Lots (Blue) */}
          {visibleSeries.lots && points.length > 0 && (
            <g data-testid="series-ingestion-lots">
              <path
                data-testid="series-area-ingestion-lots"
                d={generateAreaPath('lots')}
                fill="url(#gradient-area-lots)"
                className="transition-all duration-300 pointer-events-none"
              />
              <path
                d={generatePath('lots')}
                fill="none"
                className="stroke-blue-600 dark:stroke-blue-400 transition-all duration-300"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(p.lots);
                return (
                  <circle
                    key={`lot-${idx}`}
                    cx={cx}
                    cy={cy}
                    r="4"
                    className="fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-slate-900 transition-transform duration-150 hover:scale-125"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {/* Curve 2: Workflow Runs (Violet) */}
          {visibleSeries.runs && points.length > 0 && (
            <g data-testid="series-workflow-runs">
              <path
                data-testid="series-area-workflow-runs"
                d={generateAreaPath('runs')}
                fill="url(#gradient-area-runs)"
                className="transition-all duration-300 pointer-events-none"
              />
              <path
                d={generatePath('runs')}
                fill="none"
                className="stroke-violet-600 dark:stroke-violet-400 transition-all duration-300"
                strokeWidth="2.5"
                strokeDasharray="4,2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(p.runs);
                return (
                  <circle
                    key={`run-${idx}`}
                    cx={cx}
                    cy={cy}
                    r="4"
                    className="fill-violet-600 dark:fill-violet-400 stroke-white dark:stroke-slate-900 transition-transform duration-150 hover:scale-125"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {/* Curve 3: Buyer Dispatches (Emerald) */}
          {visibleSeries.dispatches && points.length > 0 && (
            <g data-testid="series-buyer-dispatches">
              <path
                data-testid="series-area-buyer-dispatches"
                d={generateAreaPath('dispatches')}
                fill="url(#gradient-area-dispatches)"
                className="transition-all duration-300 pointer-events-none"
              />
              <path
                d={generatePath('dispatches')}
                fill="none"
                className="stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-300"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(p.dispatches);
                return (
                  <circle
                    key={`disp-${idx}`}
                    cx={cx}
                    cy={cy}
                    r="4"
                    className="fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-slate-900 transition-transform duration-150 hover:scale-125"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {/* Interactive Hover Zones for Points */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const slotWidth = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
            return (
              <rect
                key={`hit-${idx}`}
                x={x - slotWidth / 2}
                y={paddingTop}
                width={slotWidth}
                height={chartHeight + 10}
                fill="transparent"
                className="cursor-pointer"
                data-testid={`velocity-point-${p.date}`}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.parentElement?.parentElement as HTMLElement)?.getBoundingClientRect();
                  setHoveredPoint(p);
                  setHoverPos({
                    x: (x / width) * 100,
                    y: 40,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoverPos(null);
                }}
              />
            );
          })}
        </svg>

        {/* Empty-State Flat-Zero Guidance Message */}
        {!hasEvents && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              No cross-service operational throughput recorded for the {timeframe.toUpperCase()} timeframe.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              Authentic flat-zero baseline rendered. Activity points appear as lots are ingested, workflows execute, and buyer offers dispatch.
            </p>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && hoverPos && (
          <div
            data-testid="velocity-chart-tooltip"
            className="absolute z-20 pointer-events-none -translate-x-1/2 bg-slate-900/95 dark:bg-slate-800/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 backdrop-blur-sm transition-all"
            style={{
              left: `${hoverPos.x}%`,
              top: `${hoverPos.y}px`,
            }}
          >
            <div className="text-[11px] font-semibold border-b border-slate-700/60 pb-1 mb-1.5 font-mono text-slate-300">
              {hoveredPoint.label} ({hoveredPoint.date})
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              {visibleSeries.lots && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Ingestion:
                  </span>
                  <span className="font-bold font-mono">{hoveredPoint.lots} Ingested</span>
                </div>
              )}
              {visibleSeries.runs && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-violet-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> Workflows:
                  </span>
                  <span className="font-bold font-mono">{hoveredPoint.runs} Runs</span>
                </div>
              )}
              {visibleSeries.dispatches && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Dispatches:
                  </span>
                  <span className="font-bold font-mono">{hoveredPoint.dispatches} Dispatches</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossServicePipelineVelocityChart;
