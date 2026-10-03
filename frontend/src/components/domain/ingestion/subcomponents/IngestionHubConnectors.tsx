import React, { useState } from 'react';
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

interface SourceChipConfig {
  id: string;
  testId: string;
  title: string;
  icon: string;
  iconBg: string;
  badge: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
}

export const IngestionHubConnectors: React.FC<IngestionHubConnectorsProps> = ({
  className = '',
  onOpenUploadModal,
  onSelectConnector,
}) => {
  const dispatch = useAppDispatch();
  const googleSheetsSync = useAppSelector((state) => state.ingestion.googleSheetsSync);
  const zapierSync = useAppSelector((state) => (state as any).zapierSync);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);
  const suppliers = useAppSelector((state) => state.core?.suppliers || []);

  const isConnected = googleSheetsSync?.connectionStatus === 'connected';
  const isZapierConnected = (zapierSync?.totalZaps ?? 0) > 0 || (zapierSync?.connectedZaps?.length ?? 0) > 0;
  const zapCount = zapierSync?.totalZaps ?? zapierSync?.connectedZaps?.length ?? 0;

  const [notification, setNotification] = useState<string | null>(null);

  const handleActionClick = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const chips: SourceChipConfig[] = [
    {
      id: 'google-sheets',
      testId: 'data-source-chip-google-sheets',
      title: 'Google Sheets',
      icon: 'table_chart',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
      ariaLabel: isConnected ? 'Google Sheets' : 'Connect Sheets',
      badge: isConnected ? (
        <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active • {formatRelativeTime(googleSheetsSync?.lastSyncedAt)}</span>
        </span>
      ) : (
        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          Sync on Edit
        </span>
      ),
      onClick: () => {
        if (onSelectConnector) {
          onSelectConnector('google-sheets');
        } else {
          handleActionClick(INGESTION_CONSTANTS.CONNECTORS.SHEETS_FEEDBACK);
        }
      },
    },
    {
      id: 'csv-upload',
      testId: 'data-source-chip-csv-upload',
      title: 'CSV / Excel Upload',
      icon: 'upload_file',
      iconBg: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
      ariaLabel: 'Upload File',
      badge: (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
          Batch Ingress
        </span>
      ),
      onClick: () => {
        if (onSelectConnector) {
          onSelectConnector('csv-upload');
        } else if (onOpenUploadModal) {
          onOpenUploadModal();
        } else {
          handleActionClick('Opening upload workflow...');
        }
      },
    },
    {
      id: 'zapier',
      testId: 'data-source-chip-zapier',
      title: 'Zapier Webhooks',
      icon: 'electric_bolt',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
      ariaLabel: 'Connect Zapier',
      badge: isZapierConnected ? (
        <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>{zapCount} Feeds</span>
        </span>
      ) : (
        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          Popular
        </span>
      ),
      onClick: () => {
        if (onSelectConnector) {
          onSelectConnector('zapier');
        } else {
          handleActionClick(INGESTION_CONSTANTS.CONNECTORS.ZAPIER_FEEDBACK);
        }
      },
    },
    {
      id: 'doc-scanner',
      testId: 'data-source-chip-doc-scanner',
      title: 'Image & Doc Scanner',
      icon: 'document_scanner',
      iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
      ariaLabel: 'Scan / Upload Doc',
      badge: (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
          AI OCR
        </span>
      ),
      onClick: () => {
        if (onSelectConnector) {
          onSelectConnector('doc-scanner');
        } else {
          handleActionClick(INGESTION_CONSTANTS.CONNECTORS.SCANNER_FEEDBACK);
        }
      },
    },
  ];

  return (
    <div
      className={`mb-6 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200 ${className}`}
      id="ingestion-hub-section"
      data-testid="data-sources-dock"
    >
      {/* Dock Bar */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/60 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">hub</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100 leading-snug tracking-[-0.01em]">
                Data Sources
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

        <div className="flex items-center gap-2 flex-wrap xl:justify-end">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              data-testid={chip.testId}
              aria-label={chip.ariaLabel}
              onClick={chip.onClick}
              className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-all opacity-80 hover:opacity-100 hover:shadow-xs cursor-pointer"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${chip.iconBg}`}>
                <span className="material-symbols-outlined text-[14px]">{chip.icon}</span>
              </div>
              <span className="font-semibold">{chip.title}</span>
              {chip.badge}
            </button>
          ))}

          {/* Visual + Add Data Source Primary Button */}
          <button
            type="button"
            data-testid="data-sources-add-button"
            onClick={() => {
              if (onSelectConnector) {
                onSelectConnector('google-sheets');
              } else {
                handleActionClick('Navigating to Integration Management Suite...');
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#0f4cc9] hover:bg-[#1a42a0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Data Source</span>
          </button>
        </div>
      </div>

      {/* Notification Toast if action executed */}
      {notification && (
        <div className="mx-3.5 my-2.5 p-2 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-medium border border-blue-200 animate-fade-in flex items-center justify-between">
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
    </div>
  );
};

export default IngestionHubConnectors;
