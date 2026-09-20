import React, { useEffect, useRef, useState } from 'react';
import { Users, UploadCloud, ListFilter, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  setBuyerFile, 
  setBuyerParsedResult, 
  updateBuyerMapping, 
  uploadBuyerThunk, 
  confirmBuyerThunk 
} from '../../../store/slices/ingestionSlice';
import { fetchCoreReferenceData, fetchBuyerLists } from '../../../store/slices/coreSlice';
import { useAuth } from '../../../context/AuthContext';
import { BuyerDetailDrawer } from './BuyerDetailDrawer';
import { BuyerListManagerModal } from './BuyerListManagerModal';
import { useBuyerPipeline } from './hooks/useBuyerPipeline';
import { BuyerFilterBar } from './subcomponents/BuyerFilterBar';
import { BuyerModernTable } from './subcomponents/BuyerModernTable';
import { AddBuyerModal } from './subcomponents/AddBuyerModal';
import { BuyerUploadModal } from './subcomponents/BuyerUploadModal';
import { BuyerMappingPreview } from './subcomponents/BuyerMappingPreview';

export const BuyerRegistryPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  const selectedSupplier = useAppSelector((state) => state.ingestion?.selectedSupplier || '');

  const buyerParsedResult = useAppSelector((state) => state.ingestion.buyerParsedResult);
  const buyerMappings = useAppSelector((state) => state.ingestion.buyerMappings);
  const buyerLoading = useAppSelector((state) => state.ingestion.buyerLoading);
  const buyerLoadingStep = useAppSelector((state) => state.ingestion.buyerLoadingStep);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Headless hook orchestrating pipeline state, filters, drawers, and modal visibility
  const pipeline = useBuyerPipeline();

  useEffect(() => {
    dispatch(fetchCoreReferenceData({ all: pipeline.showInactive, supplierId: selectedSupplier, token: token || undefined }));
    dispatch(fetchBuyerLists({ supplierId: selectedSupplier, token: token || undefined }));
  }, [dispatch, pipeline.showInactive, selectedSupplier, token]);

  const handleCsvSelect = async (file: File) => {
    setIsImportModalOpen(false);
    dispatch(setBuyerFile({ name: file.name, size: file.size }));
    await dispatch(uploadBuyerThunk({ file }));
  };

  const handleHiddenFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await handleCsvSelect(f);
    if (e.target) e.target.value = '';
  };

  const handleConfirmBuyerImport = async () => {
    if (!buyerParsedResult) return;
    const documentId = buyerParsedResult.documentId || buyerParsedResult._id || buyerParsedResult.ingestionJobId || '';
    const res = await dispatch(
      confirmBuyerThunk({
        documentId,
        mappings: buyerMappings,
      })
    );
    if (confirmBuyerThunk.fulfilled.match(res)) {
      dispatch(fetchCoreReferenceData({ supplierId: selectedSupplier }));
      dispatch(setBuyerParsedResult(null));
      dispatch(setBuyerFile(null));
      setIsFullscreen(false);
    }
  };

  const handleCancelBuyerImport = () => {
    dispatch(setBuyerParsedResult(null));
    dispatch(setBuyerFile(null));
    setIsFullscreen(false);
  };

  const handleMappingChange = (dbField: string, headerName: string) => {
    dispatch(updateBuyerMapping({ dbField, headerName }));
    if (dbField === 'companyName') {
      dispatch(updateBuyerMapping({ dbField: 'name', headerName }));
    }
  };

  return (
    <div className="flex flex-col gap-5" id="panel-buyer">
      {/* 1. Buyer Pipeline Subheader */}
      <div className="card bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="m-0 text-[1.05rem] font-bold text-slate-900">
                Buyer Network &amp; Allocation Accounts
              </h3>
              <span className="sr-only">Buyer List Ingestion</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {pipeline.buyers.length} Verified Buyers
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0">
              50 verified liquidation buyers, discount channels, and salvage partners. Manage your registered buyer network and cross-dock allocation agreements.
            </p>
          </div>

          {/* Action Buttons in Place */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => pipeline.setIsBuyerListModalOpen(true)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <ListFilter className="w-4 h-4 text-slate-500" />
              <span>Buyer Lists</span>
            </button>

            <button
              type="button"
              aria-label="Bulk Import via CSV"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-ingestion-upload-modal', { detail: { target: 'buyers' } }));
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              aria-label="Add Buyer Manually"
              onClick={() => pipeline.setIsAddBuyerModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Buyer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for ref/test compatibility */}
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleHiddenFileInputChange} />

      {/* Loading Step Banner */}
      {buyerLoading && (
        <div className="card bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center">
          <div className="loader mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 m-0 mb-1">Processing Buyer CSV...</p>
          <p className="text-xs text-slate-500 m-0">{buyerLoadingStep || 'Analyzing columns...'}</p>
        </div>
      )}

      {/* Mapping Confirmation Screen */}
      {!buyerLoading && buyerParsedResult && (
        <BuyerMappingPreview
          buyerParsedResult={buyerParsedResult}
          buyerMappings={buyerMappings}
          buyerLoading={buyerLoading}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onConfirm={handleConfirmBuyerImport}
          onCancel={handleCancelBuyerImport}
          onMappingChange={handleMappingChange}
        />
      )}

      {/* 2. Dedicated Buyer Filter Bar */}
      <BuyerFilterBar
        search={pipeline.search}
        tier={pipeline.tier}
        status={pipeline.status}
        showInactive={pipeline.showInactive}
        tiersList={pipeline.tiersList}
        statusesList={pipeline.statusesList}
        onSearchChange={pipeline.handleSearchChange}
        onTierChange={pipeline.handleTierChange}
        onStatusChange={pipeline.handleStatusChange}
        onShowInactiveChange={pipeline.handleShowInactiveChange}
        onClearFilters={pipeline.handleClearFilters}
      />

      {/* 3. Loaded Buyer Data Modern Grid Table */}
      <BuyerModernTable
        buyers={pipeline.paginatedBuyers}
        expandedRowIds={pipeline.expandedRowIds}
        onToggleRow={pipeline.toggleRow}
        onEditBuyerProfile={pipeline.handleEditBuyerProfile}
        onSendLotTender={pipeline.handleSendLotTender}
        onForwardShortDatedOffers={pipeline.handleForwardShortDatedOffers}
        onRouteZeroWasteDonation={pipeline.handleRouteZeroWasteDonation}
        currentPage={pipeline.currentPage}
        totalPages={pipeline.totalPages}
        onPageChange={pipeline.setCurrentPage}
        totalCount={pipeline.filteredBuyers.length}
      />

      {/* Modals & Slide-over Drawers (Mounted at Root Shell) */}
      <BuyerListManagerModal 
        isOpen={pipeline.isBuyerListModalOpen} 
        onClose={() => pipeline.setIsBuyerListModalOpen(false)}
        supplierId={selectedSupplier}
      />

      <AddBuyerModal
        isOpen={pipeline.isAddBuyerModalOpen}
        onClose={() => pipeline.setIsAddBuyerModalOpen(false)}
        supplierId={selectedSupplier}
      />

      <BuyerUploadModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onFileSelect={handleCsvSelect}
      />

      <BuyerDetailDrawer
        buyer={pipeline.selectedBuyer}
        isOpen={pipeline.isDetailDrawerOpen}
        onClose={() => {
          pipeline.handleCloseDetailDrawer();
          dispatch(fetchCoreReferenceData({ all: pipeline.showInactive, supplierId: selectedSupplier }));
        }}
        onBuyerUpdated={() => {
          dispatch(fetchCoreReferenceData({ all: pipeline.showInactive, supplierId: selectedSupplier }));
        }}
      />
    </div>
  );
};
