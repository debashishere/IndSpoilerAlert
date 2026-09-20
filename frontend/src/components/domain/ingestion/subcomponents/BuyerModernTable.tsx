import React from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Users 
} from 'lucide-react';
import { BuyerRowInspectionDrawer } from './BuyerRowInspectionDrawer';
import type { BuyerModernTableProps } from '../types/ingestion.types';

export const BuyerModernTable: React.FC<BuyerModernTableProps> = ({
  buyers,
  expandedRowIds,
  onToggleRow,
  onEditBuyerProfile,
  onSendLotTender,
  onForwardShortDatedOffers,
  onRouteZeroWasteDonation,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalCount,
  pageSize = 10,
  onPageSizeChange,
}) => {
  const getTierBadgeStyle = (tier?: string) => {
    const t = (tier || '').toLowerCase();
    if (t.includes('1')) {
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
    if (t.includes('2')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    }
    if (t.includes('liquidator')) {
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
    if (t.includes('custom')) {
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (buyers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs p-10 mb-6 border border-slate-200 text-center">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">No buyers found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No buyer accounts match the current filter criteria. Try adjusting or clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs overflow-hidden mb-6 border border-slate-200">
      {/* 12-Column Table Header */}
      <div className="grid grid-cols-12 px-4 py-3 bg-slate-100/90 text-slate-600 font-semibold text-[11px] uppercase tracking-wider items-center border-b border-slate-200">
        <div className="col-span-3">Company / Buyer Name</div>
        <div className="col-span-2">Contact Email</div>
        <div className="col-span-1">Buyer Tier</div>
        <div className="col-span-2">Preferences & Channel</div>
        <div className="col-span-1 text-center">Create Date</div>
        <div className="col-span-1 text-center">Update Date</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-center">Inspect</div>
      </div>

      {/* Table Body / Rows */}
      <div className="divide-y divide-slate-200/70">
        {buyers.map((buyer) => {
          const isExpanded = expandedRowIds.has(buyer._id);
          const isInactive = buyer.isActive === false;

          return (
            <div
              key={buyer._id}
              className={`lot-row group transition-colors cursor-pointer ${
                isInactive ? 'bg-slate-50/50 opacity-90' : 'hover:bg-slate-50/80'
              }`}
              data-testid={`buyer-row-${buyer._id}`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.inspection-drawer')) {
                  return;
                }
                onToggleRow(buyer._id);
              }}
            >
              {/* Row Grid Summary */}
              <div
                className="grid grid-cols-12 px-4 py-3 items-center select-none gap-1"
              >
                {/* Col 1: Company / Buyer Name + Subtitle */}
                <div className="col-span-3 min-w-0 pr-2">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {buyer.companyName || buyer.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                    {buyer.networkSubtitle || `ID: ${buyer.buyerId || buyer._id.slice(-6)}`}
                  </div>
                </div>

                {/* Col 2: Contact Email */}
                <div className="col-span-2 min-w-0 pr-2">
                  <span className="font-mono text-xs text-blue-600 truncate block">
                    {buyer.email}
                  </span>
                </div>

                {/* Col 3: Buyer Tier Badge */}
                <div className="col-span-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getTierBadgeStyle(
                      buyer.tier
                    )}`}
                  >
                    {buyer.tier || 'Tier 1'}
                  </span>
                </div>

                {/* Col 4: Preferences & Channel */}
                <div className="col-span-2 min-w-0 pr-2">
                  <div className="text-xs font-medium text-slate-800 truncate">
                    {buyer.preferencesPrimary || 'Standard Retail Order'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {buyer.preferencesSecondary || 'Active Allocation Network'}
                  </div>
                </div>

                {/* Col 5: Create Date */}
                <div className="col-span-1 text-center font-mono text-[11px] text-slate-500">
                  {buyer.createDate || '01/14/2025'}
                </div>

                {/* Col 6: Update Date */}
                <div className="col-span-1 text-center font-mono text-[11px] text-slate-500">
                  {buyer.updateDate || '09/17/2026'}
                </div>

                {/* Col 7: Status & Channel Badges */}
                <div className="col-span-1 text-center flex flex-col items-center gap-1 justify-center">
                  {isInactive ? (
                    <span
                      data-testid={`inactive-badge-${buyer._id}`}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                    >
                      Inactive
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {buyer.status || 'Active Compliant'}
                    </span>
                  )}

                  {/* Opt-out channel badges */}
                  {buyer.optInBidding === false && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                      No Bidding
                    </span>
                  )}
                  {buyer.optInSales === false && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                      No Sales
                    </span>
                  )}
                </div>

                {/* Col 8: Inspect Chevron */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    aria-label={`Inspect ${buyer.companyName || buyer.name}`}
                    aria-expanded={isExpanded}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRow(buyer._id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Progressive Row Inspection Drawer (In-Situ Accordion) */}
              {isExpanded && (
                <div onClick={(e) => e.stopPropagation()}>
                  <BuyerRowInspectionDrawer
                    buyer={buyer}
                    onEditBuyerProfile={onEditBuyerProfile}
                    onSendLotTender={onSendLotTender}
                    onForwardShortDatedOffers={onForwardShortDatedOffers}
                    onRouteZeroWasteDonation={onRouteZeroWasteDonation}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination & Count Footer */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing{' '}
          <strong className="text-slate-800 font-semibold font-mono">
            {(totalCount || buyers.length) === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-slate-800 font-semibold font-mono">
            {Math.min(totalCount || buyers.length, currentPage * pageSize)}
          </strong>{' '}
          of{' '}
          <strong className="text-slate-800 font-semibold font-mono">
            {totalCount || buyers.length} Buyers
          </strong>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="buyer-page-size" className="text-slate-500 text-xs">
              Page size:
            </label>
            <select
              id="buyer-page-size"
              data-testid="buyer-page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Page Navigation */}
          {onPageChange && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Previous Page"
                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="font-mono text-[11px] text-slate-600 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Next Page"
                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
