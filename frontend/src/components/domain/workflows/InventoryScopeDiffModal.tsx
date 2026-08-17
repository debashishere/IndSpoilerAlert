import React, { useState, useMemo } from 'react';
import { X, Layers, CheckCircle2, AlertOctagon, Sparkles, ChevronLeft, ChevronRight, Archive, Check } from 'lucide-react';
import { calculateLotRsl } from '../../../store/slices/workflowSlice';

export type LotDiffCategory = 'eligible' | 'new' | 'liquidated' | 'expired' | 'unavailable';

export interface DiffLotItem {
  id: string;
  lotNumber: string;
  sku: string;
  description: string;
  category: string;
  rslPercent: number;
  availableQty: number;
  status: string;
  diffCategory: LotDiffCategory;
  diffReason: string;
}

export interface InventoryScopeDiffModalProps {
  showModal: boolean;
  onClose: () => void;
  historicalRun: any | null;
  matchedLots: any[];
  allInventoryLots: any[];
}

export const InventoryScopeDiffModal: React.FC<InventoryScopeDiffModalProps> = ({
  showModal,
  onClose,
  historicalRun,
  matchedLots,
  allInventoryLots,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'eligible' | 'unavailable'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const categorizedLots = useMemo<DiffLotItem[]>(() => {
    const historicalIds: string[] = (historicalRun?.snapshotInventoryIds || []).map((id: any) => id?.toString() || id);
    const matchedMap = new Map<string, any>();
    matchedLots.forEach((l: any) => {
      const id = l._id?.toString() || l.id;
      if (id) matchedMap.set(id, l);
    });

    const allMap = new Map<string, any>();
    allInventoryLots.forEach((l: any) => {
      const id = l._id?.toString() || l.id;
      if (id) allMap.set(id, l);
    });

    const seenIds = new Set<string>();
    const items: DiffLotItem[] = [];

    // 1. Process all matched lots (Currently Eligible or Newly Added)
    matchedLots.forEach((lot: any) => {
      const id = lot._id?.toString() || lot.id;
      if (!id) return;
      seenIds.add(id);

      const isHistorical = historicalIds.includes(id);
      const rsl = calculateLotRsl(lot);
      const rslPct = Math.round(rsl * 100);
      const availableCases = lot.availableQty ?? lot.quantityCases ?? lot.quantity ?? 0;
      const sku = (typeof lot.productId === 'object' ? lot.productId?.sku : '') || lot.sku || lot.lotNumber || 'N/A';
      const description = (typeof lot.productId === 'object' ? lot.productId?.description : '') || lot.description || lot.productName || 'Inventory Lot';
      const cat = (typeof lot.productId === 'object' ? lot.productId?.category : '') || lot.category || '';

      if (isHistorical) {
        items.push({
          id,
          lotNumber: lot.lotNumber || id,
          sku,
          description,
          category: cat,
          rslPercent: rslPct,
          availableQty: availableCases,
          status: 'Eligible (Retained)',
          diffCategory: 'eligible',
          diffReason: 'Remains within shelf-life and volume thresholds'
        });
      } else {
        items.push({
          id,
          lotNumber: lot.lotNumber || id,
          sku,
          description,
          category: cat,
          rslPercent: rslPct,
          availableQty: availableCases,
          status: 'Newly Eligible',
          diffCategory: 'new',
          diffReason: 'New inventory entered active liquidation window'
        });
      }
    });

    // 2. Process historical snapshot lots that are no longer eligible
    historicalIds.forEach((histId: string) => {
      if (seenIds.has(histId)) return;
      seenIds.add(histId);

      const lot = allMap.get(histId);
      const lotNumber = lot?.lotNumber || histId;
      const sku = (typeof lot?.productId === 'object' ? lot?.productId?.sku : '') || lot?.sku || lotNumber || 'N/A';
      const description = (typeof lot?.productId === 'object' ? lot?.productId?.description : '') || lot?.description || lot?.productName || 'Historical Snapshot Lot';
      const cat = (typeof lot?.productId === 'object' ? lot?.productId?.category : '') || lot?.category || '';
      const availableCases = lot?.availableQty ?? lot?.quantityCases ?? lot?.quantity ?? 0;
      const rsl = lot ? calculateLotRsl(lot) : 0;
      const rslPct = Math.round(rsl * 100);

      const isLiquidated = availableCases <= 0 || lot?.status === 'sold' || lot?.status === 'liquidated' || lot?.status === 'inactive';
      const isExpired = rsl <= 0 || lot?.status === 'expired' || (lot?.expirationDate && new Date(lot.expirationDate) < new Date());

      if (isLiquidated) {
        items.push({
          id: histId,
          lotNumber,
          sku,
          description,
          category: cat,
          rslPercent: rslPct,
          availableQty: 0,
          status: 'Liquidated / Depleted',
          diffCategory: 'liquidated',
          diffReason: 'Fully awarded or sold during previous execution run'
        });
      } else if (isExpired) {
        items.push({
          id: histId,
          lotNumber,
          sku,
          description,
          category: cat,
          rslPercent: 0,
          availableQty: availableCases,
          status: 'Aged Out / Expired',
          diffCategory: 'expired',
          diffReason: 'Remaining shelf life decayed past minimum threshold'
        });
      } else {
        items.push({
          id: histId,
          lotNumber,
          sku,
          description,
          category: cat,
          rslPercent: rslPct,
          availableQty: availableCases,
          status: 'Unavailable',
          diffCategory: 'unavailable',
          diffReason: 'Filtered out by current campaign parameters'
        });
      }
    });

    return items;
  }, [historicalRun, matchedLots, allInventoryLots]);

  const counts = useMemo(() => {
    let eligibleCount = 0;
    let newCount = 0;
    let liquidatedCount = 0;
    let expiredCount = 0;

    categorizedLots.forEach((item) => {
      if (item.diffCategory === 'eligible') eligibleCount++;
      else if (item.diffCategory === 'new') newCount++;
      else if (item.diffCategory === 'liquidated') liquidatedCount++;
      else if (item.diffCategory === 'expired') expiredCount++;
    });

    const unavailableCount = liquidatedCount + expiredCount + categorizedLots.filter(i => i.diffCategory === 'unavailable').length;

    return {
      eligible: eligibleCount,
      newlyAdded: newCount,
      liquidated: liquidatedCount,
      expired: expiredCount,
      totalEligible: eligibleCount + newCount,
      unavailable: unavailableCount,
      total: categorizedLots.length
    };
  }, [categorizedLots]);

  const filteredLots = useMemo(() => {
    if (activeTab === 'eligible') {
      return categorizedLots.filter(l => l.diffCategory === 'eligible' || l.diffCategory === 'new');
    }
    if (activeTab === 'unavailable') {
      return categorizedLots.filter(l => l.diffCategory === 'liquidated' || l.diffCategory === 'expired' || l.diffCategory === 'unavailable');
    }
    return categorizedLots;
  }, [categorizedLots, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredLots.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLots = filteredLots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!showModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      data-testid="inventory-diff-modal"
    >
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid hsl(var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'hsl(var(--bg-card))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'hsl(var(--primary) / 15%)',
                color: 'hsl(var(--primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'hsl(var(--text-primary))' }}>
                Inventory Re-evaluation Diff Breakdown
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', margin: '2px 0 0 0' }}>
                Audit comparison of historical snapshot lots vs. currently active warehouse inventory.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="diff-close-modal-btn"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary Chips */}
        <div
          style={{
            padding: '14px 22px',
            borderBottom: '1px solid hsl(var(--border-color))',
            background: 'hsl(var(--bg-app, var(--bg-card)))',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <div
            data-testid="diff-chip-eligible"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'hsl(var(--success) / 12%)',
              border: '1px solid hsl(var(--success) / 30%)',
              color: 'hsl(var(--success))',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <CheckCircle2 size={13} />
            {counts.totalEligible} Currently Eligible
          </div>

          <div
            data-testid="diff-chip-liquidated"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'hsl(var(--text-muted) / 12%)',
              border: '1px solid hsl(var(--text-muted) / 30%)',
              color: 'hsl(var(--text-muted))',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <Archive size={13} />
            {counts.liquidated} Liquidated
          </div>

          <div
            data-testid="diff-chip-expired"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'hsl(var(--destructive, var(--error, 0 84% 60%)) / 12%)',
              border: '1px solid hsl(var(--destructive, var(--error, 0 84% 60%)) / 30%)',
              color: 'hsl(var(--destructive, var(--error, 0 84% 60%)))',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <AlertOctagon size={13} />
            {counts.expired} Expired
          </div>

          <div
            data-testid="diff-chip-newly-added"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'hsl(var(--primary) / 12%)',
              border: '1px solid hsl(var(--primary) / 30%)',
              color: 'hsl(var(--primary))',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <Sparkles size={13} />
            {counts.newlyAdded} Newly Added
          </div>
        </div>

        {/* Tab Filters */}
        <div
          style={{
            padding: '10px 22px 0 22px',
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid hsl(var(--border-color))',
            background: 'hsl(var(--bg-card))'
          }}
        >
          <button
            type="button"
            data-testid="diff-tab-all"
            onClick={() => { setActiveTab('all'); setPage(1); }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'all' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              color: activeTab === 'all' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontWeight: activeTab === 'all' ? 700 : 500,
              padding: '8px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            All Lots ({counts.total})
          </button>
          <button
            type="button"
            data-testid="diff-tab-eligible"
            onClick={() => { setActiveTab('eligible'); setPage(1); }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'eligible' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              color: activeTab === 'eligible' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontWeight: activeTab === 'eligible' ? 700 : 500,
              padding: '8px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Eligible Only ({counts.totalEligible})
          </button>
          <button
            type="button"
            data-testid="diff-tab-unavailable"
            onClick={() => { setActiveTab('unavailable'); setPage(1); }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'unavailable' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              color: activeTab === 'unavailable' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontWeight: activeTab === 'unavailable' ? 700 : 500,
              padding: '8px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Previously Processed (Unavailable) ({counts.unavailable})
          </button>
        </div>

        {/* Content Table */}
        <div style={{ padding: '16px 22px', flex: 1, overflowY: 'auto' }}>
          <div style={{ overflowX: 'auto', border: '1px solid hsl(var(--border-color))', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'hsl(var(--bg-app, var(--bg-card)))', borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Lot #</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>SKU / Description</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'center' }}>Current RSL</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Cases</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status / Audit Reason</th>
                </tr>
              </thead>
              <tbody>
                {pagedLots.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                      No inventory lots found in this filter category.
                    </td>
                  </tr>
                ) : (
                  pagedLots.map((item) => (
                    <tr
                      key={item.id}
                      data-testid={`diff-row-${item.id}`}
                      style={{
                        borderBottom: '1px solid hsl(var(--border-color))',
                        transition: 'background-color 0.1s ease'
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        {item.lotNumber}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{item.sku}</div>
                        <div style={{ fontSize: '0.74rem', color: 'hsl(var(--text-muted))' }}>{item.description}</div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: item.rslPercent <= 10 ? 'hsl(var(--warning))' : 'hsl(var(--text-primary))'
                          }}
                        >
                          {item.rslPercent}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>
                        {item.availableQty.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                              backgroundColor:
                                item.diffCategory === 'eligible'
                                  ? 'hsl(var(--success) / 15%)'
                                  : item.diffCategory === 'new'
                                  ? 'hsl(var(--primary) / 15%)'
                                  : item.diffCategory === 'expired'
                                  ? 'hsl(var(--destructive, var(--error, 0 84% 60%)) / 15%)'
                                  : 'hsl(var(--text-muted) / 15%)',
                              color:
                                item.diffCategory === 'eligible'
                                  ? 'hsl(var(--success))'
                                  : item.diffCategory === 'new'
                                  ? 'hsl(var(--primary))'
                                  : item.diffCategory === 'expired'
                                  ? 'hsl(var(--destructive, var(--error, 0 84% 60%)))'
                                  : 'hsl(var(--text-muted))',
                              border:
                                item.diffCategory === 'eligible'
                                  ? '1px solid hsl(var(--success) / 30%)'
                                  : item.diffCategory === 'new'
                                  ? '1px solid hsl(var(--primary) / 30%)'
                                  : item.diffCategory === 'expired'
                                  ? '1px solid hsl(var(--destructive, var(--error, 0 84% 60%)) / 30%)'
                                  : '1px solid hsl(var(--text-muted) / 30%)'
                            }}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                          {item.diffReason}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                fontSize: '0.8rem',
                color: 'hsl(var(--text-muted))'
              }}
            >
              <div>
                Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLots.length)} of {filteredLots.length} lots
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={{
                    background: 'hsl(var(--bg-app, var(--bg-card)))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage <= 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={{
                    background: 'hsl(var(--bg-app, var(--bg-card)))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= totalPages ? 0.5 : 1
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid hsl(var(--border-color))',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'hsl(var(--bg-app, var(--bg-card)))'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'hsl(var(--primary))',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
