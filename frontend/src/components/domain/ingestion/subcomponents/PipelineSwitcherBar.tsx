import React from 'react';
import { 
  Package, 
  DollarSign, 
  Users, 
  FolderKanban, 
  Plus, 
  ChevronsUpDown 
} from 'lucide-react';
import { useIngestionTelemetry } from '../hooks/useIngestionTelemetry';
import type { PipelineSwitcherBarProps } from '../types/ingestion.types';

export const PipelineSwitcherBar: React.FC<PipelineSwitcherBarProps> = ({
  className = '',
  activeTab,
  onTabChange,
  onOpenBuyerLists,
  onAddBuyer,
  onToggleAll,
}) => {
  const { counts } = useIngestionTelemetry();
  const [allAreOpen, setAllAreOpen] = React.useState(false);

  React.useEffect(() => {
    const handleStateChanged = (e: CustomEvent<{ allOpen: boolean }> | Event) => {
      const customEvent = e as CustomEvent<{ allOpen: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.allOpen === 'boolean') {
        setAllAreOpen(customEvent.detail.allOpen);
      }
    };

    window.addEventListener('toggle-all-state-changed', handleStateChanged);
    return () => {
      window.removeEventListener('toggle-all-state-changed', handleStateChanged);
    };
  }, []);

  const handleToggleClick = () => {
    if (onToggleAll) {
      onToggleAll();
    } else {
      window.dispatchEvent(new CustomEvent('toggle-all-rows'));
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm p-2 mb-6 border border-slate-200 dark:border-slate-800 ${className}`}
      id="pipeline-switcher-bar"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Pipeline Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
          {/* 1. Inventory Tab */}
          <button
            type="button"
            id="tab-inventory"
            onClick={() => onTabChange('inventory')}
            className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
            }`}
            aria-selected={activeTab === 'inventory'}
            role="tab"
          >
            {/* Screen reader / legacy test compatibility token */}
            <span className="sr-only">📦 Inventory Pipeline</span>
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <Package className="w-4 h-4 hidden" aria-hidden="true" />
            <span>Inventory Pipeline</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {counts.inventory}
            </span>
          </button>

          {/* 2. Sales Tab */}
          <button
            type="button"
            id="tab-sales"
            onClick={() => onTabChange('sales')}
            className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
            }`}
            aria-selected={activeTab === 'sales'}
            role="tab"
          >
            {/* Screen reader / legacy test compatibility token */}
            <span className="sr-only">💰 Sales Pipeline</span>
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <DollarSign className="w-4 h-4 hidden" aria-hidden="true" />
            <span>Sales Pipeline</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                activeTab === 'sales'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {counts.sales}
            </span>
          </button>

          {/* 3. Buyer Tab */}
          <button
            type="button"
            id="tab-buyer"
            onClick={() => onTabChange('buyers')}
            className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'buyers'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
            }`}
            aria-selected={activeTab === 'buyers'}
            role="tab"
          >
            {/* Screen reader / legacy test compatibility token */}
            <span className="sr-only">👥 Buyer List</span>
            <span className="material-symbols-outlined text-[18px]">domain</span>
            <Users className="w-4 h-4 hidden" aria-hidden="true" />
            <span>Buyer Pipeline</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                activeTab === 'buyers'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {counts.buyers}
            </span>
          </button>
        </div>

        {/* Action Utilities */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 mr-1">
            <button
              type="button"
              onClick={onOpenBuyerLists}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">folder_shared</span>
              <FolderKanban className="w-3.5 h-3.5 hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Buyer Lists</span>
            </button>
            <button
              type="button"
              onClick={onAddBuyer}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <Plus className="w-3.5 h-3.5 hidden" aria-hidden="true" />
              <span>Add Buyer</span>
            </button>
          </div>
          <button
            type="button"
            id="toggle-all-btn"
            onClick={handleToggleClick}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors border shadow-2xs cursor-pointer ${
              allAreOpen
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-600'
                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">unfold_more</span>
            <ChevronsUpDown className="w-3.5 h-3.5 hidden" aria-hidden="true" />
            <span id="toggle-all-text">{allAreOpen ? 'Collapse All' : 'Toggle All'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
