import { useState, useEffect } from 'react';
import { Check, UploadCloud, DollarSign, Users, Maximize2, Minimize2, CheckCircle2, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  updateInventoryMapping, 
  updateSalesMapping, 
  updateBuyerMapping,
  confirmInventoryThunk, 
  confirmSalesThunk,
  confirmBuyerThunk,
} from '../../../store/slices/ingestionSlice';
import { DEFAULT_SUPPLIERS } from '../../../services/coreService';
import { SemanticRulesEditor } from './SemanticRulesEditor';

export interface GridMapperTableProps {
  pipelineType?: 'inventory' | 'sales' | 'buyers';
  mode?: 'import' | 'template';
  title?: string;
  subtitle?: string;
  saveButtonText?: string;
  onSave?: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  onConfirmSuccess?: (result: any) => void;
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

export const GridMapperTable = ({
  pipelineType = 'inventory',
  mode = 'import',
  title,
  subtitle,
  saveButtonText,
  onSave,
  isSaving = false,
  saveSuccess = false,
  onConfirmSuccess,
}: GridMapperTableProps) => {
  const dispatch = useAppDispatch();
  const isInventory = pipelineType === 'inventory';
  const isSales = pipelineType === 'sales';
  const isBuyers = pipelineType === 'buyers';
  const isTemplateMode = mode === 'template';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  const { loading, loadingStep, parsedResult, mappings, isImported } = useAppSelector((state) => {
    switch (pipelineType) {
      case 'sales':
        return {
          loading: state.ingestion.salesLoading,
          loadingStep: state.ingestion.salesLoadingStep,
          parsedResult: state.ingestion.salesParsedResult,
          mappings: state.ingestion.salesMappings,
          isImported: state.ingestion.salesIsImported,
        };
      case 'buyers':
        return {
          loading: state.ingestion.buyerLoading,
          loadingStep: state.ingestion.buyerLoadingStep,
          parsedResult: state.ingestion.buyerParsedResult,
          mappings: state.ingestion.buyerMappings,
          isImported: state.ingestion.buyerIsImported,
        };
      case 'inventory':
      default:
        return {
          loading: state.ingestion.inventoryLoading,
          loadingStep: state.ingestion.inventoryLoadingStep,
          parsedResult: state.ingestion.inventoryParsedResult,
          mappings: state.ingestion.inventoryMappings,
          isImported: state.ingestion.inventoryIsImported,
        };
    }
  });
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
    const found = Object.entries(mappings || {}).find(([, h]) => h === headerName)?.[0] || '';
    if (isBuyers && found === 'name') return 'companyName';
    return found;
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const options = isInventory ? INVENTORY_OPTIONS : isSales ? SALES_OPTIONS : BUYER_OPTIONS;
    const norm = (isBuyers && fieldValue === 'name') ? 'companyName' : fieldValue;
    const found = options.find((o) => o.value === norm);
    return found ? found.label : fieldValue;
  };

  const handleMappingChange = (dbField: string, headerName: string) => {
    if (isInventory) {
      dispatch(updateInventoryMapping({ dbField, headerName }));
    } else if (isSales) {
      dispatch(updateSalesMapping({ dbField, headerName }));
    } else {
      dispatch(updateBuyerMapping({ dbField, headerName }));
      if (dbField === 'companyName') {
        dispatch(updateBuyerMapping({ dbField: 'name', headerName }));
      }
    }
  };

  const handleConfirm = async () => {
    if (!parsedResult || !effectiveSupplierId || isImported || hasClicked || loading) return;
    setHasClicked(true);
    const documentId = parsedResult.documentId || parsedResult._id || parsedResult.ingestionJobId || '';
    if (isInventory) {
      const supplierObj = suppliers.find((s) => s._id === effectiveSupplierId);
      const templateName = supplierObj ? `${supplierObj.name} Template` : 'Default Template';
      const res = await dispatch(
        confirmInventoryThunk({
          documentId,
          supplierId: effectiveSupplierId,
          mappings,
          saveTemplate: true,
          templateName,
          semanticRules,
        })
      );
      if (confirmInventoryThunk.fulfilled.match(res)) {
        onConfirmSuccess?.(res.payload);
      }
    } else if (isSales) {
      const res = await dispatch(
        confirmSalesThunk({
          documentId,
          supplierId: effectiveSupplierId,
          mappings,
          saveTemplate: false,
        })
      );
      if (confirmSalesThunk.fulfilled.match(res)) {
        onConfirmSuccess?.(res.payload);
      }
    } else {
      const res = await dispatch(
        confirmBuyerThunk({
          documentId,
          mappings,
          supplierId: effectiveSupplierId,
        })
      );
      if (confirmBuyerThunk.fulfilled.match(res)) {
        onConfirmSuccess?.(res.payload);
      }
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
      return isInventory ? 'Lots Imported ✓' : isSales ? 'Sales Reconciled ✓' : 'Buyers Ingested ✓';
    }
    if (hasClicked || loading) {
      return isInventory ? 'Importing Lots...' : isSales ? 'Reconciling Sales...' : 'Ingesting Buyers...';
    }
    if (isInventory) {
      return 'Confirm & Import Lots';
    }
    return saveButtonText || (isSales ? 'Confirm & Reconcile Sales' : 'Confirm & Ingest Buyers');
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
                            {(isInventory ? INVENTORY_OPTIONS : isSales ? SALES_OPTIONS : BUYER_OPTIONS).map((opt) => (
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
              background: isInventory ? 'hsl(var(--primary) / 10%)' : isSales ? 'hsl(var(--success) / 10%)' : 'hsl(var(--primary) / 10%)',
              color: isInventory ? 'hsl(var(--primary))' : isSales ? 'hsl(var(--success))' : 'hsl(var(--primary))',
            }}
          >
            {isInventory ? <UploadCloud size={36} /> : isSales ? <DollarSign size={36} /> : <Users size={36} />}
          </div>
          <h3 style={{ fontSize: '1.1rem', margin: '4px 0' }}>
            {isInventory ? 'No Data Extracted' : isSales ? 'No Sales Data Extracted' : 'No Buyer Data Extracted'}
          </h3>
          <p style={{ maxWidth: '340px', fontSize: '0.85rem', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
            {isInventory
              ? 'Upload a PDF invoice or CSV surplus product spreadsheet on the left to preview raw grid extractions and verify database column mapping templates.'
              : isSales
              ? 'Upload a distributor sales report (CSV or PDF) on the left to parse and reconcile against active inventory lots using FEFO allocation.'
              : 'Upload a buyer directory spreadsheet (.csv or .xlsx) on the left to preview raw grid extractions and verify column mappings.'}
          </p>
          <div className="ingestion-feature-pills">
            <span className="pill">{isInventory ? '⚡ Docling OCR' : isSales ? '⚡ FEFO Allocation' : '⚡ Deduplication Engine'}</span>
            <span className="pill">🔍 Auto Schema Detection</span>
            <span className="pill">🛡️ Dynamic Rules</span>
          </div>
        </div>
      )}
    </div>
  );
};

