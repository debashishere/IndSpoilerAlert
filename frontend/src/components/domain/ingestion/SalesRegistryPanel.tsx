import React, { useEffect, useRef, useState } from 'react';
import { 
  DollarSign, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Package 
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
import { useSalesPipeline } from './hooks/useSalesPipeline';
import { SalesFilterBar } from './subcomponents/SalesFilterBar';
import { SalesModernTable } from './subcomponents/SalesModernTable';
import { SalesUploadModal } from './subcomponents/SalesUploadModal';
import { SalesMappingPreview } from './subcomponents/SalesMappingPreview';

export const SalesRegistryPanel: React.FC = () => {
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
  const rawSalesRecords = useAppSelector((state) => state.ingestion.salesRecords);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actualFileRef = useRef<File | null>(null);

  const availableSuppliers = suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const effectiveSupplierId = selectedSupplier || (availableSuppliers.length > 0 ? (availableSuppliers[0]._id || '') : '');

  // Headless hook orchestrating sales records, filters, progressive drawer, and master toggle-all sync
  const pipeline = useSalesPipeline();

  useEffect(() => {
    dispatch(fetchSalesRecordsThunk(effectiveSupplierId));
  }, [dispatch, effectiveSupplierId]);

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
      dispatch(fetchSalesRecordsThunk(effectiveSupplierId));
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

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Ingestion Actions */}
      <div className="card bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="m-0 text-[1.05rem] font-bold text-slate-900">Sales Data Ingestion</h3>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {(rawSalesRecords || []).length} Sales Records
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0">
              Upload distributor closeout sales sheets (CSV or PDF) for AI parsing, automated schema mapping, and reconciliation against active inventory lots using FEFO allocation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-ingestion-upload-modal', { detail: { target: 'sales' } }));
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Sales Report via CSV/PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for ref/tests */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Sales Report Modal */}
      <SalesUploadModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        availableSuppliers={availableSuppliers}
        effectiveSupplierId={effectiveSupplierId}
        onSupplierChange={(id) => dispatch(setSelectedSupplier(id))}
        salesFile={salesFile}
        salesDragActive={salesDragActive}
        salesLoading={salesLoading}
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
        onClickDropzone={() => fileInputRef.current?.click()}
        onRunSalesExtraction={handleRunSalesExtraction}
      />

      {/* Error Message */}
      {salesError && (
        <div className="card bg-white p-4 rounded-xl border border-rose-200 border-l-4 border-l-rose-500 shadow-xs flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-600 m-0">Sales Extraction Error</h4>
            <p className="text-xs text-slate-600 mt-1 m-0">{salesError}</p>
          </div>
        </div>
      )}

      {/* Success / Warning Message after Ingestion */}
      {salesIsImported && (
        <div className="card bg-white p-4 rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 shadow-xs flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-700 m-0">Sales Reconciliation Complete</h4>
            <p className="text-xs text-slate-600 mt-1 m-0">
              Successfully reconciled <strong>{salesImportCount}</strong> sales records against surplus inventory (FEFO allocation applied).
            </p>
            {salesImportWarnings.length > 0 && (
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-amber-700 font-semibold m-0">⚠️ Reconciliation Warnings:</p>
                {salesImportWarnings.map((w, i) => (
                  <p key={i} className="text-[11px] text-slate-500 m-0">• {w}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Column Mapping State OR Processing Loader */}
      {salesLoading ? (
        <div className="card bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center">
          <div className="loader mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 m-0 mb-1">Processing Sales Report...</p>
          <p className="text-xs text-slate-500 m-0">{salesLoadingStep || 'Analyzing sales table columns...'}</p>
        </div>
      ) : salesParsedResult ? (
        <SalesMappingPreview
          salesParsedResult={salesParsedResult}
          salesMappings={salesMappings}
          salesLoading={salesLoading}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onConfirm={handleConfirmSalesImport}
          onCancel={handleCancelSalesImport}
          onMappingChange={handleMappingChange}
        />
      ) : null}

      {/* Bottom Section: Dedicated Sales Filter Bar & Modern Grid Table */}
      <div className="flex flex-col gap-4">
        {/* 1. Dedicated Sales Filter Bar */}
        <SalesFilterBar
          search={pipeline.search}
          lotNumber={pipeline.lotNumber}
          buyer={pipeline.buyer}
          dc={pipeline.dc}
          createDate={pipeline.createDate}
          priceRange={pipeline.priceRange}
          status={pipeline.status}
          clearingRecordCount={pipeline.clearingRecordCount}
          buyersList={pipeline.buyersList}
          dcsList={pipeline.dcsList}
          priceRangesList={pipeline.priceRangesList}
          statusesList={pipeline.statusesList}
          onSearchChange={pipeline.handleSearchChange}
          onLotNumberChange={pipeline.handleLotNumberChange}
          onBuyerChange={pipeline.handleBuyerChange}
          onDCChange={pipeline.handleDCChange}
          onCreateDateChange={pipeline.handleCreateDateChange}
          onPriceRangeChange={pipeline.handlePriceRangeChange}
          onStatusChange={pipeline.handleStatusChange}
          onClearFilters={pipeline.handleClearFilters}
        />

        {/* 2. Loaded Sales Data Modern Table */}
        {pipeline.salesRecordsLoading && (!pipeline.salesRecords || pipeline.salesRecords.length === 0) ? (
          <div className="card bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center text-slate-500 text-xs">
            <div className="loader mx-auto mb-3" />
            Loading sales data records...
          </div>
        ) : (pipeline.salesRecords || []).length === 0 ? (
          <div className="card bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center text-slate-500 text-xs">
            <DollarSign className="w-9 h-9 opacity-30 mx-auto mb-3" />
            No sales data recorded yet. Click &quot;Upload Sales Report&quot; above to ingest sales files.
          </div>
        ) : (
          <SalesModernTable
            records={pipeline.paginatedRecords}
            expandedRowIds={pipeline.expandedRowIds}
            onToggleRow={pipeline.toggleRow}
            onReconcileInvoice={pipeline.handleReconcileInvoice}
            onAuthorizeDockGatePass={pipeline.handleAuthorizeDockGatePass}
            onLiveFleetTelemetry={pipeline.handleLiveFleetTelemetry}
            currentPage={pipeline.currentPage}
            totalPages={pipeline.totalPages}
            onPageChange={pipeline.setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};
