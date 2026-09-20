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
  LayoutGrid
} from 'lucide-react';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import type { IngestionHubConnectorsProps } from '../types/ingestion.types';

export const IngestionHubConnectors: React.FC<IngestionHubConnectorsProps> = ({
  className = '',
  onOpenUploadModal,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [notification, setNotification] = useState<string | null>(null);

  const handleActionClick = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
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
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[18px]">electric_bolt</span>
                    <Zap className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    Popular
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 mt-1">Zapier Webhooks</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Trigger automated lot creation directly from ERP, inbox, or custom workflows.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleActionClick(INGESTION_CONSTANTS.CONNECTORS.ZAPIER_FEEDBACK)}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200/70"
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <Link2 className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>Connect Zapier</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Sync Delay</span>
                  <span className="text-blue-600 font-semibold">&lt; 150ms</span>
                </div>
              </div>
            </div>

            {/* Card 2: Google Sheets Sync */}
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">table_chart</span>
                    <Table className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Two-way Sync
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 mt-1">Google Sheets Sync</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Real-time spreadsheet link for batch manifest sync and live status updates.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleActionClick(INGESTION_CONSTANTS.CONNECTORS.SHEETS_FEEDBACK)}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200/70"
                >
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  <RefreshCw className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>Connect Sheets</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Status</span>
                  <span className="text-emerald-700 font-semibold">Sync on Edit</span>
                </div>
              </div>
            </div>

            {/* Card 3: Image & Doc Scanner */}
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                    <FileSearch className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    AI Docling
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 mt-1">Image &amp; Doc Scanner</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  AI OCR parsing for PDF manifests, photo invoices, and physical packing slips.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleActionClick(INGESTION_CONSTANTS.CONNECTORS.SCANNER_FEEDBACK)}
                  className="w-full py-1.5 px-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  <FileText className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>Scan / Upload Doc</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Supported</span>
                  <span className="text-slate-600 font-medium">PDF, JPG, PNG</span>
                </div>
              </div>
            </div>

            {/* Card 4: CSV / Excel Upload */}
            <div className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200 flex flex-col justify-between transition-colors shadow-2xs group">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    <UploadCloud className="w-4 h-4 hidden" aria-hidden="true" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Batch
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 mt-1">CSV / Excel Upload</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
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
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200/70"
                >
                  <span className="material-symbols-outlined text-[14px]">file_upload</span>
                  <Upload className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>Upload File</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Max File Size</span>
                  <span className="text-slate-600 font-medium">100 MB</span>
                </div>
              </div>
            </div>

            {/* Card 5: + Add Integration */}
            <div
              onClick={() => handleActionClick(INGESTION_CONSTANTS.CONNECTORS.DIRECTORY_FEEDBACK)}
              className="p-3.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/20 hover:bg-slate-50/60 flex flex-col justify-between transition-colors cursor-pointer group"
            >
              <div className="space-y-1 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <Plus className="w-4 h-4 hidden" aria-hidden="true" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 mt-1">+ Add Integration</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  NetSuite, Shopify, SAP S/4HANA, Custom REST API, or EDI feeds.
                </p>
              </div>
              <div className="w-full py-1.5 px-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 text-slate-600 group-hover:text-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-200/70">
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
