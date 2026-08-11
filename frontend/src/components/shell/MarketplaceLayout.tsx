import React, { useState, useContext, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ErrorBoundary } from './ErrorBoundary';
import { ShoppingBag, LogIn, UserPlus, ShieldCheck, LogOut, FileText, ChevronDown } from 'lucide-react';
import {
  selectBuyer,
  selectIsAuthenticated,
  openAuthModal,
  logoutBuyer,
} from '../../store/slices/authSlice';
import BuyerAuthModal from '../domain/marketplace/BuyerAuthModal';
import type { AppDispatch } from '../../store/index';
import { AuthContext } from '../../context/AuthContext';

export interface MarketplaceLayoutProps {
  children?: React.ReactNode;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  children,
  onLoginClick,
  onRegisterClick,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const reduxBuyer = useSelector(selectBuyer);
  const reduxIsAuthenticated = useSelector(selectIsAuthenticated);
  const auth = useContext(AuthContext);

  const isUserAuthenticated = reduxIsAuthenticated || (auth?.isAuthenticated && Boolean(auth?.user));
  const activeBuyer = reduxBuyer || (auth?.user ? {
    id: auth.user.uid,
    email: auth.user.email,
    companyName: auth.user.displayName || auth.user.email.split('@')[0],
    isVerified: true,
  } : null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogin = () => {
    if (onLoginClick) onLoginClick();
    dispatch(openAuthModal({ mode: 'login' }));
  };

  const handleRegister = () => {
    if (onRegisterClick) onRegisterClick();
    dispatch(openAuthModal({ mode: 'register' }));
  };

  const handleLogout = () => {
    dispatch(logoutBuyer());
    if (auth?.logout) auth.logout();
    setDropdownOpen(false);
  };

  return (
    <div className="marketplace-container bg-[hsl(var(--bg-main))] min-h-screen text-[hsl(var(--text-primary))] font-sans flex flex-col">
      <header
        data-testid="marketplace-header"
        className="sticky top-0 z-50 bg-[hsl(var(--bg-card))]/90 backdrop-blur border-b border-[hsl(var(--border-color))] px-6 py-4 flex items-center justify-between shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">
              InventoryFlowing
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Buyer Marketplace
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <a
            href="/marketplace"
            className="text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            Catalog
          </a>

          {isUserAuthenticated && activeBuyer ? (
            <div className="relative border-l border-[hsl(var(--border-color))] pl-4">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--bg-card-hover))] hover:bg-[hsl(var(--border-color))]/50 border border-[hsl(var(--border-color))] rounded-xl text-left transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                  {activeBuyer.companyName ? activeBuyer.companyName.charAt(0).toUpperCase() : 'B'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[hsl(var(--text-primary))] flex items-center gap-1">
                    {activeBuyer.companyName || activeBuyer.email}
                    {activeBuyer.isVerified && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Verified Buyer
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-[hsl(var(--text-muted))]">{activeBuyer.email}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] ml-1" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-[hsl(var(--border-color))] text-[11px] text-[hsl(var(--text-muted))]">
                    Signed in as <strong className="text-[hsl(var(--text-primary))] block truncate">{activeBuyer.email}</strong>
                  </div>
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="w-full px-3 py-2 text-xs text-left text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bg-card-hover))] hover:text-[hsl(var(--text-primary))] flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    My Bids
                  </button>
                  <div className="px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 border-b border-[hsl(var(--border-color))]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified Buyer Status
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-2 border-l border-[hsl(var(--border-color))]">
              <button
                onClick={handleLogin}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[hsl(var(--text-primary))] bg-[hsl(var(--bg-card))] hover:bg-[hsl(var(--bg-card-hover))] border border-[hsl(var(--border-color))] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Buyer Login
              </button>
              <button
                onClick={handleRegister}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>
          )}
        </nav>

        <BuyerAuthModal />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="p-12 text-center text-[hsl(var(--text-muted))] animate-pulse">
                Loading marketplace...
              </div>
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="border-t border-[hsl(var(--border-color))] bg-[hsl(var(--bg-card))] py-6 text-center text-xs text-[hsl(var(--text-muted))]">
        © {new Date().getFullYear()} InventoryFlowing. Secondary Surplus Wholesale Marketplace. All rights reserved.
      </footer>
    </div>
  );
};

export default MarketplaceLayout;
