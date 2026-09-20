import React from 'react';
import { Search, ChevronDown, RotateCcw } from 'lucide-react';
import type { InventoryFilterBarProps } from '../types/ingestion.types';

export const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({
  className = '',
  search,
  supplier,
  dc,
  category,
  status,
  suppliersList,
  dcsList,
  categoriesList,
  statusesList,
  onSearchChange,
  onSupplierChange,
  onDCChange,
  onCategoryChange,
  onStatusChange,
  onClearFilters,
}) => {
  const isFiltered = Boolean(search || supplier || dc || category || status);

  return (
    <div
      className={`bg-slate-50/80 rounded-xl shadow-xs p-3.5 mb-4 border border-slate-200/80 ${className}`}
      id="inventory-filter-bar"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Search Product */}
        <div className="flex flex-col">
          <label
            htmlFor="filter-inv-search"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Search Product
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              id="filter-inv-search"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search SKU, product description..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 text-[12.5px] border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs transition-colors"
            />
          </div>
        </div>

        {/* 2. Supplier */}
        <div className="flex flex-col">
          <label
            htmlFor="filter-inv-supplier"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Supplier
          </label>
          <div className="relative flex items-center">
            <select
              id="filter-inv-supplier"
              value={supplier}
              onChange={(e) => onSupplierChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white text-slate-900 text-[12.5px] border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="">All Suppliers</option>
              {suppliersList.map((sup) => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 3. Distribution Center */}
        <div className="flex flex-col">
          <label
            htmlFor="filter-inv-dc"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Distribution Center
          </label>
          <div className="relative flex items-center">
            <select
              id="filter-inv-dc"
              value={dc}
              onChange={(e) => onDCChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white text-slate-900 text-[12.5px] border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="">All Warehouses</option>
              {dcsList.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 4. Category */}
        <div className="flex flex-col">
          <label
            htmlFor="filter-inv-cat"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Category
          </label>
          <div className="relative flex items-center">
            <select
              id="filter-inv-cat"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white text-slate-900 text-[12.5px] border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 5. Status */}
        <div className="flex flex-col">
          <label
            htmlFor="filter-inv-status"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Status
          </label>
          <div className="relative flex items-center">
            <select
              id="filter-inv-status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white text-slate-900 text-[12.5px] border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="">All Statuses</option>
              {statusesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Clear Filters Row */}
      {isFiltered && (
        <div className="flex justify-end mt-3 pt-2 border-t border-slate-200/60">
          <button
            type="button"
            onClick={onClearFilters}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
