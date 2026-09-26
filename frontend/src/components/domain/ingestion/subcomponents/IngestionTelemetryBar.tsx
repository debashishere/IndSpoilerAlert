import React from 'react';
import { AlertTriangle, Gauge, ShieldCheck } from 'lucide-react';
import { useIngestionTelemetry } from '../hooks/useIngestionTelemetry';
import type { IngestionTelemetryBarProps } from '../types/ingestion.types';
import { InsightCard } from '../../../InsightCard';

export const IngestionTelemetryBar: React.FC<IngestionTelemetryBarProps> = ({ className = '' }) => {
  const { metrics } = useIngestionTelemetry();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6 ${className}`}>
      <InsightCard
        title="Critical RSL (<14 Days)"
        value={metrics.criticalRsl}
        subtext={metrics.criticalRslSubtext}
        icon={
          <>
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">warning</span>
            <AlertTriangle className="w-5 h-5 hidden" aria-hidden="true" />
          </>
        }
        iconBgClass="bg-rose-50 dark:bg-rose-900/30"
        iconTextClass="text-rose-600 dark:text-rose-400"
        valueClass="text-rose-600 dark:text-rose-400"
        subtextClass="text-rose-600 dark:text-rose-400"
        tooltipText="Number of inventory lots with less than 14 days of remaining shelf life requiring immediate action."
      />
      <InsightCard
        title="Liquidation Velocity"
        value={metrics.liquidationVelocity}
        subtext={metrics.liquidationVelocitySubtext}
        icon={
          <>
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">speed</span>
            <Gauge className="w-5 h-5 hidden" aria-hidden="true" />
          </>
        }
        iconBgClass="bg-indigo-50 dark:bg-indigo-900/30"
        iconTextClass="text-indigo-600 dark:text-indigo-400"
        subtextClass="text-sky-600 dark:text-sky-400"
        tooltipText="The rate at which inventory is being liquidated, calculated as sold units divided by total units."
      />
      <InsightCard
        title="Matched Buyer Network"
        value={metrics.matchedBuyers}
        subtext={metrics.matchedBuyersSubtext}
        icon={
          <>
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">verified_user</span>
            <ShieldCheck className="w-5 h-5 hidden" aria-hidden="true" />
          </>
        }
        iconBgClass="bg-blue-50 dark:bg-blue-900/30"
        iconTextClass="text-blue-600 dark:text-blue-400"
        tooltipText="Number of verified buyers currently active in the network matching your inventory profile."
      />
    </div>
  );
};
