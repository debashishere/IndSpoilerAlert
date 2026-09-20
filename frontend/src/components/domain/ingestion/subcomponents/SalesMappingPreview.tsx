import React from 'react';
import { CheckCircle2, Check, X, Maximize2, Minimize2 } from 'lucide-react';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import type { IngestionParsedResult } from '../../../../store/slices/ingestionSlice';

export interface SalesMappingPreviewProps {
  salesParsedResult: IngestionParsedResult;
  salesMappings: Record<string, string>;
  salesLoading: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onMappingChange: (dbField: string, headerName: string) => void;
}

export const SalesMappingPreview: React.FC<SalesMappingPreviewProps> = ({
  salesParsedResult,
  salesMappings,
  salesLoading,
  isFullscreen,
  onToggleFullscreen,
  onConfirm,
  onCancel,
  onMappingChange,
}) => {
  const getMappedField = (headerName: string): string => {
    return Object.entries(salesMappings).find(([, h]) => h === headerName)?.[0] || '';
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const found = INGESTION_CONSTANTS.SALES_MAPPING_OPTIONS.find((o) => o.value === fieldValue);
    return found ? found.label : fieldValue;
  };

  return (
    <div
      className={`card bg-white rounded-xl border border-emerald-500/40 shadow-xs flex flex-col p-5 ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 rounded-none overflow-hidden' : 'min-h-[400px]'
      }`}
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Header Bar */}
        <div className="flex justify-between items-center flex-wrap gap-4 pb-3 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 m-0">
                Confirm Sales CSV Mapping
              </h3>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {salesParsedResult.fileName}
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0">
              Map columns for sales reconciliation (SKU, quantity sold, warehouse, lot number). Scroll horizontally to inspect grid.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={salesLoading}
              className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors ${
                salesLoading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Reconcile Sales</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              title="Cancel"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Mapping Grid Table */}
        <div
          className={`overflow-auto rounded-lg border border-slate-200 ${
            isFullscreen ? 'max-h-[calc(100vh-180px)]' : 'max-h-[550px]'
          }`}
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                {(salesParsedResult.rawGrid?.[0] || []).map((header: string, colIdx: number) => {
                  const mappedField = getMappedField(header);
                  return (
                    <th
                      key={colIdx}
                      className={`p-2.5 border-r border-slate-200 font-semibold text-slate-700 ${
                        mappedField ? 'bg-emerald-50/70 text-emerald-900' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-[11px] truncate" title={header}>
                          {header}
                        </span>
                        <select
                          className="mapping-select text-[11px] bg-white border border-slate-300 rounded p-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                          value={mappedField}
                          onChange={(e) => onMappingChange(e.target.value, header)}
                        >
                          <option value="">Unmapped</option>
                          {INGESTION_CONSTANTS.SALES_MAPPING_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {mappedField && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300/60 px-1.5 py-0.5 rounded text-center">
                            {getFieldNameLabel(mappedField)}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(salesParsedResult.rawGrid?.slice(1) || []).map((row: string[], rowIdx: number) => (
                <tr key={rowIdx} className="hover:bg-slate-50/60 transition-colors">
                  {row.map((cell: string, cellIdx: number) => {
                    const header = salesParsedResult.rawGrid[0]?.[cellIdx];
                    const mappedField = header ? getMappedField(header) : '';
                    return (
                      <td
                        key={cellIdx}
                        className={`p-2.5 border-r border-slate-100 text-slate-700 font-mono text-[11px] ${
                          mappedField ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        {cell || <span className="text-slate-400 italic">empty</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
