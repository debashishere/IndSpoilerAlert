import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCOGSRecoveryMetrics, selectAnalyticsLoading, selectAnalyticsSummary } from '../../store/slices/coreSlice';
import { InsightCard } from '../InsightCard';

export const SummaryMetrics: React.FC = () => {
  const metrics = useSelector(selectCOGSRecoveryMetrics);
  const analyticsLoading = useSelector(selectAnalyticsLoading);
  const analyticsSummary = useSelector(selectAnalyticsSummary);
  const [activeInfoCardId, setActiveInfoCardId] = useState<string | null>(null);

  const handleToggle = (cardId: string) => {
    setActiveInfoCardId((prev) => (prev === cardId ? null : cardId));
  };

  const soldCogsBaseline = metrics.totalSoldCOGS || metrics.totalCOGS || 0;

  if (analyticsLoading && !analyticsSummary) {
    const skeletonCards = [
      'COGS Recovery Rate',
      'Landfill Waste Diverted',
      'Fees & Tax Benefit Saved',
      'CO2 Emissions Saved',
    ];

    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
        data-testid="summary-metrics-loading"
      >
        {skeletonCards.map((title, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-[76px] animate-pulse"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {title}
              </p>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
      data-testid="recovery-metrics-grid"
    >
      {/* 1. COGS Recovery Rate */}
      <InsightCard
        title="COGS Recovery Rate"
        value={`${metrics.cogsRecoveryRate}%`}
        subtext={`Recovered: $${(metrics.totalRecoveredValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} of $${soldCogsBaseline.toLocaleString(undefined, { maximumFractionDigits: 0 })} sold COGS`}
        valueClass="text-blue-600 dark:text-blue-400"
        subtextClass="text-slate-500 dark:text-slate-400"
        tooltipText="Percentage of original cost of goods recovered via secondary closeouts. Formula: (Total Recovered Value ÷ Total Sold COGS) × 100."
        isExpanded={activeInfoCardId === 'cogsRecovery'}
        onToggle={() => handleToggle('cogsRecovery')}
      />

      {/* 2. Landfill Waste Diverted */}
      <InsightCard
        title="Landfill Waste Diverted"
        value={`${metrics.wasteDivertedTons} Tons`}
        subtext="Surplus stock diverted to charity/recyclers"
        valueClass="text-emerald-600 dark:text-emerald-400"
        subtextClass="text-emerald-600 dark:text-emerald-400"
        tooltipText="Total weight of surplus inventory diverted away from municipal landfills. Computed from verified food donation transfers and organic feed/biofuel recycling tonnage."
        isExpanded={activeInfoCardId === 'wasteDiverted'}
        onToggle={() => handleToggle('wasteDiverted')}
      />

      {/* 3. Fees & Tax Benefit Saved */}
      <InsightCard
        title="Fees & Tax Benefit Saved"
        value={`$${(metrics.landfillFeesSaved || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        subtext="Avoided tipping fees + tax incentives"
        valueClass="text-amber-600 dark:text-amber-400"
        subtextClass="text-amber-600 dark:text-amber-400"
        tooltipText="Net financial value preserved by avoiding municipal landfill tipping fees ($100/ton) plus Section 170(e)(3) tax deductions for charitable donations."
        isExpanded={activeInfoCardId === 'feesSaved'}
        onToggle={() => handleToggle('feesSaved')}
        popoverAlign="right"
      />

      {/* 4. CO2 Emissions Saved */}
      <InsightCard
        title="CO2 Emissions Saved"
        value={`${metrics.co2SavedTons} Tons`}
        subtext="Reduced greenhouse gas impact"
        valueClass="text-sky-600 dark:text-sky-400"
        subtextClass="text-sky-600 dark:text-sky-400"
        tooltipText="Total greenhouse gas emissions prevented by diverting perishable goods from anaerobic decomposition in landfills (EPA WARM conversion factors)."
        isExpanded={activeInfoCardId === 'co2Saved'}
        onToggle={() => handleToggle('co2Saved')}
        popoverAlign="right"
      />
    </div>
  );
};

export default SummaryMetrics;
