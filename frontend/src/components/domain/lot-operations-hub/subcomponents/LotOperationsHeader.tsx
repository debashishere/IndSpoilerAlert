import React, { useState } from 'react';
import { ArrowLeft, Award, HeartHandshake, Recycle, Check, Info } from 'lucide-react';

interface LotOperationsHeaderProps {
  lot: any;
  backButtonLabel: string;
  onBack: () => void;
  onPublishMarketplace?: (lot: any) => void;
  onEnableBidding: (lot: any) => void;
  onDonate: (lot: any) => void;
  onRecycle: (lot: any) => void;
}

export const LotOperationsHeader: React.FC<LotOperationsHeaderProps> = ({
  lot,
  backButtonLabel,
  onBack,
  onPublishMarketplace,
  onEnableBidding,
  onDonate,
  onRecycle,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const productDescription = lot?.productId?.description || 'Unknown Product';
  const sku = lot?.productId?.sku || 'N/A';
  const lotNumber = lot?.lotNumber || 'N/A';
  const isPending = lot?.status === 'pending';
  const isActive = lot?.status === 'active';

  let statusBadgeClasses = 'bg-emerald-50 border-emerald-300 text-emerald-700';
  let statusText = 'ACTIVE LIST';
  if (isPending) {
    statusBadgeClasses = 'bg-amber-50 border-amber-300 text-amber-700';
    statusText = 'PENDING';
  } else if (lot?.status === 'sold') {
    statusBadgeClasses = 'bg-blue-50 border-blue-300 text-blue-700';
    statusText = 'SOLD';
  } else if (lot?.status === 'donated' || lot?.status === 'recycled') {
    statusBadgeClasses = 'bg-slate-100 border-slate-300 text-slate-700';
    statusText = (lot?.status || '').toUpperCase();
  } else if (lot?.status === 'expired') {
    statusBadgeClasses = 'bg-rose-50 border-rose-300 text-rose-700';
    statusText = 'EXPIRED';
  }

  return (
    <section className="mb-6 space-y-4 font-sans">
      {/* Back Action and Breadcrumb Trail */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center space-x-2 text-xs font-mono text-brand-700 hover:text-brand-900 transition group cursor-pointer bg-transparent border-none p-0"
        >
          <span className="p-1 rounded bg-white border border-surface-border group-hover:border-brand-500 transition shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition text-brand-600" />
          </span>
          <span className="font-semibold tracking-wide uppercase">{backButtonLabel || 'Return'}</span>
        </button>
      </div>

      {/* Lot Title & High-Velocity Action Bar */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle-card flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-brand-900 font-sans">
              {productDescription}
            </h1>
            <span
              className={`px-2.5 py-1 rounded-full border font-bold text-xs font-mono flex items-center gap-1.5 shadow-2xs ${statusBadgeClasses}`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot"></span>
              {statusText}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
              Lot #{lotNumber}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-brand-50 text-brand-800 border border-brand-200">
              {sku}
            </span>
          </div>

          {/* Right: Info button with hover card popover */}
          <div className="flex items-center gap-2 relative">
            <div
              className="relative shrink-0"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button
                aria-label="Lot Specification Details"
                className="w-8 h-8 rounded-full border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:border-brand-400 flex items-center justify-center font-mono font-bold text-sm transition shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
              >
                <Info className="w-4 h-4 text-brand-700" />
              </button>

              {/* Tooltip Dropdown */}
              <div
                className={`absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-card-hover border border-surface-border p-4 z-50 transition-all duration-200 transform origin-top-right ${
                  showTooltip
                    ? 'visible opacity-100 scale-100'
                    : 'invisible opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-borderLight mb-3">
                  <span className="text-xs font-mono font-bold text-brand-900 uppercase tracking-wide">
                    Lot Specifications & Schema
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-surface-borderLight">
                    <span className="text-slate-500 font-medium">SKU</span>
                    <span className="font-bold text-brand-900 flex items-center gap-1">SKU: {sku}</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-surface-borderLight">
                    <span className="text-slate-500 font-medium">Lot Number</span>
                    <span className="font-bold text-slate-800">Tracking: {lotNumber}</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-surface-borderLight">
                    <span className="text-slate-500 font-medium">Quality Rating</span>
                    <span className="font-semibold text-brand-800">Grade A • 100% Pallet Integrity</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-surface-borderLight">
                    <span className="text-slate-500 font-medium">Condition</span>
                    <span className="font-semibold text-slate-700">
                      {lot?.fdaRegulated ? 'Ambient / Monitored' : 'Standard Dry Storage'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-borderLight">
          <div className="flex flex-wrap items-center gap-3">
            {(isPending || isActive) && (
              <button
                type="button"
                aria-label="Publish to Marketplace"
                onClick={() =>
                  onPublishMarketplace
                    ? onPublishMarketplace(lot)
                    : alert('Publishing to Marketplace...')
                }
                className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-xs font-mono shadow-2xs flex items-center space-x-2 hover:bg-emerald-100 transition cursor-pointer"
                title="Publish sanitized listing to public Buyer Marketplace"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="tracking-wide">Live on Market</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold uppercase tracking-wider ml-1">
                  {isActive ? 'MARKETPLACE ACTIVE' : 'PUBLISH'}
                </span>
              </button>
            )}

            {isPending && (
              <button
                type="button"
                onClick={() => onEnableBidding(lot)}
                className="px-4 py-2 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-300 text-brand-800 text-xs font-mono font-semibold transition flex items-center space-x-2 shadow-2xs cursor-pointer"
              >
                <Award className="w-4 h-4 text-brand-600" />
                <span>Enable Bids</span>
              </button>
            )}

            {(isPending || isActive) && (
              <>
                <button
                  type="button"
                  onClick={() => onDonate(lot)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 text-xs font-mono font-medium transition flex items-center space-x-2 shadow-2xs cursor-pointer"
                  title="Divert to Charity Network"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>Donate (Tax-Off)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRecycle(lot)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 text-xs font-mono font-medium transition flex items-center space-x-2 shadow-2xs cursor-pointer"
                  title="Schedule Ecological Disposal"
                >
                  <Recycle className="w-4 h-4 text-amber-500" />
                  <span>Recycle</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
