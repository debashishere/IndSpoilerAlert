import React, { useState } from 'react';
import { 
  Network, 
  Zap, 
  Table, 
  FileSearch, 
  UploadCloud, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Link2, 
  RefreshCw, 
  FileText, 
  Upload,
  LayoutGrid,
  Settings
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { syncGoogleSheetsNowThunk } from '../../../../store/slices/ingestionSlice';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import type { IngestionHubConnectorsProps } from '../types/ingestion.types';

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'just now';
  const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const IngestionHubConnectors: React.FC<IngestionHubConnectorsProps> = ({
  className = '',
  onOpenUploadModal,
  onSelectConnector,
  defaultCollapsed = false,
}) => {
  const dispatch = useAppDispatch();
  const googleSheetsSync = useAppSelector((state) => state.ingestion.googleSheetsSync);
  const zapierSync = useAppSelector((state) => (state as any).zapierSync);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);
  const suppliers = useAppSelector((state) => state.core?.suppliers || []);

  const isConnected = googleSheetsSync?.connectionStatus === 'connected';
  const isSyncing = Boolean(googleSheetsSync?.isSyncing);
  const isZapierConnected = (zapierSync?.totalZaps ?? 0) > 0 || (zapierSync?.connectedZaps?.length ?? 0) > 0;
  const zapCount = zapierSync?.totalZaps ?? zapierSync?.connectedZaps?.length ?? 0;

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [notification, setNotification] = useState<string | null>(null);

  const handleActionClick = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSyncNow = async () => {
    const currentSupplier = suppliers.find((s) => s._id === selectedSupplier) || suppliers[0];
    const targetSupplierId = selectedSupplier || currentSupplier?._id || '';
    handleActionClick('Google Sheets sync pass triggered. Fetching latest inventory...');
    try {
      const res = await dispatch(syncGoogleSheetsNowThunk({ supplierId: targetSupplierId })).unwrap();
      handleActionClick(`Google Sheets synchronization pass completed. ${res.syncedLotCount ?? 0} active lots synchronized.`);
    } catch (err: any) {
      handleActionClick(`Google Sheets sync failed: ${err}`);
    }
  };


  return (
    <div
      className={`mb-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200 ${className}`}
      id="ingestion-hub-section"
    >
      {/* Header bar with toggle */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">hub</span>
            <Network className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Ingestion Hub &amp; Connectors
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1 border border-blue-100 dark:border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Auto-sync Active • 4 sources configured
              </span>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              Automate surplus inventory, sales reports, and buyer intake via live integrations or batch file ingestion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="ingestion-hub-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
            aria-expanded={!isCollapsed}
          >
            <span className="material-symbols-outlined text-[16px] transition-transform duration-200">
              {isCollapsed ? 'expand_more' : 'expand_less'}
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 hidden" aria-hidden="true" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 hidden" aria-hidden="true" />
            )}
            <span>{isCollapsed ? 'Expand Hub' : 'Collapse Hub'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast if action executed */}
      {notification && (
        <div className="mx-3.5 mt-3 p-2 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-medium border border-blue-200 animate-fade-in flex items-center justify-between">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-blue-600 hover:text-blue-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Connectors Grid (Collapsible) */}
      {!isCollapsed && (
        <div className="p-3.5 transition-all duration-200" id="ingestion-hub-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Zapier Webhooks */}
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[18px]">electric_bolt</span>
                    <Zap className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  {isZapierConnected ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Active Feeds
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      Popular
                    </span>
                  )}
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-1">Zapier Webhooks</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Trigger automated lot creation directly from ERP, inbox, or custom workflows.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectConnector) {
                      onSelectConnector('zapier');
                    } else {
                      handleActionClick(INGESTION_CONSTANTS.CONNECTORS.ZAPIER_FEEDBACK);
                    }
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700"
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <Link2 className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>{isZapierConnected ? 'Manage Zaps' : 'Connect Zapier'}</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>{isZapierConnected ? 'Status' : 'Sync Delay'}</span>
                  {isZapierConnected ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{zapCount} Connected Zaps</span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">&lt; 150ms</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Google Sheets Sync (Dual-State) */}
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">table_chart</span>
                    <Table className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  {isConnected ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Trigger • Auto-Sync
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      Two-way Sync
                    </span>
                  )}
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-1">Google Sheets Sync</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {isConnected
                    ? 'Live spreadsheet connection active with automatic ingress trigger and on-demand refresh.'
                    : 'Real-time spreadsheet link for batch manifest sync and live status updates.'}
                </p>
              </div>
              <div className="space-y-1.5">
                {isConnected ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={handleSyncNow}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Google Sheets Settings"
                        onClick={() => {
                          onSelectConnector?.('google-sheets');
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700"
                        title="Configure Sheets"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Last synced: {formatRelativeTime(googleSheetsSync?.lastSyncedAt)}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{googleSheetsSync?.syncedLotCount ?? 0} lots synced</span>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectConnector) {
                          onSelectConnector('google-sheets');
                        } else {
                          handleActionClick(INGESTION_CONSTANTS.CONNECTORS.SHEETS_FEEDBACK);
                        }
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700"
                    >
                      <span className="material-symbols-outlined text-[14px]">sync</span>
                      <RefreshCw className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                      <span>Connect Sheets</span>
                    </button>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Status</span>
                      <span className="text-emerald-700 font-semibold">Sync on Edit</span>
                    </div>
                  </>
                )}
              </div>
            </div>


            {/* Card 3: Image & Doc Scanner */}
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                    <FileSearch className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                    AI Docling
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-1">Image &amp; Doc Scanner</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  AI OCR parsing for PDF manifests, photo invoices, and physical packing slips.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectConnector) {
                      onSelectConnector('doc-scanner');
                    } else {
                      handleActionClick(INGESTION_CONSTANTS.CONNECTORS.SCANNER_FEEDBACK);
                    }
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  <FileText className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>Scan / Upload Doc</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Status</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">AI Engine Ready</span>
                </div>
              </div>
            </div>

            {/* Card 4: CSV / Excel Upload */}
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    <UploadCloud className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Batch
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-1">CSV / Excel Upload</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Manual batch upload with automated column schema detection &amp; mapping.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenUploadModal) {
                      onOpenUploadModal();
                    } else {
                      handleActionClick('Opening upload workflow...');
                    }
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700"
                >
                  <span className="material-symbols-outlined text-[14px]">file_upload</span>
                  <Upload className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>Upload File</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Max File Size</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">100 MB</span>
                </div>
              </div>
            </div>

            {/* Card 5: + Add Integration */}
            <div
              onClick={() => handleActionClick(INGESTION_CONSTANTS.CONNECTORS.DIRECTORY_FEEDBACK)}
              className="p-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/20 hover:bg-slate-50/60 dark:bg-slate-800/20 dark:hover:bg-slate-800/50 flex flex-col justify-between transition-colors cursor-pointer group"
            >
              <div className="space-y-1 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <Plus className="w-4 h-4 hidden" aria-hidden="true" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-1">+ Add Integration</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  NetSuite, Shopify, SAP S/4HANA, Custom REST API, or EDI feeds.
                </p>
              </div>
              <div className="w-full py-1.5 px-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700 text-slate-600 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-200/70 dark:border-slate-700">
                <span className="material-symbols-outlined text-[14px]">extension</span>
                <LayoutGrid className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                <span>Explore Directory</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
