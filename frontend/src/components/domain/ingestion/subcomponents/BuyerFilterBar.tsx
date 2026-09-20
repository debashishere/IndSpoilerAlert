import React from 'react';
import { Search, ChevronDown, RotateCcw } from 'lucide-react';
import type { BuyerFilterBarProps } from '../types/ingestion.types';

export const BuyerFilterBar: React.FC<BuyerFilterBarProps> = ({
  className = '',
  search,
  tier,
  status,
  showInactive,
  tiersList,
  statusesList,
  onSearchChange,
  onTierChange,
  onStatusChange,
  onShowInactiveChange,
  onClearFilters,
}) => {
  const isAnyFilterActive = Boolean(search || tier || status || showInactive);

  return (
    <div
      className={`bg-white rounded-xl shadow-xs p-4 mb-4 border border-slate-200 ${className}`}
      id="buyer-filter-bar"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* 1. Search Buyer */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-buyer-search"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Search Buyer
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="filter-buyer-search"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, company, email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* 2. Buyer Tier */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-buyer-tier"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Buyer Tier
          </label>
          <div className="relative">
            <select
              id="filter-buyer-tier"
              aria-label="Buyer Tier"
              value={tier}
              onChange={(e) => onTierChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">All Tiers</option>
              {tiersList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 3. Status & Channel */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filter-buyer-status"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Status & Channel
          </label>
          <div className="relative">
            <select
              id="filter-buyer-status"
              aria-label="Status & Channel"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">All Statuses</option>
              {statusesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 4. Show Inactive Buyers Checkbox & Clear Filters */}
        <div className="flex items-center justify-between gap-2 pb-1">
          <label
            htmlFor="filter-inactive-buyers"
            className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none py-1"
          >
            <input
              id="filter-inactive-buyers"
              type="checkbox"
              checked={showInactive}
              onChange={(e) => onShowInactiveChange(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <span>Show Inactive Buyers</span>
          </label>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
