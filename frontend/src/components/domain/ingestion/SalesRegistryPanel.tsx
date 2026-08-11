import { useEffect, useRef, useState } from 'react';
import { 
  DollarSign, 
  UploadCloud, 
  Check, 
  X, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileText
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { DEFAULT_SUPPLIERS } from '../../../services/coreService';
import { 
  setSelectedSupplier,
  setSalesFile,
  setSalesDragActive,
  setSalesError,
  setSalesParsedResult,
  updateSalesMapping,
  uploadSalesThunk,
  confirmSalesThunk,
  fetchSalesRecordsThunk
} from '../../../store/slices/ingestionSlice';
import { SalesTable } from '../inventory/SalesTable';

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

export const SalesRegistryPanel = () => {
  const dispatch = useAppDispatch();
  
  const suppliers = useAppSelector((state) => state.core.suppliers);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);
  
  const salesFile = useAppSelector((state) => state.ingestion.salesFile);
  const salesDragActive = useAppSelector((state) => state.ingestion.salesDragActive);
  const salesLoading = useAppSelector((state) => state.ingestion.salesLoading);
  const salesLoadingStep = useAppSelector((state) => state.ingestion.salesLoadingStep);
  const salesError = useAppSelector((state) => state.ingestion.salesError);
  const salesParsedResult = useAppSelector((state) => state.ingestion.salesParsedResult);
  const salesMappings = useAppSelector((state) => state.ingestion.salesMappings);
  const salesIsImported = useAppSelector((state) => state.ingestion.salesIsImported);
  const salesImportCount = useAppSelector((state) => state.ingestion.salesImportCount);
  const salesImportWarnings = useAppSelector((state) => state.ingestion.salesImportWarnings);
  const salesRecords = useAppSelector((state) => state.ingestion.salesRecords);
  const salesRecordsLoading = useAppSelector((state) => state.ingestion.salesRecordsLoading);

  const [search, setSearch] = useState('');
  const [lotNumberFilter, setLotNumberFilter] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [dcFilter, setDcFilter] = useState('');
  const [createDateFilter, setCreateDateFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actualFileRef = useRef<File | null>(null);

  const availableSuppliers = suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const effectiveSupplierId = selectedSupplier || (availableSuppliers.length > 0 ? (availableSuppliers[0]._id || '') : '');

  useEffect(() => {
    dispatch(fetchSalesRecordsThunk());
  }, [dispatch]);

  const getMappedField = (headerName: string): string => {
    return Object.entries(salesMappings).find(([, h]) => h === headerName)?.[0] || '';
  };

  const getFieldNameLabel = (fieldValue: string): string => {
    const found = SALES_OPTIONS.find((o) => o.value === fieldValue);
    return found ? found.label : fieldValue;
  };

  const handleMappingChange = (dbField: string, headerName: string) => {
    dispatch(updateSalesMapping({ dbField, headerName }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    actualFileRef.current = file;
    dispatch(setSalesFile({ name: file.name, size: file.size }));
  };

  const handleRunSalesExtraction = async () => {
    const actualFile = actualFileRef.current;
    if (!actualFile) {
      dispatch(setSalesError('Please select a sales report file.'));
      return;
    }
    if (!effectiveSupplierId) {
      dispatch(setSalesError('Please select a CPG Supplier Company.'));
      return;
    }
    setIsImportModalOpen(false);
    await dispatch(uploadSalesThunk({ file: actualFile, supplierId: effectiveSupplierId }));
  };

  const handleConfirmSalesImport = async () => {
    if (!salesParsedResult) return;
    const documentId = salesParsedResult.documentId || salesParsedResult._id || salesParsedResult.ingestionJobId || '';
    const res = await dispatch(
      confirmSalesThunk({
        documentId,
        supplierId: effectiveSupplierId,
        mappings: salesMappings,
        saveTemplate: false,
      })
    );
    if (confirmSalesThunk.fulfilled.match(res)) {
      dispatch(fetchSalesRecordsThunk());
      dispatch(setSalesParsedResult(null));
      dispatch(setSalesFile(null));
      actualFileRef.current = null;
      setIsFullscreen(false);
    }
  };

  const handleCancelSalesImport = () => {
    dispatch(setSalesParsedResult(null));
    dispatch(setSalesFile(null));
    actualFileRef.current = null;
    setIsFullscreen(false);
  };

  // Filter sales records based on search term & sales-tailored filters
  const filteredRecords = (salesRecords || []).filter((r: any) => {
    const term = search.toLowerCase();
    const prod = (r.productName || r.description || r.product || '').toLowerCase();
    const sku = (r.sku || r.productId || '').toLowerCase();
    const lotNum = (r.lotNumber || r['Lot Number'] || r.lot || r.lotNo || r.lotCode || '').toLowerCase();
    const buyerName = (r.buyerName || r.buyerId?.companyName || r.customer || '').toLowerCase();
    const buyerEmail = (r.buyerEmail || r.buyerId?.email || '').toLowerCase();
    const inv = (r.invoiceNumber || r.invoice || '').toLowerCase();
    const dc = (r.warehouse || r.dc || r.location || '').toLowerCase();
    const status = (r.status || 'reconciled').toLowerCase();

    // Match Search (product description, sku, lot #, buyer name, buyer email, invoice #)
    const matchesSearch =
      !search ||
      prod.includes(term) ||
      sku.includes(term) ||
      lotNum.includes(term) ||
      buyerName.includes(term) ||
      buyerEmail.includes(term) ||
      inv.includes(term) ||
      dc.includes(term);

    // Match Lot Number Filter
    const matchesLotNumber =
      !lotNumberFilter || lotNum.includes(lotNumberFilter.toLowerCase().trim());

    // Match Buyer Filter
    const matchesBuyer =
      !buyerFilter ||
      buyerName === buyerFilter.toLowerCase() ||
      buyerEmail === buyerFilter.toLowerCase();

    // Match DC Filter
    const matchesDc = !dcFilter || dcFilter === 'all' || dc === dcFilter.toLowerCase();

    // Match Create Date Filter (comparing YYYY-MM-DD)
    let matchesCreateDate = true;
    if (createDateFilter) {
      const recordDateStr = r.createdAt || r.saleDate || r.date;
      if (recordDateStr) {
        const recordIsoDate = new Date(recordDateStr).toISOString().split('T')[0];
        matchesCreateDate = recordIsoDate === createDateFilter;
      } else {
        matchesCreateDate = false;
      }
    }

    // Match Price Filter
    let matchesPrice = true;
    if (priceFilter) {
      const price = r.pricePerCase || r.unitPrice || r.price || 0;
      if (priceFilter === 'under10') matchesPrice = price < 10;
      else if (priceFilter === '10-25') matchesPrice = price >= 10 && price <= 25;
      else if (priceFilter === '25-50') matchesPrice = price > 25 && price <= 50;
      else if (priceFilter === 'over50') matchesPrice = price > 50;
    }

    // Match Status Filter
    const matchesStatus = !statusFilter || status === statusFilter.toLowerCase();

    return (
      matchesSearch &&
      matchesLotNumber &&
      matchesBuyer &&
      matchesDc &&
      matchesCreateDate &&
      matchesPrice &&
      matchesStatus
    );
  });

  // Extract unique buyers for filter dropdown
  const dynamicBuyers = (salesRecords || [])
    .map((r: any) => r.buyerName || r.buyerId?.companyName || r.buyerEmail || r.customer)
    .filter(Boolean);
  const uniqueBuyers = Array.from(new Set(dynamicBuyers));

  // Extract unique warehouses / DCs for filter dropdown
  const defaultDCs = [
    'Unilever Midwest DC',
    'Kraft Heinz Midwest DC',
    'Mondelez Midwest DC',
    'Danone Midwest DC',
    'Conagra Midwest DC',
  ];
  const dynamicDCs = (salesRecords || [])
    .map((r: any) => r.warehouse || r.dc || r.location)
    .filter(Boolean);
  const uniqueDCs = Array.from(new Set([...defaultDCs, ...dynamicDCs]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Ingestion Actions (Converted from "Sales Report Source" to "Buyer List Ingestion" structure) */}
      <div className="card" style={{ borderLeft: '4px solid hsl(var(--success))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <DollarSign size={20} style={{ color: 'hsl(var(--success))' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Sales Data Ingestion</h3>
              <span
                style={{
                  background: 'hsl(var(--success) / 0.15)',
                  color: 'hsl(var(--success))',
                  border: '1px solid hsl(var(--success) / 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '10px',
                }}
              >
                {(salesRecords || []).length} Sales Records
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
              Upload distributor closeout sales sheets (CSV or PDF) for AI parsing, automated schema mapping, and reconciliation against active inventory lots using FEFO allocation.
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
                background: 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success)))',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px hsl(142, 76%, 36% / 0.35)',
              }}
            >
              <UploadCloud size={16} /> Upload Sales Report via CSV/PDF
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for trigger/tests */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Upload Sales Report Modal */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'hsl(var(--bg-card) / 0.8)',
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
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--success) / 0.35)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '28px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 20px hsl(var(--success) / 0.15)',
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
                    background: 'hsl(var(--success) / 0.15)',
                    border: '1px solid hsl(var(--success) / 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'hsl(var(--success))',
                  }}
                >
                  <DollarSign size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
                    Upload Sales Report
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                    Select supplier company and upload sales report file (CSV/PDF).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{
                  background: 'hsl(var(--bg-card))',
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

            {/* Supplier Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                CPG Supplier Company *
              </label>
              <select
                value={effectiveSupplierId}
                onChange={(e) => dispatch(setSelectedSupplier(e.target.value))}
                style={{
                  width: '100%',
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
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
                dispatch(setSalesDragActive(true));
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(setSalesDragActive(false));
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(setSalesDragActive(false));
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) {
                  actualFileRef.current = droppedFile;
                  dispatch(setSalesFile({ name: droppedFile.name, size: droppedFile.size }));
                }
              }}
              style={{
                border: `2px dashed ${salesDragActive ? 'hsl(var(--success))' : 'hsl(var(--success) / 0.4)'}`,
                borderRadius: '12px',
                background: salesDragActive ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--success) / 0.04)',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {salesFile ? (
                <>
                  {salesFile.name.endsWith('.csv') ? (
                    <FileSpreadsheet size={38} style={{ color: 'hsl(var(--success))', marginBottom: '10px' }} />
                  ) : (
                    <FileText size={38} style={{ color: 'hsl(var(--success))', marginBottom: '10px' }} />
                  )}
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>
                    {salesFile.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    {(salesFile.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud size={38} style={{ color: 'hsl(var(--success))', marginBottom: '10px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>
                    Drag & Drop Sales Report here
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    Supports distributor closeout sales sheets in <code style={{ color: 'hsl(var(--success))' }}>.csv</code> or <code style={{ color: 'hsl(var(--success))' }}>.pdf</code> format
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
                  background: 'hsl(var(--bg-card))',
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
                onClick={handleRunSalesExtraction}
                disabled={!salesFile || salesLoading}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: salesFile ? 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success)))' : 'hsl(var(--border-color))',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: salesFile && !salesLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: salesFile ? '0 4px 14px hsl(142, 76%, 36% / 0.35)' : 'none',
                }}
              >
                <UploadCloud size={16} /> Run Sales Extraction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {salesError && (
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
            <h4 style={{ color: 'hsl(var(--error))', marginBottom: '4px', margin: 0 }}>Sales Extraction Error</h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', margin: '4px 0 0' }}>{salesError}</p>
          </div>
        </div>
      )}

      {/* Success / Warning Message after Ingestion */}
      {salesIsImported && (
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
            <h4 style={{ color: 'hsl(var(--success))', margin: '0 0 4px' }}>
              Sales Reconciliation Complete
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', margin: 0 }}>
              Successfully reconciled <strong>{salesImportCount}</strong> sales records against surplus inventory (FEFO allocation applied).
            </p>
            {salesImportWarnings.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'hsl(45, 93%, 47%)', fontWeight: 600, margin: 0 }}>
                  ⚠️ Reconciliation Warnings:
                </p>
                {salesImportWarnings.map((w, i) => (
                  <p key={i} style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px', margin: 0 }}>
                    • {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Column Mapping State OR Processing Loader */}
      {salesLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div className="loader" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Processing Sales Report...</p>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0 }}>{salesLoadingStep || 'Analyzing sales table columns...'}</p>
        </div>
      ) : salesParsedResult ? (
        <div
          className="card"
          style={{
            border: '1px solid hsl(var(--success) / 0.5)',
            background: 'hsl(var(--bg-card))',
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
                  background: 'hsl(var(--bg-card))',
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
                  <CheckCircle2 size={20} style={{ color: 'hsl(var(--success))' }} />
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'white', fontWeight: 700 }}>
                    Confirm Sales CSV Mapping
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'hsl(var(--success) / 0.2)',
                      color: 'hsl(142, 76%, 66%)',
                      border: '1px solid hsl(var(--success) / 0.4)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {salesParsedResult.fileName}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                  Map columns for sales reconciliation (SKU, quantity sold, warehouse, lot number). Scroll horizontally to inspect grid.
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
                    background: 'hsl(var(--bg-card))',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSalesImport}
                  disabled={salesLoading}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: salesLoading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success)))',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px hsl(142, 76%, 36% / 0.35)',
                  }}
                >
                  <Check size={16} /> Confirm & Reconcile Sales
                </button>
                <button
                  type="button"
                  onClick={handleCancelSalesImport}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    background: 'hsl(var(--bg-card))',
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
                    {(salesParsedResult.rawGrid?.[0] || []).map((header: string, colIdx: number) => {
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
                              {SALES_OPTIONS.map((opt) => (
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
                  {(salesParsedResult.rawGrid?.slice(1) || []).map((row: string[], rowIdx: number) => (
                    <tr key={rowIdx}>
                      {row.map((cell: string, cellIdx: number) => {
                        const header = salesParsedResult.rawGrid[0]?.[cellIdx];
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
          </div>
        </div>
      ) : null}

      {/* Bottom Section: Sales Data List Section with Migrated Filter Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          className="collapsible-filters-panel"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}
        >
          <div className="filter-input-group">
            <label>Search Sales</label>
            <input
              className="filter-search"
              placeholder="Search SKU, product, lot #, buyer name, email..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-input-group">
            <label>Lot Number</label>
            <input
              className="filter-search"
              placeholder="Search by Lot Number..."
              type="text"
              value={lotNumberFilter}
              onChange={(e) => setLotNumberFilter(e.target.value)}
            />
          </div>

          <div className="filter-input-group">
            <label>Buyer</label>
            <select
              className="filter-select"
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
            >
              <option value="">All Buyers</option>
              {uniqueBuyers.map((name) => (
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
              value={dcFilter}
              onChange={(e) => setDcFilter(e.target.value)}
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
            <label>Create Date</label>
            <input
              className="filter-search"
              type="date"
              value={createDateFilter}
              onChange={(e) => setCreateDateFilter(e.target.value)}
              style={{ padding: '8px 12px' }}
            />
          </div>

          <div className="filter-input-group">
            <label>Price Range</label>
            <select
              className="filter-select"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="">All Prices</option>
              <option value="under10">Under $10 / cs</option>
              <option value="10-25">$10 - $25 / cs</option>
              <option value="25-50">$25 - $50 / cs</option>
              <option value="over50">Over $50 / cs</option>
            </select>
          </div>

          <div className="filter-input-group">
            <label>Sales Status</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="reconciled">Reconciled</option>
              <option value="pending">Pending</option>
              <option value="invoiced">Invoiced</option>
              <option value="completed">Completed</option>
              <option value="active">Active Listing</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'flex-end' }}>
            {(search || lotNumberFilter || buyerFilter || dcFilter || createDateFilter || priceFilter || statusFilter) && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setSearch('');
                  setLotNumberFilter('');
                  setBuyerFilter('');
                  setDcFilter('');
                  setCreateDateFilter('');
                  setPriceFilter('');
                  setStatusFilter('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Loaded Sales Data Frame (Same frame structure as Inventory Table frame) */}
        {salesRecordsLoading && (!salesRecords || salesRecords.length === 0) ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
            <div className="loader" style={{ margin: '0 auto 12px' }} />
            Loading sales data records...
          </div>
        ) : (salesRecords || []).length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
            <DollarSign size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            No sales data recorded yet. Click "Upload Sales Report" above to ingest sales files.
          </div>
        ) : (
          <SalesTable filteredRecords={filteredRecords} />
        )}
      </div>
    </div>
  );
};
