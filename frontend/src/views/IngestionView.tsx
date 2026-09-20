import React, { useCallback, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPipelineTab, type PipelineTab } from '../store/slices/ingestionSlice';
import { 
  BuyerRegistryPanel,
  SalesRegistryPanel,
  InventoryRegistryPanel,
  IngestionTelemetryBar,
  IngestionHubConnectors,
  PipelineSwitcherBar,
  UnifiedIngestionModal,
  type IngestionTarget
} from '../components/domain/ingestion';
import { INGESTION_CONSTANTS } from '../components/domain/ingestion/constants/ingestionConstants';
import type { IngestionViewProps } from '../components/domain/ingestion/types/ingestion.types';

export const IngestionView: React.FC<IngestionViewProps> = ({ onOpenLotHub }) => {
  const dispatch = useAppDispatch();
  const pipelineTab = useAppSelector((state) => state.ingestion.pipelineTab);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<IngestionTarget>('inventory');

  const handleTabChange = useCallback((tab: PipelineTab) => {
    dispatch(setPipelineTab(tab));
    // Reset toggle-all state and notify switcher bar
    window.dispatchEvent(new CustomEvent('toggle-all-state-changed', { detail: { allOpen: false } }));
  }, [dispatch]);

  const handleOpenBuyerLists = useCallback(() => {
    dispatch(setPipelineTab('buyers'));
    window.dispatchEvent(new CustomEvent('open-buyer-list-manager'));
  }, [dispatch]);

  const handleAddBuyer = useCallback(() => {
    dispatch(setPipelineTab('buyers'));
    window.dispatchEvent(new CustomEvent('open-add-buyer-modal'));
  }, [dispatch]);

  const handleToggleAll = useCallback(() => {
    window.dispatchEvent(new CustomEvent('toggle-all-rows'));
  }, []);

  const handleOpenUploadModal = useCallback((target?: IngestionTarget) => {
    setModalTarget(target || (pipelineTab as IngestionTarget) || 'inventory');
    setIsUploadModalOpen(true);
  }, [pipelineTab]);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  // Listen for open-ingestion-upload-modal event (can be dispatched from child panels or global actions)
  useEffect(() => {
    const handleOpenEvent = (e: CustomEvent<{ target?: IngestionTarget }> | Event) => {
      const customEvent = e as CustomEvent<{ target?: IngestionTarget }>;
      const customTarget = customEvent.detail?.target;
      handleOpenUploadModal(customTarget);
    };

    window.addEventListener('open-ingestion-upload-modal', handleOpenEvent);
    return () => {
      window.removeEventListener('open-ingestion-upload-modal', handleOpenEvent);
    };
  }, [handleOpenUploadModal]);

  return (
    <div className="w-full px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100" id="ingestion-view">
      {/* 1. Master Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          {INGESTION_CONSTANTS.TITLE}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {INGESTION_CONSTANTS.SUBTITLE}
        </p>
      </header>

      {/* 2. Operational Telemetry Bar (4 KPI Cards) */}
      <IngestionTelemetryBar />

      {/* 3. Collapsible Dedicated Ingestion Hub & Connectors */}
      <IngestionHubConnectors onOpenUploadModal={() => handleOpenUploadModal(pipelineTab as IngestionTarget)} />

      {/* 4. Master Pipeline Switcher Bar */}
      <PipelineSwitcherBar
        activeTab={pipelineTab}
        onTabChange={handleTabChange}
        onOpenBuyerLists={handleOpenBuyerLists}
        onAddBuyer={handleAddBuyer}
        onToggleAll={handleToggleAll}
      />

      {/* 5. Active Pipeline Workbenches */}
      <div className="w-full transition-opacity duration-150">
        {pipelineTab === 'inventory' && (
          <div id="panel-inventory">
            <InventoryRegistryPanel onOpenLotHub={onOpenLotHub} />
          </div>
        )}

        {pipelineTab === 'sales' && (
          <div id="panel-sales">
            <SalesRegistryPanel />
          </div>
        )}

        {pipelineTab === 'buyers' && (
          <div id="panel-buyer">
            <BuyerRegistryPanel />
          </div>
        )}
      </div>

      {/* 6. Unified Surplus Data Ingestion Modal (Root Overlay) */}
      <UnifiedIngestionModal
        isOpen={isUploadModalOpen}
        initialTarget={modalTarget}
        onClose={handleCloseUploadModal}
      />
    </div>
  );
};

export default IngestionView;
