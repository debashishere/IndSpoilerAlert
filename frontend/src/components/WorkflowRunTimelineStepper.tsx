import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Timer, ChevronDown, Users, Mail } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { selectBuyerLists } from '../store/slices/coreSlice';

export const formatExecutionWindow = (waitHours?: number, waitUnit?: 'd' | 'h' | 'm'): string => {
  if (waitHours == null || isNaN(waitHours) || waitHours <= 0) return 'Immediate';
  
  if (waitUnit === 'm') {
    const mins = Math.round(waitHours * 60);
    return `${mins} ${mins === 1 ? 'Min' : 'Mins'}`;
  }
  if (waitUnit === 'd') {
    const days = Number((waitHours / 24).toFixed(2));
    const roundedDays = days % 1 === 0 ? Math.round(days) : days;
    return `${roundedDays} ${roundedDays === 1 ? 'Day' : 'Days'}`;
  }
  if (waitUnit === 'h') {
    const roundedHours = waitHours % 1 === 0 ? Math.round(waitHours) : Number(waitHours.toFixed(2));
    return `${roundedHours} ${roundedHours === 1 ? 'Hour' : 'Hours'}`;
  }

  // Automatic smart inference for legacy data
  if (waitHours < 1) {
    const mins = Math.round(waitHours * 60);
    return `${mins} ${mins === 1 ? 'Min' : 'Mins'}`;
  }
  if (waitHours >= 24 && waitHours % 24 === 0) {
    const days = Math.round(waitHours / 24);
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  }
  const roundedHours = waitHours % 1 === 0 ? Math.round(waitHours) : Number(waitHours.toFixed(2));
  return `${roundedHours} ${roundedHours === 1 ? 'Hour' : 'Hours'}`;
};

export const formatTimeRemaining = (remainingMs: number): string => {
  if (remainingMs <= 0) return '00h 00m 00s';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
};

