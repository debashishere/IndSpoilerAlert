import React, { useState, useEffect } from 'react';
import { DollarSign, X, CheckCircle2, AlertTriangle, Save, Edit3 } from 'lucide-react';
import { useAppDispatch } from '../../../../store/hooks';
import { updateSalesRecord } from '../../../../store/slices/ingestionSlice';
import type { SalesRecord } from '../types/ingestion.types';

export interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleRecord?: SalesRecord | null;
  onSaleUpdated?: (record: SalesRecord) => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  isOpen,
  onClose,
  saleRecord,
  onSaleUpdated,
}) => {
  const dispatch = useAppDispatch();

  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [quantitySold, setQuantitySold] = useState<number | ''>('');
  const [pricePerCase, setPricePerCase] = useState<number | ''>('');
  const [status, setStatus] = useState<string>('Settled');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [dcLocation, setDcLocation] = useState('DC-East (Edison, NJ)');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (saleRecord) {
      setProductName(saleRecord.productName || saleRecord.description || saleRecord.product || '');
      setSku(saleRecord.sku || saleRecord.productId || '');
      setLotNumber(saleRecord.lotNumber || saleRecord['Lot Number'] || saleRecord.lot || saleRecord.lotNo || '');
      setBuyerName(saleRecord.buyerName || saleRecord.buyerCompany || saleRecord.customer || '');
      setBuyerEmail(saleRecord.buyerEmail || '');
      setQuantitySold(saleRecord.quantitySold ?? saleRecord.quantity ?? '');
      setPricePerCase(saleRecord.pricePerCase ?? saleRecord.unitPrice ?? saleRecord.price ?? '');

      const st = saleRecord.status || 'Settled';
      if (st.toLowerCase().includes('pending') || st.toLowerCase().includes('escrow')) {
        setStatus('Pending Escrow');
      } else if (st.toLowerCase().includes('invoiced')) {
        setStatus('Invoiced');
      } else {
        setStatus('Settled');
      }

      let sDate = '';
      if (saleRecord.saleDate || saleRecord.dateRecorded || saleRecord.createdAt) {
        try {
          const raw = saleRecord.saleDate || saleRecord.dateRecorded || saleRecord.createdAt;
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            sDate = d.toISOString().split('T')[0];
          } else {
            sDate = raw;
          }
        } catch {
          sDate = saleRecord.saleDate || '';
        }
      }
      setSaleDate(sDate || new Date().toISOString().split('T')[0]);
      setDcLocation(saleRecord.warehouse || saleRecord.dc || saleRecord.location || 'DC-East (Edison, NJ)');
      setInvoiceNumber(saleRecord.invoiceNumber || saleRecord.contractNumber || '');
      setTrackingCarrier(saleRecord.trackingCarrier || '');
      setDeliveryWindow(saleRecord.deliveryWindow || saleRecord.appointmentTerms || '');
      setError(null);
      setSuccess(null);
    }
  }, [saleRecord, isOpen]);

  if (!isOpen || !saleRecord) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      setError('Please provide a product title/description.');
      return;
    }
    if (!sku.trim()) {
      setError('Please provide an SKU / item code.');
      return;
    }
    if (!buyerName.trim()) {
      setError('Please provide a buyer company or organization name.');
      return;
    }
    if (quantitySold === '' || Number(quantitySold) <= 0) {
      setError('Please enter a valid quantity sold greater than 0.');
      return;
    }
    if (pricePerCase === '' || Number(pricePerCase) < 0) {
      setError('Please enter a valid price per case.');
      return;
    }
    if (!saleDate || !saleDate.trim()) {
      setError('Please select a valid sale date.');
      return;
    }
    if (!dcLocation || !dcLocation.trim()) {
      setError('Please select a warehouse / DC location.');
      return;
    }

    const calculatedRevenue = Number(quantitySold) * Number(pricePerCase);
    const updatedRecord: SalesRecord = {
      ...saleRecord,
      _id: saleRecord._id,
      id: saleRecord.id || saleRecord._id,
      productName: productName.trim(),
      description: productName.trim(),
      sku: sku.trim().toUpperCase(),
      lotNumber: lotNumber.trim() || saleRecord.lotNumber || '#001',
      buyerName: buyerName.trim(),
      buyerCompany: buyerName.trim(),
      buyerEmail: buyerEmail.trim() || undefined,
      warehouse: dcLocation,
      dc: dcLocation,
      location: dcLocation,
      quantitySold: Number(quantitySold),
      quantity: Number(quantitySold),
      pricePerCase: Number(pricePerCase),
      totalRevenue: calculatedRevenue,
      totalValue: calculatedRevenue,
      grossSale: calculatedRevenue,
      netRemitted: Math.round(calculatedRevenue * 0.96 * 100) / 100,
      status,
      saleDate,
      invoiceNumber: invoiceNumber.trim() || saleRecord.invoiceNumber,
      contractNumber: saleRecord.contractNumber,
      trackingCarrier: trackingCarrier.trim() || saleRecord.trackingCarrier,
      deliveryWindow: deliveryWindow.trim() || saleRecord.deliveryWindow,
      updatedAt: new Date().toISOString(),
    };

    dispatch(updateSalesRecord(updatedRecord));
    if (onSaleUpdated) {
      onSaleUpdated(updatedRecord);
    }

    setSuccess(`Successfully updated sale record ${updatedRecord.invoiceNumber || updatedRecord.contractNumber || updatedRecord.lotNumber}`);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
      onClose();
    }, 500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-sale-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-sale-title" className="text-base font-bold text-slate-900 m-0">
                Edit Sale Record
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Update sales clearance, pricing details, and logistics routing.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Description / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Oscar Mayer Deli Slices"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* SKU & Lot Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Item Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-DELI-1001"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lot Number
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="e.g. #001"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          {/* Buyer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Whole Foods Market Regional"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Contact Email
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="e.g. procurement@buyer.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Quantity Sold & Price Per Case */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Sold (Cases) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantitySold}
                onChange={(e) => setQuantitySold(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 5400"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price Per Case ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={pricePerCase}
                onChange={(e) => setPricePerCase(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 14.20"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Status, Date, and DC Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Settlement Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="Settled">Settled</option>
                <option value="Pending Escrow">Pending Escrow</option>
                <option value="Invoiced">Invoiced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sale Date
              </label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fulfillment DC
              </label>
              <select
                value={dcLocation}
                onChange={(e) => setDcLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="Northeast Logistics Hub, Newark">Northeast Logistics Hub, Newark</option>
                <option value="Texas Central Facility, Dallas">Texas Central Facility, Dallas</option>
                <option value="Pacific Northwest Hub">Pacific Northwest Hub</option>
                <option value="DC-East (Edison, NJ)">DC-East (Edison, NJ)</option>
                <option value="DC-West (Stockton, CA)">DC-West (Stockton, CA)</option>
                <option value="DC-Central (Dallas, TX)">DC-Central (Dallas, TX)</option>
                <option value="DC-North (Chicago, IL)">DC-North (Chicago, IL)</option>
              </select>
            </div>
          </div>

          {/* Invoice / Reference Number & Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Reference #
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-9941"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tracking / Carrier
              </label>
              <input
                type="text"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                placeholder="e.g. SWF-90214-VA • Swift Cold Logistics"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Delivery Window */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Window / Appointment Terms
            </label>
            <input
              type="text"
              value={deliveryWindow}
              onChange={(e) => setDeliveryWindow(e.target.value)}
              placeholder="e.g. Mar 21, 08:00 EST"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
