export type AppRoute =
  | { type: 'deal'; dealId: string; token: string | null }
  | { type: 'negotiation'; offerId: string; token: string | null }
  | { type: 'marketplace'; token: string | null }
  | { type: 'supplier' };

export function resolveAppRoute(
  pathname: string,
  hostname?: string,
  search?: string
): AppRoute {
  const dealMatch = pathname.match(/^\/(?:portal\/)?deal\/([^/?#]+)/);
  if (dealMatch) {
    const params = new URLSearchParams(search || '');
    const token = params.get('token') || params.get('dealToken');
    return {
      type: 'deal',
      dealId: dealMatch[1],
      token,
    };
  }

  const negotiationMatch = pathname.match(/^\/portal\/negotiation\/([^/?#]+)/);
  if (negotiationMatch) {
    const params = new URLSearchParams(search || '');
    const token = params.get('token') || params.get('negotiationToken');
    return {
      type: 'negotiation',
      offerId: negotiationMatch[1],
      token,
    };
  }

  const cleanHost = (hostname || '').split(':')[0].toLowerCase();
  const isMarketplaceSubdomain = cleanHost.startsWith('marketplace.');
  const isMarketplacePath = pathname.startsWith('/marketplace') || pathname.startsWith('/bid');

  if (isMarketplaceSubdomain || isMarketplacePath) {
    const params = new URLSearchParams(search || '');
    const token = params.get('token') || params.get('quickBidToken');
    return {
      type: 'marketplace',
      token,
    };
  }

  return { type: 'supplier' };
}
