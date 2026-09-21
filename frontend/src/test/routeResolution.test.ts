import { describe, it, expect } from 'vitest';
import { resolveAppRoute } from '../utils/routeResolution';

describe('resolveAppRoute', () => {
  it('resolves deal routes (/deal/:id and /portal/deal/:id) with tokens', () => {
    expect(resolveAppRoute('/deal/deal-123', 'localhost', '?token=abc')).toEqual({
      type: 'deal',
      dealId: 'deal-123',
      token: 'abc',
    });

    expect(resolveAppRoute('/portal/deal/deal-456', 'app.inventoryflowing.com', '?dealToken=xyz')).toEqual({
      type: 'deal',
      dealId: 'deal-456',
      token: 'xyz',
    });
  });

  it('resolves negotiation routes (/portal/negotiation/:id) with tokens', () => {
    expect(resolveAppRoute('/portal/negotiation/offer-999', 'localhost', '?token=neg-tok')).toEqual({
      type: 'negotiation',
      offerId: 'offer-999',
      token: 'neg-tok',
    });

    expect(resolveAppRoute('/portal/negotiation/offer-888', 'localhost', '?negotiationToken=neg-tok-2')).toEqual({
      type: 'negotiation',
      offerId: 'offer-888',
      token: 'neg-tok-2',
    });
  });

  it('resolves marketplace routes for /marketplace, /marketplace/*, /bid/*, and marketplace.* subdomain', () => {
    // /marketplace
    expect(resolveAppRoute('/marketplace', 'localhost', '')).toEqual({
      type: 'marketplace',
      token: null,
    });

    // /marketplace/listing-123
    expect(resolveAppRoute('/marketplace/listing-123', 'localhost', '')).toEqual({
      type: 'marketplace',
      token: null,
    });

    // /bid/lot-456 with token
    expect(resolveAppRoute('/bid/lot-456', 'localhost', '?token=bid-token-1')).toEqual({
      type: 'marketplace',
      token: 'bid-token-1',
    });

    // marketplace.inventoryflowing.com subdomain (even on root /)
    expect(resolveAppRoute('/', 'marketplace.inventoryflowing.com', '?quickBidToken=qb-123')).toEqual({
      type: 'marketplace',
      token: 'qb-123',
    });

    // marketplace.localhost:5173
    expect(resolveAppRoute('/', 'marketplace.localhost:5173', '')).toEqual({
      type: 'marketplace',
      token: null,
    });
  });

  it('resolves supplier workspace for non-marketplace routes and default hosts', () => {
    expect(resolveAppRoute('/', 'localhost', '')).toEqual({ type: 'supplier' });
    expect(resolveAppRoute('/app', 'localhost', '')).toEqual({ type: 'supplier' });
    expect(resolveAppRoute('/app/inventory', 'app.inventoryflowing.com', '')).toEqual({ type: 'supplier' });
  });
});
