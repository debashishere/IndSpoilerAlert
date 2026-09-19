import React from 'react';
import { Building2, ShieldCheck, Mail, DollarSign, Package } from 'lucide-react';

export interface CommercialStatCardsProps {
  buyerCompany: string;
  buyerEmail: string;
  hasNegotiatedSettledPrice: boolean;
  finalPrice?: number;
  unitPrice: number;
  reserveFloorPrice: number;
  allocationPct: number;
  quantity: number;
  isFullClearing: boolean;
  totalRecovery: number;
  netClearingTotal: number;
}

export const CommercialStatCards: React.FC<CommercialStatCardsProps> = ({
  buyerCompany,
  buyerEmail,
  hasNegotiatedSettledPrice,
  finalPrice,
  unitPrice,
  reserveFloorPrice,
  allocationPct,
  quantity,
  isFullClearing,
  totalRecovery,
  netClearingTotal
}) => {
  return (
    <div className="relative bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 w-full">
      <div
        data-testid="centralized-commercial-stat-cards"
        className="relative max-w-[1100px] mx-auto w-full px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
      >
        {/* Card 1: Buyer Organization */}
        <div
          data-testid="summary-buyer-org"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11.5px] font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Buyer Organization
              </span>
              <span
                data-testid="buyer-verified-badge"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified
              </span>
            </div>
            <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100 truncate" title={buyerCompany}>
              {buyerCompany}
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] truncate mt-1">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <a
              href={`mailto:${buyerEmail}`}
              className="truncate font-mono hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title={buyerEmail}
            >
              {buyerEmail}
            </a>
          </div>
        </div>

        {/* Card 2: Unit Offer */}
        <div
          data-testid="summary-unit-offer"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11.5px] font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Unit Offer
              </span>
              {hasNegotiatedSettledPrice && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
                  Settled
                </span>
              )}
            </div>
            {hasNegotiatedSettledPrice && finalPrice !== undefined ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[20px] font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                    ${finalPrice.toFixed(2)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[12px]">/case</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  Initial Bid: ${unitPrice.toFixed(2)} /case
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[20px] font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                    ${unitPrice.toFixed(2)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[12px]">/case</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  Floor: ${reserveFloorPrice.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          {hasNegotiatedSettledPrice && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Floor: ${reserveFloorPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* Card 3: Volume Requested */}
        <div
          data-testid="summary-volume-requested"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11.5px] font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Volume Requested
              </span>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded font-mono">
                {allocationPct}% Lot
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                {quantity}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[12px]">cases</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                isFullClearing
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              {isFullClearing ? 'Full Clearing' : 'Partial Clearing'}
            </span>
          </div>
        </div>

        {/* Card 4: Gross Recovery */}
        <div
          data-testid="summary-gross-recovery"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11.5px] font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Gross Recovery
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                Target Margin
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                ${totalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Net Est: ${netClearingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};
