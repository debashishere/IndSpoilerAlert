import React from 'react';
import { Database, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectRSLDistribution, selectAnalyticsLoading } from '../../store/slices/coreSlice';

export const RSLDistributionChart: React.FC = () => {
  const { caseStats, categoryBreakdown } = useSelector(selectRSLDistribution);
  const analyticsLoading = useSelector(selectAnalyticsLoading);

  if (analyticsLoading) {
    return (
      <div
        className="flex flex-col gap-5"
        id="rsl-distribution-rail"
        data-testid="rsl-distribution-rail"
      >
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col items-center justify-center min-h-[340px] text-center animate-pulse"
          data-testid="rsl-distribution-loading"
        >
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin mb-2" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Loading stock disposition telemetry...
          </p>
        </div>
      </div>
    );
  }
  const totalCases = caseStats.total || 0;
  const totalDisposed =
    (caseStats.sold || 0) +
    (caseStats.donated || 0) +
    (caseStats.recycled || 0) +
    (caseStats.expired || 0);
  const hasDispositionData = totalCases > 0 || totalDisposed > 0;
  const total = Math.max(totalCases, totalDisposed) || 1;

  const soldPct = ((caseStats.sold || 0) / total) * 100;
  const donPct = ((caseStats.donated || 0) / total) * 100;
  const recPct = ((caseStats.recycled || 0) / total) * 100;
  const expPct = ((caseStats.expired || 0) / total) * 100;

  const formatPct = (pct: number): string => {
    if (pct > 0 && pct < 1) return '<1';
    return pct.toFixed(0);
  };

  const maxCategoryVol = Math.max(
    ...(categoryBreakdown || []).map((c: any) => c.volume ?? c.volumeCases ?? 0),
    100
  );

  return (
    <div
      className="flex flex-col gap-5"
      id="rsl-distribution-rail"
      data-testid="rsl-distribution-rail"
    >
      {/* 1. Product Stock Disposition Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider m-0">
              Product Stock Disposition
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 px-2 py-0.5 rounded">
            Leftovers Rate: {caseStats.leftoverRate || 0}%
          </span>
        </div>

        {!hasDispositionData ? (
          <p
            className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center"
            data-testid="disposition-empty-state"
          >
            No stock disposition data recorded yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>
                Total Cases Managed:{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-mono">
                  {totalCases.toLocaleString()}
                </strong>
              </span>
            </div>

            {/* Stacked bar diagram */}
          <div
            className="w-full h-5 rounded-lg overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80"
            data-testid="disposition-stacked-bar"
            role="group"
            aria-label="Product stock disposition percentage breakdown"
          >
            {caseStats.sold > 0 && (
              <div
                style={{ width: `${soldPct}%` }}
                className="h-full bg-emerald-600 transition-all duration-300"
                title={`Sold: ${(caseStats.sold || 0).toLocaleString()} cases (${formatPct(soldPct)}%)`}
                data-testid="disposition-segment-sold"
                role="img"
                aria-label={`Sold: ${(caseStats.sold || 0).toLocaleString()} cases (${formatPct(soldPct)}%)`}
              />
            )}
            {caseStats.donated > 0 && (
              <div
                style={{ width: `${donPct}%` }}
                className="h-full bg-blue-600 transition-all duration-300"
                title={`Donated: ${(caseStats.donated || 0).toLocaleString()} cases (${formatPct(donPct)}%)`}
                data-testid="disposition-segment-donated"
                role="img"
                aria-label={`Donated: ${(caseStats.donated || 0).toLocaleString()} cases (${formatPct(donPct)}%)`}
              />
            )}
            {caseStats.recycled > 0 && (
              <div
                style={{ width: `${recPct}%` }}
                className="h-full bg-amber-500 transition-all duration-300"
                title={`Recycled: ${(caseStats.recycled || 0).toLocaleString()} cases (${formatPct(recPct)}%)`}
                data-testid="disposition-segment-recycled"
                role="img"
                aria-label={`Recycled: ${(caseStats.recycled || 0).toLocaleString()} cases (${formatPct(recPct)}%)`}
              />
            )}
            {caseStats.expired > 0 && (
              <div
                style={{ width: `${expPct}%` }}
                className="h-full bg-rose-600 transition-all duration-300"
                title={`Expired/Leftover: ${(caseStats.expired || 0).toLocaleString()} cases (${formatPct(expPct)}%)`}
                data-testid="disposition-segment-expired"
                role="img"
                aria-label={`Expired/Leftover: ${(caseStats.expired || 0).toLocaleString()} cases (${formatPct(expPct)}%)`}
              />
            )}
          </div>

          {/* Legend details list */}
          <div className="flex flex-col gap-2 pt-1 text-xs">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Sold (Awarded)</span>
              </span>
              <strong className="font-mono text-slate-800 dark:text-slate-200">
                {(caseStats.sold || 0).toLocaleString()} Cases
              </strong>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Donated to Food Banks</span>
              </span>
              <strong className="font-mono text-slate-800 dark:text-slate-200">
                {(caseStats.donated || 0).toLocaleString()} Cases
              </strong>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Recycled (Bio-fuels/Feed)</span>
              </span>
              <strong className="font-mono text-slate-800 dark:text-slate-200">
                {(caseStats.recycled || 0).toLocaleString()} Cases
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Expired (Spoilage)</span>
              </span>
              <strong className="font-mono text-slate-800 dark:text-slate-200">
                {(caseStats.expired || 0).toLocaleString()} Cases
              </strong>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 2. Volume Distribution by CPG Category Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider m-0">
            Volume Distribution by CPG Category
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {(categoryBreakdown || []).length} Categories
          </span>
        </div>

        {(!categoryBreakdown || categoryBreakdown.length === 0) ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
            No category volume distribution recorded yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3.5 pt-1" data-testid="category-breakdown-list">
            {categoryBreakdown.map((cat: any, idx: number) => {
              const vol = cat.volume ?? cat.volumeCases ?? 0;
              const pct = (vol / maxCategoryVol) * 100;
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {cat.category}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] shrink-0 ml-2">
                      {vol.toLocaleString()} Cases
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      data-testid={`category-bar-${idx}`}
                      role="progressbar"
                      aria-valuenow={Math.round(pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${cat.category}: ${vol.toLocaleString()} cases`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RSLDistributionChart;
