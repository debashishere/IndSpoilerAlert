import React, { useState } from 'react';
import { DollarSign, X, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useAppDispatch } from '../../../../store/hooks';
import { addSalesRecord } from '../../../../store/slices/ingestionSlice';
import type { SalesRecord } from '../types/ingestion.types';

export interface CreateSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSalesCreated?: (record: SalesRecord) => void;
}

export const CreateSalesModal: React.FC<CreateSalesModalProps> = ({
  isOpen,
  onClose,
  onSalesCreated,
}) => {
  const dispatch = useAppDispatch();

  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [quantitySold, setQuantitySold] = useState<number | ''>('');
  const [pricePerCase, setPricePerCase] = useState<number | ''>('');
  const [status, setStatus] = useState<'Settled' | 'Pending Escrow'>('Settled');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [dcLocation, setDcLocation] = useState('DC-East (Edison, NJ)');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

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
    if (lotNumber.trim() && lotNumber.trim().length < 2) {
      setError('Please provide a valid Lot number.');
      return;
    }
    if (!buyerName.trim()) {
      setError('Please provide a buyer company or organization name.');
      return;
    }
    if (!quantitySold || Number(quantitySold) <= 0) {
      setError('Please enter a valid quantity sold greater than 0.');
      return;
    }
    if (pricePerCase === '' || Number(pricePerCase) < 0) {
      setError('Please enter a valid price per case.');
      return;
    }
    if (!status || !['Settled', 'Pending Escrow'].includes(status)) {
      setError('Please select a valid settlement status.');
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
    const generatedInvoiceNumber = invoiceNumber.trim() || `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    const effectiveLotNumber = lotNumber.trim() || `LOT-${sku.trim().toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleId = `sale-manual-${Date.now()}`;

    const newRecord: SalesRecord = {
      _id: saleId,
      id: saleId,
      contractNumber: `CTR-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceNumber: generatedInvoiceNumber,
      productName: productName.trim(),
      description: productName.trim(),
      sku: sku.trim().toUpperCase(),
      lotNumber: effectiveLotNumber,
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
      netRemitted: Math.round(calculatedRevenue * 0.95 * 100) / 100,
      status,
      saleDate,
      dateRecorded: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    dispatch(addSalesRecord(newRecord));
    if (onSalesCreated) {
      onSalesCreated(newRecord);
    }

    setSuccess(`Successfully recorded sales invoice ${generatedInvoiceNumber}`);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-sales-title"
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
              <h3 id="create-sales-title" className="text-base font-bold text-slate-900 m-0">
                Create Sales Record
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Record a direct sales clearance or off-platform transaction.
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
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
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
              placeholder="e.g. Artisanal Almond Milk (8x32oz)"
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
                placeholder="e.g. SKU-MLK-4001"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Origin Lot Number
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="Auto-generated if empty"
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
                placeholder="e.g. Grocery Outlet Wholesale"
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
                placeholder="e.g. procurement@groceryoutlet.com"
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
                placeholder="e.g. 350"
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
                placeholder="e.g. 14.50"
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
                onChange={(e) => setStatus(e.target.value as 'Settled' | 'Pending Escrow')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="Settled">Settled</option>
                <option value="Pending Escrow">Pending Escrow</option>
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
                <option value="DC-East (Edison, NJ)">DC-East (Edison, NJ)</option>
                <option value="DC-West (Stockton, CA)">DC-West (Stockton, CA)</option>
                <option value="DC-Central (Dallas, TX)">DC-Central (Dallas, TX)</option>
                <option value="DC-North (Chicago, IL)">DC-North (Chicago, IL)</option>
              </select>
            </div>
          </div>

          {/* Invoice / Reference Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invoice / Clearance Reference # (Optional)
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2026-9901 (Auto-generated if empty)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
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
              <Sparkles className="w-3.5 h-3.5" />
              <span>Record Sales Clearance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
