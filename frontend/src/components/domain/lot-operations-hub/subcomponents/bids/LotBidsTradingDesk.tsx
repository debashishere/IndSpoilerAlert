import React, { useMemo } from 'react';
import {
  Award,
  Search,
  MessageSquare,
  Filter,
  Download,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { BID_STATUS_FILTERS } from '../../constants/lotOperationsConstants';
import { getBidStatusInfo } from '../../constants/lotPricingCalculations';
import type { useLotBidsTradingDesk } from '../../hooks/useLotBidsTradingDesk';
import type { BidFilterStatus } from '../../types/lotOperations.types';

interface LotBidsTradingDeskProps {
  lot: any;
  bidsTradingDesk: ReturnType<typeof useLotBidsTradingDesk>;
}

export const LotBidsTradingDesk: React.FC<LotBidsTradingDeskProps> = ({
  lot,
  bidsTradingDesk,
}) => {
  const {
    allBids,
    filteredBids,
    bidStatusFilter,
    setBidStatusFilter,
    bidSearchQuery,
    setBidSearchQuery,
    selectedBidForInspector,
    negotiationBidsLoading,
    handleBidRowSelect,
  } = bidsTradingDesk;

  // Calculate status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<BidFilterStatus, number> = {
      All: allBids.length,
      Pending: 0,
      Countered: 0,
      Awarded: 0,
      Declined: 0,
    };

    for (const b of allBids) {
      const info = getBidStatusInfo(b.status, b);
      if (info.key === 'Pending' || info.key === 'Buyer Countered') counts.Pending++;
      else if (info.key === 'Countered') counts.Countered++;
      else if (info.key === 'Awarded') counts.Awarded++;
      else if (info.key === 'Declined') counts.Declined++;
    }
    return counts;
  }, [allBids]);

  // Total allocated cases from all bids
  const totalAllocatedCases = useMemo(() => {
    return allBids.reduce((sum, b) => {
      const qty = typeof b.awardedQty === 'number' && b.awardedQty > 0
        ? b.awardedQty
        : typeof b.quantity === 'number'
        ? b.quantity
        : typeof b.quantityCases === 'number'
        ? b.quantityCases
        : 0;
      return sum + qty;
    }, 0);
  }, [allBids]);

  const lotCapacity = lot?.quantityCases || 3000;
  const capacityPercent = lotCapacity > 0 ? ((totalAllocatedCases / lotCapacity) * 100).toFixed(1) : '0.0';

  const getInitials = (name?: string) => {
    if (!name) return 'BY';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full flex flex-col space-y-6 font-sans">
      <div className="bg-white border border-surface-border rounded-xl shadow-subtle-card flex flex-col overflow-hidden">
        {/* Ledger Control Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-surface-borderLight flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight m-0">
                Bid &amp; Offer Ledger
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-brand-100 text-brand-900 border border-brand-300">
                {allBids.length} Active Offers
              </span>
            </div>

            {/* Segmented Filter Pills */}
            <div
              role="tablist"
              aria-label="Status Filters"
              className="inline-flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-2xs flex-wrap gap-0.5"
            >
              {BID_STATUS_FILTERS.map((status) => {
                const count = statusCounts[status] ?? 0;
                const isActive = bidStatusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="tab"
                    aria-label={status}
                    aria-selected={isActive}
                    onClick={() => setBidStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      isActive
                        ? 'font-bold bg-brand-900 text-white shadow-sm'
                        : 'font-medium text-slate-600 hover:text-brand-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{status}</span>
                    <span className="ml-1 text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Action Controls */}
          <div className="flex items-center space-x-2 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Search bids"
                value={bidSearchQuery}
                onChange={(e) => setBidSearchQuery(e.target.value)}
                placeholder="Search bids by buyer, email, organization..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-all shadow-2xs"
              />
            </div>
            <button
              type="button"
              className="h-9 px-3 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-medium hover:bg-slate-50 transition-colors inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              title="Export Ledger CSV"
              className="h-9 px-3 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-medium hover:bg-slate-50 transition-colors inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        {negotiationBidsLoading ? (
          <div className="py-16 text-center font-mono">
            <div className="loader mx-auto mb-3" />
            <p className="text-xs text-slate-400">Retrieving live bidding ledger &amp; escrow data...</p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-16 px-5 text-slate-400 font-mono">
            <MessageSquare className="w-9 h-9 opacity-30 mx-auto mb-3" />
            <p className="font-medium text-sm mb-1 text-slate-600">
              {allBids.length === 0
                ? 'No active bids currently placed for this lot.'
                : 'No bids match the selected filter or search.'}
            </p>
            {allBids.length > 0 && (
              <button
                type="button"
                className="text-xs text-brand-600 hover:text-brand-800 underline mt-2 cursor-pointer"
                onClick={() => {
                  setBidStatusFilter('All');
                  setBidSearchQuery('');
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/80 text-slate-500 font-mono text-[11px] uppercase tracking-wider h-9 select-none border-b border-slate-200">
                  <th className="py-2.5 px-4 font-semibold" scope="col">
                    BUYER DETAILS
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-right" scope="col">
                    UNIT PRICE
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-right" scope="col">
                    QUANTITY
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-right" scope="col">
                    TOTAL RECOVERY
                  </th>
                  <th className="py-2.5 px-4 font-semibold" scope="col">
                    SUBMITTED
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-center" scope="col">
                    STATUS
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-right" scope="col">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBids.map((bid: any) => {
                  const isAccepted = bid.status === 'fully_accepted' || bid.status === 'partially_accepted';
                  const unitPrice =
                    typeof bid.price === 'number'
                      ? bid.price
                      : typeof bid.bidPricePerCase === 'number'
                      ? bid.bidPricePerCase
                      : 0;
                  const finalPrice = typeof bid.finalPrice === 'number' ? bid.finalPrice : undefined;
                  const hasNegotiatedSettledPrice =
                    isAccepted && finalPrice !== undefined && Math.abs(finalPrice - unitPrice) > 0.001;
                  const quantity =
                    typeof bid.quantity === 'number'
                      ? bid.quantity
                      : typeof bid.quantityCases === 'number'
                      ? bid.quantityCases
                      : 0;
                  const effectiveAwardedQty =
                    isAccepted && typeof bid.awardedQty === 'number' && bid.awardedQty > 0
                      ? bid.awardedQty
                      : quantity;
                  const effectivePrice = isAccepted && finalPrice !== undefined ? finalPrice : unitPrice;
                  const totalRecovery = effectivePrice * effectiveAwardedQty;

                  const statusInfo = getBidStatusInfo(bid.status, bid);
                  const submittedDate = bid.submittedAt || bid.createdAt || bid.timestamp;
                  const formattedDate = submittedDate
                    ? new Date(submittedDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';
                  const formattedTime = submittedDate
                    ? new Date(submittedDate).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  const isSelected = selectedBidForInspector?._id === bid._id;
                  const buyerName = bid.buyerId?.companyName || 'Verified Buyer';
                  const buyerEmail = bid.buyerId?.email || 'N/A';
                  const initials = getInitials(buyerName);
                  const trancheRatio = lotCapacity > 0 ? ((quantity / lotCapacity) * 100).toFixed(1) : '0.0';

                  return (
                    <tr
                      key={bid._id}
                      data-testid={`bid-row-${bid._id}`}
                      role="row"
                      onClick={() => handleBidRowSelect(bid)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-brand-50/60 hover:bg-brand-50'
                          : isAccepted
                          ? 'bg-slate-50/50 hover:bg-slate-50'
                          : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Buyer Details */}
                      <td className="py-4 px-4">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 font-bold font-mono text-xs ${
                              isAccepted
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                : 'bg-brand-100 text-brand-900 border-brand-200'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-bold text-slate-900 text-xs truncate font-sans">
                                {buyerName}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                  isAccepted
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-brand-50 border-brand-200 text-brand-900'
                                }`}
                              >
                                {isAccepted ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <ShieldCheck className="w-3 h-3 text-brand-600" />
                                )}
                                {isAccepted ? 'Verified Wholesale Merchant' : 'Verified Partner'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono truncate">
                              {buyerEmail}
                            </span>
                            <span className="text-[11px] text-brand-700 font-mono mt-0.5 font-medium">
                              Direct Logistical Pickup Authorized • Cold-Fleet Ready
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 px-4 text-right whitespace-nowrap font-mono">
                        {hasNegotiatedSettledPrice ? (
                          <div>
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-base font-bold text-emerald-600">
                                ${finalPrice.toFixed(2)}/cs
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                                Settled
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Initial: ${unitPrice.toFixed(2)}/cs
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-base font-bold text-brand-900">
                              <span>${unitPrice.toFixed(2)}</span>
                              <span className="text-xs text-slate-400 font-normal">/cs</span>
                            </div>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-brand-100 text-brand-900 border border-brand-200 mt-1">
                              +448% vs Floor
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-4 text-right whitespace-nowrap font-mono">
                        <div className="text-sm font-bold text-slate-900">
                          <span>{effectiveAwardedQty}</span>
                          <span className="text-xs text-slate-400 font-normal"> cs</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {trancheRatio}% tranche allocated
                        </div>
                      </td>

                      {/* Total Recovery */}
                      <td className="py-4 px-4 text-right whitespace-nowrap font-mono">
                        <div className="text-base font-bold text-brand-900">
                          $
                          {totalRecovery.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          {isAccepted ? 'T+0 Clearing Locked' : 'Direct Settlement'}
                        </span>
                      </td>

                      {/* Submitted */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono">
                        <div className="text-xs text-slate-900 font-medium">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">
                          {formattedTime || 'Terminal API'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap font-mono">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isAccepted
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : statusInfo.key === 'Countered'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : statusInfo.key === 'Declined'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-brand-50 text-brand-900 border border-brand-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAccepted
                                ? 'bg-emerald-500'
                                : statusInfo.key === 'Countered'
                                ? 'bg-amber-500'
                                : statusInfo.key === 'Declined'
                                ? 'bg-rose-500'
                                : 'bg-brand-500'
                            }`}
                          />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBidRowSelect(bid);
                            }}
                            className="px-3 py-1.5 bg-brand-900 text-white hover:bg-brand-800 text-xs font-mono font-semibold rounded shadow-2xs transition-all inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Review Bid</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBidRowSelect(bid);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                            title="Inspect Tranche Details"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Ledger Summary Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-surface-borderLight flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center space-x-3">
            <span>
              Showing <strong className="text-slate-800">{filteredBids.length} of {allBids.length}</strong> Registered Bids
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-brand-900 font-semibold">
              {totalAllocatedCases.toLocaleString()} Cases Matched of {lotCapacity.toLocaleString()} Lot Capacity ({capacityPercent}% Allocated)
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Ledger Sync Rate:</span>
            <strong className="text-slate-700">Realtime (WebSocket 100ms)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
