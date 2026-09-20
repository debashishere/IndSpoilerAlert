import React, { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

export interface BuyerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

export const BuyerUploadModal: React.FC<BuyerUploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Bulk Import Buyers via CSV
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Upload a structured CSV file to import multiple buyers into your registry.
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

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Dropzone */}
        <div className="p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center"
          >
            <UploadCloud className="w-10 h-10 text-blue-600 mb-2" />
            <h4 className="text-sm font-semibold text-slate-800 m-0 mb-1">
              Select or drag your CSV file here
            </h4>
            <p className="text-xs text-slate-500 m-0">
              Supports <code className="text-blue-600 font-mono">.csv</code> files up to 500 records per import
            </p>
          </div>

          {/* Formats Info */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold block mb-1.5">Supported CSV Columns:</span>
            <div className="flex gap-1.5 flex-wrap font-mono text-[11px]">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                name / companyName
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                email
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                tier
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Select CSV File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
