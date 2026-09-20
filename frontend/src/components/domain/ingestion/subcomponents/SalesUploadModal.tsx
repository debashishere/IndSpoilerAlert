import React from 'react';
import { DollarSign, X, UploadCloud, FileSpreadsheet, FileText } from 'lucide-react';
import type { Supplier } from '../../../../store/slices/coreSlice';

export interface SalesUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSuppliers: Supplier[];
  effectiveSupplierId: string;
  onSupplierChange: (id: string) => void;
  salesFile: { name: string; size: number } | null;
  salesDragActive: boolean;
  salesLoading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClickDropzone: () => void;
  onRunSalesExtraction: () => void;
}

export const SalesUploadModal: React.FC<SalesUploadModalProps> = ({
  isOpen,
  onClose,
  availableSuppliers,
  effectiveSupplierId,
  onSupplierChange,
  salesFile,
  salesDragActive,
  salesLoading,
  onDragOver,
  onDragLeave,
  onDrop,
  onClickDropzone,
  onRunSalesExtraction,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-[540px] p-6 sm:p-7 shadow-xl flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Upload Sales Report
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select supplier company and upload sales report file (CSV/PDF).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CPG Supplier Company Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            CPG Supplier Company *
          </label>
          <select
            value={effectiveSupplierId}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs cursor-pointer"
          >
            {availableSuppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.companyCode ? `(${s.companyCode})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Drop Zone */}
        <div
          onClick={onClickDropzone}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
            salesDragActive
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          {salesFile ? (
            <>
              {salesFile.name.endsWith('.csv') ? (
                <FileSpreadsheet className="w-9 h-9 text-emerald-600 mx-auto mb-2.5" />
              ) : (
                <FileText className="w-9 h-9 text-emerald-600 mx-auto mb-2.5" />
              )}
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                {salesFile.name}
              </h4>
              <p className="text-xs text-slate-500 m-0">
                {(salesFile.size / 1024).toFixed(1)} KB • Click or drag another file to replace
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                Drag & Drop Sales Report here
              </h4>
              <p className="text-xs text-slate-500 m-0">
                Supports distributor closeout sales sheets in <code className="text-emerald-600 font-mono">.csv</code> or <code className="text-emerald-600 font-mono">.pdf</code> format
              </p>
            </>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onRunSalesExtraction}
            disabled={!salesFile || salesLoading}
            className={`px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors ${
              salesFile && !salesLoading
                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{salesLoading ? 'Processing...' : 'Run Sales Extraction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
