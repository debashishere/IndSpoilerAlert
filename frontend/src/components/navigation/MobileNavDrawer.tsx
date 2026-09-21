import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveTab } from '../../store/slices/coreSlice';
import { BRAND_CONFIG, PRIMARY_NAVIGATION_TABS } from './constants/navigationConstants';
import type { NavigationTab } from './types/navigation.types';
import type { UserMenuProfile } from './InstitutionalControlMenu';

export interface MobileNavDrawerStats {
  activeLots?: number | string;
  pendingBids?: string;
  unreadAlerts?: string;
}

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserMenuProfile;
  stats?: MobileNavDrawerStats;
  onTabSelect?: (tab: NavigationTab) => void;
  onLogout?: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  user,
  stats,
  onTabSelect,
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.core.activeTab);
  const effectiveTab = activeTab === 'lot-hub' ? 'inventory' : activeTab;

  // Hydrate stats from Redux or defaults
  const reduxInventoryLots = useAppSelector((state) => state.inventory?.inventoryList?.length);
  const activeLots = stats?.activeLots ?? (reduxInventoryLots && reduxInventoryLots > 0 ? reduxInventoryLots : 100);
  const pendingBids = stats?.pendingBids ?? '3 Active';
  const unreadAlerts = stats?.unreadAlerts ?? '4 Alerts';

  const profile: UserMenuProfile = {
    name: user?.name || 'Debashishere007',
    email: user?.email || 'debashis@example.corp',
    role: user?.role || 'Verified Agent',
    agentId: user?.agentId || 'AGT-402',
    initials: user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'DH'),
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLinkClick = (tabId: NavigationTab) => {
    dispatch(setActiveTab(tabId));
    onTabSelect?.(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true">
      {/* Backdrop */}
      <div
        data-testid="mobile-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Mobile Navigation Drawer"
        className="relative z-10 w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-y-auto text-slate-800 dark:text-slate-200 transition-all duration-200"
      >
        {/* 1. Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d47a1] to-[#1976d2] flex items-center justify-center text-white shadow-md shadow-blue-900/20 flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                  {BRAND_CONFIG.name}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-950 text-[#0d47a1] dark:text-blue-300 rounded">
                  {BRAND_CONFIG.version}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">
                {BRAND_CONFIG.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
            aria-label="Close Drawer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* 2. User Profile Card */}
        <div className="p-4 mx-4 mt-3 bg-gradient-to-br from-[#f1f5fb] to-[#e8effd] dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-[#0d47a1] text-white flex items-center justify-center font-bold text-sm shadow-sm tracking-wide">
                {profile.initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {profile.name}
                </span>
                <span className="material-symbols-outlined text-blue-600 text-xs fill" aria-label="Verified">
                  verified
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  {profile.role}
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  ID: #{profile.agentId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Stats Matrix Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 mt-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl p-2.5 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Lots
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {activeLots}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl p-2.5 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Bids
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {pendingBids}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl p-2.5 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unread
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {unreadAlerts}
            </span>
          </div>
        </div>

        {/* 4. Primary Navigation Links */}
        <div className="px-4 mt-4 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 px-2">
            Primary Navigation
          </div>
          <nav className="space-y-1">
            {PRIMARY_NAVIGATION_TABS.map((tab) => {
              const isActive = effectiveTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleLinkClick(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-colors ${
                    isActive
                      ? 'bg-[#0d47a1] text-white shadow-md shadow-blue-950/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {tab.iconName}
                    </span>
                    <span>{tab.label}</span>
                  </div>

                  {/* Contextual Badges */}
                  {isActive && tab.id === 'ingestion' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
                      Active
                    </span>
                  )}
                  {tab.id === 'inbox' && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                        4 New
                      </span>
                    </div>
                  )}
                  {tab.id !== 'ingestion' && tab.id !== 'inbox' && (
                    <span className="material-symbols-outlined text-slate-400 text-sm" aria-hidden="true">
                      chevron_right
                    </span>
                  )}
                </button>
              );
            })}

            {/* Standalone Public Marketplace Portal Launcher */}
            <a
              href="/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50 transition-colors mt-2"
              aria-label="Launch Public Marketplace Portal"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  storefront
                </span>
                <span>Public Marketplace</span>
              </div>
              <span className="material-symbols-outlined text-sm text-blue-500" aria-hidden="true">
                open_in_new
              </span>
            </a>
          </nav>

          {/* 5. Terminal Node Card */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 px-2">
              Terminal Node
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">hub</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    {BRAND_CONFIG.nodeLabel}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    {BRAND_CONFIG.nodeId}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">sync_alt</span>
            </div>
          </div>
        </div>

        {/* 6. Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-slate-500">shield_lock</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {BRAND_CONFIG.auditTag}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {BRAND_CONFIG.securityTag}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">logout</span>
            <span>Sign Out / Lock Console</span>
          </button>
          <div className="text-center mt-2.5">
            <span className="text-[10px] text-slate-400">
              © 2026 {BRAND_CONFIG.name} • Clearinghouse Node v4.2
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};
