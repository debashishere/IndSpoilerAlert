import React from 'react';
import { Search, Hash, ChevronDown, RotateCcw } from 'lucide-react';
import type { SalesFilterBarProps } from '../types/ingestion.types';

export const SalesFilterBar: React.FC<SalesFilterBarProps> = ({
  className = '',
  search,
  lotNumber,
  buyer,
  dc,
  createDate,
  priceRange,
  status,
  clearingRecordCount,
  buyersList,
  dcsList,
  priceRangesList,
  statusesList,
  onSearchChange,
  onLotNumberChange,
  onBuyerChange,
  onDCChange,
  onCreateDateChange,
  onPriceRangeChange,
  onStatusChange,
  onClearFilters,
}) => {
  const hasActiveFilters = Boolean(
    search || lotNumber || buyer || dc || createDate || priceRange || status
  );

  return (
    <div
      className={`bg-slate-50 rounded-xl shadow-xs p-4 mb-4 border border-slate-200/80 space-y-3 ${className}`}
      id="panel-sales-filter-bar"
    >
      {/* Row 1: Primary Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Search Sales */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-sales-search"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Search Sales
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              search
            </span>
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden" />
            <input
              id="filter-sales-search"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search SKU, product, lot #, buyer name, email..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 text-[13px] border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* 2. Lot Number */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-sales-lot"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Lot Number
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              pin
            </span>
            <Hash className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden" />
            <input
              id="filter-sales-lot"
              type="text"
              value={lotNumber}
              onChange={(e) => onLotNumberChange(e.target.value)}
              placeholder="Search by Lot Number..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 text-[13px] border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* 3. Buyer */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-sales-buyer"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Buyer
          </label>
          <div className="relative">
            <select
              id="filter-sales-buyer"
              aria-label="Buyer"
              value={buyer}
              onChange={(e) => onBuyerChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-white text-slate-800 text-[13px] border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">All Buyers</option>
              {buyersList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              expand_more
            </span>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden" />
          </div>
        </div>

        {/* 4. Distribution Center */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-sales-dc"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Distribution Center
          </label>
          <div className="relative">
            <select
              id="filter-sales-dc"
              aria-label="Distribution Center"
              value={dc}
              onChange={(e) => onDCChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-white text-slate-800 text-[13px] border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">All Warehouses</option>
              {dcsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              expand_more
            </span>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden" />
          </div>
        </div>

        {/* 5. Create Date */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-sales-date"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Create Date
          </label>
          <div className="relative">
            <input
              id="filter-sales-date"
              aria-label="Create Date"
              type="text"
              value={createDate}
              onChange={(e) => onCreateDateChange(e.target.value)}
              placeholder="09/18/2026"
              className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 text-[13px] border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Price Range, Sales Status, Live ERP Clearing Badge, and Clear Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-slate-200/60 items-center">
        {/* Price Range */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-sales-price-select"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Price Range
          </label>
          <div className="relative">
            <select
              id="filter-sales-price-select"
              aria-label="Price Range"
              value={priceRange}
              onChange={(e) => onPriceRangeChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-white text-slate-800 text-[13px] border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">All Prices</option>
              {priceRangesList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              expand_more
            </span>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden" />
          </div>
        </div>

        {/* Sales Status */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-sales-status-select"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Sales Status
          </label>
          <div className="relative">
            <select
              id="filter-sales-status-select"
              aria-label="Sales Status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-white text-slate-800 text-[13px] border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statusesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              expand_more
            </span>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none hidden" />
          </div>
        </div>

        {/* Live ERP Clearing & Clear Filters */}
        <div className="lg:col-span-2 flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-3 py-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="material-symbols-outlined text-[15px] text-emerald-600 animate-pulse">
              sync_alt
            </span>
            <span>Live ERP Clearing Connected ({clearingRecordCount} records)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
