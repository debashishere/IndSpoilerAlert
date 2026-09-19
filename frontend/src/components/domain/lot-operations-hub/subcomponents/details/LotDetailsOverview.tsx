import React from 'react';
import { Box, CheckCircle2, TrendingUp, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { calculateDaysRemaining, calculateRslRatio } from '../../constants/lotPricingCalculations';

interface LotDetailsOverviewProps {
  lot: any;
  onUpdateProductAllergens?: (productId: string, newAllergens: string[]) => Promise<void>;
  onFastTrackClearing?: () => void;
}

export const LotDetailsOverview: React.FC<LotDetailsOverviewProps> = ({
  lot,
  onFastTrackClearing,
}) => {
  const daysRemaining = calculateDaysRemaining(lot?.expirationDate);
  const availableQty = lot?.availableQty ?? lot?.quantityCases ?? 0;
  const quantityCases = lot?.quantityCases || 1;
  const costPerCase = lot?.costPerCase ?? 13.0;
  const totalValue = availableQty * costPerCase;
  const shelfLifeDays = lot?.productId?.shelfLifeDays || 30;
  const rslRatio = calculateRslRatio(daysRemaining, shelfLifeDays);
  const inStockPercentage = Math.min(100, Math.max(0, (availableQty / quantityCases) * 100));

  const supplierName = lot?.supplierId?.name || 'Unilever / Debashishere007';
  const hubName = lot?.distributionCenterId?.name || 'Texas Central Facility, Dallas, TX';
  const isExpired = daysRemaining === 0;

  const expirationFormatted = lot?.expirationDate
    ? new Date(lot.expirationDate).toLocaleDateString()
    : '8/27/2026';
  const createdFormatted = lot?.createdAt
    ? new Date(lot.createdAt).toLocaleString()
    : '8/19/2026, 6:58:01 PM';
  const updatedFormatted = lot?.updatedAt
    ? new Date(lot.updatedAt).toLocaleString()
    : '9/18/2026, 9:59:34 AM';

  return (
    <article
      className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle-card relative overflow-hidden"
      data-purpose="inventory-lot-overview"
    >
      {/* Overview Header */}
      <div
        className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 flex-wrap gap-2"
        data-field="overview-header"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Inventory Ground Truth &amp; Core Lot Telemetry
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-100 text-brand-900 font-bold">
                HUMAN + AGENT SYNC
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Real-time warehouse allocation and pallet level telemetry
            </p>
          </div>
        </div>
        <span
          className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold"
          data-field="lot-identifier"
        >
          ID: {lot?.lotNumber ? `#${lot.lotNumber}` : 'INV-89240-TX'}
        </span>
      </div>

      <div className="space-y-4" data-field="telemetry-grid">
        {/* Line 1: Supplier Origin & Distribution Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 transition"
            data-field="supplier-origin"
          >
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-medium">
              Supplier Origin
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-base">{supplierName}</span>
              <span className="inline-flex items-center text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified Partner
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Node: {lot?.supplierId?.nodeCode || 'NA-SOUTH-TX-HUB'}
            </div>
          </div>

          <div
            className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 transition"
            data-field="distribution-hub"
          >
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-medium">
              Distribution Hub
            </div>
            <div className="font-bold text-slate-900 text-sm truncate" title={hubName}>
              {hubName}
            </div>
            <div className="text-xs text-brand-700 font-mono mt-0.5 font-medium">
              Bay 4-B Cold Dock Assigned
            </div>
          </div>
        </div>

        {/* Line 2: Volume Metrics & Baseline Lot Valuation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 transition"
            data-field="volume-inventory"
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400 uppercase tracking-wider text-[11px] font-medium">
                Available Volume
              </span>
              <span className="text-brand-700 font-bold text-[11px]">
                {inStockPercentage.toFixed(1)}% IN STOCK
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-slate-900">
                {availableQty.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {quantityCases.toLocaleString()} cases
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${inStockPercentage}%` }}
              ></div>
            </div>
          </div>

          <div
            className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 transition"
            data-field="valuation-metrics"
          >
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-medium">
              Baseline Valuation
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-emerald-600">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-mono text-slate-400">
                (${costPerCase.toFixed(2)}/cs baseline)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-2 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>FOB Origin / Non-refrigerated dry pallet</span>
            </div>
          </div>
        </div>

        {/* Line 3: Expiration Threshold Alert & Shelf-Life Notice */}
        <div
          className={`rounded-lg p-3.5 border flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2 ${
            isExpired || daysRemaining < 10
              ? 'bg-rose-50 border-rose-200'
              : 'bg-amber-50 border-amber-200'
          }`}
          data-field="expiration-alert"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-1.5 rounded-md bg-white shadow-2xs shrink-0 border ${
                isExpired || daysRemaining < 10
                  ? 'text-rose-600 border-rose-100'
                  : 'text-amber-600 border-amber-100'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`font-mono font-bold text-xs tracking-wide uppercase ${
                    isExpired || daysRemaining < 10 ? 'text-rose-900' : 'text-amber-900'
                  }`}
                >
                  {isExpired ? 'Critical Shelf-Life Threshold' : 'Monitored Shelf-Life Window'}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                    isExpired
                      ? 'bg-rose-600 text-white'
                      : daysRemaining < 10
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isExpired ? 'EXPIRED / 0 DAYS' : `${daysRemaining} DAYS REMAINING (${rslRatio}% RSL)`}
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 font-mono ${
                  isExpired || daysRemaining < 10 ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                Expiration: <strong className="font-bold">{expirationFormatted}</strong> •{' '}
                {isExpired
                  ? 'Immediate secondary market diversion triggered by Agent. Escalation Level 1'
                  : 'Real-time pallet velocity tracked for proactive clearance'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 self-end md:self-auto shrink-0">
            <button
              onClick={onFastTrackClearing}
              type="button"
              className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Fast-Track Clearing &gt;</span>
            </button>
          </div>
        </div>

        {/* Timestamps metadata bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-500 pt-1">
          <div className="flex items-center space-x-2 px-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              Logged: <strong className="text-slate-700 font-medium">{createdFormatted}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2 px-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Agent Sync: <strong className="text-slate-700 font-medium">{updatedFormatted}</strong>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
