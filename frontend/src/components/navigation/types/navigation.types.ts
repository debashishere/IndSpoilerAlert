import type { NavigationTab } from '../../../store/slices/coreSlice';

export type { NavigationTab };

export interface NavBadge {
  type: 'dot' | 'pill';
  label?: string;
  className?: string;
}

export interface NavigationTabConfig {
  id: NavigationTab;
  label: string;
  iconName: string; // Material symbol or Lucide icon name
  badge?: NavBadge;
  targetRole?: 'all' | 'supplier' | 'buyer';
}

export interface GlobalNavigationBarProps {
  onTabChange?: (tab: NavigationTab) => void;
  onOpenMobileDrawer?: () => void;
  selectedSupplier?: string;
  onSelectSupplier?: (supplierId: string) => void;
  onLogout?: () => void;
  className?: string;
}

export interface UserProfileSummary {
  name: string;
  initials: string;
  roleLabel: string;
  isVerified: boolean;
  agentId?: string;
}
