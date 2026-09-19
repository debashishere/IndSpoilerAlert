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
      className="relative px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap rounded-t-2xl transition-colors duration-150 shadow-2xs"
    >
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        {/* Top Metadata Tranche: Breadcrumbs, Eyebrow, Lot ID, SKU, Status Pill */}
        <div className="flex items-center gap-2 flex-wrap text-[12px] font-medium text-slate-500 dark:text-slate-400">
          <button
            type="button"
            data-testid="back-to-bids-btn"
            onClick={onClose}
            aria-label="Back to Bids & Offers"
            className="group inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3 h-3 transition-transform duration-150 group-hover:-translate-x-0.5" />
            <span>← Back to Bids &amp; Offers</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

          <span className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-[11px]">
            Bid Action Inspector
          </span>

          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

          <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs tracking-tight">
            {lotNumber.startsWith('LOT') ? lotNumber : `Lot #${lotNumber}`}
          </span>

          <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs tracking-tight">
            SKU: {lotSku}
          </span>

          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

          <span
            data-testid="modal-status-badge"
            className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full border capitalize transition-colors duration-150 ${statusTokens.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusTokens.dot}`} aria-hidden="true" />
            {displayStatus}
          </span>
        </div>

        {/* Primary Screen Title: High-Contrast Typographic Anchor (22px/24px, tracking-tight, leading-snug) */}
        <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate max-w-[850px]">
          {productTitle}
        </h1>
      </div>

      {/* Right Control Actions: Optional Preview Email, Adaptive Reset, and Compact Close */}
      <div className="flex items-center gap-2.5 shrink-0 ml-4">
        {onOpenPreviewModal && (
          <button
            type="button"
            onClick={onOpenPreviewModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[12px] font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <span>Preview Email</span>
          </button>
        )}

        {/* Adaptive Lifecycle Action: Reset to Pending for re-actioning */}
        {rawStatus !== 'pending' && (
          <button
            type="button"
            onClick={onReset}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border border-amber-300 dark:border-amber-700/70 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-2xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors flex items-center justify-center cursor-pointer text-[14px] shadow-2xs"
          title="Close Workspace"
        >
          <span className="sr-only">Close Workspace</span>
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
