import { useState, useEffect } from 'react';
import { Check, UploadCloud, DollarSign, Maximize2, Minimize2, CheckCircle2, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  updateInventoryMapping, 
  updateSalesMapping, 
  confirmInventoryThunk, 
  confirmSalesThunk 
} from '../../../store/slices/ingestionSlice';
import { DEFAULT_SUPPLIERS } from '../../../services/coreService';
import { SemanticRulesEditor } from './SemanticRulesEditor';

export interface GridMapperTableProps {
  pipelineType?: 'inventory' | 'sales';
  mode?: 'import' | 'template';
  title?: string;
  subtitle?: string;
  saveButtonText?: string;
  onSave?: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
}

const INVENTORY_OPTIONS = [
  { value: 'sku', label: 'SKU' },
  { value: 'description', label: 'Description' },
  { value: 'brand', label: 'Brand' },
  { value: 'category', label: 'Category' },
  { value: 'subCategory', label: 'Sub-Category' },
  { value: 'quantity', label: 'Quantity (Cases)' },
  { value: 'availableQty', label: 'Available Qty' },
  { value: 'expirationDate', label: 'Expiration Date' },
  { value: 'originalPrice', label: 'Original Price' },
  { value: 'lotNumber', label: 'Lot Number' },
  { value: 'productionDate', label: 'Production Date' },
  { value: 'standardSellPrice', label: 'List Price' },
  { value: 'status', label: 'Status (Active/Sold)' },
  { value: 'fdaRegulated', label: 'FDA Regulated' },
  { value: 'temperatureMin', label: 'Min Temp (°F)' },
  { value: 'temperatureMax', label: 'Max Temp (°F)' },
  { value: 'warehouse', label: 'Warehouse / DC' },
];

const SALES_OPTIONS = [
  { value: 'sku', label: 'SKU' },
  { value: 'description', label: 'Description' },
  { value: 'brand', label: 'Brand' },
  { value: 'lotNumber', label: 'Lot Number' },
  { value: 'buyerEmail', label: 'Buyer Email' },
  { value: 'buyerCompany', label: 'Buyer Company' },
  { value: 'quantity', label: 'Quantity Sold (Cases)' },
  { value: 'price', label: 'Price Per Case' },
  { value: 'totalValue', label: 'Total Value' },
  { value: 'revenue', label: 'Total Revenue' },
  { value: 'saleDate', label: 'Sale Date' },
  { value: 'invoiceNumber', label: 'Invoice #' },
  { value: 'productName', label: 'Product Name' },
  { value: 'status', label: 'Status' },
  { value: 'warehouse', label: 'Warehouse / DC' },
];

