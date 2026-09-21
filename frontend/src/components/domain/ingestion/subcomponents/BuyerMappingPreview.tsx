import React from 'react';
import { CheckCircle2, Maximize2, Minimize2, Check, X } from 'lucide-react';

const BUYER_OPTIONS = [
  { value: 'companyName', label: 'Company / Buyer Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'tier', label: 'Buyer Tier' },
  { value: 'acceptsShortDated', label: 'Accepts Short-Dated' },
  { value: 'minShelfLife', label: 'Min Shelf Life (Days)' },
  { value: 'categories', label: 'Categories' },
  { value: 'transportRadius', label: 'Transport Radius (Miles)' },
  { value: 'excludedAllergens', label: 'Excluded Allergens' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'address', label: 'Address' },
];

export interface BuyerMappingPreviewProps {
  buyerParsedResult: any;
  buyerMappings: Record<string, string>;
  buyerLoading: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onMappingChange: (dbField: string, headerName: string) => void;
}

export const BuyerMappingPreview: React.FC<BuyerMappingPreviewProps> = ({
  buyerParsedResult,
  buyerMappings,
  buyerLoading,
  isFullscreen,
  onToggleFullscreen,
  onConfirm,
  onCancel,
  onMappingChange,
}) => {
  if (!buyerParsedResult) return null;

  const getMappedField = (headerName: string): string => {
    const found = Object.entries(buyerMappings).find(([, h]) => h === headerName)?.[0] || '';
    if (found === 'name') return 'companyName';
    return found;
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const norm = fieldValue === 'name' ? 'companyName' : fieldValue;
    const found = BUYER_OPTIONS.find((o) => o.value === norm);
    return found ? found.label : fieldValue;
  };

  const rawHeaders = buyerParsedResult.rawGrid?.[0] || [];
  const rawRows = buyerParsedResult.rawGrid?.slice(1) || [];

  return (
    <div
      className={`card border border-blue-500/50 bg-white rounded-xl shadow-md transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-6 rounded-none overflow-hidden bg-white flex flex-col'
          : 'p-5 flex flex-col gap-4'
      }`}
    >
      <div className="preview-container flex flex-col gap-4 h-full">
        {/* Header Bar */}
        <div className="preview-header-bar flex justify-between items-center flex-wrap gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 m-0">
                Confirm Buyer Data Mapping
              </h3>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                {buyerParsedResult.fileName}
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0">
              Map CSV columns to database fields before importing into buyer registry. Scroll horizontally to review raw grid extraction.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={buyerLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Ingest Buyers</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              title="Cancel"
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div
          className="preview-grid-wrapper overflow-auto rounded-lg border border-slate-200 bg-white"
          style={{ maxHeight: isFullscreen ? 'calc(100vh - 180px)' : '480px' }}
        >
          <table className="preview-table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {rawHeaders.map((header: string, colIdx: number) => {
                  const mappedField = getMappedField(header);
                  return (
                    <th key={colIdx} className={`p-3 font-semibold text-slate-700 whitespace-nowrap ${mappedField ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold">{header}</span>
                        <select
                          className="mapping-select text-xs p-1 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={mappedField}
                          onChange={(e) => onMappingChange(e.target.value, header)}
                        >
                          <option value="">Unmapped</option>
                          {BUYER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {mappedField && (
                          <span className="text-[10px] text-blue-700 font-semibold mt-0.5">
                            {getFieldNameLabel(mappedField)}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {rawRows.map((row: string[], rowIdx: number) => (
                <tr key={rowIdx} className="hover:bg-slate-50/60">
                  {row.map((cell: string, cellIdx: number) => {
                    const header = rawHeaders[cellIdx];
                    const mappedField = header ? getMappedField(header) : '';
                    return (
                      <td
                        key={cellIdx}
                        className={`p-2.5 whitespace-nowrap text-slate-700 ${mappedField ? 'bg-blue-50/20' : ''}`}
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
