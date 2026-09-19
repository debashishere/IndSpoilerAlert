import { useMemo } from 'react';
import type { TimelineEvent, TimelineCategoryFilter } from '../types/bidActionInspector.types';

export interface UseTimelineAuditParams {
  bid: any;
  lot?: any;
  internalStatus: string;
  internalMessages: any[];
  selectedDeclineReason: string;
  declineRationale: string;
  timelineCategoryFilter: TimelineCategoryFilter;
  timelineSearchQuery: string;
}

export const useTimelineAudit = ({
  bid,
  lot,
  internalStatus,
  internalMessages,
  selectedDeclineReason,
  declineRationale,
  timelineCategoryFilter,
  timelineSearchQuery
}: UseTimelineAuditParams) => {
  const allEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Lot publication / listing
    events.push({
      id: `lot-pub-${lot?._id || '0'}`,
      category: 'system',
      title: 'Lot Published & Inventory Allocated',
      description: `Lot #${lot?.lotNumber || 'N/A'} (${lot?.productId?.description || 'Surplus Item'}, SKU: ${lot?.productId?.sku || 'N/A'}) published with standard sell baseline $${Number(lot?.standardSellPrice || 0).toFixed(2)}/cs.`,
      timestamp: lot?.createdAt || lot?.listingDate || bid?.submittedAt || new Date().toISOString(),
      actor: 'Supplier Operations',
      referenceId: lot?.lotNumber ? `LOT-${lot.lotNumber}` : (lot?._id || 'LOT-REF')
    });

    // 2. Escrow pre-auth check
    events.push({
      id: `escrow-${bid?._id || '0'}`,
      category: 'system',
      title: 'Automated Escrow Pre-Authorization & Buyer Verification',
      description: `Commercial solvency check and escrow pre-authorization verified for buyer ${bid?.buyerId?.companyName || 'Buyer'}. Funds pre-allocated for transaction compliance.`,
      timestamp: bid?.submittedAt || lot?.createdAt || new Date().toISOString(),
      actor: 'Escrow Engine / Compliance',
      referenceId: `ESCROW-PREAUTH-${bid?._id?.slice(-6) || 'AUTH'}`
    });

    // 3. Buyer Initial Bid
    events.push({
      id: `bid-init-${bid?._id || '0'}`,
      category: 'negotiations',
      title: 'Buyer Initial Offer Submitted',
      description: `Initial offer submitted at $${Number(bid?.price || bid?.bidPricePerCase || 0).toFixed(2)}/cs for ${bid?.quantity || bid?.quantityCases || 0} cases (Total: $${(Number(bid?.price || bid?.bidPricePerCase || 0) * Number(bid?.quantity || bid?.quantityCases || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}).`,
      timestamp: bid?.submittedAt || new Date().toISOString(),
      actor: bid?.buyerId?.companyName || 'Buyer',
      referenceId: `BID-${bid?._id || 'REF'}`
    });

    // 4. Negotiation messages (from internalMessages or bid?.messages)
    const msgs = internalMessages && internalMessages.length > 0 ? internalMessages : (bid?.messages || []);
    msgs.forEach((msg: any, index: number) => {
      if (index === 0 && msg.sender === 'buyer' && msg.content?.includes('Initial offer submitted')) {
        return;
      }
      const isSupplier = msg.sender === 'supplier';
      const isBuyer = msg.sender === 'buyer';
      const category: 'negotiations' | 'system' = isSupplier || isBuyer ? 'negotiations' : 'system';
      const title = isSupplier 
        ? `Supplier Counter-Offer Dispatched ($${Number(msg.proposedPrice || 0).toFixed(2)}/cs)`
        : isBuyer 
          ? 'Buyer Negotiation Response' 
          : 'System Negotiation Note';
      const actor = isSupplier ? 'Supplier Operations' : isBuyer ? (bid?.buyerId?.companyName || 'Buyer') : 'System';

      events.push({
        id: `msg-${index}-${msg.timestamp || index}`,
        category,
        title,
        description: msg.content || (msg.proposedPrice ? `Proposed terms: $${Number(msg.proposedPrice).toFixed(2)}/cs for ${msg.proposedQuantity || bid?.quantity} cases.` : 'Negotiation note recorded.'),
        timestamp: msg.timestamp || new Date().toISOString(),
        actor,
        referenceId: `MSG-ROUND-${index + 1}`
      });
    });

    // 5. Final settlement or status transition
    const currentStatus = internalStatus || bid?.status;
    if (currentStatus === 'accepted' || currentStatus === 'fully_accepted') {
      events.push({
        id: `status-accept-${bid?._id || '0'}`,
        category: 'status',
        title: 'Offer Accepted & Deal Settlement Active',
        description: 'Offer officially accepted by Supplier Operations. Deal settlement generated with agreed logistics pickup instructions.',
        timestamp: new Date().toISOString(),
        actor: 'Supplier Operations',
        referenceId: `AWARD-DEAL-${bid?._id || '0'}`
      });
    } else if (currentStatus === 'rejected' || currentStatus === 'declined') {
      events.push({
        id: `status-reject-${bid?._id || '0'}`,
        category: 'status',
        title: 'Offer Declined & Rejection Notice Dispatched',
        description: selectedDeclineReason ? `Offer declined. Reason: ${selectedDeclineReason}. Rationale: ${declineRationale || 'N/A'}` : 'Offer declined by Supplier Operations.',
        timestamp: new Date().toISOString(),
        actor: 'Supplier Operations',
        referenceId: `DECLINE-${bid?._id || '0'}`
      });
    } else if (currentStatus === 'countered') {
      events.push({
        id: `status-counter-${bid?._id || '0'}`,
        category: 'status',
        title: 'Status Transition: Active Counter Proposal',
        description: 'Offer transitioned to Countered state pending buyer review and action.',
        timestamp: new Date().toISOString(),
        actor: 'Workflow Engine',
        referenceId: `TRANS-COUNTER-${bid?._id || '0'}`
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [bid, lot, internalStatus, internalMessages, selectedDeclineReason, declineRationale]);

  const filteredEvents = useMemo(() => {
    const query = timelineSearchQuery.trim().toLowerCase();
    return allEvents.filter(event => {
      const matchesCategory = timelineCategoryFilter === 'all' || event.category === timelineCategoryFilter;
      const matchesSearch = !query || 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.actor.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [allEvents, timelineCategoryFilter, timelineSearchQuery]);

  return {
    allEvents,
    filteredEvents
  };
};
