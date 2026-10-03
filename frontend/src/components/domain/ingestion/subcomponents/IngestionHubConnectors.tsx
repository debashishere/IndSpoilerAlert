import React, { useState } from 'react';
import type { IngestionHubConnectorsProps } from '../types/ingestion.types';

export const IngestionHubConnectors: React.FC<IngestionHubConnectorsProps> = ({
  className = '',
  onSelectConnector,
}) => {
  const [notification, setNotification] = useState<string | null>(null);

  const handleActionClick = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

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
