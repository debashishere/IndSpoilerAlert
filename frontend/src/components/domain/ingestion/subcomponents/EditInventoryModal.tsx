import React, { useState, useEffect } from 'react';
import { Package, X, CheckCircle2, AlertTriangle, Save, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updateLotInList } from '../../../../store/slices/inventorySlice';
import type { Supplier } from '../../../../store/slices/coreSlice';
import { isLotListedInBidding } from '../utils/inventoryUtils';

export interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot?: any | null;
  onLotUpdated?: (lot: any) => void;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  onClose,
  lot: initialLot,
  onLotUpdated,
}) => {
  const dispatch = useAppDispatch();
  const suppliers = useAppSelector((state) => state.core.suppliers);
  const [currentLot, setCurrentLot] = useState<any | null>(initialLot || null);

  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [quantityCases, setQuantityCases] = useState<number | ''>('');
  const [packagingUnit, setPackagingUnit] = useState('Cases');
  const [costPerCase, setCostPerCase] = useState<number | ''>('');
  const [standardSellPrice, setStandardSellPrice] = useState<number | ''>('');
  const [expirationDate, setExpirationDate] = useState('');
  const [storageTemp, setStorageTemp] = useState('Ambient');
  const [dcLocation, setDcLocation] = useState('DC-East (Edison, NJ)');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [status, setStatus] = useState('Available');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync lot when opened or changed
  useEffect(() => {
    setCurrentLot(initialLot || null);
  }, [initialLot, isOpen]);

  useEffect(() => {
    if (currentLot) {
      setTitle(currentLot.title || currentLot.productName || currentLot.productId?.description || '');
      setSku(currentLot.sku || currentLot.productId?.sku || '');
      setLotNumber(currentLot.lotNumber || currentLot.batchNumber || '');
      setQuantityCases(currentLot.availableQty ?? currentLot.quantityCases ?? currentLot.availableCases ?? '');
      setPackagingUnit(currentLot.packagingUnit || 'Cases');
      setCostPerCase(currentLot.costPerCase !== undefined && currentLot.costPerCase !== null ? currentLot.costPerCase : '');
      const sellPrice = currentLot.standardSellPrice ?? currentLot.productId?.standardSellPrice;
      setStandardSellPrice(sellPrice !== undefined && sellPrice !== null ? sellPrice : '');
      
      let exp = '';
      if (currentLot.expirationDate) {
        try {
          exp = currentLot.expirationDate.split('T')[0];
        } catch {
          exp = currentLot.expirationDate;
        }
      }
      setExpirationDate(exp);
      setStorageTemp(currentLot.storageTemp || (currentLot.temperatureMin <= 38 ? 'Refrigerated' : 'Ambient'));
      setDcLocation(currentLot.warehouse || currentLot.location || currentLot.dc || currentLot.distributionCenterId?.name || 'DC-East (Edison, NJ)');
      setSelectedSupplierId(currentLot.supplierId?._id || currentLot.supplierId || '');
      setStatus(currentLot.status || 'Available');
      setError(null);
      setSuccess(null);
    }
  }, [currentLot]);

  if (!isOpen) return null;

  const isBiddingActive = isLotListedInBidding(currentLot);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reject edit if inventory is listed in bidding
    if (isLotListedInBidding(currentLot)) {
      setError('Cannot edit inventory: Lot is currently listed in bidding.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a product title/description.');
      return;
    }
    if (!sku.trim()) {
      setError('Please provide an SKU / item code.');
      return;
    }
    if (!quantityCases || Number(quantityCases) <= 0) {
      setError('Please enter a valid case quantity greater than 0.');
      return;
    }
    if (!expirationDate) {
      setError('Please select an expiration date.');
      return;
    }
    if (costPerCase !== '' && Number(costPerCase) < 0) {
      setError('Please enter a valid unit cost (greater than or equal to 0).');
      return;
    }
    if (standardSellPrice !== '' && Number(standardSellPrice) < 0) {
      setError('Please enter a valid standard sell price (greater than or equal to 0).');
      return;
    }

    const effectiveSupplier = suppliers.find((s: Supplier) => s._id === selectedSupplierId) || suppliers[0];

    const updatedLot = {
      ...currentLot,
      title: title.trim(),
      productName: title.trim(),
      description: title.trim(),
      productId: currentLot?.productId ? {
        ...currentLot.productId,
        description: title.trim(),
        sku: sku.trim().toUpperCase(),
      } : currentLot?.productId,
      sku: sku.trim().toUpperCase(),
      lotNumber: lotNumber.trim() || currentLot?.lotNumber || `LOT-${sku.trim().toUpperCase()}`,
      quantityCases: Number(quantityCases),
      availableCases: Number(quantityCases),
      availableQty: Number(quantityCases),
      totalCases: currentLot?.totalCases || Number(quantityCases),
      packagingUnit,
      costPerCase: costPerCase !== '' ? Number(costPerCase) : 0,
      standardSellPrice: standardSellPrice !== '' ? Number(standardSellPrice) : 0,
      expirationDate,
      storageTemp,
      warehouse: dcLocation,
      location: dcLocation,
      dc: dcLocation,
      status,
      supplierId: effectiveSupplier?._id || currentLot?.supplierId || '',
      supplierName: effectiveSupplier?.name || currentLot?.supplierName || 'Verified Supplier',
      updatedAt: new Date().toISOString(),
    };

    dispatch(updateLotInList(updatedLot));
    if (onLotUpdated) {
      onLotUpdated(updatedLot);
    }

    setSuccess(`Successfully updated inventory lot ${updatedLot.lotNumber}`);
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
      aria-labelledby="edit-inventory-title"
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
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-inventory-title" className="text-base font-bold text-slate-900 m-0">
                Edit Inventory Record
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Update surplus lot details, quantities, expiration, and warehouse routing.
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
          {/* Rejection Alert Banner if Listed in Bidding */}
          {isBiddingActive && (
            <div
              role="alert"
              aria-label="Edit Rejected: Lot Listed in Bidding"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3"
            >
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-700 m-0">Cannot Edit: Lot Listed in Bidding</h4>
                <p className="text-rose-600 text-[11px] m-0 mt-0.5">
                  Our system rejects edit requests when inventory is currently listed in active bidding. Modifications are locked to preserve ongoing auction bids and buyer pricing commitments.
                </p>
              </div>
            </div>
          )}

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

          {/* Product Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Description / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isBiddingActive}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Organic Strawberry Greek Yogurt (12x5.3oz)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
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
                disabled={isBiddingActive}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-YOG-8821"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lot Number
              </label>
              <input
                type="text"
                disabled={isBiddingActive}
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="e.g. LOT-2026-001"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Quantity & Packaging Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity (Cases) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                disabled={isBiddingActive}
                min="1"
                value={quantityCases}
                onChange={(e) => setQuantityCases(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 450"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Packaging Unit
              </label>
              <select
                disabled={isBiddingActive}
                value={packagingUnit}
                onChange={(e) => setPackagingUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="Cases">Cases</option>
                <option value="Pallets">Pallets</option>
                <option value="Units">Individual Units</option>
              </select>
            </div>
          </div>

          {/* Cost & Sell Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Per Case ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={isBiddingActive}
                value={costPerCase}
                onChange={(e) => setCostPerCase(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 18.50"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standard Sell Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={isBiddingActive}
                value={standardSellPrice}
                onChange={(e) => setStandardSellPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 24.00"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Expiration Date & Storage Temp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-inv-exp-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Expiration Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-inv-exp-date"
                type="date"
                required
                disabled={isBiddingActive}
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Temperature
              </label>
              <select
                disabled={isBiddingActive}
                value={storageTemp}
                onChange={(e) => setStorageTemp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="Ambient">Ambient / Dry Storage</option>
                <option value="Refrigerated">Refrigerated (Cold Chain)</option>
                <option value="Frozen">Frozen (-18°C)</option>
              </select>
            </div>
          </div>

          {/* DC Location & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warehouse / DC Location
              </label>
              <select
                disabled={isBiddingActive}
                value={dcLocation}
                onChange={(e) => setDcLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="DC-East (Edison, NJ)">DC-East (Edison, NJ)</option>
                <option value="DC-West (Stockton, CA)">DC-West (Stockton, CA)</option>
                <option value="DC-Central (Dallas, TX)">DC-Central (Dallas, TX)</option>
                <option value="DC-North (Chicago, IL)">DC-North (Chicago, IL)</option>
                <option value="Northeast Hub">Northeast Hub</option>
                <option value="Texas Central">Texas Central</option>
                <option value="Pacific Northwest">Pacific Northwest</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inventory Status
              </label>
              <select
                disabled={isBiddingActive}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="Available">Available</option>
                <option value="Active List">Active List</option>
                <option value="Critical RSL">Critical RSL</option>
                <option value="Urgent RSL">Urgent RSL</option>
                <option value="Stable RSL">Stable RSL</option>
                <option value="Sold">Sold</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
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
              id="save-inventory-edit-btn"
              disabled={isBiddingActive}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 ${
                isBiddingActive
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              {isBiddingActive ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked (Listed in Bidding)</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
