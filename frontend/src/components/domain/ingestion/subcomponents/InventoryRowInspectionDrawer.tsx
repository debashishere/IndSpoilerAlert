import React, { useState } from 'react';
import { 
  ExternalLink, 
  Send, 
  FileCheck, 
  ShieldAlert, 
  Thermometer, 
  Calendar, 
  DollarSign, 
  Layers 
} from 'lucide-react';
import type { InventoryRowInspectionDrawerProps } from '../types/ingestion.types';

export const InventoryRowInspectionDrawer: React.FC<InventoryRowInspectionDrawerProps> = ({
  lot,
  onOpenLotHub,
  onOpenComplianceModal,
  onPushToBidding,
  onQuarantine,
}) => {
  const [quarantined, setQuarantined] = useState(false);
  const [biddingPushed, setBiddingPushed] = useState(false);

  // Formatting helpers
  const tempMin = lot.temperatureMin ?? 34;
  const tempMax = lot.temperatureMax ?? 38;
  const tempLabel = tempMin <= 38 ? 'Strict Chilled' : tempMin <= 50 ? 'Chilled Cool' : 'Ambient Dry';

  const packDateFormatted = lot.productionDate 
    ? new Date(lot.productionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Jan 12, 2026';

  const expDateFormatted = lot.expirationDate
    ? new Date(lot.expirationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Aug 23, 2026';

  const availableQty = lot.availableQty ?? 1000;
  const unitCost = lot.costPerCase ?? 12.5;
  const listPrice = lot.standardSellPrice ?? lot.productId?.standardSellPrice ?? (unitCost * 1.6);
  
  const msrpTotal = Math.round(listPrice * availableQty);
  const targetLiquidation = Math.round(unitCost * availableQty);
  const minReserve = Math.round(targetLiquidation * 0.8);

  const palletCount = lot.palletCount ?? Math.max(1, Math.ceil(availableQty / 30));

  // FEFO calculation
  const expDiffDays = lot.expirationDate
    ? Math.ceil((new Date(lot.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 10;
  const isExpCritical = expDiffDays <= 14;
  const isExpUrgent = expDiffDays > 14 && expDiffDays <= 30;

  const fefoRank = isExpCritical 
    ? 'Priority #1 (Immediate)' 
    : isExpUrgent 
    ? 'Priority #2 (Urgent)' 
    : 'Priority #3 (Stable)';

  const handleOpenHub = () => {
    if (onOpenLotHub) {
      onOpenLotHub(lot);
    }
  };

  const handlePushBidding = () => {
    setBiddingPushed(true);
    if (onPushToBidding) {
      onPushToBidding(lot);
    }
  };

  const handleQuarantine = () => {
    setQuarantined(!quarantined);
    if (onQuarantine) {
      onQuarantine(lot);
    }
  };

  const handleCOA = () => {
    if (onOpenComplianceModal) {
      onOpenComplianceModal(lot);
    }
  };

  return (
    <div
      className="inspection-drawer px-4 pb-4 pt-1 bg-slate-50/70 border-t border-slate-200/60"
      id={`inv-row-${lot._id || 'drawer'}`}
    >
      <div className="p-4 rounded-xl bg-white shadow-xs border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cold-Chain Telemetry */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Cold-Chain Telemetry
            </p>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">thermostat</span>
            <div className="text-[11px] font-mono">
              <span className="font-bold text-slate-900">{tempMin}°F – {tempMax}°F</span>{' '}
              <span className="text-slate-500">({tempLabel})</span>
              <div className="text-slate-500 text-[10px]">
                Sensor: {lot.sensorId || 'Hub-A-Log-09'} • OK
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-600">
            <span className="font-semibold text-slate-900">Lot:</span> {lot.lotNumber || 'LOT-2026-001'} • {palletCount} Pallets
          </div>
        </div>

        {/* 2. FEFO Lifecycle Matrix */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              FEFO Lifecycle Matrix
            </p>
          </div>
          <div className="text-[11px] space-y-1.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pack Date:</span>
              <span className="text-slate-800 font-medium">{packDateFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Exp. Date:</span>
              <span className={isExpCritical ? 'text-rose-600 font-bold' : 'text-slate-900 font-medium'}>
                {expDateFormatted}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">FEFO Rank:</span>
              <span className={isExpCritical ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>
                {fefoRank}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Valuation & Recovery Margin */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Valuation & Recovery Margin
            </p>
          </div>
          <div className="text-[11px] space-y-1.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Original MSRP:</span>
              <span className="line-through text-slate-400 font-medium">${msrpTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Target Liquidation:</span>
              <span className="text-slate-900 font-bold">${targetLiquidation.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Min Reserve:</span>
              <span className="text-slate-700 font-medium">${minReserve.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 4. Batch Operations */}
        <div className="flex flex-col justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Batch Operations
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* Primary Action Button: Open Operations Hub */}
            <button
              type="button"
              onClick={handleOpenHub}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Operations Hub</span>
            </button>

            {/* Push to Bidding */}
            <button
              type="button"
              onClick={handlePushBidding}
              className={`w-full py-1 px-2.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                biddingPushed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>{biddingPushed ? 'Pushed to Bidding ✓' : 'Push to Bidding'}</span>
            </button>

            {/* COA and Quarantine buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCOA}
                className="py-1 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-200 transition-colors cursor-pointer"
              >
                <FileCheck className="w-3 h-3 text-blue-600" />
                <span>COA</span>
              </button>
              <button
                type="button"
                onClick={handleQuarantine}
                className={`py-1 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                  quarantined
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>{quarantined ? 'Quarantined' : 'Quarantine'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
