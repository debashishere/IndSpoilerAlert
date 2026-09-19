import React from 'react';
import { ArrowLeft, RotateCcw, X } from 'lucide-react';

export interface BidActionInspectorHeaderProps {
  onClose: () => void;
  lotNumber: string;
  lotSku: string;
  productTitle: string;
  isRejected: boolean;
  isAccepted: boolean;
  isCountered: boolean;
  isBuyerCountered: boolean;
  internalStatus: string;
  bidStatus: string;
  rawStatus: string;
  isSubmitting: boolean;
  onReset?: () => Promise<void> | void;
  onOpenPreviewModal?: () => void;
}

export const BidActionInspectorHeader: React.FC<BidActionInspectorHeaderProps> = ({
  onClose,
  lotNumber,
  lotSku,
  productTitle,
  isRejected,
  isAccepted,
  isCountered,
  isBuyerCountered,
  internalStatus,
  bidStatus,
  rawStatus,
  isSubmitting,
  onReset,
  onOpenPreviewModal
}) => {
  // Status pill styling token selection according to 60-30-10 semantic palette
  const getStatusBadgeTokens = () => {
    if (isRejected) {
      return {
        badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
        dot: 'bg-rose-500'
      };
    }
    if (isAccepted) {
      return {
        badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-500'
      };
    }
    if (isCountered) {
      return {
        badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        dot: 'bg-blue-500'
      };
    }
    if (isBuyerCountered) {
      return {
        badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        dot: 'bg-indigo-500'
      };
    }
    return {
      badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      dot: 'bg-amber-500 animate-pulse'
    };
  };

  const statusTokens = getStatusBadgeTokens();
  const displayStatus = isBuyerCountered
    ? 'Buyer Countered'
    : (internalStatus || bidStatus || 'pending');

  return (
    <header
      role="banner"
      className="relative px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap transition-colors duration-150 shadow-xs"
    >
      <div className="min-w-0 flex-1">
        {/* Top Metadata Tranche: Breadcrumbs, Lot ID, SKU, Status Pill */}
        <div className="flex items-center gap-2 flex-wrap mb-1 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            data-testid="back-to-bids-btn"
            onClick={onClose}
            aria-label="Back to Bids & Offers"
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
            <span>← Back to Bids &amp; Offers</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Bid Action Inspector
          </span>

          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

          <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 tracking-tight">
            {lotNumber.startsWith('LOT') ? lotNumber : `LOT #${lotNumber}`}
          </span>

          <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 tracking-tight">
            SKU: {lotSku}
          </span>

          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

          <span
            data-testid="modal-status-badge"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize transition-colors duration-150 ${statusTokens.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusTokens.dot}`} aria-hidden="true" />
            {displayStatus}
          </span>
        </div>

        {/* Primary Screen Title: High-Contrast Typographic Anchor */}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate max-w-[700px] leading-snug">
          {productTitle}
        </h1>
      </div>

      {/* Right Control Actions: Adaptive Lifecycle Action & Close Workspace Exit Anchor */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Adaptive Lifecycle Action: Reset to Pending for re-actioning */}
        {rawStatus !== 'pending' && (
          <button
            type="button"
            onClick={onReset}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-amber-300 dark:border-amber-700/70 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bid to Pending</span>
          </button>
        )}

        <button
          type="button"
          data-testid="close-workspace-btn"
          aria-label="Close Workspace"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Close Workspace</span>
        </button>
      </div>
    </header>
  );
};
