import React from 'react';
import { Gauge, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PlatformSlaYieldDistributionData } from '../../../store/slices/coreSlice';

interface PlatformSlaYieldDistributionChartProps {
  distribution?: PlatformSlaYieldDistributionData;
  loading?: boolean;
  timeframe: string;
}

const defaultDistribution: PlatformSlaYieldDistributionData = {
  workflowYield: {
    yieldPct: 0,
    successfulRuns: 0,
    totalRuns: 0,
  },
  turnaroundDistribution: {
    under2h: { count: 0, pct: 0 },
    twoToSixH: { count: 0, pct: 0 },
    sixToTwentyFourH: { count: 0, pct: 0 },
    over24h: { count: 0, pct: 0 },
    totalEvaluated: 0,
  },
  coldChainCompliance: {
    dockCompliancePct: 0,
    tempCompliancePct: 0,
    totalShipments: 0,
    totalColdLogs: 0,
  },
};

interface CircularProgressGaugeProps {
  percentage: number;
  label: string;
  strokeColor: string;
  radius?: number;
  formatPct: (val: number) => string;
}

const CircularProgressGauge: React.FC<CircularProgressGaugeProps> = ({
  percentage,
  label,
  strokeColor,
  radius = 38,
  formatPct,
}) => {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative my-3 flex items-center justify-center">
      <svg
        width="100"
        height="100"
        className="-rotate-90 origin-center"
        role="img"
        aria-label={`${label}: ${formatPct(percentage)}`}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-slate-200 dark:stroke-slate-700/70"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={`${strokeColor} transition-all duration-700 ease-out`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
          {formatPct(percentage)}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
      </div>
    </div>
  );
};

export const PlatformSlaYieldDistributionChart: React.FC<PlatformSlaYieldDistributionChartProps> = ({
  distribution = defaultDistribution,
  loading = false,
  timeframe,
}) => {
  const dist = distribution || defaultDistribution;

  const isZeroState =
    dist.workflowYield.totalRuns === 0 &&
    dist.turnaroundDistribution.totalEvaluated === 0 &&
    dist.coldChainCompliance.totalShipments === 0 &&
    dist.coldChainCompliance.totalColdLogs === 0;

  const formatPct = (val: number) => {
    if (val === 0 || !val || isNaN(val)) return '0%';
    return val % 1 === 0 ? `${val}%` : `${val.toFixed(1)}%`;
  };

  const workflowYieldPct = dist.workflowYield.yieldPct;
  const dockCompliancePct = dist.coldChainCompliance.dockCompliancePct;
  const tempCompliancePct = dist.coldChainCompliance.tempCompliancePct;

  const turnaroundBuckets = [
    {
      testId: 'turnaround-bucket-under2h',
      label: '< 2h',
      dotColor: 'bg-emerald-500',
      barColor: 'bg-emerald-500',
      data: dist.turnaroundDistribution.under2h,
    },
    {
      testId: 'turnaround-bucket-twoToSixH',
      label: '2–6h',
      dotColor: 'bg-blue-500',
      barColor: 'bg-blue-500',
      data: dist.turnaroundDistribution.twoToSixH,
    },
    {
      testId: 'turnaround-bucket-sixToTwentyFourH',
      label: '6–24h',
      dotColor: 'bg-amber-500',
      barColor: 'bg-amber-500',
      data: dist.turnaroundDistribution.sixToTwentyFourH,
    },
    {
      testId: 'turnaround-bucket-over24h',
      label: '> 24h',
      dotColor: 'bg-rose-500',
      barColor: 'bg-rose-500',
      data: dist.turnaroundDistribution.over24h,
    },
  ];

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-5 relative"
      data-testid="platform-sla-yield-distribution-container"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Platform SLA &amp; Operational Yield Distribution
              {loading && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Workflow Campaign clearance yield, Buyer communications turnaround velocity, and Cold-Chain HACCP compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {timeframe.toUpperCase()} Active Scope
          </span>
        </div>
      </div>

      {/* Contextual Zero-State Guidance if empty */}
      {isZeroState && (
        <div
          data-testid="sla-empty-guidance"
          className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300"
        >
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            No operational SLA or yield telemetry recorded for the selected timeframe. Baselines reflect zero activity.
          </span>
        </div>
      )}

      {/* 3 Pillar Distribution Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Workflow Campaign Completion Yield */}
        <div
          data-testid="workflow-yield-gauge"
          className="bg-slate-50/70 dark:bg-slate-800/30 rounded-xl border border-slate-200/70 dark:border-slate-700/50 p-4 flex flex-col items-center justify-between text-center relative"
        >
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-violet-500" /> Campaign Completion Yield
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Automations</span>
          </div>

          <CircularProgressGauge
            percentage={workflowYieldPct}
            label="Yield Rate"
            strokeColor="stroke-violet-600 dark:stroke-violet-400"
            formatPct={formatPct}
          />

          <div className="w-full pt-2 border-t border-slate-200/60 dark:border-slate-700/40 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between font-medium">
              <span>Runs Clearance</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {dist.workflowYield.successfulRuns} / {dist.workflowYield.totalRuns} Runs Resolved
              </span>
            </div>
            <div className="text-[10px] text-violet-600 dark:text-violet-400 font-medium text-left">
              {dist.workflowYield.totalRuns === 0
                ? 'No automation runs recorded'
                : workflowYieldPct >= 80
                ? 'Optimal Liquidation Execution'
                : 'Standard Pipeline Clearance'}
            </div>
          </div>
        </div>

        {/* Column 2: Buyer Communications Turnaround Speed */}
        <div className="bg-slate-50/70 dark:bg-slate-800/30 rounded-xl border border-slate-200/70 dark:border-slate-700/50 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Buyer Turnaround Speed
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {dist.turnaroundDistribution.totalEvaluated} Responses
            </span>
          </div>

          <div className="flex flex-col gap-2.5 my-1">
            {turnaroundBuckets.map((bucket) => (
              <div key={bucket.testId} data-testid={bucket.testId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${bucket.dotColor}`} />
                    {bucket.label}
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                    {bucket.data.count} ({bucket.data.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${bucket.barColor} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(bucket.data.pct, 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/40 text-[10px] text-slate-400 font-medium text-center">
            {dist.turnaroundDistribution.totalEvaluated === 0
              ? 'No response turnaround recorded'
              : dist.turnaroundDistribution.under2h.pct + dist.turnaroundDistribution.twoToSixH.pct >= 50
              ? 'High Responsive Liquidity (< 6h dominant)'
              : 'Standard Deal Negotiation Rhythm'}
          </div>
        </div>

        {/* Column 3: Cold-Chain HACCP & Dock Appointment Compliance */}
        <div
          data-testid="dock-compliance-gauge"
          className="bg-slate-50/70 dark:bg-slate-800/30 rounded-xl border border-slate-200/70 dark:border-slate-700/50 p-4 flex flex-col items-center justify-between text-center relative"
        >
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" /> Cold-Chain &amp; Dock SLA
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">HACCP</span>
          </div>

          <CircularProgressGauge
            percentage={dockCompliancePct}
            label="Compliance"
            strokeColor="stroke-cyan-500 dark:stroke-cyan-400"
            formatPct={formatPct}
          />

          <div className="w-full pt-2 border-t border-slate-200/60 dark:border-slate-700/40 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between font-medium">
              <span>Appointment Target</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Dock SLA Target</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Temp Compliance:</span>
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">{formatPct(tempCompliancePct)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
