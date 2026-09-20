import React, { useState } from 'react';
import { Users, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { 
  addBuyerThunk, 
  setBuyerNewName, 
  setBuyerNewEmail, 
  setBuyerNewTier 
} from '../../../../store/slices/ingestionSlice';
import { fetchCoreReferenceData } from '../../../../store/slices/coreSlice';
import type { AddBuyerModalProps } from '../types/ingestion.types';

export const AddBuyerModal: React.FC<AddBuyerModalProps> = ({
  isOpen,
  onClose,
  onBuyerAdded,
  supplierId,
}) => {
  const dispatch = useAppDispatch();
  const reduxName = useAppSelector((state) => state.ingestion.buyerNewName);
  const reduxEmail = useAppSelector((state) => state.ingestion.buyerNewEmail);
  const reduxTier = useAppSelector((state) => state.ingestion.buyerNewTier);
  const saving = useAppSelector((state) => state.ingestion.buyerSaving);
  const success = useAppSelector((state) => state.ingestion.buyerSuccess);
  const error = useAppSelector((state) => state.ingestion.buyerError);

  const [localName, setLocalName] = useState(reduxName);
  const [localEmail, setLocalEmail] = useState(reduxEmail);
  const [localTier, setLocalTier] = useState(reduxTier || 'tier1');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName || !localEmail || saving) return;

    const res = await dispatch(
      addBuyerThunk({
        companyName: localName,
        email: localEmail,
        tier: localTier,
        supplierId,
      })
    );

    if (addBuyerThunk.fulfilled.match(res)) {
      dispatch(fetchCoreReferenceData({ supplierId }));
      if (onBuyerAdded) {
        onBuyerAdded(res.payload);
      }
      setLocalName('');
      setLocalEmail('');
      dispatch(setBuyerNewName(''));
      dispatch(setBuyerNewEmail(''));
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-buyer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-buyer-title" className="text-base font-bold text-slate-900 m-0">
                Add Buyer Manually
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Register a new buyer into your global network.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="buyer-company-name"
              className="text-xs font-semibold text-slate-700 block"
            >
              Company / Buyer Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="buyer-company-name"
              type="text"
              required
              value={localName}
              onChange={(e) => {
                setLocalName(e.target.value);
                dispatch(setBuyerNewName(e.target.value));
              }}
              placeholder="e.g. Costco Wholesale"
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="buyer-contact-email"
              className="text-xs font-semibold text-slate-700 block"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="buyer-contact-email"
              type="email"
              required
              value={localEmail}
              onChange={(e) => {
                setLocalEmail(e.target.value);
                dispatch(setBuyerNewEmail(e.target.value));
              }}
              placeholder="buyer@company.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="buyer-tier-select"
              className="text-xs font-semibold text-slate-700 block"
            >
              Buyer Tier
            </label>
            <select
              id="buyer-tier-select"
              value={localTier}
              onChange={(e) => {
                setLocalTier(e.target.value);
                dispatch(setBuyerNewTier(e.target.value));
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="tier1">Tier 1 — Primary Retailer</option>
              <option value="tier2">Tier 2 — Regional Retailer</option>
              <option value="liquidator">Liquidator / Secondary Market</option>
              <option value="custom">Custom / Other</option>
            </select>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!localName || !localEmail || saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? 'Saving...' : '+ Add to Buyer Registry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
