/**
 * Utility functions for Ingestion Inventory domain
 */

/**
 * Checks if an inventory lot is currently listed in active bidding or marketplace.
 * The system rejects editing for any lot that satisfies bidding criteria.
 */
export function isLotListedInBidding(lot: any): boolean {
  if (!lot) return false;

  // 1. Direct explicit boolean flags
  if (
    lot.isListedInBidding === true ||
    lot.listedInBidding === true ||
    lot.bidding === true ||
    lot.biddingPushed === true ||
    lot.allowBidding === true
  ) {
    return true;
  }

  // 2. MarketplaceListing relationship & status
  if (lot.listing) {
    if (lot.listing.allowBidding === true) return true;
    if (typeof lot.listing.status === 'string' && lot.listing.status.toLowerCase() === 'active') return true;
  }

  // 3. Status string check (e.g. 'Bidding', 'In Bidding', 'Listed in Bidding')
  const statusStr = String(lot.status || '').toLowerCase();
  if (
    statusStr === 'bidding' ||
    statusStr === 'in bidding' ||
    statusStr.includes('bidding') ||
    statusStr.includes('listed in bidding')
  ) {
    return true;
  }

  // 4. Active bids association
  if (Array.isArray(lot.bids) && lot.bids.length > 0) {
    return true;
  }
  if (lot.hasActiveBids === true) {
    return true;
  }

  return false;
}
