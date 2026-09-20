import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Package, DollarSign } from 'lucide-react';
import type { SalesModernTableProps, SalesRecord } from '../types/ingestion.types';
import { SalesRowInspectionDrawer } from './SalesRowInspectionDrawer';

export const SalesModernTable: React.FC<SalesModernTableProps> = ({
  records,
  expandedRowIds,
  onToggleRow,
  onReconcileInvoice,
  onAuthorizeDockGatePass,
  onLiveFleetTelemetry,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  totalCount,
}) => {
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPricePerCase = (price?: number) => {
    if (price === undefined || price === null) return '$0.00/cs';
    return `$${price.toFixed(2)}/cs`;
  };

  const formatQuantity = (qty?: number) => {
    if (qty === undefined || qty === null) return '0 cs';
    return `${qty.toLocaleString('en-US')} cs`;
  };

  const formatDateRecorded = (dateStr?: string) => {
    if (!dateStr) return 'Rec: 09/18/26';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `Rec: ${dateStr}`;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `Rec: ${mm}/${dd}/${yy}`;
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('settled') || s.includes('completed')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          Settled
        </span>
      );
    }
    if (s.includes('escrow') || s.includes('pending')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          Pending Escrow
        </span>
      );
    }
    if (s.includes('invoiced')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
          Invoiced
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
        {status || 'Active'}
      </span>
    );
  };

  if (records.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200/80 shadow-xs text-center text-slate-500 text-xs">
        <DollarSign className="w-9 h-9 opacity-30 mx-auto mb-3" />
        No sales records found matching your current filter criteria.
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl shadow-xs overflow-hidden mb-6 border border-slate-200/80"
      id="sales-modern-table"
    >
      {/* Table Header Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900">
            Reconciled Sales Registry ({records.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
          <span className="hover:underline cursor-pointer">SKU</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Lot #</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Buyer Node</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Warehouse / DC</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Revenue</span>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Wrapper */}
      <div className="overflow-x-auto">
        <div className="min-w-[1050px]">
          {/* Column Header Row */}
          <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-wider items-center border-b border-slate-200/80 select-none">
            <div className="col-span-2 flex items-center gap-1">
              <span>PRODUCT / SKU</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 flex items-center gap-1">
              <span>LOT NUMBER</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <span>BUYER / CUSTOMER</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <span>DISTRIBUTION CENTER</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <span>QTY SOLD</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <span>PRICE DETAILS</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <span>TOTAL REVENUE</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 text-center">
              <span>DATES</span>
            </div>
            <div className="col-span-1 text-center">
              <span>INSPECT</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {records.map((record: SalesRecord) => {
              const isExpanded = expandedRowIds.has(record._id);

              const productName = record.productName || record.description || record.product || 'Surplus Sales Item';
              const sku = record.sku || record.productId || 'SKU-GEN';
              const lotNumber = record.lotNumber || record['Lot Number'] || record.lot || record.lotNo || '#001';
              const buyerCompany = record.buyerCompany || record.buyerName || record.customer || 'Enterprise Liquidator';
              const buyerNode = record.buyerNode || 'Regional Outlet';
              const dcName = record.warehouse || record.dc || record.location || 'Logistics Hub Central';
              const dockType = record.dockType || record.storageTemp || 'Ambient Freight';
              const qtySold = record.quantitySold ?? record.quantity ?? 0;
              const pricePerCase = record.pricePerCase ?? record.unitPrice ?? record.price ?? 0;
              const revenue = record.totalRevenue ?? record.totalValue ?? (qtySold * pricePerCase);

              return (
                <div
                  key={record._id}
                  className="lot-row group transition-colors hover:bg-slate-50/60 cursor-pointer"
                  onClick={() => onToggleRow(record._id)}
                >
                  {/* Master Clickable Row Header */}
                  <div className="grid grid-cols-12 px-4 py-3 items-center select-none text-[12px]">
                    {/* 1. PRODUCT / SKU */}
                    <div className="col-span-2 min-w-0 pr-2">
                      <div className="font-semibold text-[13px] text-slate-900 truncate leading-tight">
                        {productName}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          SKU: {sku}
                        </span>
                        {(record.invoiceNumber || record.contractNumber) && (
                          <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {record.invoiceNumber || record.contractNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. LOT NUMBER */}
                    <div className="col-span-1 font-mono text-blue-600 font-bold text-[12px]">
                      {lotNumber}
                    </div>

                    {/* 3. BUYER / CUSTOMER */}
                    <div className="col-span-2 min-w-0 pr-2">
                      <div className="font-medium text-slate-800 text-[13px] truncate">
                        {buyerCompany}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {buyerNode}
                      </div>
                    </div>

                    {/* 4. DISTRIBUTION CENTER */}
                    <div className="col-span-2 min-w-0 pr-2">
                      <div className="text-slate-800 text-[12px] truncate font-medium">
                        {dcName}
                      </div>
                      <div className="mt-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-blue-700 font-medium font-sans">
                          {dockType}
                        </span>
                      </div>
                    </div>

                    {/* 5. QTY SOLD */}
                    <div className="col-span-1 text-right font-mono font-semibold text-slate-900 text-[12.5px]">
                      {formatQuantity(qtySold)}
                    </div>

                    {/* 6. PRICE DETAILS */}
                    <div className="col-span-1 text-right font-mono text-slate-700 text-[12.5px]">
                      {formatPricePerCase(pricePerCase)}
                    </div>

                    {/* 7. TOTAL REVENUE */}
                    <div className="col-span-1 text-right font-mono font-bold text-slate-900 text-[13px]">
                      {formatCurrency(revenue)}
                    </div>

                    {/* 8. DATES & STATUS */}
                    <div className="col-span-1 text-center flex flex-col items-center gap-1">
                      <div className="text-[10px] font-mono text-slate-500">
                        {formatDateRecorded(record.dateRecorded || record.saleDate || record.createdAt)}
                      </div>
                      {getStatusBadge(record.status)}
                    </div>

                    {/* 9. INSPECT CHEVRON */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        aria-label="Inspect row detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRow(record._id);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-200/80 transition-colors text-slate-500 cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-blue-600' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Progressive Inspection Drawer directly underneath row */}
                  {isExpanded && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <SalesRowInspectionDrawer
                        record={record}
                        onReconcileInvoice={onReconcileInvoice}
                        onAuthorizeDockGatePass={onAuthorizeDockGatePass}
                        onLiveFleetTelemetry={onLiveFleetTelemetry}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination & Count Footer */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing{' '}
          <strong className="text-slate-800 font-semibold font-mono">
            {(totalCount ?? records.length) === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-slate-800 font-semibold font-mono">
            {Math.min(totalCount ?? records.length, currentPage * pageSize)}
          </strong>{' '}
          of{' '}
          <strong className="text-slate-800 font-semibold font-mono">
            {totalCount ?? records.length} Sales Records
          </strong>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="sales-page-size" className="text-slate-500 text-xs">
              Page size:
            </label>
            <select
              id="sales-page-size"
              data-testid="sales-page-size-select"
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
