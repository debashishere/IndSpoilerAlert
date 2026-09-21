import React, { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveTab } from '../../store/slices/coreSlice';
import { useAuth } from '../../context/AuthContext';
import { BrandEmblem } from './subcomponents/BrandEmblem';
import { NavigationPillTabs } from './subcomponents/NavigationPillTabs';
import { NotificationBell } from './subcomponents/NotificationBell';
import { ProfilePill } from './subcomponents/ProfilePill';
import { InstitutionalControlMenu } from './InstitutionalControlMenu';
import { NotificationsPopover } from './NotificationsPopover';
import { MobileNavDrawer } from './MobileNavDrawer';
import type { GlobalNavigationBarProps, NavigationTab } from './types/navigation.types';

export const GlobalNavigationBar: React.FC<GlobalNavigationBarProps> = ({
  onTabChange,
  onOpenMobileDrawer,
  selectedSupplier,
  onSelectSupplier,
  onLogout,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.core.activeTab);

  let authUser: any = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch {
    authUser = null;
  }

  // Derive user presentation
  const displayName = authUser?.displayName || authUser?.email?.split('@')[0] || 'Debashishere007';
  const userInitials = authUser?.displayName
    ? authUser.displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DH';

  // Popover & Drawer state management
  const [controlMenuOpen, setControlMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleOpenDrawer = useCallback(() => {
    if (onOpenMobileDrawer) {
      onOpenMobileDrawer();
    } else {
      setMobileDrawerOpen(true);
    }
  }, [onOpenMobileDrawer]);

  const handleTabSelect = useCallback(
    (tab: NavigationTab) => {
      dispatch(setActiveTab(tab));
      if (onTabChange) {
        onTabChange(tab);
      }
    },
    [dispatch, onTabChange]
  );

  const handleBrandClick = useCallback(() => {
    handleTabSelect('ingestion');
  }, [handleTabSelect]);

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((prev) => !prev);
    setControlMenuOpen(false);
  }, []);

  const toggleControlMenu = useCallback(() => {
    setControlMenuOpen((prev) => !prev);
    setNotificationsOpen(false);
  }, []);

  return (
    <header
      className={`w-full bg-white rounded-xl border border-slate-200/90 shadow-sm px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 md:gap-6 transition-all duration-200 ${className}`}
      role="banner"
    >
      {/* Left: Brand Logo & Title */}
      <BrandEmblem onClick={handleBrandClick} />

      {/* Center: Rounded Pill Nav Navigation Bar & Public Marketplace Launcher (Desktop lg+) */}
      <div className="hidden lg:flex items-center gap-3">
        <NavigationPillTabs 
          activeTab={activeTab} 
          onTabSelect={handleTabSelect} 
        />
        <a
          href="/marketplace"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 rounded-full transition-all duration-150 shadow-2xs hover:scale-[1.02] cursor-pointer"
          title="Open Standalone Public Buyer Marketplace in a new tab"
          aria-label="Public Marketplace Portal"
        >
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">storefront</span>
          <span>Public Marketplace</span>
          <span className="material-symbols-outlined text-[13px]" aria-hidden="true">open_in_new</span>
        </a>
      </div>

      {/* Right: Notification Bell, User Avatar Pill & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <NotificationBell
            isOpen={notificationsOpen}
            onClick={toggleNotifications}
          />
          <NotificationsPopover
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onViewAll={() => setNotificationsOpen(false)}
          />
        </div>

        <div className="relative">
          <ProfilePill
            initials={userInitials}
            name={displayName}
            roleLabel="Verified Agent"
            isVerified={true}
            isOpen={controlMenuOpen}
            onClick={toggleControlMenu}
          />
          <InstitutionalControlMenu
            isOpen={controlMenuOpen}
            onClose={() => setControlMenuOpen(false)}
            user={{
              name: displayName,
              email: authUser?.email || 'debashis@example.corp',
              role: 'Verified Agent',
              agentId: 'AGT-402',
              initials: userInitials,
            }}
            selectedSupplier={selectedSupplier}
            onSelectSupplier={onSelectSupplier}
            onLogout={onLogout}
          />
        </div>

        {/* Mobile Hamburger Trigger (visible on screens < lg) */}
        <button
          type="button"
          onClick={handleOpenDrawer}
          className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <span className="material-symbols-outlined text-lg">menu</span>
        </button>
      </div>

      {/* Slide-over Responsive Drawer Overlay */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        user={{
          name: displayName,
          email: authUser?.email || 'debashis@example.corp',
          role: 'Verified Agent',
          agentId: 'AGT-402',
          initials: userInitials,
        }}
        onTabSelect={handleTabSelect}
        onLogout={onLogout}
      />
    </header>
  );
};
