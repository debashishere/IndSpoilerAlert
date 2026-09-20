import React from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Package,
  DollarSign,
  Users
} from 'lucide-react';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import { useUnifiedIngestionModal } from '../hooks/useUnifiedIngestionModal';
import type { UnifiedIngestionModalProps } from '../types/ingestion.types';

export const UnifiedIngestionModal: React.FC<UnifiedIngestionModalProps> = (props) => {
  const { isOpen } = props;
  const {
    target,
    selectedFile,
    dragActive,
    isSubmitting,
    errorMessage,
    fileInputRef,
    handleSelectTarget,
    handleDrag,
    handleDrop,
    handleFileChange,
    triggerFileSelect,
    formatFileSize,
    handleSubmit,
    handleClose,
  } = useUnifiedIngestionModal(props);

  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'inventory_2':
        return (
          <>
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <Package className="w-5 h-5 hidden" aria-hidden="true" />
          </>
        );
      case 'point_of_sale':
        return (
          <>
            <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
            <DollarSign className="w-5 h-5 hidden" aria-hidden="true" />
          </>
        );
      case 'domain':
      default:
        return (
          <>
            <span className="material-symbols-outlined text-[20px]">domain</span>
            <Users className="w-5 h-5 hidden" aria-hidden="true" />
          </>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unified-ingestion-modal-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[680px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-4 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                Batch Import Workbench
              </span>
            </div>
            <h2
              id="unified-ingestion-modal-title"
              className="text-lg font-bold text-slate-900 tracking-tight leading-snug"
            >
              {INGESTION_CONSTANTS.MODAL.TITLE}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {INGESTION_CONSTANTS.MODAL.SUBTITLE}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Step 1: Destination Pipeline Selection */}
          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2.5">
              1. Select Destination Pipeline
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INGESTION_CONSTANTS.MODAL.DESTINATIONS.map((dest) => {
                const isSelected = target === dest.id;
                return (
                  <div
                    key={dest.id}
                    onClick={() => handleSelectTarget(dest.id as any)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {renderIcon(dest.icon)}
                      </div>
                      <input
                        type="radio"
                        name="ingestion-destination"
                        id={`dest-${dest.id}`}
                        aria-label={dest.title}
                        checked={isSelected}
                        onChange={() => handleSelectTarget(dest.id as any)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                        {dest.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {dest.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60">
                      <span
                        className={`text-[10px] font-semibold ${
                          isSelected ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      >
                        {dest.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Drag & Drop Zone */}
          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2.5">
              2. Upload Spreadsheet or Manifest
            </label>

            <input
              type="file"
              data-testid="unified-ingestion-file-input"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                  : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/30'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 shadow-2xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-[13px] font-bold text-slate-900">
                    {selectedFile.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {formatFileSize(selectedFile.size)} • Click or drag to replace
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Ready for Ingestion
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-2.5">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-[13px] font-bold text-slate-900">
                    Drag &amp; drop spreadsheet or click to browse
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports .csv, .xlsx, and .xls files up to 100 MB
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold">.CSV</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold">.XLSX</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold">.XLS</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-[12px] font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className={`px-5 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all ${
              selectedFile && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/40'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing File...' : 'Ingest Dataset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
