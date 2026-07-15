import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveTab, type NavigationTab } from '../../store/slices/coreSlice';

export const SUPPLIER_ONLY_MODULES: NavigationTab[] = [
  'ingestion',
  'inventory',
  'workflows',
  'lot-hub',
  'analytics',
  'logistics',
];

export const COMMON_MODULES: NavigationTab[] = [
  'marketplace',
  'inbox',
  'settings',
  'dashboard',
];

export interface RoleGuardResult {
  isAllowed: boolean;
  effectiveTab: NavigationTab;
  hasSupplierProfile: boolean;
}

export const useRoleGuard = (): RoleGuardResult => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.core.activeTab);
  const auth = useAuth();
  const user = auth?.user;

  // By default, if user is not logged in or user has supplier profile set to true, supplier access is granted.
  // Supplier access is restricted ONLY if user is logged in AND has supplier: false (Buyer-only).
  const hasSupplierProfile = user ? Boolean(user.profiles?.supplier) : true;
  const isGuardedSupplierRoute = SUPPLIER_ONLY_MODULES.includes(activeTab);

  const isAllowed = hasSupplierProfile || !isGuardedSupplierRoute;
  const effectiveTab = isAllowed ? activeTab : 'marketplace';

  useEffect(() => {
    if (!isAllowed) {
      dispatch(setActiveTab('marketplace'));
    }
  }, [isAllowed, dispatch]);

  return {
    isAllowed,
    effectiveTab,
    hasSupplierProfile,
  };
};

export interface RoleGuardProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, fallback = null }) => {
  const { isAllowed } = useRoleGuard();

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;
