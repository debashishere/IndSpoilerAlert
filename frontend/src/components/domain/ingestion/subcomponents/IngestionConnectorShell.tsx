import React from 'react';
import { Table, Zap, FileSearch, ArrowLeft, Upload } from 'lucide-react';
import type { IngestionConnectorId, IngestionConnectorShellProps } from '../types/ingestion.types';

interface ConnectorTabDef {
  id: IngestionConnectorId;
  label: string;
  iconSymbol: string;
  FallbackIcon: React.ComponentType<{ className?: string }>;
}

const CONNECTOR_TABS: ConnectorTabDef[] = [
  {
    id: 'google-sheets',
    label: 'Google Sheets Sync',
    iconSymbol: 'table_chart',
    FallbackIcon: Table,
  },
  {
    id: 'zapier',
    label: 'Zapier Webhooks',
    iconSymbol: 'electric_bolt',
    FallbackIcon: Zap,
  },
  {
    id: 'doc-scanner',
    label: 'Image & Doc Scanner',
    iconSymbol: 'document_scanner',
    FallbackIcon: FileSearch,
  },
  {
    id: 'csv-upload',
    label: 'CSV / Excel Upload',
    iconSymbol: 'upload_file',
    FallbackIcon: Upload,
  },
];

export const IngestionConnectorShell: React.FC<IngestionConnectorShellProps> = ({
  activeConnector,
  onSelectConnector,
  onBack,
  children,
}) => {
  return (
    <div className="w-full space-y-4" id="ingestion-connector-shell">
      {/* Return navigation & Compact Command Header */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        {/* Tier 1: Return anchor and status indicator */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Ingestion Pipeline</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-600 dark:text-slate-300">
              Distraction-Free Workspace
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>4 Ingress Channels</span>
          </div>
        </div>

        {/* Tier 2: Suite Title & Inline Cross-Connector Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              Integration Management Suite
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated sync, webhooks, and AI document ingestion pipelines.
            </p>
          </div>

          {/* Inline cross-connector switcher bar */}
          <div
            role="tablist"
            aria-label="Integration Connectors"
            className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto shrink-0"
          >
            {CONNECTOR_TABS.map((tab) => {
              const isActive = activeConnector === tab.id;
              const { FallbackIcon } = tab;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`connector-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`connector-panel-${tab.id}`}
                  onClick={() => onSelectConnector(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] leading-none">
                    {tab.iconSymbol}
                  </span>
                  <FallbackIcon className="w-3.5 h-3.5 hidden" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connector Content Slot */}
      <div id={`connector-panel-${activeConnector}`} role="tabpanel" className="w-full">
        {children}
      </div>
    </div>
  );
};

export default IngestionConnectorShell;
