import React from 'react';
import { Sparkles, X, UploadCloud, FileSpreadsheet, FileText } from 'lucide-react';
import type { Supplier } from '../../../../store/slices/coreSlice';

export interface InventoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSuppliers: Supplier[];
  effectiveSupplierId: string;
  onSupplierChange: (id: string) => void;
  inventoryFile: { name: string; size: number } | null;
  inventoryDragActive: boolean;
  inventoryLoading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClickDropzone: () => void;
  onRunExtraction: () => void;
}

export const InventoryUploadModal: React.FC<InventoryUploadModalProps> = ({
  isOpen,
  onClose,
  availableSuppliers,
  effectiveSupplierId,
  onSupplierChange,
  inventoryFile,
  inventoryDragActive,
  inventoryLoading,
  onDragOver,
  onDragLeave,
  onDrop,
  onClickDropzone,
  onRunExtraction,
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
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Upload Inventory Document
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select CPG supplier company and upload invoice list or product spreadsheet.
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
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer"
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
            inventoryDragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          {inventoryFile ? (
            <div className="flex flex-col items-center">
              {inventoryFile.name.endsWith('.csv') ? (
                <FileSpreadsheet className="w-10 h-10 text-blue-600 mb-2" />
              ) : (
                <FileText className="w-10 h-10 text-blue-600 mb-2" />
              )}
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                {inventoryFile.name}
              </h4>
              <p className="text-xs text-slate-500">
                {(inventoryFile.size / 1024).toFixed(1)} KB • Click or drag another file to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-blue-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                Drag & Drop Invoice File here
              </h4>
              <p className="text-xs text-slate-500">
                Supports PDF (Docling OCR) or CSV surplus product spreadsheets
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onRunExtraction}
            disabled={!inventoryFile || inventoryLoading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              inventoryFile && !inventoryLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Extraction</span>
          </button>
        </div>
      </div>
    </div>
  );
};