export const formatElapsedTime = (startIso?: string, endIso?: string): string => {
  if (!startIso || !endIso) return '';
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = end - start;
  if (diffMs <= 0 || isNaN(diffMs)) return '0m';
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

export const getPricingRuleLabel = (discountType?: string): string => {
  const dt = (discountType || '').toLowerCase();
  if (dt === 'ai_optimizer' || dt === 'dynamic' || dt === 'ai_yield') {
    return 'AI Yield Optimizer';
  }
  if (dt === 'min_bid_floor' || dt === 'fixed_price' || dt === 'floor_price') {
    return 'Min Bid Floor $';
  }
  return 'Fixed Markdown %';
};

export const formatDiscountValue = (stage: any): string => {
  const dt = (stage?.discountType || '').toLowerCase();
  const val = stage?.discountValue ?? 0;
  if (dt === 'min_bid_floor' || dt === 'fixed_price' || dt === 'floor_price') {
    return `$${Number(val).toFixed(2)}`;
  }
  return `${val}%`;
};

export const resolveStageBids = (stg: any, allBids: any[], run: any): any[] => {
  if (!allBids || allBids.length === 0) return [];

  // If stage has explicit allocatedLotIds, match against them
  if (Array.isArray(stg?.allocatedLotIds) && stg.allocatedLotIds.length > 0) {
    return allBids.filter((b: any) => {
      const bidLotId = b.inventoryLotId?._id || b.inventoryLotId?.id || b.inventoryLotId || b.lotId;
      return stg.allocatedLotIds.includes(bidLotId);
    });
  }

  // Otherwise, match against run.snapshotInventoryIds or default
  if (Array.isArray(run?.snapshotInventoryIds) && run.snapshotInventoryIds.length > 0) {
    return allBids.filter((b: any) => {
      const bidLotId = b.inventoryLotId?._id || b.inventoryLotId?.id || b.inventoryLotId || b.lotId;
      return run.snapshotInventoryIds.includes(bidLotId);
    });
  }

  return allBids;
};

export const isBidWinning = (bid: any, stageState: string, isEvaluating: boolean, run: any): boolean => {
  if (stageState !== 'completed' || isEvaluating) return false;
  if (bid.status === 'accepted' || bid.isWinning) return true;
  if (run?.resolution?.winningBidId && (bid._id === run.resolution.winningBidId || bid.id === run.resolution.winningBidId)) return true;
  if (run?.resolution?.action === 'auto_award') {
    const winningBuyer = run?.resolution?.targetBuyerId?.companyName || run?.resolution?.targetBuyerId?._id || run?.resolution?.targetBuyerId;
    const bidBuyer = bid.buyerName || bid.buyerId?.companyName || bid.buyerId?._id || bid.buyerId;
    if (winningBuyer && bidBuyer === winningBuyer && run?.resolution?.winningPrice && bid.price === run.resolution.winningPrice) {
      return true;
    }
  }
  return false;
};

export const resolveStageLots = (stg: any, inventoryList: any[], run: any): any[] => {
  if (!inventoryList) inventoryList = [];

  const targetLotIds = Array.isArray(stg?.allocatedLotIds) && stg.allocatedLotIds.length > 0
    ? stg.allocatedLotIds
    : (Array.isArray(run?.snapshotInventoryIds) && run.snapshotInventoryIds.length > 0 ? run.snapshotInventoryIds : []);

  if (targetLotIds.length === 0) {
    return inventoryList.length > 0 ? inventoryList : [];
  }

  return targetLotIds.map((id: string, idx: number) => {
    const found = inventoryList.find((l: any) => (l._id || l.id) === id || l.lotNumber === id);
    return found || {
      _id: id,
      lotNumber: `LOT-${String(id).slice(-4)}`,
      sku: 'SKU-SNAPSHOT',
      description: 'Inventory Lot Item',
      quantityCases: 100
    };
  });
};

export const resolveStageBuyers = (
  stg: any,
  buyers: any[] = [],
  buyerLists: any[] = [],
  run?: any
): Array<{ id: string; name: string; email: string; tier: string }> => {
  if (!buyers) buyers = [];
  if (!buyerLists) buyerLists = [];

  // 1. Custom buyer mode
  if (stg.buyerMode === 'custom') {
    const customList = Array.isArray(stg.customBuyers) && stg.customBuyers.length > 0
      ? stg.customBuyers
      : (Array.isArray(stg.customBuyerIds) ? stg.customBuyerIds : []);

    if (customList.length === 0) {
      if (Array.isArray(run?.evaluatedBuyerIds) && run.evaluatedBuyerIds.length > 0) {
        return run.evaluatedBuyerIds.map((bId: any) => {
          const id = typeof bId === 'string' ? bId : (bId._id || bId.id || bId.email);
          const matched = buyers.find((b: any) => (b._id || b.id) === id || b.email === id);
          return matched ? {
            id: matched._id || matched.id || id,
            name: matched.companyName || matched.name || id,
            email: matched.email || '',
            tier: matched.tier || 'custom',
          } : {
            id: String(id),
            name: String(id),
            email: '',
            tier: 'custom',
          };
        });
      }
      return [];
    }

    return customList.map((cb: any) => {
      const id = typeof cb === 'string' ? cb : (cb.id || cb._id || cb.email);
      const matched = buyers.find((b: any) => b._id === id || b.id === id || b.email === id);
      if (matched) {
        return {
          id: matched._id || matched.id || id,
          name: (typeof cb === 'object' && (cb.name || cb.companyName)) ? (cb.name || cb.companyName) : (matched.companyName || matched.name || id),
          email: (typeof cb === 'object' && cb.email) ? cb.email : (matched.email || ''),
          tier: (typeof cb === 'object' && cb.tier) ? cb.tier : (matched.tier || 'custom'),
        };
      }
      if (typeof cb === 'object') {
        return {
          id: cb.id || cb._id || cb.name || 'buyer',
          name: cb.name || cb.companyName || cb.email || id,
          email: cb.email || '',
          tier: cb.tier || 'custom',
        };
      }
      return {
        id: String(id),
        name: String(id),
        email: '',
        tier: 'custom',
      };
    });
  }

  // 2. Buyer List or Segment mode
  if (stg.buyerMode === 'segment' || stg.buyerMode === 'list' || stg.buyerListId || stg.buyerSegment || stg.buyerListName) {
    const targetId = stg.buyerListId || stg.buyerSegment;
    const targetName = (stg.buyerListName || stg.buyerSegment || '').toLowerCase();

    // Look for matching list in buyerLists
    const matchedList = buyerLists.find((l: any) =>
      (targetId && (l._id === targetId || l.id === targetId || l.type === targetId)) ||
      (targetName && l.name && l.name.toLowerCase() === targetName) ||
      (targetId && l.name && l.name.toLowerCase() === String(targetId).toLowerCase())
    );

    if (matchedList) {
      const listBuyerIds = Array.isArray(matchedList.buyerIds) ? matchedList.buyerIds : [];
      return listBuyerIds.map((b: any) => {
        if (typeof b === 'object' && b !== null) {
          return {
            id: b._id || b.id || b.email,
            name: b.companyName || b.name || b.email || 'Partner',
            email: b.email || '',
            tier: b.tier || 'tier1',
          };
        }
        const matched = buyers.find((buyer: any) => (buyer._id || buyer.id) === b || buyer.email === b);
        if (matched) {
          return {
            id: matched._id || matched.id || b,
            name: matched.companyName || matched.name || b,
            email: matched.email || '',
            tier: matched.tier || 'tier1',
          };
        }
        return {
          id: String(b),
          name: String(b),
          email: '',
          tier: 'tier1',
        };
      });
    }

    // Try finding in static segments or attributes on buyers
    const segName = (stg.buyerSegment || stg.buyerListName || stg.buyerListId || '').toLowerCase();
    const isPrimary = segName.includes('primary') || segName.includes('tier 1') || segName.includes('tier1');
    const isSecondary = segName.includes('secondary') || segName.includes('tier 2') || segName.includes('tier2') || segName.includes('liquidator');

    const matched = buyers.filter((b: any) => {
      const bTier = String(b.tier ?? '').toLowerCase();
      const bSeg = String(b.segment ?? b.buyerSegment ?? '').toLowerCase();
      if (stg.buyerSegment && (bSeg === stg.buyerSegment.toLowerCase() || b.buyerSegment === stg.buyerSegment || bTier === stg.buyerSegment.toLowerCase())) {
        return true;
      }
      if (isPrimary && (!bTier || bTier === 'tier1' || bTier === 'primary' || bTier === '1' || bTier === 'tier1_retailers')) {
        return true;
      }
      if (isSecondary && (bTier === 'tier2' || bTier === 'secondary' || bTier === 'liquidator' || bTier === 'all_liquidators' || bTier === '2')) {
        return true;
      }
      return false;
    });

    if (matched.length > 0) {
      return matched.map((b: any) => ({
        id: b._id || b.id || b.email,
        name: b.companyName || b.name || b.email,
        email: b.email || '',
        tier: b.tier || 'tier1',
      }));
    }

    // If list/segment was configured but no buyers matched from static segments or buyerLists:
    // Check if the run has evaluatedBuyerIds / buyerEmails recorded during past execution
    if (Array.isArray(run?.evaluatedBuyerIds) && run.evaluatedBuyerIds.length > 0) {
      return run.evaluatedBuyerIds.map((bId: any) => {
        const id = typeof bId === 'string' ? bId : (bId._id || bId.id || bId.email);
        const matchedBuyer = buyers.find((b: any) => (b._id || b.id) === id || b.email === id);
        return matchedBuyer ? {
          id: matchedBuyer._id || matchedBuyer.id || id,
          name: matchedBuyer.companyName || matchedBuyer.name || id,
          email: matchedBuyer.email || '',
          tier: matchedBuyer.tier || 'tier1',
        } : {
          id: String(id),
          name: String(id),
          email: '',
          tier: 'tier1',
        };
      });
    }

    if (Array.isArray(run?.buyerEmails) && run.buyerEmails.length > 0) {
      return run.buyerEmails.map((email: string) => {
        const matchedBuyer = buyers.find((b: any) => b.email?.toLowerCase() === email.toLowerCase());
        return matchedBuyer ? {
          id: matchedBuyer._id || matchedBuyer.id || email,
          name: matchedBuyer.companyName || matchedBuyer.name || email,
          email: matchedBuyer.email || email,
          tier: matchedBuyer.tier || 'tier1',
        } : {
          id: email,
          name: email,
          email,
          tier: 'tier1',
        };
      });
    }

    // List mode was requested and no buyers found -> return empty list
    return [];
  }

  // 3. BuyerMode === 'all' or default
  if (stg.buyerMode !== 'all' && Array.isArray(run?.evaluatedBuyerIds) && run.evaluatedBuyerIds.length > 0) {
    return run.evaluatedBuyerIds.map((bId: any) => {
      const id = typeof bId === 'string' ? bId : (bId._id || bId.id || bId.email);
      const matchedBuyer = buyers.find((b: any) => (b._id || b.id) === id || b.email === id);
      return matchedBuyer ? {
        id: matchedBuyer._id || matchedBuyer.id || id,
        name: matchedBuyer.companyName || matchedBuyer.name || id,
        email: matchedBuyer.email || '',
        tier: matchedBuyer.tier || 'tier1',
      } : {
        id: String(id),
        name: String(id),
        email: '',
        tier: 'tier1',
      };
    });
  }

  return buyers.map((b: any) => ({
    id: b._id || b.id || b.email,
    name: b.companyName || b.name || b.email,
    email: b.email || '',
    tier: b.tier || 'tier1',
  }));
};

export const resolveEmailTokens = (
  template: string,
  stage: any,
  run: any,
  inventoryList: any[] = [],
  allBuyers: any[] = [],
  buyerLists: any[] = []
): string => {
  if (!template) return '';

  const stageLots = resolveStageLots(stage, inventoryList, run);
  const stageBuyers = resolveStageBuyers(stage, allBuyers, buyerLists, run);

  // Target buyer / partner name
  let targetBuyerName: string | undefined = undefined;
  if (stage.acceptingPartnerName || stage.acceptingPartner?.companyName || stage.acceptingPartner?.name) {
    targetBuyerName = stage.acceptingPartnerName || stage.acceptingPartner?.companyName || stage.acceptingPartner?.name;
  } else if (stage.disposalPartnerName || stage.disposalPartner?.companyName || stage.disposalPartner?.name) {
    targetBuyerName = stage.disposalPartnerName || stage.disposalPartner?.companyName || stage.disposalPartner?.name;
  } else if (stage.partnerName) {
    targetBuyerName = stage.partnerName;
  } else if (stageBuyers.length > 0) {
    targetBuyerName = stageBuyers[0].name;
  }

  // Current stage discount
  let currentStageDiscount: string | undefined = undefined;
  if (stage.discountValue != null) {
    currentStageDiscount = formatDiscountValue(stage);
  }

  // Formatted Window / Deadlines
  const formattedWindow = formatExecutionWindow(stage.waitHours, stage.waitUnit);
  
  let responseDeadline: string | undefined = undefined;
  if (stage.responseDeadline) {
    responseDeadline = stage.responseDeadline;
  } else if (formattedWindow && formattedWindow !== 'Immediate') {
    responseDeadline = formattedWindow;
  } else if (stage.waitHours) {
    responseDeadline = `${stage.waitHours} Hours`;
  }

  let offerExpirationTime: string | undefined = undefined;
  if (stage.offerExpirationTime) {
    offerExpirationTime = stage.offerExpirationTime;
  } else if (formattedWindow && formattedWindow !== 'Immediate') {
    offerExpirationTime = formattedWindow;
  } else if (stage.waitHours) {
    offerExpirationTime = `${stage.waitHours} Hours`;
  }

  let disposalDeadline: string | undefined = undefined;
  if (stage.disposalDeadline) {
    disposalDeadline = new Date(stage.disposalDeadline).toLocaleDateString();
  }

  // Inventory Table
  let inventoryTable: string | undefined = undefined;
  if (stageLots && stageLots.length > 0) {
    const rows = stageLots.map((lot: any, idx: number) => {
      const lotNum = lot.lotNumber || `LOT-${String(lot._id || idx).slice(-4)}`;
      const sku = lot.sku || 'N/A';
      const desc = lot.description || 'Inventory Item';
      const cases = (lot.availableQty || lot.quantityCases || 0).toLocaleString();
      return `<tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #1e293b;">${lotNum}</td>
        <td style="padding: 8px 12px; color: #64748b; font-family: monospace;">${sku}</td>
        <td style="padding: 8px 12px; color: #334155;">${desc}</td>
        <td style="padding: 8px 12px; font-weight: 600; text-align: right; color: #0f172a;">${cases} Cases</td>
      </tr>`;
    }).join('');

    inventoryTable = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; text-align: left; border: 1px solid #e2e8f0; background-color: #ffffff; border-radius: 6px; overflow: hidden;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
          <th style="padding: 8px 12px;">Lot #</th>
          <th style="padding: 8px 12px;">SKU</th>
          <th style="padding: 8px 12px;">Description</th>
          <th style="padding: 8px 12px; text-align: right;">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
  }

  // Dictionary of known tokens
  const tokenMap: Record<string, string | undefined> = {
    buyer_name: targetBuyerName,
    partner_name: targetBuyerName,
    current_stage_discount: currentStageDiscount,
    response_deadline: responseDeadline,
    offer_expiration_time: offerExpirationTime,
    disposal_deadline: disposalDeadline,
    inventory_table: inventoryTable,
    expiry_hours: formattedWindow,
    supplier_name: run?.campaignSnapshot?.supplierName || run?.supplierName,
    lot_title: stageLots[0]?.description || stageLots[0]?.lotNumber,
  };

  let resolved = template;

  // Substitute known tokens
  Object.keys(tokenMap).forEach((key) => {
    const val = tokenMap[key];
    if (val !== undefined && val !== null && val !== '') {
      const regex = new RegExp(`\\{\\{\\{?${key}\\}?\\}\\}`, 'g');
      resolved = resolved.replace(regex, val);
    }
  });

  // Fallback remaining {{token_name}} to [Token Name]
  resolved = resolved.replace(/\{\{\{?([a-zA-Z0-9_-]+)\}?\}\}/g, (match, tokenKey) => {
    const formatted = tokenKey
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
    return `[${formatted}]`;
  });

  return resolved;
};

export interface StageAllocatedLotsSectionProps {
  stage: any;
  inventoryList?: any[];
  run?: any;
  initialPageSize?: number;
}

export const StageAllocatedLotsSection: React.FC<StageAllocatedLotsSectionProps> = ({
  stage,
  inventoryList = [],
  run,
  initialPageSize = 10,
}) => {
  const stageLots = resolveStageLots(stage, inventoryList, run);
  const [pageSize, setPageSize] = useState<number>(() => Math.min(30, Math.max(1, initialPageSize)));
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalLots = stageLots.length;
  const totalPages = Math.max(1, Math.ceil(totalLots / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const handlePageSizeChange = (newSize: number) => {
    const clamped = Math.min(30, Math.max(1, newSize));
    setPageSize(clamped);
    setCurrentPage(1);
  };

  const startIndex = totalLots === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalLots, safeCurrentPage * pageSize);
  const paginatedLots = stageLots.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  return (
    <div data-testid="stage-allocated-lots-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div data-testid="stage-allocated-lots-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <span style={{ fontSize: '9px' }}>⬤</span> ALLOCATED LOTS
        </div>
        <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
          {totalLots} {totalLots === 1 ? 'Lot Allocated' : 'Lots Allocated'}
        </span>
      </div>

      {totalLots === 0 ? (
        <div
          data-testid="stage-lots-empty"
          style={{
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: 'hsl(var(--bg-card-hover) / 40%)',
            border: '1px dashed hsl(var(--border-color))',
            fontSize: '0.78rem',
            color: 'hsl(var(--text-muted))',
            textAlign: 'center',
          }}
        >
          No specific inventory lots allocated to this stage.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'hsl(var(--bg-card-hover) / 50%)', borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Lot Identifier</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>SKU</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Description</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLots.map((lot: any, lIdx: number) => {
                  const lotId = lot._id || lot.id || `LOT-${(safeCurrentPage - 1) * pageSize + lIdx}`;
                  const lotNum = lot.lotNumber || `LOT-${String(lotId).slice(-4)}`;
                  const cases = lot.availableQty || lot.quantityCases || 0;

                  return (
                    <tr
                      key={lotId}
                      data-testid="stage-allocated-lot-row"
                      style={{
                        borderBottom: lIdx < paginatedLots.length - 1 ? '1px solid hsl(var(--border-color))' : 'none',
                        backgroundColor: 'hsl(var(--bg-card))',
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        {lotNum}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'hsl(var(--text-muted))', fontFamily: 'monospace' }}>
                        {lot.sku || 'N/A'}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'hsl(var(--text-primary))' }}>
                        {lot.description || 'Inventory Item'}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {cases.toLocaleString()} Cases
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            data-testid="stage-allocated-lots-pagination"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '8px 12px',
              backgroundColor: 'hsl(var(--bg-card-hover) / 30%)',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-color))',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div data-testid="stage-allocated-lots-page-info" style={{ color: 'hsl(var(--text-secondary))' }}>
                Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{totalLots}</strong> lots
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-muted))' }}>
                <label htmlFor={`stage-page-size-${stage?.stageNumber || 'audit'}`} style={{ fontSize: '0.72rem' }}>Page size:</label>
                <select
                  id={`stage-page-size-${stage?.stageNumber || 'audit'}`}
                  data-testid="stage-allocated-lots-page-size-select"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid hsl(var(--border-color))',
                    backgroundColor: 'hsl(var(--bg-card))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30 (max)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                data-testid="stage-allocated-lots-page-prev"
                aria-label="Previous Page"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid hsl(var(--border-color))',
                  backgroundColor: 'hsl(var(--bg-card))',
                  color: safeCurrentPage <= 1 ? 'hsl(var(--text-muted))' : 'hsl(var(--text-primary))',
                  cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.72rem',
                  opacity: safeCurrentPage <= 1 ? 0.6 : 1,
                  fontWeight: 600,
                }}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  data-testid={`stage-allocated-lots-page-btn-${page}`}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid hsl(var(--border-color))',
                    backgroundColor: safeCurrentPage === page ? 'hsl(var(--primary))' : 'hsl(var(--bg-card))',
                    color: safeCurrentPage === page ? 'white' : 'hsl(var(--text-secondary))',
                    fontWeight: safeCurrentPage === page ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                data-testid="stage-allocated-lots-page-next"
                aria-label="Next Page"
                disabled={safeCurrentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid hsl(var(--border-color))',
                  backgroundColor: 'hsl(var(--bg-card))',
                  color: safeCurrentPage >= totalPages || totalPages === 0 ? 'hsl(var(--text-muted))' : 'hsl(var(--text-primary))',
                  cursor: safeCurrentPage >= totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.72rem',
                  opacity: safeCurrentPage >= totalPages || totalPages === 0 ? 0.6 : 1,
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface WorkflowRunTimelineStepperProps {
  run: any;
  stages?: any[];
  allBuyers?: any[];
  allBids?: any[];
  inventoryList?: any[];
  buyerLists?: any[];
}

export const WorkflowRunTimelineStepper: React.FC<WorkflowRunTimelineStepperProps> = ({
  run,
  stages = [],
  allBuyers = [],
  allBids = [],
  inventoryList = [],
  buyerLists = [],
}) => {
  let reduxBuyerLists: any[] = [];
  try {
    reduxBuyerLists = useAppSelector(selectBuyerLists) || [];
  } catch (e) {
    reduxBuyerLists = [];
  }
  const effectiveBuyerLists = (buyerLists && buyerLists.length > 0) ? buyerLists : reduxBuyerLists;

  const [nowTime, setNowTime] = useState(Date.now());
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const [expandedAudience, setExpandedAudience] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const TIER_BADGE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    tier1: { bg: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))', label: 'Tier 1' },
    primary: { bg: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))', label: 'Primary' },
    tier2: { bg: 'hsl(262 83% 68% / 15%)', color: 'hsl(262 83% 68%)', label: 'Tier 2' },
    secondary: { bg: 'hsl(262 83% 68% / 15%)', color: 'hsl(262 83% 68%)', label: 'Secondary' },
    liquidator: { bg: 'hsl(var(--warning) / 15%)', color: 'hsl(var(--warning))', label: 'Liquidator' },
    custom: { bg: 'hsl(var(--success) / 15%)', color: 'hsl(var(--success))', label: 'Custom' },
  };

  const campaignStages = stages.length > 0
    ? stages
    : (run?.campaignSnapshot?.stages || [
        {
          stageNumber: 1,
          name: 'Primary Tier Bargain',
          stageType: 'liquidation',
          discountType: 'percentage_off_wholesale',
          discountValue: 15,
          waitHours: 24,
          buyerMode: 'segment',
          buyerSegment: 'Tier 1 Wholesale'
        },
        {
          stageNumber: 2,
          name: 'Broad Market Clearance',
          stageType: 'liquidation',
          discountType: 'percentage_off_wholesale',
          discountValue: 35,
          waitHours: 48,
          buyerMode: 'all'
        },
        {
          stageNumber: 3,
          name: 'Final Salvage / Donation Divert',
          stageType: 'donation',
          discountType: 'fixed_price',
          discountValue: 1.0,
          waitHours: 12,
          buyerMode: 'all'
        }
      ]);

  const isAwarded = run?.status === 'awarded';
  const isFallback = run?.status === 'fallback_executed';
  const isEvaluating = run?.status === 'evaluating' || run?.status === 'dispatched';
  const hasStageExecutions = Array.isArray(run?.stageExecutions) && run.stageExecutions.length > 0;

  const executionStatusBadgeMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
    dispatched: { label: 'Dispatched', bg: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))', border: 'hsl(var(--primary) / 40%)' },
    evaluating: { label: 'Evaluating', bg: 'hsl(var(--warning) / 15%)', color: 'hsl(var(--warning))', border: 'hsl(var(--warning) / 40%)' },
    partially_awarded: { label: 'Partially Awarded', bg: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))', border: 'hsl(var(--primary) / 40%)' },
    awarded: { label: 'Awarded', bg: 'hsl(var(--success) / 15%)', color: 'hsl(var(--success))', border: 'hsl(var(--success) / 40%)' },
    expired: { label: 'Expired', bg: 'hsl(var(--text-muted) / 15%)', color: 'hsl(var(--text-muted))', border: 'hsl(var(--text-muted) / 40%)' },
    escalating: { label: 'Escalating', bg: 'hsl(var(--warning) / 20%)', color: 'hsl(var(--warning))', border: 'hsl(var(--warning) / 50%)' },
    pending: { label: 'Pending', bg: 'hsl(var(--bg-card-hover))', color: 'hsl(var(--text-muted))', border: 'hsl(var(--border-color))' },
  };

  const stageList = hasStageExecutions
    ? [...run.stageExecutions]
        .sort((a: any, b: any) => (a.stageIndex ?? 0) - (b.stageIndex ?? 0))
        .map((exec: any, idx: number) => {
          const stageIndex = exec.stageIndex ?? idx;
          const stageDef = campaignStages[stageIndex] || stages[stageIndex] || run?.campaignSnapshot?.stages?.[stageIndex] || {
            stageNumber: stageIndex + 1,
            name: `Stage ${stageIndex + 1}`,
            stageType: 'liquidation',
            waitHours: 24,
          };
          return {
            ...stageDef,
            ...exec,
            stageNumber: stageIndex + 1,
            stageIndex,
            isExecution: true,
            executionStatus: exec.status,
            buyerEmails: exec.buyerEmails || [],
            lotsOffered: exec.lotsOffered || [],
            firedAt: exec.firedAt,
          };
        })
    : campaignStages.map((stage: any, idx: number) => ({
        ...stage,
        stageNumber: stage.stageNumber || idx + 1,
        stageIndex: idx,
        isExecution: false,
      }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'hsl(var(--primary))' }} />
          Stage-Gate Execution Timeline & Escalation Trace
        </h4>
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          {stageList.length} {hasStageExecutions ? 'Executed Stage Steps' : 'Configured Stage Gates'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
        {stageList.map((stage: any, idx: number) => {
          const stageNum = stage.stageNumber || idx + 1;
          const stageType = stage.stageType || (stage.name?.toLowerCase().includes('donat') ? 'donation' : stage.name?.toLowerCase().includes('landfill') ? 'landfill' : 'liquidation');
          
          let stageState: 'completed' | 'active' | 'skipped' | 'pending' = 'pending';
          if (hasStageExecutions) {
            const execStat = stage.executionStatus || stage.status;
            if (execStat === 'awarded' || execStat === 'partially_awarded' || execStat === 'expired') {
              stageState = 'completed';
            } else if (execStat === 'dispatched' || execStat === 'escalating' || (run?.currentStageIndex === stage.stageIndex && (isEvaluating || run?.status === 'escalating'))) {
              stageState = 'active';
            } else if (execStat === 'pending') {
              stageState = 'pending';
            } else {
              stageState = 'pending';
            }
          } else {
            if (isAwarded) {
              stageState = idx === 0 ? 'completed' : 'skipped';
            } else if (isFallback) {
              stageState = idx < campaignStages.length - 1 ? 'completed' : 'active';
            } else if (isEvaluating) {
              stageState = idx === 0 ? 'active' : 'pending';
            }
          }

          const badgeBg = stageType === 'donation' 
            ? 'hsl(var(--primary) / 12%)' 
            : stageType === 'landfill' 
              ? 'hsl(var(--warning) / 15%)' 
              : 'hsl(var(--success) / 12%)';
          const badgeColor = stageType === 'donation' 
            ? 'hsl(var(--primary))' 
            : stageType === 'landfill' 
              ? 'hsl(var(--warning))' 
              : 'hsl(var(--success))';

          const formattedWindow = formatExecutionWindow(stage.waitHours, stage.waitUnit);

          // Calculate remaining window for active stage
          let remainingWindowMs = 0;
          let isWindowExpired = false;
          const isNodeActive = hasStageExecutions
            ? (stageState === 'active' || stage.executionStatus === 'dispatched' || stage.executionStatus === 'escalating' || (run?.currentStageIndex === stage.stageIndex && isEvaluating))
            : (stageState === 'active' && isEvaluating);

          if (isNodeActive) {
            const firedAtMs = stage.firedAt
              ? new Date(stage.firedAt).getTime()
              : (run.evaluationEndsAt ? new Date(run.evaluationEndsAt).getTime() - (stage.waitHours || 24) * 3600000 : new Date(run.dispatchedAt || run.createdAt || Date.now()).getTime());
            const endsAtMs = stage.firedAt
              ? (firedAtMs + (stage.waitHours || 24) * 3600000)
              : (run.evaluationEndsAt ? new Date(run.evaluationEndsAt).getTime() : firedAtMs + (stage.waitHours || 24) * 3600000);
            remainingWindowMs = endsAtMs - nowTime;
            isWindowExpired = remainingWindowMs <= 0;
          }

          return (
            <React.Fragment key={idx}>
              <div
                data-testid={`stage-step-${stageNum}`}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px 20px',
                  backgroundColor: stageState === 'active' && isEvaluating ? 'hsl(var(--warning) / 8%)' : 'hsl(var(--bg-card))',
                  borderRadius: '10px',
                  border: stageState === 'active' && isEvaluating ? '1px solid hsl(var(--warning) / 50%)' : '1px solid hsl(var(--border-color))',
                  position: 'relative',
                  boxShadow: stageState === 'active' && isEvaluating ? '0 0 16px hsl(var(--warning) / 15%)' : undefined
                }}
              >
                {/* Step indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: stageState === 'completed' 
                        ? (stage.executionStatus === 'expired' ? 'hsl(var(--text-muted))' : 'hsl(var(--success))')
                        : stageState === 'active' 
                          ? (isEvaluating ? 'hsl(var(--warning))' : 'hsl(var(--primary))') 
                          : 'hsl(var(--bg-card-hover))',
                      color: stageState === 'completed' || stageState === 'active' ? '#fff' : 'hsl(var(--text-muted))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      border: stageState === 'active' && isEvaluating ? '2px solid hsl(var(--warning))' : '2px solid hsl(var(--border-color))'
                    }}
                  >
                    {stageState === 'completed' && stage.executionStatus !== 'expired' ? <CheckCircle2 size={16} /> : stageNum}
                  </div>
                </div>

                {/* Step body */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'hsl(var(--text-primary))' }}>
                        Stage {stageNum}: {stage.name || `Stage Gate ${stageNum}`}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: badgeBg,
                        color: badgeColor
                      }}>
                        {stageType}
                      </span>
                      {hasStageExecutions && stage.executionStatus && (
                        <span
                          data-testid={`stage-status-badge-${stageNum}`}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: executionStatusBadgeMap[stage.executionStatus]?.bg || 'hsl(var(--bg-card-hover))',
                            color: executionStatusBadgeMap[stage.executionStatus]?.color || 'hsl(var(--text-muted))',
                            border: `1px solid ${executionStatusBadgeMap[stage.executionStatus]?.border || 'hsl(var(--border-color))'}`
                          }}
                        >
                          {executionStatusBadgeMap[stage.executionStatus]?.label || String(stage.executionStatus).replace(/_/g, ' ')}
                        </span>
                      )}
                      {stageState === 'active' && isEvaluating && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: 'hsl(var(--warning) / 20%)',
                          color: 'hsl(var(--warning))',
                          border: '1px solid hsl(var(--warning) / 40%)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--warning))', animation: 'pulse 1.5s infinite' }} />
                          Active Window
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '0.74rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} style={{ color: 'hsl(var(--primary))' }} />
                        <span>Execution Window: <strong style={{ color: 'hsl(var(--text-primary))' }}>{formattedWindow}</strong></span>
                      </div>
                      {(stageState === 'completed' || stageState === 'active' || isNodeActive) && (
                        <button
                          data-testid="expand-audit-btn"
                          aria-label={expandedStages[stageNum] ? 'Collapse audit panel' : 'Expand audit panel'}
                          onClick={() => setExpandedStages(prev => ({ ...prev, [stageNum]: !prev[stageNum] }))}
                          style={{
                            background: 'none',
                            border: '1px solid hsl(var(--border-color))',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'hsl(var(--text-muted))',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                        >
                          <ChevronDown
                            size={15}
                            style={{
                              transition: 'transform 0.25s',
                              transform: expandedStages[stageNum] ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Live timer badge for in-progress stage */}
                  {isNodeActive && (
                    <div
                      data-testid={`stage-countdown-timer-${stageNum}`}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'hsl(var(--warning) / 12%)',
                        border: '1px solid hsl(var(--warning) / 35%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'hsl(var(--warning))' }}>
                        <Timer size={15} />
                        <span>
                          {isWindowExpired
                            ? 'Window Expired – Resolution / Escalation in Progress'
                            : `Stage Window Countdown: ${formatTimeRemaining(remainingWindowMs)} remaining`}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                        Total Window: {formattedWindow}
                      </span>
                    </div>
                  )}

                  {hasStageExecutions ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      {stage.firedAt && (
                        <div>
                          <strong>Fired:</strong> {new Date(stage.firedAt).toLocaleString()}
                        </div>
                      )}
                      <div>
                        <strong>Buyers:</strong> {stage.buyerEmails.length} {stage.buyerEmails.length === 1 ? 'Buyer' : 'Buyers'}
                      </div>
                      <div>
                        <strong>Lots:</strong> {stage.lotsOffered.length} {stage.lotsOffered.length === 1 ? 'Lot' : 'Lots'}
                      </div>
                      <div>
                        <strong>Pricing Rule:</strong> {stage.discountValue != null ? `${stage.discountValue}% (${stage.discountType?.replace(/_/g, ' ') || 'Discount'})` : 'Fixed / Custom'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      <div>
                        <strong>Pricing Rule:</strong> {stage.discountValue != null ? `${stage.discountValue}% (${stage.discountType?.replace(/_/g, ' ') || 'Discount'})` : 'Fixed / Custom'}
                      </div>
                      <div>
                        <strong>Audience Target:</strong> {stage.buyerMode === 'custom' ? `${stage.customBuyers?.length || 0} Custom Partners` : (stage.buyerMode === 'segment' || stage.buyerMode === 'list') ? (stage.buyerSegment || stage.buyerListName || stage.buyerListId || 'Targeted Segment') : 'All Registered Partners'}
                      </div>
                      {stage.allocatedLotIds && stage.allocatedLotIds.length > 0 && (
                        <div>
                          <strong>Allocated Lots:</strong> {stage.allocatedLotIds.length} Lots
                        </div>
                      )}
                    </div>
                  )}

                {/* Expanded Stage Audit Accordion Panel */}
                {expandedStages[stageNum] && (
                  <div
                    data-testid="stage-audit-panel"
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid hsl(var(--border-color))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      animation: 'fadeIn 0.2s ease-in-out',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            color: 'hsl(var(--text-primary))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Stage Audit
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: 'hsl(var(--bg-card-hover))',
                            color: 'hsl(var(--text-muted))',
                            fontWeight: 600,
                          }}
                        >
                          Telemetry & Trace
                        </span>
                      </div>
                      <button
                        data-testid="collapse-stage-audit-btn"
                        aria-label="Collapse stage audit"
                        onClick={() => setExpandedStages(prev => ({ ...prev, [stageNum]: false }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'hsl(var(--text-muted))',
                          fontSize: '0.75rem',
                          padding: '2px 4px',
                        }}
                      >
                        <span>Collapse</span>
                        <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
                      </button>
                    </div>

                    {/* Stage Configuration Summary Section */}
                    <div data-testid="stage-config-summary-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div data-testid="stage-config-summary-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        <span style={{ fontSize: '9px' }}>⬤</span> STAGE CONFIGURATION
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', background: 'hsl(var(--bg-card-hover) / 40%)', padding: '12px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Stage Name</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{stage.name || `Stage ${stageNum}`}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Stage Type</div>
                          <div>
                            <span
                              data-testid="stage-type-badge"
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                backgroundColor: badgeBg,
                                color: badgeColor,
                                display: 'inline-block'
                              }}
                            >
                              {stageType}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Execution Window</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{formattedWindow}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Auto-Execute</div>
                          <div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                backgroundColor: stage.autoExecute ? 'hsl(var(--success) / 15%)' : 'hsl(var(--warning) / 15%)',
                                color: stage.autoExecute ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                                display: 'inline-block'
                              }}
                            >
                              {stage.autoExecute ? 'Auto-Execute On' : 'Manual Approval'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                    {/* Audience Targeting Section */}
                    {(() => {
                      const stageContacts = resolveStageBuyers(stage, allBuyers, effectiveBuyerLists, run);
                      const audienceLabel = stage.buyerMode === 'custom'
                        ? 'Custom List'
                        : (stage.buyerMode === 'segment' || stage.buyerMode === 'list')
                          ? (stage.buyerSegment || stage.buyerListName || 'Targeted Segment')
                          : 'All Registered Partners';

                      return (
                        <div data-testid="stage-audience-targeting-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div data-testid="stage-audience-targeting-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            <span style={{ fontSize: '9px' }}>⬤</span> AUDIENCE TARGETING
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '8px',
                              background: 'hsl(var(--bg-card-hover) / 40%)',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid hsl(var(--border-color))'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Users size={15} style={{ color: 'hsl(var(--primary))' }} />
                              <span
                                data-testid="stage-audience-header-badge"
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: 'hsl(var(--text-primary))',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>{audienceLabel}</span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    padding: '1px 7px',
                                    borderRadius: '10px',
                                    backgroundColor: 'hsl(var(--primary) / 12%)',
                                    color: 'hsl(var(--primary))'
                                  }}
                                >
                                  {stageContacts.length} {stageContacts.length === 1 ? 'Partner' : 'Partners'}
                                </span>
                              </span>
                            </div>

                            {stageContacts.length > 0 && (
                              <button
                                type="button"
                                data-testid="toggle-contacts-btn"
                                onClick={() => setExpandedAudience(prev => ({ ...prev, [stageNum]: !prev[stageNum] }))}
                                style={{
                                  background: 'none',
                                  border: '1px solid hsl(var(--border-color))',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: 'hsl(var(--text-muted))',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>{expandedAudience[stageNum] ? 'Hide Contacts' : `View Contacts (${stageContacts.length})`}</span>
                                <ChevronDown size={13} style={{ transform: expandedAudience[stageNum] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                              </button>
                            )}
                          </div>

                          {/* Expandable Contact Rows */}
                          {expandedAudience[stageNum] && stageContacts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                              {stageContacts.map((contact, cIdx) => {
                                const tierKey = (contact.tier || 'tier1').toLowerCase();
                                const tierConfig = TIER_BADGE_STYLE[tierKey] || { bg: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))', label: contact.tier || 'Partner' };

                                return (
                                  <div
                                    key={contact.id || cIdx}
                                    data-testid="stage-audience-contact-row"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '8px 12px',
                                      backgroundColor: 'hsl(var(--bg-card))',
                                      borderRadius: '6px',
                                      border: '1px solid hsl(var(--border-color))',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          backgroundColor: tierConfig.bg,
                                          color: tierConfig.color,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 800,
                                          fontSize: '0.7rem'
                                        }}
                                      >
                                        {(contact.name || 'P').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                          {contact.name}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                                          {contact.email || 'No email provided'}
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <span
                                        data-testid="contact-tier-badge"
                                        style={{
                                          fontSize: '0.66rem',
                                          fontWeight: 700,
                                          textTransform: 'uppercase',
                                          padding: '2px 8px',
                                          borderRadius: '10px',
                                          backgroundColor: tierConfig.bg,
                                          color: tierConfig.color
                                        }}
                                      >
                                        {contact.tier || tierConfig.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                    {stageType === 'liquidation' && (
                      <>
                        {/* Pricing & Timing Section */}
                        <div data-testid="stage-pricing-timing-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div data-testid="stage-pricing-timing-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            <span style={{ fontSize: '9px' }}>⬤</span> PRICING & TIMING
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', background: 'hsl(var(--bg-card-hover) / 40%)', padding: '12px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Pricing Rule</div>
                              <div data-testid="stage-pricing-rule-value" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                {getPricingRuleLabel(stage.discountType)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Discount / Floor Value</div>
                              <div data-testid="stage-pricing-discount-value" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                {formatDiscountValue(stage)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Response Window</div>
                              <div data-testid="stage-pricing-window-value" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                {formattedWindow}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                        {/* Bids & Offers Ledger Section */}
                        {(() => {
                          const stageBids = resolveStageBids(stage, allBids, run);

                          return (
                            <div data-testid="stage-bids-ledger-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div data-testid="stage-bids-ledger-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                  <span style={{ fontSize: '9px' }}>⬤</span> BIDS & OFFERS LEDGER
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                                  {stageBids.length} {stageBids.length === 1 ? 'Bid Received' : 'Bids Received'}
                                </span>
                              </div>

                              {stageBids.length === 0 ? (
                                <div
                                  data-testid="stage-bids-empty"
                                  style={{
                                    padding: '14px',
                                    borderRadius: '8px',
                                    backgroundColor: 'hsl(var(--bg-card-hover) / 40%)',
                                    border: '1px dashed hsl(var(--border-color))',
                                    fontSize: '0.78rem',
                                    color: 'hsl(var(--text-muted))',
                                    textAlign: 'center',
                                  }}
                                >
                                  No bids received for this stage.
                                </div>
                              ) : (
                                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                    <thead>
                                      <tr style={{ background: 'hsl(var(--bg-card-hover) / 50%)', borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                                        <th style={{ padding: '8px 12px', fontWeight: 700 }}>Buyer Name</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 700 }}>Bid/Case</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 700 }}>Quantity</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 700 }}>Total Offer</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 700 }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {stageBids.map((bid: any, bIdx: number) => {
                                        const winning = isBidWinning(bid, stageState, isEvaluating, run);
                                        const buyerName = bid.buyerName || bid.buyerId?.companyName || bid.buyerId?.name || 'Buyer';
                                        const price = bid.price || 0;
                                        const qty = bid.quantityCases || bid.quantity || 0;
                                        const total = price * qty;

                                        return (
                                          <tr
                                            key={bid._id || bid.id || bIdx}
                                            data-testid="stage-bid-row"
                                            style={{
                                              borderBottom: bIdx < stageBids.length - 1 ? '1px solid hsl(var(--border-color))' : 'none',
                                              backgroundColor: winning ? 'hsl(var(--success) / 12%)' : 'hsl(var(--bg-card))',
                                            }}
                                          >
                                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {winning && (
                                                  <span
                                                    data-testid="winning-bid-marker"
                                                    style={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: '3px',
                                                      fontSize: '0.65rem',
                                                      fontWeight: 800,
                                                      padding: '1px 6px',
                                                      borderRadius: '4px',
                                                      backgroundColor: 'hsl(var(--success))',
                                                      color: '#fff',
                                                    }}
                                                  >
                                                    ★ Winning Bid
                                                  </span>
                                                )}
                                                <span>{buyerName}</span>
                                              </div>
                                            </td>
                                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                                              ${price.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'hsl(var(--text-muted))' }}>
                                              {qty} Cases
                                            </td>
                                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                              <span
                                                style={{
                                                  fontSize: '0.66rem',
                                                  fontWeight: 700,
                                                  textTransform: 'uppercase',
                                                  padding: '2px 7px',
                                                  borderRadius: '10px',
                                                  backgroundColor: winning || bid.status === 'accepted' ? 'hsl(var(--success) / 15%)' : bid.status === 'rejected' ? 'hsl(var(--error) / 15%)' : 'hsl(var(--primary) / 15%)',
                                                  color: winning || bid.status === 'accepted' ? 'hsl(var(--success))' : bid.status === 'rejected' ? 'hsl(var(--error))' : 'hsl(var(--primary))',
                                                }}
                                              >
                                                {bid.status || 'submitted'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                        {/* Allocated Lots Section */}
                        <StageAllocatedLotsSection stage={stage} inventoryList={inventoryList} run={run} />
                      </>
                    )}

                    {stageType === 'donation' && (() => {
                      const isDonationAccepted = stage.status === 'accepted' || stage.outcome === 'accepted' || stage.acceptanceOutcome === 'accepted' || (stageState === 'completed' && run?.status === 'awarded') || run?.resolution?.action === 'donation_accepted';
                      const isDonationEscalated = stage.status === 'escalated' || stage.outcome === 'escalated' || stage.acceptanceOutcome === 'escalated' || (stageState === 'completed' && run?.status === 'fallback_executed') || stage.status === 'expired';
                      const dispatchedAt = stage.dispatchedAt || stage.startedAt || run?.dispatchedAt || run?.createdAt;
                      const acceptedAt = stage.acceptedAt || stage.resolvedAt || (isDonationAccepted ? run?.resolution?.resolvedAt : null);
                      const elapsedTimeStr = formatElapsedTime(dispatchedAt, acceptedAt);

                      return (
                        <>
                          {/* Offer Expiration Window Section */}
                          <div data-testid="stage-offer-window-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div data-testid="stage-offer-window-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                              <span style={{ fontSize: '9px' }}>⬤</span> OFFER EXPIRATION WINDOW
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', background: 'hsl(var(--bg-card-hover) / 40%)', padding: '12px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Configured Duration</div>
                                <div data-testid="stage-offer-duration-value" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                  {formattedWindow}
                                </div>
                              </div>
                              {isDonationAccepted && acceptedAt && (
                                <>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Accepted Duration</div>
                                    <div data-testid="stage-offer-elapsed-time" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--success))' }}>
                                      Accepted in {elapsedTimeStr || 'Immediate'}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Acceptance Timestamp</div>
                                    <div data-testid="stage-offer-accepted-timestamp" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                                      {new Date(acceptedAt).toLocaleString()}
                                    </div>
                                  </div>
                                </>
                              )}
                              {isDonationEscalated && (
                                <div>
                                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Escalation Status</div>
                                  <div data-testid="stage-offer-escalated-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--warning))' }}>
                                    Expired — escalated to next stage
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                          {/* Allocated Lots Section */}
                          <StageAllocatedLotsSection stage={stage} inventoryList={inventoryList} run={run} />

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                          {/* Acceptance Outcome Section */}
                          {(() => {
                            const isDeclined = stage.status === 'declined' || stage.outcome === 'declined' || stage.acceptanceOutcome === 'declined';
                            const isEscalated = stage.status === 'escalated' || stage.outcome === 'escalated' || stage.acceptanceOutcome === 'escalated' || (stageState === 'completed' && run?.status === 'fallback_executed') || stage.status === 'expired';
                            const isAccepted = stage.status === 'accepted' || stage.outcome === 'accepted' || stage.acceptanceOutcome === 'accepted' || (stageState === 'completed' && run?.status === 'awarded') || run?.resolution?.action === 'donation_accepted';

                            let outcomeStatus = 'pending';
                            let badgeLabel = 'Pending';
                            let badgeBg = 'hsl(var(--primary) / 15%)';
                            let badgeColor = 'hsl(var(--primary))';

                            if (isDeclined) {
                              outcomeStatus = 'declined';
                              badgeLabel = 'Declined';
                              badgeBg = 'hsl(var(--error) / 15%)';
                              badgeColor = 'hsl(var(--error))';
                            } else if (isEscalated) {
                              outcomeStatus = 'escalated';
                              badgeLabel = 'Escalated';
                              badgeBg = 'hsl(var(--warning) / 15%)';
                              badgeColor = 'hsl(var(--warning))';
                            } else if (isAccepted) {
                              outcomeStatus = 'accepted';
                              badgeLabel = 'Accepted';
                              badgeBg = 'hsl(var(--success) / 15%)';
                              badgeColor = 'hsl(var(--success))';
                            } else if (stageState === 'active' && isEvaluating) {
                              badgeLabel = 'In Review';
                            }

                            const partnerName = stage.acceptingPartnerName || stage.acceptingPartner?.name || stage.acceptingPartner?.companyName || (typeof stage.acceptingPartner === 'string' ? stage.acceptingPartner : null) || run?.resolution?.targetBuyerId?.companyName || run?.resolution?.targetBuyerId?.name || (typeof run?.resolution?.targetBuyerId === 'string' ? run?.resolution?.targetBuyerId : null) || stage.donatingEntity?.name || stage.donatingEntity;

                            return (
                              <div data-testid="stage-acceptance-outcome-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div data-testid="stage-acceptance-outcome-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                  <span style={{ fontSize: '9px' }}>⬤</span> ACCEPTANCE OUTCOME
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'hsl(var(--bg-card-hover) / 40%)', padding: '12px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                                  <span
                                    data-testid="stage-acceptance-status-badge"
                                    style={{
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      padding: '3px 10px',
                                      borderRadius: '10px',
                                      backgroundColor: badgeBg,
                                      color: badgeColor,
                                      display: 'inline-block',
                                    }}
                                  >
                                    {badgeLabel}
                                  </span>
                                  {outcomeStatus === 'accepted' && partnerName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'hsl(var(--text-primary))' }}>
                                      <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.74rem', fontWeight: 600 }}>Partner:</span>
                                      <strong data-testid="stage-accepting-partner-name">{partnerName}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      );
                    })()}

                    {stageType === 'landfill' && (() => {
                      const isPickupConfirmed = Boolean(stage.pickupConfirmed || stage.pickupStatus === 'confirmed' || stage.status === 'completed' || stage.outcome === 'completed' || (stageState === 'completed' && run?.status === 'awarded') || run?.resolution?.action === 'landfill_executed');
                      
                      const rawDeadline = stage.disposalDeadline || (run?.dispatchedAt ? new Date(new Date(run.dispatchedAt).getTime() + (stage.waitHours || 24) * 3600000).toISOString() : null);
                      const deadlineDate = rawDeadline ? new Date(rawDeadline) : null;
                      const isPastDeadline = deadlineDate ? deadlineDate.getTime() < nowTime : false;

                      let deadlineStatus = 'Scheduled';
                      let statusBg = 'hsl(var(--primary) / 15%)';
                      let statusColor = 'hsl(var(--primary))';

                      if (isPickupConfirmed) {
                        deadlineStatus = 'Completed';
                        statusBg = 'hsl(var(--success) / 15%)';
                        statusColor = 'hsl(var(--success))';
                      } else if (isPastDeadline) {
                        deadlineStatus = 'Overdue';
                        statusBg = 'hsl(var(--warning) / 15%)';
                        statusColor = 'hsl(var(--warning))';
                      }

                      return (
                        <>
                          {/* Disposal & Removal Deadline Section */}
                          <div data-testid="stage-disposal-deadline-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div data-testid="stage-disposal-deadline-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                              <span style={{ fontSize: '9px' }}>⬤</span> DISPOSAL & REMOVAL DEADLINE
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', background: 'hsl(var(--bg-card-hover) / 40%)', padding: '12px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Disposal Deadline</div>
                                <div data-testid="stage-disposal-deadline-value" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                                  {deadlineDate ? deadlineDate.toLocaleDateString() : 'Not Set'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Deadline Status</div>
                                <div>
                                  <span
                                    data-testid="stage-disposal-deadline-status"
                                    style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      backgroundColor: statusBg,
                                      color: statusColor,
                                      display: 'inline-block'
                                    }}
                                  >
                                    {deadlineStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                          {/* Allocated Lots Section */}
                          <StageAllocatedLotsSection stage={stage} inventoryList={inventoryList} run={run} />

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                          {/* Pickup / Execution Status Section */}
                          {(() => {
                            let pickupBadgeLabel = 'Pending';
                            let pickupBadgeBg = 'hsl(var(--primary) / 15%)';
                            let pickupBadgeColor = 'hsl(var(--primary))';

                            if (isPickupConfirmed) {
                              pickupBadgeLabel = 'Pickup Confirmed';
                              pickupBadgeBg = 'hsl(var(--success) / 15%)';
                              pickupBadgeColor = 'hsl(var(--success))';
                            } else if (isPastDeadline) {
                              pickupBadgeLabel = 'Overdue';
                              pickupBadgeBg = 'hsl(var(--warning) / 15%)';
                              pickupBadgeColor = 'hsl(var(--warning))';
                            }

                            const partnerName = stage.disposalPartnerName || stage.disposalPartner?.name || stage.disposalPartner?.companyName || (typeof stage.disposalPartner === 'string' ? stage.disposalPartner : null) || stage.partnerName || run?.resolution?.targetBuyerId?.companyName || run?.resolution?.targetBuyerId?.name || (typeof run?.resolution?.targetBuyerId === 'string' ? run?.resolution?.targetBuyerId : null);

                            return (
                              <div data-testid="stage-pickup-status-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div data-testid="stage-pickup-status-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                  <span style={{ fontSize: '9px' }}>⬤</span> PICKUP / EXECUTION STATUS
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'hsl(var(--bg-card-hover) / 40%)', padding: '12px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                                  <span
                                    data-testid="stage-pickup-status-badge"
                                    style={{
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      padding: '3px 10px',
                                      borderRadius: '10px',
                                      backgroundColor: pickupBadgeBg,
                                      color: pickupBadgeColor,
                                      display: 'inline-block',
                                    }}
                                  >
                                    {pickupBadgeLabel}
                                  </span>
                                  {isPickupConfirmed && partnerName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'hsl(var(--text-primary))' }}>
                                      <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.74rem', fontWeight: 600 }}>Partner:</span>
                                      <strong data-testid="stage-disposal-partner-name">{partnerName}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      );
                    })()}

                    {/* Empty shell placeholder for unrecognized stage types */}
                    {stageType !== 'liquidation' && stageType !== 'donation' && stageType !== 'landfill' && (
                      <div
                        data-testid="stage-audit-shell"
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          backgroundColor: 'hsl(var(--bg-card-hover) / 50%)',
                          border: '1px dashed hsl(var(--border-color))',
                          fontSize: '0.78rem',
                          color: 'hsl(var(--text-muted))',
                          textAlign: 'center',
                        }}
                      >
                        Stage execution telemetry and evaluation details will appear here.
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                    {/* Email Preview Section (All Stage Types) */}
                    {(() => {
                      const rawSubject = stage.emailSubject || stage.emailConfig?.subject || stage.subject || '';
                      const rawBodyHtml = stage.emailBodyHtml || stage.emailConfig?.bodyHtml || stage.bodyHtml || '';
                      const hasEmail = Boolean(rawBodyHtml && rawBodyHtml.trim().length > 0);

                      const resolvedSubject = resolveEmailTokens(rawSubject, stage, run, inventoryList, allBuyers, effectiveBuyerLists);
                      const resolvedBodyHtml = resolveEmailTokens(rawBodyHtml, stage, run, inventoryList, allBuyers, effectiveBuyerLists);

                      return (
                        <div data-testid="stage-email-preview-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div data-testid="stage-email-preview-header" style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            <span style={{ fontSize: '9px' }}>⬤</span> EMAIL PREVIEW
                          </div>

                          {!hasEmail ? (
                            <div
                              data-testid="stage-email-empty"
                              style={{
                                padding: '14px',
                                borderRadius: '8px',
                                backgroundColor: 'hsl(var(--bg-card-hover) / 40%)',
                                border: '1px dashed hsl(var(--border-color))',
                                fontSize: '0.78rem',
                                color: 'hsl(var(--text-muted))',
                                textAlign: 'center',
                              }}
                            >
                              No email configured for this stage
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* Read-Only Subject Field */}
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '3px',
                                  background: 'hsl(var(--bg-card-hover) / 40%)',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid hsl(var(--border-color))',
                                }}
                              >
                                <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>
                                  Subject Line
                                </div>
                                <div
                                  data-testid="stage-email-subject"
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: 'hsl(var(--text-primary))',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {resolvedSubject || '[No Subject Configured]'}
                                </div>
                              </div>

                              {/* Sandboxed Inline Preview Frame */}
                              <div
                                style={{
                                  border: '1px solid hsl(var(--border-color))',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  backgroundColor: '#ffffff',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                }}
                              >
                                <iframe
                                  data-testid="stage-email-preview-frame"
                                  sandbox="allow-same-origin"
                                  title={`Email Preview Stage ${stageNum}`}
                                  srcDoc={resolvedBodyHtml}
                                  style={{
                                    width: '100%',
                                    height: '240px',
                                    border: 'none',
                                    display: 'block',
                                    backgroundColor: '#ffffff',
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            {run?.status === 'escalating' && idx === (run.currentStageIndex ?? 0) && (
              <div
                data-testid="stage-escalating-indicator"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'hsl(var(--warning) / 10%)',
                  border: '1px dashed hsl(var(--warning) / 50%)',
                  color: 'hsl(var(--warning))',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  margin: '4px 0',
                }}
              >
                <Clock size={15} />
                <span>Escalating to Stage {stageNum + 1}...</span>
              </div>
            )}
          </React.Fragment>
        );
      })}
      </div>
    </div>
  );
};

