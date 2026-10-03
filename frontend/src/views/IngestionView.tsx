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
  CsvExcelIntegrationView,
  PipelineSwitcherBar,
  type IngestionTarget,
  type IngestionConnectorId
} from '../components/domain/ingestion';
import { INGESTION_CONSTANTS } from '../components/domain/ingestion/constants/ingestionConstants';
import type { IngestionViewProps } from '../components/domain/ingestion/types/ingestion.types';

function parseConnectorParam(): IngestionConnectorId | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const connector = params.get('connector');
  if (connector === 'google-sheets' || connector === 'zapier' || connector === 'doc-scanner' || connector === 'csv-upload') {
    return connector;
  }
  return null;
}

function parseTargetParam(): IngestionTarget | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const target = params.get('target');
  if (target === 'inventory' || target === 'sales' || target === 'buyers') {
    return target;
  }
  return null;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onOpenLotHub }) => {
  const dispatch = useAppDispatch();
  const pipelineTab = useAppSelector((state) => state.ingestion.pipelineTab);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);
  const suppliers = useAppSelector((state) => state.core.suppliers);

  const [activeConnector, setActiveConnector] = useState<IngestionConnectorId | null>(parseConnectorParam);
  const [activeTarget, setActiveTarget] = useState<IngestionTarget | null>(parseTargetParam);

  const handleSelectConnector = useCallback((connector: IngestionConnectorId, target?: IngestionTarget) => {
    setActiveConnector(connector);
    if (target) {
      setActiveTarget(target);
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'ingestion');
      url.searchParams.set('connector', connector);
      if (target) {
        url.searchParams.set('target', target);
      } else if (connector !== 'csv-upload') {
        url.searchParams.delete('target');
      }
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  const handleBackToPipeline = useCallback(() => {
    setActiveConnector(null);
    setActiveTarget(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('connector');
      url.searchParams.delete('target');
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  // Listen to popstate for browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveConnector(parseConnectorParam());
      setActiveTarget(parseTargetParam());
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

  // Listen for batch ingress navigation events: deep-link smoothly to full-page CSV Integration Suite
  useEffect(() => {
    const handleOpenEvent = (e: CustomEvent<{ target?: IngestionTarget }> | Event) => {
      const customEvent = e as CustomEvent<{ target?: IngestionTarget }>;
      const customTarget = customEvent.detail?.target || (pipelineTab as IngestionTarget) || 'inventory';
      handleSelectConnector('csv-upload', customTarget);
    };

    window.addEventListener('open-ingestion-batch-suite', handleOpenEvent);
    window.addEventListener('open-ingestion-upload-modal', handleOpenEvent);
    return () => {
      window.removeEventListener('open-ingestion-batch-suite', handleOpenEvent);
      window.removeEventListener('open-ingestion-upload-modal', handleOpenEvent);
    };
  }, [handleSelectConnector, pipelineTab]);

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
          {activeConnector === 'csv-upload' && (
            <div id="connector-csv-upload-workspace" data-testid="connector-csv-upload-workspace">
              <CsvExcelIntegrationView
                supplierId={supplierId}
                supplierName={supplierName}
                initialTarget={activeTarget || parseTargetParam() || (pipelineTab as IngestionTarget) || 'inventory'}
                onNavigateToPipeline={(tgt) => {
                  handleBackToPipeline();
                  dispatch(setPipelineTab(tgt));
                }}
              />
            </div>
          )}
        </IngestionConnectorShell>
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
        onOpenUploadModal={() => handleSelectConnector('csv-upload', (pipelineTab as IngestionTarget) || 'inventory')}
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
    </div>
  );
};

export default IngestionView;
