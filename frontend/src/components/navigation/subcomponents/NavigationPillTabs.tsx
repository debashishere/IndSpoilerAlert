import React from 'react';
import { PRIMARY_NAVIGATION_TABS } from '../constants/navigationConstants';
import type { NavigationTab } from '../types/navigation.types';

export interface NavigationPillTabsProps {
  activeTab: NavigationTab;
  onTabSelect: (tab: NavigationTab) => void;
  unreadAlertCount?: number;
}

export const NavigationPillTabs: React.FC<NavigationPillTabsProps> = ({
  activeTab,
  onTabSelect,
}) => {
  // Compute effective active tab (e.g. lot-hub resolves to inventory)
  const effectiveTab = activeTab === 'lot-hub' ? 'inventory' : activeTab;

  return (
    <nav 
      className="hidden lg:flex items-center gap-1.5 bg-slate-50/90 p-1.5 rounded-full border border-slate-200/70 shadow-inner"
      aria-label="Primary Navigation"
    >
      {PRIMARY_NAVIGATION_TABS.map((tab) => {
        const isActive = effectiveTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabSelect(tab.id)}
            className={`transition-all duration-150 flex items-center gap-1.5 ${
              isActive
                ? 'px-5 py-2 rounded-full bg-[#0d47a1] text-white text-sm font-semibold shadow-sm'
                : 'px-4 py-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-sm font-medium'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
