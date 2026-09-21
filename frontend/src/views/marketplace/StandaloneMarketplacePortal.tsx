import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MarketplaceLayout } from '../../components/shell/MarketplaceLayout';
import { MarketplaceLandingView } from './MarketplaceLandingView';
import { QuickBidModal } from '../../components/QuickBidModal';
import { ThemeToggle } from '../../components/shell';
import { checkBuyerSessionThunk, BUYER_TOKEN_STORAGE_KEY } from '../../store/slices/authSlice';
import type { AppDispatch } from '../../store';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface StandaloneMarketplacePortalProps {
  initialToken?: string | null;
}

export const StandaloneMarketplacePortal: React.FC<StandaloneMarketplacePortalProps> = ({
  initialToken,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedToken = localStorage.getItem(BUYER_TOKEN_STORAGE_KEY);
      if (storedToken) {
        dispatch(checkBuyerSessionThunk());
      }
    }
  }, [dispatch]);

  const [quickBidToken, setQuickBidToken] = useState<string | null>(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('quickBidToken') || null;
    }
    return null;
  });

  return (
    <>
      <ThemeToggle />
      <MarketplaceLayout>
        <React.Suspense
          fallback={
            <div className="p-12 text-center text-slate-400">
              Loading marketplace landing page...
            </div>
          }
        >
          <MarketplaceLandingView apiBaseUrl={API_BASE_URL} />
        </React.Suspense>
      </MarketplaceLayout>

      {quickBidToken && (
        <QuickBidModal
          token={quickBidToken}
          onClose={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('token');
              url.searchParams.delete('quickBidToken');
              window.history.replaceState(
                {},
                document.title,
                url.pathname + (url.search !== '?' ? url.search : '')
              );
            }
            setQuickBidToken(null);
          }}
          onSuccess={() => {
            setQuickBidToken(null);
          }}
        />
      )}
    </>
  );
};
