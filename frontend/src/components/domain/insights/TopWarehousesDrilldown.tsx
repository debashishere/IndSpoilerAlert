import React, { useState } from 'react';
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  Boxes,
  Upload,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab, type SalesWarehouseSummary } from '../../../store/slices/coreSlice';

export interface TopWarehousesDrilldownProps {
  topWarehouses?: SalesWarehouseSummary[];
  onOpenLotHub?: (lot: any) => void;
  onNavigateToIngestion?: () => void;
  expandedWarehouseIds?: Set<string>;
  onToggleExpand?: (warehouseKey: string) => void;
  searchQueries?: Record<string, string>;
  onSearchChange?: (warehouseKey: string, query: string) => void;
}

export const TopWarehousesDrilldown: React.FC<TopWarehousesDrilldownProps> = ({
  topWarehouses = [],
  onOpenLotHub,
  onNavigateToIngestion,
  expandedWarehouseIds: controlledExpandedWarehouseIds,
  onToggleExpand: controlledToggleExpand,
  searchQueries: controlledSearchQueries,
  onSearchChange: controlledSearchChange,
}) => {
  const dispatch = useDispatch();
  // Internal fallback state if uncontrolled
  const [internalExpandedWarehouseIds, setInternalExpandedWarehouseIds] = useState<Set<string>>(
    new Set()
  );
  const [internalSearchQueries, setInternalSearchQueries] = useState<Record<string, string>>({});

  const expandedWarehouseIds =
    controlledExpandedWarehouseIds !== undefined
      ? controlledExpandedWarehouseIds
      : internalExpandedWarehouseIds;
  const searchQueries =
    controlledSearchQueries !== undefined ? controlledSearchQueries : internalSearchQueries;

  const handleIngestClick = () => {
    if (onNavigateToIngestion) {
      onNavigateToIngestion();
    } else {
      dispatch(setActiveTab('ingestion'));
    }
  };

  const toggleExpand = (warehouseKey: string) => {
    if (controlledToggleExpand) {
      controlledToggleExpand(warehouseKey);
    } else {
      setInternalExpandedWarehouseIds((prev) => {
        const next = new Set(prev);
        if (next.has(warehouseKey)) {
          next.delete(warehouseKey);
        } else {
          next.add(warehouseKey);
        }
        return next;
      });
    }
  };

  const handleSearchChange = (warehouseKey: string, query: string) => {
    if (controlledSearchChange) {
      controlledSearchChange(warehouseKey, query);
    } else {
      setInternalSearchQueries((prev) => ({
        ...prev,
        [warehouseKey]: query,
      }));
    }
  };

  if (!topWarehouses || topWarehouses.length === 0) {
    return (
      <div
        data-testid="top-warehouses-empty-state"
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center shadow-xs"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          No Warehouse Clearing Activity Recorded
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
          There are no warehouse fulfillment transactions matching the current timeframe and filters.
        </p>
        <button
          type="button"
          onClick={handleIngestClick}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Ingest Sales Data</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="top-warehouses-accordion-list">
      {topWarehouses.map((wh, idx) => {
        const warehouseKey = wh.warehouse ? `warehouse-${idx + 1}` : `warehouse-${idx + 1}`;
        const isExpanded = expandedWarehouseIds.has(warehouseKey);
        const query = (searchQueries[warehouseKey] || '').toLowerCase().trim();

        const filteredTransactions = (wh.transactions || []).filter((tx) => {
          if (!query) return true;
          return (
            tx.sku?.toLowerCase().includes(query) ||
            tx.lotNumber?.toLowerCase().includes(query) ||
            tx.product?.toLowerCase().includes(query) ||
            tx.invoiceNumber?.toLowerCase().includes(query) ||
            tx.buyer?.toLowerCase().includes(query) ||
            tx.brand?.toLowerCase().includes(query)
          );
        });

        return (
          <div
            key={warehouseKey}
            data-testid={`warehouse-card-${warehouseKey}`}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200"
          >
            {/* Summary Card Header / Trigger */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(warehouseKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(warehouseKey);
                }
              }}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors select-none"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Rank Badge */}
                <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/70 shrink-0">
                  #{wh.rank || idx + 1}
                </span>

                {/* Warehouse Name & Location */}
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate m-0">
                      {wh.warehouse}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {(wh.recoveryPct ?? 0).toFixed(1)}% Recovery
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {wh.transactionCount}{' '}
                      {wh.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Boxes className="w-3 h-3 text-slate-400" />
                      {(wh.casesCleared ?? 0).toLocaleString()} cases
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics Columns & Accordion Caret */}
              <div className="flex items-center gap-6 self-end md:self-center shrink-0">
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Cleared Revenue
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      ${(wh.clearedRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="border-l border-slate-200 dark:border-slate-800 pl-5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Cases Cleared
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {(wh.casesCleared ?? 0).toLocaleString()} cases
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                  )}
                </div>
              </div>
            </div>

            {/* Accordion Content: Child Transaction Ledger */}
            {isExpanded && (
              <div
                data-testid={`warehouse-transactions-panel-${warehouseKey}`}
                className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2"
              >
                {/* Embedded In-Table Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter transactions by SKU, Lot #, Product, or Buyer..."
                      value={searchQueries[warehouseKey] || ''}
                      onChange={(e) => handleSearchChange(warehouseKey, e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs placeholder:text-slate-400"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Showing {filteredTransactions.length} of {(wh.transactions || []).length}{' '}
                    transactions
                  </span>
                </div>

                {/* Transaction Ledger Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-3 uppercase tracking-wider whitespace-nowrap">Sale Date</th>
                        <th className="py-3 px-3 uppercase tracking-wider whitespace-nowrap">Invoice / Lot #</th>
                        <th className="py-3 px-3 uppercase tracking-wider whitespace-nowrap">Product Description &amp; Brand</th>
                        <th className="py-3 px-3 uppercase tracking-wider whitespace-nowrap">Purchasing Buyer</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-right whitespace-nowrap">Cases Cleared</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-right whitespace-nowrap">Price/Case</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-right whitespace-nowrap">Cleared Revenue</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-right whitespace-nowrap">Recovery %</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-center whitespace-nowrap">Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            No transactions matched the search query.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* Sale Date */}
                            <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                              {tx.saleDate ? new Date(tx.saleDate).toLocaleDateString() : '—'}
                            </td>

                            {/* Invoice / Lot # (with onOpenLotHub) */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                {tx.lotNumber ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onOpenLotHub) {
                                        onOpenLotHub({
                                          _id: tx.lotId || tx.lotNumber,
                                          lotNumber: tx.lotNumber,
                                          productName: tx.product,
                                          sku: tx.sku,
                                          brand: tx.brand,
                                          quantityCases: tx.quantityCases,
                                          facility: tx.warehouse,
                                        });
                                      }
                                    }}
                                    className="font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 text-[11px] font-semibold text-left cursor-pointer"
                                    title="Open in Lot Operations Hub"
                                  >
                                    <span>{tx.lotNumber}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <span className="font-mono text-slate-400 text-[11px]">—</span>
                                )}
                                {tx.invoiceNumber && (
                                  <span className="text-[10px] text-slate-400">
                                    Inv: {tx.invoiceNumber}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Product Description & Brand */}
                            <td className="py-3 px-3 max-w-[220px]">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {tx.product}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                  {tx.brand && <span>{tx.brand}</span>}
                                  {tx.sku && <span className="font-mono">{tx.sku}</span>}
                                </div>
                              </div>
                            </td>

                            {/* Purchasing Buyer */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {tx.buyer || 'Direct Closeout'}
                                </span>
                                {tx.buyerSegment && (
                                  <span className="text-[10px] text-slate-400">
                                    {tx.buyerSegment}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Cases Cleared */}
                            <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              {(tx.quantityCases ?? 0).toLocaleString()}
                            </td>

                            {/* Price / Case */}
                            <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              ${(tx.pricePerCase ?? 0).toFixed(2)}
                            </td>

                            {/* Cleared Revenue */}
                            <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                              ${(tx.revenue ?? (tx.quantityCases * tx.pricePerCase)).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            {/* Recovery % */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {tx.recoveryPct !== undefined ? (
                                <span
                                  className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                                    tx.recoveryPct >= 80
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : tx.recoveryPct >= 60
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {tx.recoveryPct.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Delivery Status */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {tx.status === 'delivered' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Delivered
                                </span>
                              ) : tx.status === 'in_transit' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                  <Truck className="w-3 h-3" />
                                  In Transit
                                </span>
                              ) : tx.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {tx.status || 'Reconciled'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
