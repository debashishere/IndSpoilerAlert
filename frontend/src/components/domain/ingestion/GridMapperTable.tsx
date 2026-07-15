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
  pipelineType: 'inventory' | 'sales';
}

const INVENTORY_OPTIONS = [
  { value: 'sku', label: 'SKU' },
  { value: 'description', label: 'Description' },
  { value: 'quantity', label: 'Quantity (Cases)' },
  { value: 'expirationDate', label: 'Expiration Date' },
  { value: 'originalPrice', label: 'Original Price' },
  { value: 'lotNumber', label: 'Lot Number' },
  { value: 'productionDate', label: 'Production Date' },
  { value: 'category', label: 'Category' },
  { value: 'standardSellPrice', label: 'List Price' },
  { value: 'warehouse', label: 'Warehouse / DC' },
];

const SALES_OPTIONS = [
  { value: 'sku', label: 'SKU' },
  { value: 'lotNumber', label: 'Lot Number' },
  { value: 'buyerEmail', label: 'Buyer Email' },
  { value: 'quantity', label: 'Quantity Sold (Cases)' },
  { value: 'price', label: 'Price Per Case' },
  { value: 'saleDate', label: 'Sale Date' },
  { value: 'invoiceNumber', label: 'Invoice #' },
  { value: 'productName', label: 'Product Name' },
  { value: 'warehouse', label: 'Warehouse / DC' },
  { value: 'revenue', label: 'Total Revenue' },
];

export const GridMapperTable = ({ pipelineType }: GridMapperTableProps) => {
  const dispatch = useAppDispatch();
  const isInventory = pipelineType === 'inventory';

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

  const isDisabled = isImported || hasClicked || loading;

  const getButtonText = () => {
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
          <div className="preview-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                {isInventory ? `Extract Preview: ${parsedResult.fileName}` : `Sales Extract Preview: ${parsedResult.fileName}`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                {isInventory
                  ? 'Verify suggested column templates and adjust manual overrides. Scroll horizontally to inspect grid.'
                  : 'Map columns for sales reconciliation (SKU, quantity sold, warehouse, lot number). Scroll horizontally to inspect grid.'}
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
                className={`btn ${isImported ? 'btn-secondary' : 'btn-primary'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.75 : 1,
                  background: isImported
                    ? 'hsl(142 76% 20% / 40%)'
                    : isInventory
                    ? undefined
                    : 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 46%))',
                  color: isImported ? 'hsl(142 76% 65%)' : '#fff',
                  border: isImported ? '1px solid hsl(142 76% 36% / 50%)' : 'none',
                  boxShadow: isDisabled ? 'none' : '0 4px 12px hsl(var(--primary) / 0.25)',
                }}
                onClick={handleConfirm}
                disabled={isDisabled}
              >
                {isImported ? <CheckCircle2 size={16} /> : isDisabled ? <Lock size={16} /> : <Check size={16} />}
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

          {isInventory && <SemanticRulesEditor rawHeaders={parsedResult.rawGrid[0] || []} />}
        </div>
      ) : (
        <div className="empty-state empty-state-compact">
          <div
            className="empty-state-icon-wrapper"
            style={{
              background: isInventory ? 'hsl(var(--primary) / 10%)' : 'hsl(142 76% 46% / 10%)',
              color: isInventory ? 'hsl(var(--primary))' : 'hsl(142, 76%, 46%)',
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

