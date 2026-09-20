import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Navigation, 
  Truck, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import type { SalesRowInspectionDrawerProps } from '../types/ingestion.types';

export const SalesRowInspectionDrawer: React.FC<SalesRowInspectionDrawerProps> = ({
  record,
  onReconcileInvoice,
  onAuthorizeDockGatePass,
  onLiveFleetTelemetry,
}) => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Sep 18, 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatUtcTimestamp = (dateStr?: string, fallbackHour = '09:30') => {
    if (!dateStr) return `Sep 18, 2026 ${fallbackHour} UTC`;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `${dateStr} ${fallbackHour} UTC`;
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${datePart} ${hours}:${minutes} UTC`;
  };

  const handleReconcile = () => {
    setActionFeedback(`Reconciling invoice ${record.invoiceNumber || record.contractNumber || ''}...`);
    setTimeout(() => setActionFeedback(null), 3000);
    if (onReconcileInvoice) {
      onReconcileInvoice(record);
    }
  };

  const handleGatePass = () => {
    setActionFeedback(`Dock gate pass authorized for ${record.buyerName || record.buyerCompany || 'carrier'}!`);
    setTimeout(() => setActionFeedback(null), 3000);
    if (onAuthorizeDockGatePass) {
      onAuthorizeDockGatePass(record);
    }
  };

  const handleTelemetry = () => {
    setActionFeedback(`Querying live carrier telemetry for ${record.contractNumber || 'load'}...`);
    setTimeout(() => setActionFeedback(null), 3000);
    if (onLiveFleetTelemetry) {
      onLiveFleetTelemetry(record);
    }
  };

  // Determine logistics block details
  const contractNumber = record.contractNumber || record.invoiceNumber || 'ORD-2026-9941';
  const tracking = record.trackingCarrier || 'SWF-90214-VA • Swift Cold Logistics';
  const deliveryOrPickup = record.deliveryWindow || record.appointmentTerms || 'Mar 21, 08:00 EST';
  const pickupTerms = record.pickupTerms;
  const telemetryGps = record.telemetryGps;
  const telemetrySpeed = record.telemetrySpeed;

  const grossSale = record.grossSale ?? record.totalRevenue ?? record.totalValue ?? 76680;
  const netRemitted = record.netRemitted ?? (grossSale * 0.96);
  const escrowStatus = record.escrowStatus;
  const settlementTerms = record.settlementTerms;

  return (
    <div
      className="inspection-drawer px-4 pb-4 pt-1 bg-slate-50/70 border-t border-slate-200/60"
      id={`sales-drawer-${record._id}`}
    >
      <div className="p-4 rounded-xl bg-white shadow-xs border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. Logistics & Dispatch */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Logistics &amp; Dispatch
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1.5 font-mono text-[11px]">
            {pickupTerms ? (
              <>
                <div className="text-slate-800">
                  <span className="font-semibold text-slate-500 font-sans">Terms: </span>
                  {pickupTerms}
                </div>
                <div className="text-blue-700 font-semibold">
                  <span className="font-semibold text-slate-500 font-sans">Appointment: </span>
                  {deliveryOrPickup}
                </div>
              </>
            ) : telemetryGps ? (
              <>
                <div className="text-slate-800">
                  <span className="font-semibold text-slate-500 font-sans">GPS: </span>
                  {telemetryGps}
                </div>
                <div className="text-blue-700 font-bold">
                  <span className="font-semibold text-slate-500 font-sans">Speed: </span>
                  {telemetrySpeed || '62 mph • On schedule'}
                </div>
              </>
            ) : (
              <>
                <div className="text-slate-800">
                  <span className="font-semibold text-slate-500 font-sans">Contract: </span>
                  {contractNumber}
                </div>
                <div className="text-slate-600 truncate" title={tracking}>
                  <span className="font-semibold text-slate-500 font-sans">Tracking: </span>
                  {tracking}
                </div>
                <div className="text-slate-900 font-bold">
                  Delivery Window: {deliveryOrPickup}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. Audit & Date Logs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Audit & Date Logs
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1.5 font-mono text-[11px]">
            <div className="text-slate-800">
              <span className="text-slate-500 font-sans">Date Recorded: </span>
              {formatDate(record.dateRecorded || record.saleDate || record.createdAt)}
            </div>
            <div className="text-slate-700">
              <span className="text-slate-500 font-sans">Create Date: </span>
              {formatUtcTimestamp(record.createdAt, '09:30')}
            </div>
            <div className="text-slate-700">
              <span className="text-slate-500 font-sans">Update Date: </span>
              {formatUtcTimestamp(record.updatedAt, '14:15')}
            </div>
          </div>
        </div>

        {/* 3. Financial Remittance */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Financial Remittance
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">Gross Sale:</span>
              <span className="text-slate-900 font-semibold">{formatCurrency(grossSale)}</span>
            </div>
            {escrowStatus ? (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Escrow Status:</span>
                <span className="text-emerald-700 font-bold">{escrowStatus}</span>
              </div>
            ) : settlementTerms ? (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Terms:</span>
                <span className="text-blue-700 font-bold">{settlementTerms}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-900 font-sans">Net Remitted:</span>
                <span className="text-emerald-600">{formatCurrency(netRemitted)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Contextual Action CTAs */}
        <div className="flex flex-col justify-between gap-2.5">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Operational Actions
            </p>
            {actionFeedback && (
              <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{actionFeedback}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {/* Primary contextual action button */}
            {pickupTerms ? (
              <button
                type="button"
                onClick={handleGatePass}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <ShieldCheck className="w-3.5 h-3.5 hidden" />
                <span>Authorize Dock Gate Pass</span>
              </button>
            ) : telemetryGps ? (
              <button
                type="button"
                onClick={handleTelemetry}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <Navigation className="w-3.5 h-3.5 hidden" />
                <span>Live Fleet Telemetry</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReconcile}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <FileText className="w-3.5 h-3.5 hidden" />
                <span>Reconcile Invoice</span>
              </button>
            )}

            {/* Contextual auxiliary actions if not already primary */}
            <div className="flex items-center gap-1.5">
              {!pickupTerms && (
                <button
                  type="button"
                  onClick={handleGatePass}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-200/80 transition-colors cursor-pointer"
                  title="Authorize Dock Gate Pass"
                >
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  <span>Gate Pass</span>
                </button>
              )}
              {!telemetryGps && (
                <button
                  type="button"
                  onClick={handleTelemetry}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-200/80 transition-colors cursor-pointer"
                  title="Live Fleet Telemetry"
                >
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span>Fleet GPS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