export const GridMapperTable = ({
  pipelineType = 'inventory',
  mode = 'import',
  title,
  subtitle,
  saveButtonText,
  onSave,
  isSaving = false,
  saveSuccess = false,
}: GridMapperTableProps) => {
  const dispatch = useAppDispatch();
  const isInventory = pipelineType === 'inventory';
  const isTemplateMode = mode === 'template';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  const loading = useAppSelector((state) => 
    isInventory ? state.ingestion.inventoryLoading : state.ingestion.salesLoading
  );
  const loadingStep = useAppSelector((state) => 
    isInventory ? state.ingestion.inventoryLoadingStep : state.ingestion.salesLoadingStep
  );
  const parsedResult = useAppSelector((state) => 
    isInventory ? state.ingestion.inventoryParsedResult : state.ingestion.salesParsedResult
  );
  const mappings = useAppSelector((state) => 
    isInventory ? state.ingestion.inventoryMappings : state.ingestion.salesMappings
  );
  const isImported = useAppSelector((state) => 
    isInventory ? state.ingestion.inventoryIsImported : state.ingestion.salesIsImported
  );
  const suppliers = useAppSelector((state) => state.core.suppliers);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);
  const semanticRules = useAppSelector((state) => state.ingestion.inventorySemanticRules);

  const availableSuppliers = suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const effectiveSupplierId = selectedSupplier || (availableSuppliers.length > 0 ? (availableSuppliers[0]._id || '') : '');

  // Reset clicked state when parsed result or imported state changes
  useEffect(() => {
    setHasClicked(false);
  }, [parsedResult, isImported]);

  // Keyboard shortcut to close fullscreen with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const getMappedField = (headerName: string): string => {
    return Object.entries(mappings).find(([, h]) => h === headerName)?.[0] || '';
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const options = isInventory ? INVENTORY_OPTIONS : SALES_OPTIONS;
    const found = options.find((o) => o.value === fieldValue);
    return found ? found.label : fieldValue;
  };

  const handleMappingChange = (dbField: string, headerName: string) => {
    if (isInventory) {
      dispatch(updateInventoryMapping({ dbField, headerName }));
    } else {
      dispatch(updateSalesMapping({ dbField, headerName }));
    }
  };

  const handleConfirm = () => {
    if (!parsedResult || !effectiveSupplierId || isImported || hasClicked || loading) return;
    setHasClicked(true);
    const documentId = parsedResult.documentId || parsedResult._id || parsedResult.ingestionJobId || '';
    if (isInventory) {
      const supplierObj = suppliers.find((s) => s._id === effectiveSupplierId);
      const templateName = supplierObj ? `${supplierObj.name} Template` : 'Default Template';
      dispatch(
        confirmInventoryThunk({
          documentId,
          supplierId: effectiveSupplierId,
          mappings,
          saveTemplate: true,
          templateName,
          semanticRules,
        })
      );
    } else {
      dispatch(
        confirmSalesThunk({
          documentId,
          supplierId: effectiveSupplierId,
          mappings,
          saveTemplate: false,
        })
      );
    }
  };

  const handleAction = () => {
    if (isTemplateMode) {
      onSave?.();
    } else {
      handleConfirm();
    }
  };

  const isDisabled = isTemplateMode ? (isSaving || loading) : (isImported || hasClicked || loading);

  const getButtonText = () => {
    if (isTemplateMode) {
      if (saveSuccess) return 'Mapping Saved ✓';
      if (isSaving || loading) return 'Saving Mapping...';
      return saveButtonText || 'Save Sheet Mapping';
    }
    if (isImported) {
      return isInventory ? 'Lots Imported ✓' : 'Sales Reconciled ✓';
    }
    if (hasClicked || loading) {
      return isInventory ? 'Importing Lots...' : 'Reconciling Sales...';
    }
    return isInventory ? 'Confirm & Import Lots' : 'Confirm & Reconcile Sales';
  };

  return (
    <div 
      className={`card mapper-table-card ${!parsedResult ? 'is-empty' : ''}`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              background: 'hsl(var(--bg-card, 223 47% 9%))',
              padding: '24px',
              borderRadius: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }
          : {
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 220px)',
            }
      }
    >
      {loading ? (
        <div className="loader-container" style={{ padding: '60px 20px' }}>
          <div className="loader" />
          <p style={{ fontWeight: 500 }}>
            {isInventory ? 'Running Ingestion Engine...' : 'Processing Sales Report...'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textAlign: 'center', maxWidth: '300px' }}>
            {loadingStep}
          </p>
        </div>
      ) : parsedResult ? (
        <div className="preview-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          {/* Dynamic Semantic Attribute Translation Rules - Top Section */}
          <SemanticRulesEditor
            rawHeaders={parsedResult.rawGrid[0] || []}
            rawGrid={parsedResult.rawGrid}
            pipelineType={isInventory ? 'inventory' : 'sales'}
          />

          <div className="preview-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>
                {title || (isInventory ? 'Confirm Inventory Data Mapping' : 'Confirm Sales Data Mapping')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                {subtitle || (isInventory
                  ? 'Verify suggested column templates and adjust manual overrides. Scroll horizontally to inspect grid.'
                  : 'Map columns for sales reconciliation (SKU, quantity sold, warehouse, lot number). Scroll horizontally to inspect grid.')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen View' : 'Full Screen View'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-color))',
                  background: 'hsl(var(--bg-card-hover))',
                  color: 'hsl(var(--text-primary))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
              </button>

              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-colors shadow-xs ${
                  isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                } ${
                  isImported || saveSuccess
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : isInventory
                    ? 'bg-[#0f4cc9] hover:bg-[#1a42a0] text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                onClick={handleAction}
                disabled={isDisabled}
              >
                {isTemplateMode ? (
                  saveSuccess ? <CheckCircle2 size={16} /> : <Check size={16} />
                ) : isImported ? (
                  <CheckCircle2 size={16} />
                ) : isDisabled ? (
                  <Lock size={16} />
                ) : (
                  <Check size={16} />
                )}
                <span>{getButtonText()}</span>
              </button>
            </div>
          </div>

          <div 
            className="preview-grid-wrapper"
            style={{
              flex: 1,
              overflow: 'auto',
              maxHeight: isFullscreen ? 'calc(100vh - 180px)' : 'calc(100vh - 360px)',
              minHeight: '260px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-color))',
              backgroundColor: 'hsl(var(--bg-card))',
            }}
          >
            <table className="preview-table" style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {parsedResult.rawGrid[0].map((header, colIdx) => {
                    const mappedField = getMappedField(header);
                    return (
                      <th key={colIdx} className={mappedField ? 'mapping-highlight' : ''} style={{ whiteSpace: 'nowrap' }}>
                        <div className="mapping-badge-container">
                          <span style={{ fontWeight: 'bold' }}>{header}</span>
                          <select
                            className="mapping-select"
                            value={mappedField}
                            onChange={(e) => handleMappingChange(e.target.value, header)}
                          >
                            <option value="">Unmapped</option>
                            {(isInventory ? INVENTORY_OPTIONS : SALES_OPTIONS).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {mappedField && (
                            <span className="badge badge-info" style={{ marginTop: '4px', fontSize: '0.65rem' }}>
                              {getFieldNameLabel(mappedField)}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {parsedResult.rawGrid.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => {
                      const header = parsedResult.rawGrid[0][cellIdx];
                      const mappedField = getMappedField(header);
                      return (
                        <td key={cellIdx} className={mappedField ? 'mapping-highlight' : ''} style={{ whiteSpace: 'nowrap' }}>
                          {cell || <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>empty</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state empty-state-compact">
          <div
            className="empty-state-icon-wrapper"
            style={{
              background: isInventory ? 'hsl(var(--primary) / 10%)' : 'hsl(var(--success) / 10%)',
              color: isInventory ? 'hsl(var(--primary))' : 'hsl(var(--success))',
            }}
          >
            {isInventory ? <UploadCloud size={36} /> : <DollarSign size={36} />}
          </div>
          <h3 style={{ fontSize: '1.1rem', margin: '4px 0' }}>
            {isInventory ? 'No Data Extracted' : 'No Sales Data Extracted'}
          </h3>
          <p style={{ maxWidth: '340px', fontSize: '0.85rem', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
            {isInventory
              ? 'Upload a PDF invoice or CSV surplus product spreadsheet on the left to preview raw grid extractions and verify database column mapping templates.'
              : 'Upload a distributor sales report (CSV or PDF) on the left to parse and reconcile against active inventory lots using FEFO allocation.'}
          </p>
          <div className="ingestion-feature-pills">
            <span className="pill">{isInventory ? '⚡ Docling OCR' : '⚡ FEFO Allocation'}</span>
            <span className="pill">🔍 Auto Schema Detection</span>
            <span className="pill">🛡️ Dynamic Rules</span>
          </div>
        </div>
      )}
    </div>
  );
};

