import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tag, DollarSign, Award, Clock, Search, ChevronRight, ChevronDown } from 'lucide-react';
import type { RootState } from '../../../store';
import { fetchAllBidsThunk } from '../../../services/inventoryService';

export const BiddingDataView: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const dispatch = useDispatch();
  const { allBids, allBidsLoading, inventoryList } = useSelector((state: RootState) => state.inventory);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchAllBidsThunk() as any);
  }, [dispatch]);

  const filteredBids = (allBids || []).filter((bid: any) => {
    const lot = bid.listingId?.opportunityId?.lotId || bid.inventoryLotId;
    const prod = lot?.productId;
    const buyer = bid.buyerId;

    const matchesSearch =
      !searchTerm ||
      prod?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && (bid.status === 'pending' || bid.status === 'submitted')) ||
      (statusFilter === 'awarded' && (bid.status === 'awarded' || bid.status === 'fully_accepted')) ||
      (statusFilter === 'countered' && (bid.status === 'countered' || bid.status === 'partially_accepted')) ||
      (statusFilter === 'rejected' && bid.status === 'rejected');

    return matchesSearch && matchesStatus;
  });

  const totalBidsCount = (allBids || []).length;
  const totalBidsValue = (allBids || []).reduce((sum: number, b: any) => {
    const qty = b.quantity || b.quantityCases || 0;
    const price = b.price || b.proposedPrice || 0;
    return sum + qty * price;
  }, 0);

  const pendingBidsCount = (allBids || []).filter(
    (b: any) => b.status === 'pending' || b.status === 'submitted' || b.status === 'countered'
  ).length;
  const awardedValue = (allBids || [])
    .filter((b: any) => b.status === 'awarded' || b.status === 'fully_accepted')
    .reduce((sum: number, b: any) => sum + (b.quantity || 0) * (b.price || 0), 0);

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || 'pending').toLowerCase();
    if (s === 'awarded' || s === 'fully_accepted') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 capitalize">
          {statusStr.replace('_', ' ')}
        </span>
      );
    }
    if (s === 'countered' || s === 'partially_accepted') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 capitalize">
          {statusStr.replace('_', ' ')}
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 capitalize">
          {statusStr.replace('_', ' ')}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 capitalize">
        {statusStr.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-5" id="insight-bidding-panel">
      {/* 1. Operational Telemetry Cards Grid (Matching Ingestion Standard) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5" id="bidding-telemetry-bar">
        {/* Card 1: Total Bids Received */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Bids Received
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                {totalBidsCount}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Active marketplace offers
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">sell</span>
            <Tag className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 2: Total Offer Pipeline Value */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Offer Pipeline Value
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                ${totalBidsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Gross bid dollar value
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              monetization_on
            </span>
            <DollarSign className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 3: Pending Evaluation */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Evaluation
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-amber-600 dark:text-amber-400 leading-none">
                {pendingBidsCount}
              </span>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Awaiting award or counter
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">schedule</span>
            <Clock className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 4: Awarded Revenue */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Awarded Revenue
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                ${awardedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Accepted buyer closeouts
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              military_tech
            </span>
            <Award className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* 2. Filter and Search Bar (Matching Ingestion Filter Bar) */}
      <div
        className="bg-slate-50/80 dark:bg-slate-900/80 rounded-xl shadow-xs p-3.5 border border-slate-200/80 dark:border-slate-800"
        id="bidding-filter-bar"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
          {/* Search input */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Search Bids &amp; Buyers
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-[12.5px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs transition-colors"
                placeholder="Search bids by product, SKU, buyer company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Bid Status
            </label>
            <div className="relative flex items-center">
              <select
                className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[12.5px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Bids</option>
                <option value="pending">Pending</option>
                <option value="countered">Countered</option>
                <option value="awarded">Awarded</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bidding Records Modern Table (Matching Ingestion Modern Table Standard) */}
      {allBidsLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center text-slate-500 dark:text-slate-400 text-xs">
          <div className="loader mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 m-0 mb-1">
            Loading active bidding data...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Synchronizing marketplace offers</p>
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
          <Tag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 m-0 mb-1">No Bids Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto m-0">
            {searchTerm || statusFilter !== 'all'
              ? 'No buyer bids match your search and filter criteria.'
              : 'There are no active bids submitted yet. Enable bidding on inventory lots or list offerings in the Marketplace to receive buyer offers.'}
          </p>
        </div>
      ) : (
        <div
          className="bg-white dark:bg-slate-900 rounded-xl shadow-xs overflow-hidden border border-slate-200/80 dark:border-slate-800 mb-6"
          id="bidding-modern-table"
        >
          {/* Table Header Bar */}
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                Marketplace Bids ({filteredBids.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <span className="hover:underline cursor-pointer">SKU</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Buyer</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Quantity</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Offer Value</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Status</span>
            </div>
          </div>

          {/* Responsive Horizontal Scroll Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Surplus Lot / SKU</th>
                  <th className="px-4 py-2.5">Buyer Company &amp; Contact</th>
                  <th className="px-4 py-2.5 text-center">Bid Quantity</th>
                  <th className="px-4 py-2.5 text-right">Offered Price</th>
                  <th className="px-4 py-2.5 text-right">Total Value</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-center">Date Placed</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-slate-900 dark:text-slate-100">
                {filteredBids.map((bid: any) => {
                  const lot =
                    bid.listingId?.opportunityId?.lotId ||
                    bid.inventoryLotId ||
                    inventoryList.find((l: any) => l._id === bid.lotId);
                  const prod = lot?.productId;
                  const buyer = bid.buyerId;
                  const qty = bid.quantity || bid.quantityCases || 0;
                  const price = bid.price || bid.proposedPrice || 0;
                  const total = qty * price;

                  const statusStr = bid.status || 'pending';

                  return (
                    <tr
                      key={bid._id}
                      className="border-b border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Lot / SKU */}
                      <td className="px-4 py-3">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                          {prod?.description || lot?.description || 'Surplus Inventory Lot'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          SKU: {prod?.sku || 'N/A'} <span className="text-slate-300 dark:text-slate-600">·</span>{' '}
                          {lot?.supplierId?.name || 'CPG Supplier'}
                        </div>
                      </td>

                      {/* Buyer */}
                      <td className="px-4 py-3">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {buyer?.companyName || buyer?.name || 'Retail Buyer'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {buyer?.email || bid.buyerEmail || 'buyer@example.com'}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {qty.toLocaleString()} cs
                        </span>
                      </td>

                      {/* Offered Price */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          ${price.toFixed(2)} / cs
                        </span>
                      </td>

                      {/* Total Value */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                          ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">{getStatusBadge(statusStr)}</td>

                      {/* Date */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {bid.submittedAt || bid.createdAt
                            ? new Date(bid.submittedAt || bid.createdAt).toLocaleDateString()
                            : 'Recent'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          {lot && onOpenLotHub && (
                            <button
                              type="button"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                              onClick={() => onOpenLotHub(lot)}
                            >
                              <span>Operation Hub</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiddingDataView;
