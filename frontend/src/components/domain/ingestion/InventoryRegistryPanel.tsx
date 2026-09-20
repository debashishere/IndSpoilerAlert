import React, { useEffect, useRef, useState } from 'react';
import { 
  Database, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
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
  confirmInventoryThunk,
} from '../../../store/slices/ingestionSlice';
import { fetchCoreReferenceData } from '../../../store/slices/coreSlice';
import { fetchInventoryLotsThunk } from '../../../services/inventoryService';
import { useAuth } from '../../../context/AuthContext';
import { RiskAssessmentModal } from '../inventory/RiskAssessmentModal';
import { ComplianceModal } from '../inventory/ComplianceModal';
import { useInventoryPipeline } from './hooks/useInventoryPipeline';
import { InventoryFilterBar } from './subcomponents/InventoryFilterBar';
import { InventoryModernTable } from './subcomponents/InventoryModernTable';
import { InventoryUploadModal } from './subcomponents/InventoryUploadModal';
import { InventoryMappingPreview } from './subcomponents/InventoryMappingPreview';

export const InventoryRegistryPanel: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const dispatch = useAppDispatch();
  const { user, token } = useAuth();

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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const actualFileRef = useRef<File | null>(null);

  const availableSuppliers = suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const effectiveSupplierId = selectedSupplier || (availableSuppliers.length > 0 ? (availableSuppliers[0]._id || '') : '');

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchCoreReferenceData({ supplierId: effectiveSupplierId, token: token || undefined, email: user?.email }));
    if (!pipeline.inventoryList || pipeline.inventoryList.length === 0) {
      dispatch(fetchInventoryLotsThunk({ supplierId: effectiveSupplierId, token: token || undefined }));
    }
  }, [dispatch, effectiveSupplierId, token, user?.email]);

  // Headless hook orchestrating filters, table, drawers, and toggle-all synchronization
  const pipeline = useInventoryPipeline({ onOpenLotHub });

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

  return (
    <div className="flex flex-col gap-5" id="panel-inventory">
      {/* Hidden File Input for ref/tests */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Inventory Document Modal */}
      <InventoryUploadModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        availableSuppliers={availableSuppliers}
        effectiveSupplierId={effectiveSupplierId}
        onSupplierChange={(id) => dispatch(setSelectedSupplier(id))}
        inventoryFile={inventoryFile}
        inventoryDragActive={inventoryDragActive}
        inventoryLoading={inventoryLoading}
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
        onClickDropzone={() => fileInputRef.current?.click()}
        onRunExtraction={handleRunExtraction}
      />

      {/* Error Message */}
      {inventoryError && (
        <div className="card bg-white p-4 rounded-xl border border-rose-200 border-l-4 border-l-rose-500 shadow-xs flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-600 m-0">Extraction Error</h4>
            <p className="text-xs text-slate-600 mt-1 m-0">{inventoryError}</p>
          </div>
        </div>
      )}

      {/* Ingestion Complete Success Banner */}
      {inventoryIsImported && (
        <div className="card bg-white p-4 rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 shadow-xs flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-700 m-0">Ingestion Complete</h4>
            <p className="text-xs text-slate-600 mt-1 m-0">
              Successfully imported <strong>{inventoryImportCount}</strong> product lots to inventory database.
            </p>
            {inventoryImportedLotIds.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto flex flex-wrap gap-1">
                {inventoryImportedLotIds.map((id) => (
                  <span
                    key={id}
                    className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium font-mono"
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
        <div className="card bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center">
          <div className="loader mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 m-0 mb-1">Running Ingestion Engine...</p>
          <p className="text-xs text-slate-500 m-0">{inventoryLoadingStep || 'Analyzing document headers...'}</p>
        </div>
      ) : inventoryParsedResult ? (
        <InventoryMappingPreview
          inventoryParsedResult={inventoryParsedResult}
          inventoryMappings={inventoryMappings}
          inventoryLoading={inventoryLoading}
          inventoryIsImported={inventoryIsImported}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onConfirm={handleConfirmInventoryImport}
          onCancel={handleCancelInventoryImport}
          onMappingChange={handleMappingChange}
        />
      ) : null}

      {/* Bottom Section: Dedicated Inventory Filter Bar & Modern Grid Table */}
      <div className="flex flex-col gap-4">
        {/* 1. Dedicated Filter Bar */}
        <InventoryFilterBar
          search={pipeline.search}
          supplier={pipeline.supplier}
          dc={pipeline.dc}
          category={pipeline.category}
          status={pipeline.status}
          suppliersList={pipeline.suppliersList}
          dcsList={pipeline.dcsList}
          categoriesList={pipeline.categoriesList}
          statusesList={pipeline.statusesList}
          onSearchChange={pipeline.handleSearchChange}
          onSupplierChange={pipeline.handleSupplierChange}
          onDCChange={pipeline.handleDCChange}
          onCategoryChange={pipeline.handleCategoryChange}
          onStatusChange={pipeline.handleStatusChange}
          onClearFilters={pipeline.handleClearFilters}
        />

        {/* 2. Loaded Inventory Data Modern Table */}
        {pipeline.inventoryLoading && (!pipeline.inventoryList || pipeline.inventoryList.length === 0) ? (
          <div className="card bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center text-slate-500 text-xs">
            <div className="loader mx-auto mb-3" />
            Loading inventory lots...
          </div>
        ) : (pipeline.inventoryList || []).length === 0 ? (
          <div className="card bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center text-slate-500 text-xs">
            <Package className="w-9 h-9 opacity-30 mx-auto mb-3" />
            No inventory lots recorded yet. Click &quot;Upload Inventory Document&quot; above to ingest product lots.
          </div>
        ) : (
          <InventoryModernTable
            lots={pipeline.paginatedLots}
            expandedRowIds={pipeline.expandedRowIds}
            onToggleRow={pipeline.toggleRow}
            onOpenLotHub={pipeline.handleOpenLotHub}
            onOpenRiskModal={pipeline.handleOpenRiskModal}
            onOpenComplianceModal={pipeline.handleOpenComplianceModal}
            currentPage={pipeline.currentPage}
            totalPages={pipeline.totalPages}
            onPageChange={pipeline.setCurrentPage}
            pageSize={pipeline.pageSize}
            onPageSizeChange={pipeline.setPageSize}
            totalCount={pipeline.filteredLots.length}
          />
        )}
      </div>

      {/* Domain Modals */}
      <RiskAssessmentModal />
      <ComplianceModal />
    </div>
  );
};
