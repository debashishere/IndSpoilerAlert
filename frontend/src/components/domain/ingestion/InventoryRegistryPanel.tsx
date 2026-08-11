import { useEffect, useRef, useState } from 'react';
import { 
  Database, 
  UploadCloud, 
  Check, 
  X, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileText,
  Sparkles,
  Package
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { DEFAULT_SUPPLIERS } from '../../../services/coreService';
import { 
  setSelectedSupplier,
  setInventoryFile,
  setInventoryDragActive,
  setInventoryError,
  setInventoryParsedResult,
  updateInventoryMapping,
  uploadInventoryThunk,
  confirmInventoryThunk
} from '../../../store/slices/ingestionSlice';
import { fetchCoreReferenceData } from '../../../store/slices/coreSlice';
import { fetchInventoryLotsThunk } from '../../../services/inventoryService';
import {
  setFilterSearch,
  setFilterSupplier,
  setFilterDC,
  setFilterCategory,
  setFilterStatus,
  selectFilteredInventoryLots,
} from '../../../store/slices/inventorySlice';
import { SemanticRulesEditor } from './SemanticRulesEditor';
import { InventoryTable } from '../inventory/InventoryTable';
import { RiskAssessmentModal } from '../inventory/RiskAssessmentModal';
import { ComplianceModal } from '../inventory/ComplianceModal';

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

export const InventoryRegistryPanel: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const dispatch = useAppDispatch();

  const suppliers = useAppSelector((state) => state.core.suppliers);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);

  const inventoryFile = useAppSelector((state) => state.ingestion.inventoryFile);
  const inventoryDragActive = useAppSelector((state) => state.ingestion.inventoryDragActive);
  const inventoryLoading = useAppSelector((state) => state.ingestion.inventoryLoading);
  const inventoryLoadingStep = useAppSelector((state) => state.ingestion.inventoryLoadingStep);
  const inventoryError = useAppSelector((state) => state.ingestion.inventoryError);
  const inventoryParsedResult = useAppSelector((state) => state.ingestion.inventoryParsedResult);
  const inventoryMappings = useAppSelector((state) => state.ingestion.inventoryMappings);
  const inventorySemanticRules = useAppSelector((state) => state.ingestion.inventorySemanticRules);
  const inventoryIsImported = useAppSelector((state) => state.ingestion.inventoryIsImported);
  const inventoryImportCount = useAppSelector((state) => state.ingestion.inventoryImportCount);
  const inventoryImportedLotIds = useAppSelector((state) => state.ingestion.inventoryImportedLotIds);

  const inventoryList = useAppSelector((state) => state.inventory?.inventoryList || []);
  const inventoryListLoading = useAppSelector((state) => state.inventory?.loading || false);

  const listFilterSearch = useAppSelector((state) => state.inventory?.listFilterSearch || '');
  const listFilterSupplier = useAppSelector((state) => state.inventory?.listFilterSupplier || '');
  const listFilterDC = useAppSelector((state) => state.inventory?.listFilterDC || '');
  const listFilterCategory = useAppSelector((state) => state.inventory?.listFilterCategory || '');
  const listFilterStatus = useAppSelector((state) => state.inventory?.listFilterStatus || '');

  const filteredLots = useAppSelector(selectFilteredInventoryLots);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const actualFileRef = useRef<File | null>(null);

  const availableSuppliers = suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const effectiveSupplierId = selectedSupplier || (availableSuppliers.length > 0 ? (availableSuppliers[0]._id || '') : '');

  useEffect(() => {
    dispatch(fetchCoreReferenceData());
    dispatch(fetchInventoryLotsThunk(undefined));
  }, [dispatch]);

  const getMappedField = (headerName: string): string => {
    return Object.entries(inventoryMappings).find(([, h]) => h === headerName)?.[0] || '';
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const found = INVENTORY_OPTIONS.find((o) => o.value === fieldValue);
    return found ? found.label : fieldValue;
  };

  const handleMappingChange = (dbField: string, headerName: string) => {
    dispatch(updateInventoryMapping({ dbField, headerName }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    actualFileRef.current = file;
    dispatch(setInventoryFile({ name: file.name, size: file.size }));
  };

  const handleRunExtraction = async () => {
    const actualFile = actualFileRef.current;
    if (!actualFile) {
      dispatch(setInventoryError('Please select an inventory document file.'));
      return;
    }
    if (!effectiveSupplierId) {
      dispatch(setInventoryError('Please select a CPG Supplier Company.'));
      return;
    }
    setIsImportModalOpen(false);
    await dispatch(uploadInventoryThunk({ file: actualFile, supplierId: effectiveSupplierId }));
  };

  const handleConfirmInventoryImport = async () => {
    if (!inventoryParsedResult) return;
    const documentId = inventoryParsedResult.documentId || inventoryParsedResult._id || inventoryParsedResult.ingestionJobId || '';
    const supplierObj = suppliers.find((s) => s._id === effectiveSupplierId);
    const templateName = supplierObj ? `${supplierObj.name} Template` : 'Default Template';

    const res = await dispatch(
      confirmInventoryThunk({
        documentId,
        supplierId: effectiveSupplierId,
        mappings: inventoryMappings,
        saveTemplate: true,
        templateName,
        semanticRules: inventorySemanticRules,
      })
    );

    if (confirmInventoryThunk.fulfilled.match(res)) {
      dispatch(fetchInventoryLotsThunk(undefined));
      dispatch(setInventoryParsedResult(null));
      dispatch(setInventoryFile(null));
      actualFileRef.current = null;
      setIsFullscreen(false);
    }
  };

  const handleCancelInventoryImport = () => {
    dispatch(setInventoryParsedResult(null));
    dispatch(setInventoryFile(null));
    actualFileRef.current = null;
    setIsFullscreen(false);
  };

  // Build filter dropdown lists with default presets & dynamic values from inventoryList
  const defaultSuppliers = ['Unilever'];
  const dynamicSuppliers = (inventoryList || []).map((lot: any) => lot.supplierId?.name || lot.supplier).filter(Boolean);
  const uniqueSuppliers = Array.from(new Set([...defaultSuppliers, ...dynamicSuppliers]));

  const defaultDCs = ['Unilever Midwest DC', 'Kraft Heinz Midwest DC', 'Mondelez Midwest DC', 'Danone Midwest DC', 'Conagra Midwest DC'];
  const dynamicDCs = (inventoryList || []).map((lot: any) => lot.distributionCenterId?.name || lot.warehouse || lot.location).filter(Boolean);
  const uniqueDCs = Array.from(new Set([...defaultDCs, ...dynamicDCs]));

  const defaultCategories = ['Dairy', 'Dry Goods', 'Beverages', 'Meat'];
  const dynamicCategories = (inventoryList || []).map((lot: any) => lot.productId?.category || lot.category).filter(Boolean);
  const uniqueCategories = Array.from(new Set([...defaultCategories, ...dynamicCategories]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Ingestion Actions (Converted to match Buyer List & Sales Data Ingestion structure) */}
      <div className="card" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <Database size={20} style={{ color: 'hsl(var(--primary))' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Inventory Data Ingestion</h3>
              <span
                style={{
                  background: 'hsl(var(--primary) / 0.15)',
                  color: 'hsl(var(--primary))',
                  border: '1px solid hsl(var(--primary) / 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '10px',
                }}
              >
                {(inventoryList || []).length} Inventory Lots
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
              Upload unstructured invoice lists and surplus product spreadsheets (PDF or CSV) for AI Docling OCR parsing, dynamic column schema mapping, and inventory lot import.
            </p>
          </div>

          {/* Action Buttons in Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(262, 83%, 53%))',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px hsl(var(--primary) / 0.35)',
              }}
            >
              <UploadCloud size={16} /> Upload Inventory Document via CSV/PDF
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for ref/tests */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Upload Inventory Document Modal */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            style={{
              background: 'hsl(223, 47%, 10%)',
              border: '1px solid hsl(var(--primary) / 0.35)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '28px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 20px hsl(var(--primary) / 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'hsl(var(--primary) / 0.15)',
                    border: '1px solid hsl(var(--primary) / 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    Upload Inventory Document
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                    Select CPG supplier company and upload invoice list or product spreadsheet.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{
                  background: 'hsl(223, 47%, 14%)',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '8px',
                  color: 'hsl(var(--text-muted))',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* CPG Supplier Company Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                CPG Supplier Company *
              </label>
              <select
                value={effectiveSupplierId}
                onChange={(e) => dispatch(setSelectedSupplier(e.target.value))}
                style={{
                  width: '100%',
                  background: 'hsl(223, 47%, 8%)',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
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
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(setInventoryDragActive(true));
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(setInventoryDragActive(false));
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(setInventoryDragActive(false));
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) {
                  actualFileRef.current = droppedFile;
                  dispatch(setInventoryFile({ name: droppedFile.name, size: droppedFile.size }));
                }
              }}
              style={{
                border: `2px dashed ${inventoryDragActive ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'}`,
                borderRadius: '12px',
                background: inventoryDragActive ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--primary) / 0.04)',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {inventoryFile ? (
                <>
                  {inventoryFile.name.endsWith('.csv') ? (
                    <FileSpreadsheet size={38} style={{ color: 'hsl(var(--primary))', marginBottom: '10px' }} />
                  ) : (
                    <FileText size={38} style={{ color: 'hsl(var(--primary))', marginBottom: '10px' }} />
                  )}
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                    {inventoryFile.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    {(inventoryFile.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud size={38} style={{ color: 'hsl(var(--primary))', marginBottom: '10px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                    Drag & Drop Invoice File here
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    Supports PDF (Docling OCR) or CSV surplus product spreadsheets
                  </p>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-color))',
                  background: 'hsl(223, 47%, 14%)',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunExtraction}
                disabled={!inventoryFile || inventoryLoading}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: inventoryFile ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(262, 83%, 53%))' : 'hsl(var(--border-color))',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: inventoryFile && !inventoryLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: inventoryFile ? '0 4px 14px hsl(var(--primary) / 0.35)' : 'none',
                }}
              >
                <Sparkles size={16} /> Run Extraction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {inventoryError && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid hsl(var(--error))',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={20} style={{ color: 'hsl(var(--error))', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'hsl(var(--error))', marginBottom: '4px', margin: 0 }}>Extraction Error</h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', margin: '4px 0 0' }}>{inventoryError}</p>
          </div>
        </div>
      )}

      {/* Ingestion Complete Success Banner */}
      {inventoryIsImported && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid hsl(var(--success))',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <CheckCircle2 size={20} style={{ color: 'hsl(var(--success))', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'hsl(var(--success))', margin: '0 0 4px' }}>Ingestion Complete</h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', margin: 0 }}>
              Successfully imported <strong>{inventoryImportCount}</strong> product lots to inventory database.
            </p>
            {inventoryImportedLotIds.length > 0 && (
              <div style={{ marginTop: '8px', maxHeight: '100px', overflowY: 'auto' }}>
                {inventoryImportedLotIds.map((id) => (
                  <span
                    key={id}
                    style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      backgroundColor: 'hsl(var(--primary-glow) / 20%)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      margin: '2px',
                      color: 'hsl(var(--primary))',
                      border: '1px solid hsl(var(--primary) / 20%)',
                      fontWeight: 600,
                    }}
                  >
                    🔍 {id}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Column Mapping State OR Processing Loader */}
      {inventoryLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div className="loader" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Running Ingestion Engine...</p>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0 }}>{inventoryLoadingStep || 'Analyzing document headers...'}</p>
        </div>
      ) : inventoryParsedResult ? (
        <div
          className="card"
          style={{
            border: '1px solid hsl(var(--primary) / 0.5)',
            background: 'hsl(223, 47%, 10%)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            ...(isFullscreen
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                  background: 'hsl(223, 47%, 9%)',
                  padding: '24px',
                  borderRadius: 0,
                  overflow: 'hidden',
                }
              : {}),
          }}
        >
          <div className="preview-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div className="preview-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <CheckCircle2 size={20} style={{ color: 'hsl(var(--primary))' }} />
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#fff', fontWeight: 700 }}>
                    Extract Preview: {inventoryParsedResult.fileName}
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'hsl(var(--primary) / 0.2)',
                      color: 'hsl(var(--primary))',
                      border: '1px solid hsl(var(--primary) / 0.4)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {inventoryParsedResult.fileName}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                  Verify suggested column templates and adjust manual overrides. Scroll horizontally to inspect grid.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    background: 'hsl(223, 47%, 14%)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInventoryImport}
                  disabled={inventoryLoading || inventoryIsImported}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: inventoryLoading || inventoryIsImported ? 'not-allowed' : 'pointer',
                    background: inventoryIsImported
                      ? 'hsl(142 76% 20% / 40%)'
                      : 'linear-gradient(135deg, hsl(var(--primary)), hsl(262, 83%, 53%))',
                    color: inventoryIsImported ? 'hsl(142 76% 65%)' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px hsl(var(--primary) / 0.35)',
                  }}
                >
                  <Check size={16} /> {inventoryIsImported ? 'Lots Imported ✓' : 'Confirm & Import Lots'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelInventoryImport}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    background: 'hsl(223, 47%, 14%)',
                    color: 'hsl(var(--text-muted))',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              className="preview-grid-wrapper"
              style={{
                maxHeight: isFullscreen ? 'calc(100vh - 180px)' : '550px',
                overflow: 'auto',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border-color))',
              }}
            >
              <table className="preview-table">
                <thead>
                  <tr>
                    {(inventoryParsedResult.rawGrid?.[0] || []).map((header: string, colIdx: number) => {
                      const mappedField = getMappedField(header);
                      return (
                        <th key={colIdx} className={mappedField ? 'mapping-highlight' : ''}>
                          <div className="mapping-badge-container">
                            <span style={{ fontWeight: 'bold' }}>{header}</span>
                            <select
                              className="mapping-select"
                              value={mappedField}
                              onChange={(e) => handleMappingChange(e.target.value, header)}
                            >
                              <option value="">Unmapped</option>
                              {INVENTORY_OPTIONS.map((opt) => (
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
                  {(inventoryParsedResult.rawGrid?.slice(1) || []).map((row: string[], rowIdx: number) => (
                    <tr key={rowIdx}>
                      {row.map((cell: string, cellIdx: number) => {
                        const header = inventoryParsedResult.rawGrid[0]?.[cellIdx];
                        const mappedField = header ? getMappedField(header) : '';
                        return (
                          <td key={cellIdx} className={mappedField ? 'mapping-highlight' : ''}>
                            {cell || <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>empty</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SemanticRulesEditor rawHeaders={inventoryParsedResult.rawGrid[0] || []} />
          </div>
        </div>
      ) : null}

      {/* Bottom Section: Inventory Data List Section with Migrated Filter Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          className="collapsible-filters-panel"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}
        >
          <div className="filter-input-group">
            <label>Search Product</label>
            <input
              className="filter-search"
              placeholder="Search SKU, product description..."
              type="text"
              value={listFilterSearch}
              onChange={(e) => dispatch(setFilterSearch(e.target.value))}
            />
          </div>

          <div className="filter-input-group">
            <label>Supplier</label>
            <select
              className="filter-select"
              value={listFilterSupplier}
              onChange={(e) => dispatch(setFilterSupplier(e.target.value))}
            >
              <option value="">All Suppliers</option>
              {uniqueSuppliers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label>Distribution Center</label>
            <select
              className="filter-select"
              value={listFilterDC}
              onChange={(e) => dispatch(setFilterDC(e.target.value))}
            >
              <option value="">All Warehouses</option>
              {uniqueDCs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label>Category</label>
            <select
              className="filter-select"
              value={listFilterCategory}
              onChange={(e) => dispatch(setFilterCategory(e.target.value))}
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label>Status</label>
            <select
              className="filter-select"
              value={listFilterStatus}
              onChange={(e) => dispatch(setFilterStatus(e.target.value))}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active Listing</option>
              <option value="sold">Sold</option>
              <option value="donated">Donated</option>
              <option value="recycled">Recycled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'flex-end' }}>
            {(listFilterSearch || listFilterSupplier || listFilterDC || listFilterCategory || listFilterStatus) && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  dispatch(setFilterSearch(''));
                  dispatch(setFilterSupplier(''));
                  dispatch(setFilterDC(''));
                  dispatch(setFilterCategory(''));
                  dispatch(setFilterStatus(''));
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Loaded Inventory Data Frame (Migrated full Inventory Table View) */}
        {inventoryListLoading && (!inventoryList || inventoryList.length === 0) ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
            <div className="loader" style={{ margin: '0 auto 12px' }} />
            Loading inventory lots...
          </div>
        ) : (inventoryList || []).length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
            <Package size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            No inventory lots recorded yet. Click "Upload Inventory Document" above to ingest product lots.
          </div>
        ) : (
          <InventoryTable filteredLots={filteredLots} onOpenLotHub={onOpenLotHub} />
        )}
      </div>

      {/* Domain Modals */}
      <RiskAssessmentModal />
      <ComplianceModal />
    </div>
  );
};
