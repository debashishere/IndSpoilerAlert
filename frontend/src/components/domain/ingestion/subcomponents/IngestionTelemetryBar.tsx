import React from 'react';
import { Wallet, AlertTriangle, Gauge, ShieldCheck } from 'lucide-react';
import { useIngestionTelemetry } from '../hooks/useIngestionTelemetry';
import type { IngestionTelemetryBarProps } from '../types/ingestion.types';

export const IngestionTelemetryBar: React.FC<IngestionTelemetryBarProps> = ({ className = '' }) => {
  const { metrics } = useIngestionTelemetry();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-6 ${className}`}>
      {/* Card 1: Active Portfolio Value */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Portfolio Value
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
              {metrics.portfolioValue}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {metrics.portfolioSubtext}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
            account_balance_wallet
          </span>
          <Wallet className="w-5 h-5 hidden" aria-hidden="true" />
        </div>
      </div>

      {/* Card 2: Critical RSL (<14 Days) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Critical RSL (&lt;14 Days)
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[20px] font-bold font-mono text-rose-600 dark:text-rose-400 leading-none">
              {metrics.criticalRsl}
            </span>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {metrics.criticalRslSubtext}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
            warning
          </span>
          <AlertTriangle className="w-5 h-5 hidden" aria-hidden="true" />
        </div>
      </div>

      {/* Card 3: Liquidation Velocity */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Liquidation Velocity
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
              {metrics.liquidationVelocity}
            </span>
            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
              {metrics.liquidationVelocitySubtext}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
            speed
          </span>
          <Gauge className="w-5 h-5 hidden" aria-hidden="true" />
        </div>
      </div>

      {/* Card 4: Matched Buyer Network */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Matched Buyer Network
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
              {metrics.matchedBuyers}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {metrics.matchedBuyersSubtext}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
            verified_user
          </span>
          <ShieldCheck className="w-5 h-5 hidden" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
