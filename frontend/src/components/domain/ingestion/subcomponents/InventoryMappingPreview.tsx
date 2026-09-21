import React from 'react';
import { CheckCircle2, Maximize2, Minimize2, Check, X } from 'lucide-react';
import { SemanticRulesEditor } from '../SemanticRulesEditor';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';

export interface InventoryMappingPreviewProps {
  inventoryParsedResult: any;
  inventoryMappings: Record<string, string>;
  inventoryLoading: boolean;
  inventoryIsImported: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onMappingChange: (dbField: string, headerName: string) => void;
}

export const InventoryMappingPreview: React.FC<InventoryMappingPreviewProps> = ({
  inventoryParsedResult,
  inventoryMappings,
  inventoryLoading,
  inventoryIsImported,
  isFullscreen,
  onToggleFullscreen,
  onConfirm,
  onCancel,
  onMappingChange,
}) => {
  if (!inventoryParsedResult) return null;

  const getMappedField = (headerName: string): string => {
    return Object.entries(inventoryMappings).find(([, h]) => h === headerName)?.[0] || '';
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const found = INGESTION_CONSTANTS.INVENTORY_MAPPING_OPTIONS.find((o) => o.value === fieldValue);
    return found ? found.label : fieldValue;
  };

  const rawHeaders = inventoryParsedResult.rawGrid?.[0] || [];
  const rawRows = inventoryParsedResult.rawGrid?.slice(1) || [];

  return (
    <div
      className={`card border border-blue-500/50 bg-white rounded-xl shadow-md transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-6 rounded-none overflow-hidden bg-white flex flex-col'
          : 'p-5 flex flex-col gap-4'
      }`}
    >
      <div className="preview-container flex flex-col gap-4 h-full">
        {/* Dynamic Semantic Attribute Translation Rules - Top Section */}
        <SemanticRulesEditor
          rawHeaders={rawHeaders}
          rawGrid={inventoryParsedResult.rawGrid}
          pipelineType="inventory"
        />

        {/* Header Bar */}
        <div className="preview-header-bar flex justify-between items-center flex-wrap gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 m-0">
                Confirm Inventory Data Mapping
              </h3>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                {inventoryParsedResult.fileName}
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0">
              Verify suggested column templates and adjust manual overrides. Scroll horizontally to inspect grid.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="btn btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={inventoryLoading || inventoryIsImported}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                inventoryIsImported
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{inventoryIsImported ? 'Lots Imported ✓' : 'Confirm & Import Lots'}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Wrapper */}
        <div
          className={`preview-grid-wrapper overflow-auto rounded-lg border border-slate-200 ${
            isFullscreen ? 'max-h-[calc(100vh-220px)]' : 'max-h-[500px]'
          }`}
        >
          <table className="preview-table w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                {rawHeaders.map((header: string, colIdx: number) => {
                  const mappedField = getMappedField(header);
                  return (
                    <th key={colIdx} className={`p-3 border-r border-slate-200 ${mappedField ? 'bg-blue-50/50' : ''}`}>
                      <div className="mapping-badge-container flex flex-col gap-1.5">
                        <span className="font-bold text-slate-800 text-xs">{header}</span>
                        <select
                          className="mapping-select text-[11px] p-1 rounded border border-slate-300 bg-white text-slate-900"
                          value={mappedField}
                          onChange={(e) => onMappingChange(e.target.value, header)}
                        >
                          <option value="">Unmapped</option>
                          {INGESTION_CONSTANTS.INVENTORY_MAPPING_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {mappedField && (
                          <span className="badge badge-info text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium inline-block w-fit">
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
              {rawRows.map((row: string[], rowIdx: number) => (
                <tr key={rowIdx} className="hover:bg-slate-50/70">
                  {row.map((cell: string, cellIdx: number) => {
                    const header = rawHeaders[cellIdx];
                    const mappedField = header ? getMappedField(header) : '';
                    return (
                      <td key={cellIdx} className={`p-2.5 border-r border-slate-100 ${mappedField ? 'bg-blue-50/20' : ''}`}>
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
