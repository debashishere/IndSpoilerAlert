import React from 'react';
import { Award, Search, MessageSquare } from 'lucide-react';
import { BID_STATUS_FILTERS } from '../../constants/lotOperationsConstants';
import { getBidStatusInfo } from '../../constants/lotPricingCalculations';
import type { useLotBidsTradingDesk } from '../../hooks/useLotBidsTradingDesk';

interface LotBidsTradingDeskProps {
  lot: any;
  bidsTradingDesk: ReturnType<typeof useLotBidsTradingDesk>;
}

export const LotBidsTradingDesk: React.FC<LotBidsTradingDeskProps> = ({
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

  return (
    <div className="w-full flex flex-col">
      <div className="lot-hub-card w-full p-0 overflow-hidden">
        {/* Card Header with Title, Status Filters, and Search */}
        <div className="lot-hub-card-header px-5 py-4 border-b border-[hsl(var(--border-color))] flex justify-between items-center flex-wrap gap-3">
          <div className="lot-hub-card-title flex items-center gap-2.5">
            <Award size={20} className="text-[hsl(var(--primary))]" />
            <h3 className="m-0 text-base font-bold text-[hsl(var(--text-primary))]">
              Bid & Offer ({filteredBids.length})
            </h3>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Tabs */}
            <div
              role="tablist"
              aria-label="Status Filters"
              className="flex gap-1 bg-[hsl(var(--bg-main))] p-1 rounded-lg border border-[hsl(var(--border-color))]"
            >
              {BID_STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={bidStatusFilter === status}
                  className={`btn btn-sm px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    bidStatusFilter === status ? 'btn-primary font-semibold' : 'btn-ghost'
                  }`}
                  onClick={() => setBidStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[220px]">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]"
              />
              <input
                type="text"
                aria-label="Search bids"
                placeholder="Search bids by buyer, email..."
                value={bidSearchQuery}
                onChange={(e) => setBidSearchQuery(e.target.value)}
                className="form-input pl-8 pr-3 py-1.5 text-xs rounded-lg w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-color))]"
              />
            </div>
          </div>
        </div>

        {/* List Body */}
        {negotiationBidsLoading ? (
          <div className="py-16 text-center">
            <div className="loader mx-auto mb-3" />
            <p className="text-xs text-[hsl(var(--text-muted))]">Retrieving live bidding dashboard...</p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-16 px-5 text-[hsl(var(--text-muted))]">
            <MessageSquare size={36} className="opacity-30 mx-auto mb-3" />
            <p className="font-medium text-sm mb-1">
              {allBids.length === 0
                ? 'No active bids currently placed for this lot.'
                : 'No bids match the selected filter or search.'}
            </p>
            {allBids.length > 0 && (
              <button
                className="btn btn-sm btn-ghost text-xs mt-2"
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
          <div className="flex flex-col">
            {/* List Header */}
            <div
              className="grid gap-3 px-5 py-3 bg-[hsl(var(--bg-main))] border-b border-[hsl(var(--border-color))] text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-secondary))]"
              style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr 1.2fr 1fr' }}
            >
              <div>Buyer Details</div>
              <div>Unit Price</div>
              <div>Quantity</div>
              <div>Total Recovery</div>
              <div>Submitted</div>
              <div className="text-right">Status</div>
            </div>

            {/* Bid Rows */}
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
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A';
              const isSelected = selectedBidForInspector?._id === bid._id;

              return (
                <div
                  key={bid._id}
                  data-testid={`bid-row-${bid._id}`}
                  role="row"
                  onClick={() => handleBidRowSelect(bid)}
                  className={`grid gap-3 items-center px-5 py-3.5 border-b border-[hsl(var(--border-color))] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[hsl(var(--bg-card-hover))]' : 'hover:bg-[hsl(var(--bg-main)/50%)]'
                  }`}
                  style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr 1.2fr 1fr' }}
                >
                  <div>
                    <div className="font-semibold text-sm text-[hsl(var(--text-primary))]">
                      {bid.buyerId?.companyName || 'Verified Buyer'}
                    </div>
                    <div className="text-xs text-[hsl(var(--text-muted))]">
                      {bid.buyerId?.email || 'N/A'}
                    </div>
                  </div>

                  <div>
                    {hasNegotiatedSettledPrice ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[hsl(var(--success))] text-sm">
                            ${finalPrice.toFixed(2)}/cs
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[hsla(var(--success),0.15)] text-[hsl(var(--success))] border border-[hsla(var(--success),0.3)] uppercase">
                            Settled
                          </span>
                        </div>
                        <div className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                          Initial: ${unitPrice.toFixed(2)}/cs
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-[hsl(var(--success))] text-sm">
                          ${unitPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-[hsl(var(--text-muted))]">/cs</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-[hsl(var(--text-primary))] text-xs">
                      {quantity}
                    </span>
                    <span className="text-xs text-[hsl(var(--text-muted))]"> cs</span>
                  </div>

                  <div>
                    <span className="font-bold text-[hsl(var(--text-primary))] text-sm">
                      $
                      {totalRecovery.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="text-xs text-[hsl(var(--text-secondary))]">
                    {formattedDate}
                  </div>

                  <div className="text-right">
                    <span
                      className={`badge ${statusInfo.className} text-xs px-2 py-1 rounded capitalize font-semibold`}
                      style={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.border}`,
                      }}
                    >
                      {statusInfo.label}
                    </span>
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
