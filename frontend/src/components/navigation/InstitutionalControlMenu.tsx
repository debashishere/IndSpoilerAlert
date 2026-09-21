import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store/hooks';
import { DEFAULT_SUPPLIERS } from '../../services/coreService';
import { BRAND_CONFIG } from './constants/navigationConstants';

export interface UserMenuProfile {
  name: string;
  email: string;
  role: string;
  agentId: string;
  initials: string;
}

export interface InstitutionalControlMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserMenuProfile;
  selectedSupplier?: string;
  onSelectSupplier?: (supplierId: string) => void;
  onLogout?: () => void;
}

export const InstitutionalControlMenu: React.FC<InstitutionalControlMenuProps> = ({
  isOpen,
  onClose,
  user,
  selectedSupplier,
  onSelectSupplier,
  onLogout,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const reduxSuppliers = useAppSelector((state) => state.core.suppliers);
  const suppliers = (reduxSuppliers && reduxSuppliers.length > 0) ? reduxSuppliers : DEFAULT_SUPPLIERS;
  const currentSupplierId = selectedSupplier || suppliers[0]?._id;

  const backendHealthy = useAppSelector((state) => state.core.backendHealthy);
  const sidecarHealthy = useAppSelector((state) => state.core.sidecarHealthy);

  const profile: UserMenuProfile = {
    name: user?.name || 'Debashishere007',
    email: user?.email || 'debashis@example.corp',
    role: user?.role || 'Verified Agent',
    agentId: user?.agentId || 'AGT-402',
    initials: user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'DH'),
  };

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Institutional Control Menu"
      className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-slate-800 dark:text-slate-200 transition-all duration-150 animate-in fade-in slide-in-from-top-1"
    >
      {/* 1. User Identity Header */}
      <div className="p-4 bg-gradient-to-br from-blue-50/70 to-slate-50/70 dark:from-slate-800/80 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#0d47a1] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
          {profile.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
              {profile.name}
            </span>
            <span className="material-symbols-outlined text-blue-600 text-xs fill" aria-label="Verified">
              verified
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
            {profile.email}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              {profile.role}
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              ID: #{profile.agentId}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 2. Facility / Supplier Switcher */}
        <div>
          <label 
            htmlFor="facility-supplier-select"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5"
          >
            Facility / Supplier
          </label>
          <div className="relative">
            <select
              id="facility-supplier-select"
              aria-label="Facility / Supplier"
              value={currentSupplierId}
              onChange={(e) => onSelectSupplier?.(e.target.value)}
              className="w-full h-10 pl-3 pr-8 text-xs font-medium bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-colors appearance-none cursor-pointer"
            >
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.companyCode || 'FAC'})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-base text-slate-400 pointer-events-none" aria-hidden="true">
              unfold_more
            </span>
          </div>
        </div>

        {/* 3. Theme Toggle Control */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Toggle Theme
          </button>
        </div>

        {/* 4. Standalone Public Marketplace Portal Launcher */}
        <a
          href="/marketplace"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition-colors group cursor-pointer"
          aria-label="Launch Public Marketplace Portal"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400" aria-hidden="true">
              storefront
            </span>
            <span className="text-xs font-medium">Public Marketplace Portal</span>
          </div>
          <span className="material-symbols-outlined text-sm text-blue-500 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
            open_in_new
          </span>
        </a>

        {/* 5. Real-time Node & Service Telemetry */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-0.5">
            System Telemetry
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">Backend API</span>
              <span className="flex items-center gap-1 text-[11px] font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${backendHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {backendHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">Sidecar</span>
              <span className="flex items-center gap-1 text-[11px] font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${sidecarHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {sidecarHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">{BRAND_CONFIG.nodeLabel}</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {BRAND_CONFIG.nodeId}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Sign Out / Lock Console Footer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout?.();
          }}
          className="w-full py-2 px-3 bg-white hover:bg-rose-50 dark:bg-slate-700 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-600 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">logout</span>
          <span>Sign Out / Lock Console</span>
        </button>
      </div>
    </div>
  );
};
