import React, { useState, useEffect } from 'react';
import { resolveAppRoute } from './utils/routeResolution';
import type { AppRoute } from './utils/routeResolution';
import { ThemeToggle } from './components/shell';
import { DealSettlementPortalView } from './views/DealSettlementPortalView';
import { BuyerNegotiationPortalView } from './views/BuyerNegotiationPortalView';
import { StandaloneMarketplacePortal } from './views/marketplace/StandaloneMarketplacePortal';
import { SupplierWorkspace } from './views/supplier/SupplierWorkspace';

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    resolveAppRoute(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      typeof window !== 'undefined' ? window.location.search : ''
    )
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(
        resolveAppRoute(
          window.location.pathname,
          window.location.hostname,
          window.location.search
        )
      );
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (route.type === 'deal') {
    return (
      <>
        <ThemeToggle />
        <DealSettlementPortalView dealId={route.dealId} token={route.token} />
      </>
    );
  }

  if (route.type === 'negotiation') {
    return (
      <>
        <ThemeToggle />
        <BuyerNegotiationPortalView offerId={route.offerId} token={route.token} />
      </>
    );
  }

  if (route.type === 'marketplace') {
    return <StandaloneMarketplacePortal initialToken={route.token} />;
  }

  return <SupplierWorkspace />;
}
