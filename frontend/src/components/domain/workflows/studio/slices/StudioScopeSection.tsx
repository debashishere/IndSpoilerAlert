import React from 'react';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Search,
  CheckSquare,
  Square,
  CheckCircle,
  AlertTriangle,
  Layers,
  Table,
} from 'lucide-react';
import type { UseWorkflowStudioReturn } from '../hooks/useWorkflowStudio';
import { calculateLotRsl } from '../../../../../store/slices/workflowSlice';

interface StudioScopeSectionProps {
  studio: UseWorkflowStudioReturn;
}

export const StudioScopeSection: React.FC<StudioScopeSectionProps> = ({ studio }) => {
  const {
    categoryFilter,
    setCategoryFilter,
    maxRslFilter,
    setMaxRslFilter,
    minCasesFilter,
    setMinCasesFilter,
    explicitLotIds,
    setExplicitLotIds,
    setExcludedLotIds,
    selectorMode,
    setSelectorMode,
    showLotGrid,
    setShowLotGrid,
    lotSearch,
    setLotSearch,
    lotDcFilter,
    setLotDcFilter,
    lotCoaFilter,
    setLotCoaFilter,
    activeLots,
    matchedLots,
    displayLots,
    allDisplaySelected,
    selectAll,
    deselectAll,
    toggleLot,
    isFetchingInventory,
    handleLoadInventory,
    hasDrift,
    lastRunLotCount,
    currentMatchedCount,
    setDismissedDriftBanner,
    formattedLastRunDate,
    setShowInventoryDiffModal,
    activeScopeInfoPopover,
    setActiveScopeInfoPopover,
    scopeInfoRef,
    handleSyncStageAllocations,
    stageSyncMessage,
  } = studio;

  const card: React.CSSProperties = {
    background: 'hsl(var(--bg-card))',
    padding: '20px 24px',
    borderRadius: '14px',
    border: '1px solid hsl(var(--border-color))',
    boxShadow: '0 4px 20px -2px rgba(13, 71, 161, 0.06)',
  };

  const h3st: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const inpSt: React.CSSProperties = {
    background: 'hsl(var(--bg-card))',
    border: '1.5px solid hsl(var(--border-color))',
    borderRadius: '8px',
    padding: '9px 12px',
    color: 'hsl(var(--text-primary))',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 2px 4px rgba(13, 71, 161, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease',
  };

  const dropSt: React.CSSProperties = {
    background: 'linear-gradient(180deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-card-hover)) 100%)',
    border: '1.5px solid rgba(33, 150, 243, 0.4)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: 'hsl(var(--text-primary))',
    fontSize: '13px',
    fontWeight: 600,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 12px rgba(13, 71, 161, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Drift Detection & Live Re-evaluation Alert Banner */}
      {hasDrift && (
        <div
          data-testid="inventory-drift-banner"
          style={{
            backgroundColor: 'hsl(var(--warning) / 12%)',
            border: '1px solid hsl(var(--warning) / 45%)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'hsl(var(--warning) / 20%)',
                border: '1px solid hsl(var(--warning) / 40%)',
                color: 'hsl(var(--warning))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--warning))', letterSpacing: '-0.01em' }}>
                  Inventory Scope Updated (Live Re-evaluation)
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', marginTop: '3px', lineHeight: 1.45 }}>
                Inventory has changed since the last execution on {formattedLastRunDate}. Currently, <strong style={{ color: 'hsl(var(--text-primary))' }}>{currentMatchedCount} lot(s)</strong> are eligible based on active filter rules ({Math.abs(lastRunLotCount - currentMatchedCount)} previously processed lots are no longer active, have been liquidated, or aged out).
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              data-testid="sync-stage-allocations-btn"
              onClick={handleSyncStageAllocations}
              style={{
                background: 'hsl(var(--primary) / 20%)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsl(var(--primary) / 40%)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={14} /> Sync Stage Allocations
            </button>
            <button
              type="button"
              data-testid="drift-review-breakdown-btn"
              onClick={() => setShowInventoryDiffModal(true)}
              style={{
                background: 'hsl(var(--warning) / 20%)',
                color: 'hsl(var(--warning))',
                border: '1px solid hsl(var(--warning) / 40%)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Table size={14} /> Review Lot Breakdown
            </button>
            <button
              type="button"
              data-testid="drift-dismiss-banner-btn"
              onClick={() => setDismissedDriftBanner(true)}
              style={{
                background: 'hsl(var(--bg-card))',
                color: 'hsl(var(--text-muted))',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <X size={14} /> Dismiss
            </button>
          </div>
        </div>
      )}

      {stageSyncMessage && (
        <div
          style={{
            backgroundColor: 'hsl(var(--success) / 12%)',
            border: '1px solid hsl(var(--success) / 30%)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: 'hsl(var(--success))',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={14} /> {stageSyncMessage}
        </div>
      )}

      {/* SECTION 2: Inventory Selector */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ ...h3st, margin: 0 }}>
            <Filter size={17} color="hsl(var(--primary))" /> 2. Matching Inventory Lots
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleLoadInventory}
              disabled={isFetchingInventory}
              style={{
                background: 'hsl(var(--primary)/0.15)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsl(var(--primary)/0.3)',
                borderRadius: '6px',
                padding: '4px 11px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isFetchingInventory ? 'not-allowed' : 'pointer',
              }}
            >
              {isFetchingInventory ? 'Loading…' : '🔄 Load Live'}
            </button>
            <button
              type="button"
              onClick={() => setShowLotGrid(p => !p)}
              style={{
                background: 'transparent',
                color: 'hsl(var(--primary))',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500,
              }}
            >
              {showLotGrid ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showLotGrid ? 'Hide Grid' : `View (${matchedLots.length})`}
            </button>
          </div>
        </div>

        {/* Scope Mode Selector */}
        <div
          ref={scopeInfoRef}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            padding: '6px 10px',
            background: 'hsl(var(--bg-app, var(--bg-card)))',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border-color))',
            width: 'fit-content',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
            Scope Mode:
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
            <button
              type="button"
              data-testid="scope-mode-dynamic-btn"
              data-active={selectorMode === 'automatic' ? 'true' : 'false'}
              onClick={() => {
                setSelectorMode('automatic');
                setExplicitLotIds([]);
                setExcludedLotIds([]);
              }}
              style={{
                background: selectorMode === 'automatic' ? 'hsl(var(--primary))' : 'transparent',
                color: selectorMode === 'automatic' ? 'white' : 'hsl(var(--text-primary))',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: selectorMode === 'automatic' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Dynamic Rule (Sweep Mode)
            </button>
            <button
              type="button"
              data-testid="info-dynamic-scope-btn"
              onClick={() => setActiveScopeInfoPopover(p => p === 'dynamic' ? null : 'dynamic')}
              title="Click to view description for Dynamic Rule (Sweep Mode)"
              aria-label="Explain Dynamic Rule (Sweep Mode)"
              style={{
                background: activeScopeInfoPopover === 'dynamic' ? 'hsl(var(--primary) / 20%)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: activeScopeInfoPopover === 'dynamic' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.15s ease',
              }}
            >
              <Info size={13} />
            </button>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
            <button
              type="button"
              data-testid="scope-mode-pinned-btn"
              data-active={selectorMode === 'explicit' ? 'true' : 'false'}
              onClick={() => {
                setSelectorMode('explicit');
                setExplicitLotIds(matchedLots.map((l: any) => l._id?.toString() || l.id).filter(Boolean));
              }}
              style={{
                background: selectorMode === 'explicit' ? 'hsl(var(--primary))' : 'transparent',
                color: selectorMode === 'explicit' ? 'white' : 'hsl(var(--text-primary))',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: selectorMode === 'explicit' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Pinned Lot Scope (Snapshot Mode)
            </button>
            <button
              type="button"
              data-testid="info-pinned-scope-btn"
              onClick={() => setActiveScopeInfoPopover(p => p === 'pinned' ? null : 'pinned')}
              title="Click to view description for Pinned Lot Scope (Snapshot Mode)"
              aria-label="Explain Pinned Lot Scope (Snapshot Mode)"
              style={{
                background: activeScopeInfoPopover === 'pinned' ? 'hsl(var(--primary) / 20%)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: activeScopeInfoPopover === 'pinned' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.15s ease',
              }}
            >
              <Info size={13} />
            </button>
          </div>

          {/* Floating Scope Mode Description Popover Window */}
          {activeScopeInfoPopover && (
            <div
              data-testid="scope-mode-info-popover"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                zIndex: 60,
                width: '380px',
                maxWidth: '90vw',
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '10px',
                padding: '14px 16px',
                boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'hsl(var(--primary) / 15%)',
                      color: 'hsl(var(--primary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Info size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                      {activeScopeInfoPopover === 'dynamic'
                        ? 'Dynamic Rule (Sweep Mode)'
                        : 'Pinned Lot Scope (Snapshot Mode)'}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: activeScopeInfoPopover === 'dynamic' ? 'hsl(var(--primary) / 15%)' : 'hsl(var(--warning) / 15%)',
                        color: activeScopeInfoPopover === 'dynamic' ? 'hsl(var(--primary))' : 'hsl(var(--warning))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginTop: '2px',
                      }}
                    >
                      {activeScopeInfoPopover === 'dynamic' ? 'Live Dynamic Evaluation' : 'Locked Lot Snapshot'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="close-scope-info-popover-btn"
                  onClick={() => setActiveScopeInfoPopover(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'hsl(var(--text-muted))',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary, var(--text-primary)))', lineHeight: 1.5, marginTop: '8px' }}>
                {activeScopeInfoPopover === 'dynamic' ? (
                  <>
                    <p style={{ margin: '0 0 6px 0' }}>
                      <strong>How it works:</strong> Evaluates filter criteria (RSL %, Category, Storage, Min Cases) dynamically against active warehouse stock at execution time.
                    </p>
                    <p style={{ margin: 0, color: 'hsl(var(--text-muted))' }}>
                      <strong>Execution Behavior:</strong> Qualifying lots are continuously swept into the workflow as they degrade or new inventory arrives. In Edit view, lots are re-evaluated against today’s date.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '0 0 6px 0' }}>
                      <strong>How it works:</strong> Freezes and pins a specific list of inventory lots at save time.
                    </p>
                    <p style={{ margin: 0, color: 'hsl(var(--text-muted))' }}>
                      <strong>Execution Behavior:</strong> Future workflow executions target strictly these pinned lots, ignoring newly arriving inventory or shelf-life drift.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ width: '160px' }}>
            <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...dropSt, padding: '6px 10px', fontSize: '12px' }}>
              <option value="">All Categories</option>
              <option value="Dairy">Dairy</option>
              <option value="Produce">Produce</option>
              <option value="Meat & Poultry">Meat & Poultry</option>
              <option value="Dry Goods">Dry Goods</option>
              <option value="Frozen Foods">Frozen Foods</option>
            </select>
          </div>
          <div style={{ width: '170px' }}>
            <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
              Max RSL: <strong style={{ color: 'hsl(var(--warning))' }}>{maxRslFilter >= 1 ? '100% (All RSL)' : `${Math.round(maxRslFilter * 100)}%`}</strong>
            </label>
            <input
              type="range"
              min="0.05"
              max="1.00"
              step="0.05"
              value={maxRslFilter}
              onChange={e => setMaxRslFilter(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'hsl(var(--primary))' }}
            />
          </div>
          <div style={{ width: '100px' }}>
            <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Min Cases</label>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={minCasesFilter === 0 ? '' : minCasesFilter}
              onChange={e => setMinCasesFilter(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              style={{ ...inpSt, padding: '6px 10px', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>

        {showLotGrid && (
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Search row */}
            <div style={{ padding: '9px 13px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center', background: 'hsl(var(--bg-card))' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                <input
                  type="text"
                  placeholder="Search lots…"
                  value={lotSearch}
                  onChange={e => setLotSearch(e.target.value)}
                  style={{ ...inpSt, paddingLeft: '26px', padding: '6px 6px 6px 26px', fontSize: '12px', borderRadius: '6px' }}
                />
              </div>
              <select value={lotDcFilter} onChange={e => setLotDcFilter(e.target.value)} style={{ ...dropSt, width: 'auto', padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}>
                <option value="">All DCs</option>
                {[...new Set(activeLots.map((l: any) => typeof l.distributionCenterId === 'object' ? (l.distributionCenterId?.name || '') : (l.distributionCenterId || '')).filter(Boolean))].map(dc => (
                  <option key={dc} value={dc}>{dc}</option>
                ))}
              </select>
              <select value={lotCoaFilter} onChange={e => setLotCoaFilter(e.target.value)} style={{ ...dropSt, width: 'auto', padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}>
                <option value="all">All Compliance</option>
                <option value="verified">COA Verified</option>
                <option value="pending">COA Pending</option>
              </select>
            </div>

            {/* Header row */}
            <div style={{ background: 'hsl(var(--bg-card))', padding: '7px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={allDisplaySelected ? deselectAll : selectAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: allDisplaySelected ? 'hsl(var(--primary)/0.15)' : 'transparent',
                    border: `1px solid ${allDisplaySelected ? 'hsl(var(--primary)/0.4)' : 'hsl(var(--border-color))'}`,
                    color: allDisplaySelected ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {allDisplaySelected ? <CheckSquare size={11} /> : <Square size={11} />}
                  {allDisplaySelected ? 'Deselect All' : 'Select All'}
                </button>
                <span>Lots ({displayLots.length})</span>
              </div>
              <span style={{ color: 'hsl(var(--primary))' }}>{matchedLots.length} in workflow</span>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {activeLots.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>
                  No lots loaded — click Load Live above.
                </div>
              ) : displayLots.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>
                  No lots match your filters.
                </div>
              ) : displayLots.map((lot: any) => {
                const lotId = lot._id?.toString() || lot.id;
                const isIn = matchedLots.some((m: any) => (m._id?.toString() || m.id) === lotId);
                const isExpl = explicitLotIds.includes(lotId);
                const isExcl = (studio.excludedLotIds || []).includes(lotId);
                const desc = lot.productId?.description || 'Surplus Item';
                const sku = lot.productId?.sku || lot.lotNumber || 'SKU';
                const cases = lot.availableQty ?? lot.quantityCases ?? 0;
                const rsl = Math.round(calculateLotRsl(lot) * 100);
                const hasCoa = lot.complianceStatus === 'verified' || lot.coaS3Uri;
                const dc = typeof lot.distributionCenterId === 'object'
                  ? (lot.distributionCenterId?.name || lot.distributionCenterId?.code || 'Main DC')
                  : (lot.distributionCenterId || 'Main DC');

                return (
                  <div
                    key={lotId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 15px',
                      borderBottom: '1px solid hsl(223 27% 14%)',
                      background: isIn ? 'transparent' : 'hsl(346 84% 50%/0.04)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <input
                        type="checkbox"
                        checked={isIn}
                        onChange={() => toggleLot(lotId, isIn)}
                        style={{ width: '14px', height: '14px', accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span>{desc}</span>
                          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>({sku})</span>
                          {isExpl && (
                            <span style={{ background: 'hsl(var(--success)/0.15)', color: 'hsl(var(--success))', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              EXPLICIT
                            </span>
                          )}
                          {isExcl && (
                            <span style={{ background: 'hsl(var(--error)/0.15)', color: 'hsl(var(--error))', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              EXCLUDED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'flex', gap: '10px', marginTop: '1px' }}>
                          <span>DC: {dc}</span>
                          <span>Exp: {lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: rsl <= 15 ? 'hsl(var(--error))' : 'hsl(var(--warning))' }}>
                        {rsl}% RSL
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>{cases} cases</span>
                      {hasCoa ? (
                        <span style={{ color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                          <CheckCircle size={11} /> COA
                        </span>
                      ) : (
                        <span style={{ color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                          <AlertTriangle size={11} /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
