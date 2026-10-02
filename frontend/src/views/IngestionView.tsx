import React, { useCallback, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPipelineTab, type PipelineTab } from '../store/slices/ingestionSlice';
import { 
  BuyerRegistryPanel,
  SalesRegistryPanel,
  InventoryRegistryPanel,
  IngestionHubConnectors,
  IngestionConnectorShell,
  GoogleSheetsIntegrationView,
  ZapierIntegrationView,
  DocScannerIntegrationView,
  PipelineSwitcherBar,
  UnifiedIngestionModal,
  type IngestionTarget,
  type IngestionConnectorId
} from '../components/domain/ingestion';
import { INGESTION_CONSTANTS } from '../components/domain/ingestion/constants/ingestionConstants';
import type { IngestionViewProps } from '../components/domain/ingestion/types/ingestion.types';

function parseConnectorParam(): IngestionConnectorId | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const connector = params.get('connector');
  if (connector === 'google-sheets' || connector === 'zapier' || connector === 'doc-scanner') {
    return connector;
  }
  return null;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onOpenLotHub }) => {
  const dispatch = useAppDispatch();
  const pipelineTab = useAppSelector((state) => state.ingestion.pipelineTab);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);
  const suppliers = useAppSelector((state) => state.core.suppliers);

  const [activeConnector, setActiveConnector] = useState<IngestionConnectorId | null>(parseConnectorParam);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<IngestionTarget>('inventory');

  const handleSelectConnector = useCallback((connector: IngestionConnectorId) => {
    setActiveConnector(connector);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'ingestion');
      url.searchParams.set('connector', connector);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  const handleBackToPipeline = useCallback(() => {
    setActiveConnector(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('connector');
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  // Listen to popstate for browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveConnector(parseConnectorParam());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const currentSupplier = suppliers.find((s) => s._id === selectedSupplier) || suppliers[0];
  const supplierId = selectedSupplier || currentSupplier?._id || '';
  const supplierName = currentSupplier?.name || 'Verified Supplier';

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

  if (activeConnector) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100" id="ingestion-view">
        <IngestionConnectorShell
          activeConnector={activeConnector}
          onSelectConnector={handleSelectConnector}
          onBack={handleBackToPipeline}
        >
          {activeConnector === 'google-sheets' && (
            <div id="connector-google-sheets-workspace">
              <GoogleSheetsIntegrationView
                supplierId={supplierId}
                supplierName={supplierName}
              />
            </div>
          )}
          {activeConnector === 'zapier' && (
            <div id="connector-zapier-workspace">
              <ZapierIntegrationView
                supplierId={supplierId}
                supplierName={supplierName}
              />
            </div>
          )}
          {activeConnector === 'doc-scanner' && (
            <div id="connector-doc-scanner-workspace">
              <DocScannerIntegrationView
                supplierId={supplierId}
                supplierName={supplierName}
              />
            </div>
          )}
        </IngestionConnectorShell>

        {/* Unified Surplus Data Ingestion Modal remains accessible */}
        <UnifiedIngestionModal
          isOpen={isUploadModalOpen}
          initialTarget={modalTarget}
          onClose={handleCloseUploadModal}
        />
      </div>
    );
  }

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

      {/* 2. Collapsible Dedicated Ingestion Hub & Connectors */}
      <IngestionHubConnectors
        onOpenUploadModal={() => handleOpenUploadModal(pipelineTab as IngestionTarget)}
        onSelectConnector={handleSelectConnector}
      />

      {/* 3. Master Pipeline Switcher Bar */}
      <PipelineSwitcherBar
        activeTab={pipelineTab}
        onTabChange={handleTabChange}
        onOpenBuyerLists={handleOpenBuyerLists}
        onAddBuyer={handleAddBuyer}
        onToggleAll={handleToggleAll}
      />

      {/* 4. Active Pipeline Workbenches */}
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

      {/* 5. Unified Surplus Data Ingestion Modal (Root Overlay) */}
      <UnifiedIngestionModal
        isOpen={isUploadModalOpen}
        initialTarget={modalTarget}
        onClose={handleCloseUploadModal}
      />
    </div>
  );
};

export default IngestionView;
