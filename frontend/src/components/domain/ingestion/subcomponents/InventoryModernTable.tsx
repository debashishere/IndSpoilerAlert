import React from 'react';
import { Thermometer, Snowflake, ChevronRight, AlertTriangle } from 'lucide-react';
import type { InventoryModernTableProps } from '../types/ingestion.types';
import { InventoryRowInspectionDrawer } from './InventoryRowInspectionDrawer';

export const InventoryModernTable: React.FC<InventoryModernTableProps> = ({
  lots,
  expandedRowIds,
  onToggleRow,
  onOpenLotHub,
  onOpenRiskModal,
  onOpenComplianceModal,
}) => {
  const calculateDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateRslRatio = (lot: any) => {
    if (typeof lot.remainingShelfLife === 'number') {
      return Math.round(lot.remainingShelfLife <= 1 ? lot.remainingShelfLife * 100 : lot.remainingShelfLife);
    }
    const daysRemaining = calculateDaysRemaining(lot.expirationDate);
    let totalShelfDays = lot.productId?.shelfLifeDays || lot.shelfLifeDays || 120;
    return Math.max(0, Math.min(100, Math.round((daysRemaining / totalShelfDays) * 100)));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  return (
    <div
      className="bg-white rounded-xl shadow-xs overflow-hidden mb-6 border border-slate-200/80"
      id="inventory-modern-table"
    >
      {/* Table Header Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900">
            Registered Inventory ({lots.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
          <span className="hover:underline cursor-pointer">SKU</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Brand</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Sub-Category</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Storage Temp</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Expiration & RSL</span>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Wrapper */}
      <div className="overflow-x-auto">
        <div className="min-w-[1150px]">
          {/* Column Header Row */}
          <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-wider items-center border-b border-slate-200/80">
            <div className="col-span-3 flex items-center gap-1">
              <span>PRODUCT / SKU</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 flex items-center gap-1">
              <span>SUPPLIER</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 flex items-center gap-1">
              <span>DISTRIBUTION CENTER</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-2 flex items-center justify-center gap-1">
              <span>EXPIRATION & RSL</span>
              <span className="text-[10px] text-slate-700">↑</span>
            </div>
            <div className="col-span-1 text-center">
              <span>STORAGE TEMP</span>
            </div>
            <div className="col-span-1 text-center flex items-center justify-center gap-1">
              <span>QUANTITY CASES</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <span>PRICE DETAILS</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </div>
            <div className="col-span-1 text-center">
              <span>CREATE DATE</span>
            </div>
            <div className="col-span-1 text-right">
              <span>STATUS</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {lots.map((lot) => {
              const isExpanded = expandedRowIds.has(lot._id);
              const rslRatio = calculateRslRatio(lot);
              const daysRemaining = calculateDaysRemaining(lot.expirationDate);
              const isExpired = daysRemaining === 0 || (lot.expirationDate && new Date(lot.expirationDate).getTime() <= Date.now());

              const availableQty = lot.availableQty ?? 0;
              const totalCases = lot.totalCases ?? availableQty;
              const costPerCase = lot.costPerCase ?? 0;
              const listPrice = lot.standardSellPrice ?? lot.productId?.standardSellPrice ?? 0;
              const totalCost = availableQty * costPerCase;

              const description = lot.productId?.description || lot.description || lot.productName || 'Surplus Inventory Lot';
              const sku = lot.productId?.sku || lot.sku || 'N/A';
              const brand = lot.productId?.brand || lot.brand;
              const category = lot.productId?.category || lot.category;
              const subCategory = lot.productId?.subCategory || lot.subCategory;
              const lotNumber = lot.lotNumber || lot.batchNumber || 'LOT-UNSET';

              const supplierName = lot.supplierId?.name || lot.supplier || 'Direct Supplier';
              const dcName = lot.distributionCenterId?.name || lot.warehouse || lot.location || 'Hub Central';

              const tempMin = lot.temperatureMin ?? 34;
              const tempMax = lot.temperatureMax ?? 38;

              // Status presentation
              const statusLower = (lot.status || '').toLowerCase();
              let statusLabel = 'ACTIVE LIST';
              let statusColorClass = 'text-blue-600';

              if (statusLower === 'sold') {
                statusLabel = 'SOLD';
                statusColorClass = 'text-emerald-600';
              } else if (statusLower === 'critical' || statusLower === 'critical rsl') {
                statusLabel = 'CRITICAL RSL';
                statusColorClass = 'text-rose-600';
              } else if (statusLower === 'urgent' || statusLower === 'urgent rsl') {
                statusLabel = 'URGENT RSL';
                statusColorClass = 'text-amber-600';
              } else if (statusLower === 'stable' || statusLower === 'stable rsl') {
                statusLabel = 'STABLE RSL';
                statusColorClass = 'text-emerald-600';
              } else if (lot.status) {
                statusLabel = lot.status.toUpperCase();
              }

              return (
                <div
                  key={lot._id}
                  className="lot-row group transition-colors hover:bg-slate-50/60 cursor-pointer"
                  onClick={() => onToggleRow(lot._id)}
                >
                  {/* Master Clickable Row Header */}
                  <div className="grid grid-cols-12 px-4 py-3 items-center select-none text-[12px]">
                    {/* 1. PRODUCT / SKU */}
                    <div className="col-span-3 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-blue-600' : ''
                          }`}
                        />
                        <span className="font-semibold text-[13px] text-slate-900 leading-tight truncate">
                          {description}
                        </span>
                      </div>

                      {/* SKU & Brand Pills */}
                      <div className="flex items-center gap-1.5 mt-1 ml-5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-medium">
                          {sku}
                        </span>
                        {brand && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-700 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {brand}
                          </span>
                        )}
                      </div>

                      {/* Category Badges & Lot */}
                      <div className="flex items-center gap-1.5 mt-1 ml-5 flex-wrap">
                        {category && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                            {category}
                          </span>
                        )}
                        {subCategory && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            {subCategory}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5 ml-5">
                        Lot: {lotNumber}
                      </div>
                    </div>

                    {/* 2. SUPPLIER */}
                    <div className="col-span-1 text-slate-800 text-[12px] font-medium truncate pr-1">
                      {supplierName}
                    </div>

                    {/* 3. DISTRIBUTION CENTER */}
                    <div className="col-span-1 text-slate-600 text-[11px] leading-tight pr-1">
                      <div className="font-medium text-slate-800 truncate">{dcName}</div>
                    </div>

                    {/* 4. EXPIRATION & RSL */}
                    <div className="col-span-2 px-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Exp: <span className="font-mono text-slate-900">{formatDate(lot.expirationDate)}</span>
                        </span>
                        <span className={`flex items-center gap-0.5 font-bold text-[11px] ${
                          isExpired || rslRatio <= 15 ? 'text-rose-600' : rslRatio <= 40 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {isExpired ? 'Expired' : `${daysRemaining}d left`}
                        </span>
                      </div>
                      {/* RSL Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full my-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isExpired || rslRatio <= 15 ? 'bg-rose-500' : rslRatio <= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${rslRatio}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Mfg: {formatDate(lot.productionDate)}
                      </div>
                    </div>

                    {/* 5. STORAGE TEMP */}
                    <div className="col-span-1 text-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-800">
                        {tempMin <= 38 ? (
                          <Snowflake className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{tempMin}°F to {tempMax}°F</span>
                      </div>
                    </div>

                    {/* 6. QUANTITY CASES */}
                    <div className="col-span-1 text-center font-mono">
                      <div className="font-bold text-[13px] text-slate-900">
                        {availableQty.toLocaleString()} cases
                      </div>
                      <div className="text-[10px] text-slate-400">
                        of {totalCases.toLocaleString()} cs total
                      </div>
                    </div>

                    {/* 7. PRICE DETAILS */}
                    <div className="col-span-1 text-right font-mono text-[11px] leading-tight pr-1">
                      <div className="text-slate-500">
                        Cost: <span className="font-bold text-slate-900">${costPerCase.toFixed(2)}</span>/cs
                      </div>
                      {listPrice > 0 && (
                        <div className="text-slate-400">
                          List: ${listPrice.toFixed(2)}/cs
                        </div>
                      )}
                      <div className="text-slate-500 font-semibold mt-0.5">
                        Total: <span className="text-slate-900">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* 8. CREATE DATE */}
                    <div className="col-span-1 text-center font-mono text-[11px] text-slate-700">
                      {formatDate(lot.createdAt || lot.productionDate)}
                    </div>

                    {/* 9. STATUS */}
                    <div className="col-span-1 text-right flex flex-col items-end gap-1">
                      <span className={`text-[11px] font-bold ${statusColorClass}`}>
                        {statusLabel}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenRiskModal) onOpenRiskModal(lot);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/80 transition-colors shadow-2xs cursor-pointer"
                      >
                        Risk Details
                      </button>
                    </div>
                  </div>

                  {/* Progressive Inspection Drawer directly underneath row */}
                  {isExpanded && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <InventoryRowInspectionDrawer
                        lot={lot}
                        onOpenLotHub={onOpenLotHub}
                        onOpenComplianceModal={onOpenComplianceModal}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
