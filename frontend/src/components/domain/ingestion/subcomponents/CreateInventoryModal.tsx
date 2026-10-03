import React, { useState } from 'react';
import { Package, X, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { addInventoryLot } from '../../../../store/slices/inventorySlice';
import type { Supplier } from '../../../../store/slices/coreSlice';

export interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId?: string;
  onLotCreated?: (lot: any) => void;
}

export const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  onLotCreated,
}) => {
  const dispatch = useAppDispatch();
  const suppliers = useAppSelector((state) => state.core.suppliers);
  const reduxSupplierId = useAppSelector((state) => state.ingestion?.selectedSupplier || '');
  const currentSupplierId = supplierId || reduxSupplierId;

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
  const [selectedSupplierId, setSelectedSupplierId] = useState(currentSupplierId || '');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!storageTemp || !storageTemp.trim()) {
      setError('Please select a storage temperature.');
      return;
    }
    if (!dcLocation || !dcLocation.trim()) {
      setError('Please select a warehouse / DC location.');
      return;
    }

    const effectiveSupplier = suppliers.find((s: Supplier) => s._id === (selectedSupplierId || currentSupplierId)) || suppliers[0];
    const generatedLotNumber = lotNumber.trim() || `LOT-${sku.trim().toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const lotId = `lot-manual-${Date.now()}`;

    const newLot = {
      _id: lotId,
      id: lotId,
      lotNumber: generatedLotNumber,
      title: title.trim(),
      productName: title.trim(),
      sku: sku.trim().toUpperCase(),
      quantityCases: Number(quantityCases),
      availableCases: Number(quantityCases),
      availableQty: Number(quantityCases),
      costPerCase: costPerCase !== '' ? Number(costPerCase) : 0,
      standardSellPrice: standardSellPrice !== '' ? Number(standardSellPrice) : (costPerCase !== '' ? Number(costPerCase) * 1.25 : 0),
      packagingUnit,
      expirationDate,
      storageTemp,
      warehouse: dcLocation,
      location: dcLocation,
      dc: dcLocation,
      status: 'Available',
      supplierId: effectiveSupplier?._id || currentSupplierId || '',
      supplierName: effectiveSupplier?.name || 'Verified Supplier',
      createdAt: new Date().toISOString(),
      remainingShelfLife: 100,
    };

    dispatch(addInventoryLot(newLot));
    if (onLotCreated) {
      onLotCreated(newLot);
    }

    setSuccess(`Successfully created inventory lot ${generatedLotNumber}`);
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
      aria-labelledby="create-inventory-title"
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
              <h3 id="create-inventory-title" className="text-base font-bold text-slate-900 m-0">
                Create Inventory Record
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Register a new surplus lot into the inventory registry.
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

          {/* Product Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Description / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Organic Strawberry Greek Yogurt (12x5.3oz)"
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
                placeholder="e.g. SKU-YOG-8821"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lot Number (Optional)
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

          {/* Quantity & Packaging Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity (Cases) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantityCases}
                onChange={(e) => setQuantityCases(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 450"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Packaging Unit
              </label>
              <select
                value={packagingUnit}
                onChange={(e) => setPackagingUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
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
                value={costPerCase}
                onChange={(e) => setCostPerCase(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 18.50"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                value={standardSellPrice}
                onChange={(e) => setStandardSellPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 24.00"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Expiration Date & Storage Temp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-inv-exp-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Expiration Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-inv-exp-date"
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Temperature
              </label>
              <select
                value={storageTemp}
                onChange={(e) => setStorageTemp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="Ambient">Ambient / Dry Storage</option>
                <option value="Refrigerated">Refrigerated (Cold Chain)</option>
                <option value="Frozen">Frozen (-18°C)</option>
              </select>
            </div>
          </div>

          {/* DC Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warehouse / DC Location
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
            {suppliers && suppliers.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Company
                </label>
                <select
                  value={selectedSupplierId || currentSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  {suppliers.map((s: Supplier) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              <span>Create Inventory Lot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
