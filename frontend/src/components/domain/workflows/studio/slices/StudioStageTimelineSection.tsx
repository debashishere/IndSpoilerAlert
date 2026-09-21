import React from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Sliders,
  Users,
  Mail,
  Trash2,
  Table,
  HeartHandshake,
  CheckCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import type { UseWorkflowStudioReturn } from '../hooks/useWorkflowStudio';
import type { Stage } from '../types/studio.types';
import { StageAudiencePicker } from '../subcomponents/StageAudiencePicker';
import { StageEmailModal } from '../../StageEmailModal';
import {
  formatWaitTime,
  getStageBuyerCount,
  getStageValidationErrors,
} from '../utils/studioCalculations';
import { calculateLotRsl } from '../../../../../store/slices/workflowSlice';

interface StudioStageTimelineSectionProps {
  studio: UseWorkflowStudioReturn;
  buyers: any[];
}

export const StudioStageTimelineSection: React.FC<StudioStageTimelineSectionProps> = ({
  studio,
  buyers,
}) => {
  const {
    stages,
    setStages,
    updateStage,
    handleStageTypeChange,
    expandedStageIdx,
    setExpandedStageIdx,
    matchedLots,
    reduxBuyerLists,
    openStageEmailModalIdx,
    setOpenStageEmailModalIdx,
    setInspectingSegment,
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
    <div style={card}>
      <h3 style={h3st}>
        <Clock size={17} color="hsl(var(--primary))" /> 3. Stage-Gate Escalation Timeline
      </h3>
      <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: '-8px 0 16px', lineHeight: 1.5 }}>
        Each stage escalates to a different audience at a different price. Click any stage to configure its audience and pricing.
      </p>

      {/* Visual timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {stages.map((stage, idx) => {
          const stageNumber = stage.stageNumber || idx + 1;
          const isExpanded = expandedStageIdx === idx;
          const isListMode = stage.buyerMode === 'list' || stage.buyerMode === 'segment';
          const listLabel = stage.buyerListName || stage.buyerListId || stage.buyerSegment || 'Target List';
          const audienceSummary = isListMode
            ? listLabel
            : `${stage.customBuyers.length} custom buyer${stage.customBuyers.length !== 1 ? 's' : ''}`;
          const pricingSummary =
            stage.discountType === 'yield'
              ? 'AI Yield'
              : stage.discountType === 'fixed'
                ? `${stage.discountValue}% Off`
                : `$${stage.discountValue} Floor`;
          const stageBuyerCount = getStageBuyerCount(stage, reduxBuyerLists, buyers);
          const stageValidationErrors = getStageValidationErrors(stage, idx, reduxBuyerLists, buyers);
          const isZeroBuyer = (!stage.stageType || stage.stageType === 'liquidation') && stageBuyerCount === 0;

          return (
            <div
              key={idx}
              style={{ display: 'flex', flexDirection: 'column', marginBottom: idx < stages.length - 1 ? '8px' : '0' }}
            >
              <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                {/* Left spine: number + connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px', flexShrink: 0 }}>
                  <div
                    data-testid={`stage-${stageNumber}-circle`}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: isExpanded
                        ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))'
                        : 'hsl(var(--bg-card))',
                      border: `2px solid ${isExpanded ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isExpanded ? 'white' : 'hsl(var(--text-muted))',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      zIndex: 1,
                    }}
                    onClick={() => setExpandedStageIdx(isExpanded ? null : idx)}
                  >
                    {stageNumber}
                  </div>
                  {idx < stages.length - 1 && (
                    <div style={{ width: '2px', flex: 1, minHeight: '20px', background: 'hsl(var(--border-color))', margin: '4px 0' }} />
                  )}
                </div>

                {/* Right: card */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Collapsed summary row — always visible */}
                  <div
                    data-testid={`stage-${stageNumber}-header-row`}
                    onClick={() => setExpandedStageIdx(isExpanded ? null : idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isExpanded ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--bg-card))',
                      border: `1px solid ${isExpanded ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--border-color))'}`,
                      borderRadius: isExpanded ? '10px 10px 0 0' : '10px',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                    onMouseEnter={e => {
                      if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))';
                    }}
                    onMouseLeave={e => {
                      if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))';
                    }}
                  >
                    {/* Left: name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '140px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isExpanded ? 'hsl(var(--primary))' : 'hsl(var(--border-color))',
                        }}
                      >
                        {stage.name}
                      </span>
                    </div>

                    {/* Centre: summary chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Stage Type Switcher Segmented Pills */}
                      <div
                        data-testid={`stage-${stageNumber}-type-switcher`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'hsl(var(--bg-card))',
                          border: '1px solid hsl(var(--border-color))',
                          borderRadius: '20px',
                          padding: '2px',
                          gap: '2px',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          data-testid={`stage-${stageNumber}-type-liquidation`}
                          onClick={() => handleStageTypeChange(idx, 'liquidation')}
                          style={{
                            background: (!stage.stageType || stage.stageType === 'liquidation') ? 'hsl(var(--primary))' : 'transparent',
                            color: (!stage.stageType || stage.stageType === 'liquidation') ? 'white' : 'hsl(var(--text-muted))',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          🏷️ Liquidation
                        </button>
                        <button
                          type="button"
                          data-testid={`stage-${stageNumber}-type-donation`}
                          onClick={() => handleStageTypeChange(idx, 'donation')}
                          style={{
                            background: stage.stageType === 'donation' ? 'hsl(var(--primary))' : 'transparent',
                            color: stage.stageType === 'donation' ? 'white' : 'hsl(var(--text-muted))',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          🎁 Donate
                        </button>
                        <button
                          type="button"
                          data-testid={`stage-${stageNumber}-type-landfill`}
                          onClick={() => handleStageTypeChange(idx, 'landfill')}
                          style={{
                            background: stage.stageType === 'landfill' ? 'hsl(var(--primary))' : 'transparent',
                            color: stage.stageType === 'landfill' ? 'white' : 'hsl(var(--text-muted))',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          🗑️ Landfill
                        </button>
                      </div>

                      {/* Lot Allocation chip */}
                      <span
                        data-testid={`stage-${stageNumber}-lot-allocation-chip`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'hsl(var(--primary)/0.08)',
                          border: '1px solid hsl(var(--border-color))',
                          color: 'hsl(var(--text-primary))',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Table size={11} />{' '}
                        {stage.allocatedLotIds && stage.allocatedLotIds.length !== matchedLots.length
                          ? `${stage.allocatedLotIds.length} of ${matchedLots.length} Lots Allocated`
                          : `All Lots (${matchedLots.length})`}
                      </span>

                      {/* Audience chip */}
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'hsl(var(--primary)/0.12)',
                          border: '1px solid hsl(var(--primary)/0.25)',
                          color: 'hsl(var(--primary))',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Users size={11} /> {audienceSummary}
                      </span>

                      {/* Pricing / Mode chip */}
                      {stage.stageType === 'donation' ? (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'hsl(var(--primary)/0.12)',
                            border: '1px solid hsl(var(--primary)/0.25)',
                            color: 'hsl(var(--primary))',
                            borderRadius: '20px',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <HeartHandshake size={11} /> Donation Transfer (Complimentary)
                        </span>
                      ) : stage.stageType === 'landfill' ? (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'hsl(var(--error)/0.12)',
                            border: '1px solid hsl(var(--error)/0.25)',
                            color: 'hsl(var(--error))',
                            borderRadius: '20px',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Trash2 size={11} /> Disposal Deadline: {stage.disposalDeadline || 'Not set'}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'hsl(var(--secondary)/0.12)',
                            border: '1px solid hsl(var(--secondary)/0.25)',
                            color: 'hsl(var(--secondary))',
                            borderRadius: '20px',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Sliders size={11} /> {pricingSummary}
                        </span>
                      )}

                      {/* Wait chip - shown for liquidation and donation */}
                      {stage.stageType !== 'landfill' && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'hsl(var(--text-muted)/0.08)',
                            border: '1px solid hsl(var(--border-color))',
                            color: 'hsl(var(--text-muted))',
                            borderRadius: '20px',
                            padding: '3px 10px',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Clock size={11} /> {formatWaitTime(stage.waitHours)} window
                        </span>
                      )}
                    </div>

                    {/* Right: controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {stages.length > 1 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setStages(p => p.filter((_, i) => i !== idx));
                            setExpandedStageIdx(null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(var(--error))',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            opacity: 0.6,
                            borderRadius: '4px',
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <div style={{ color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded panel — full width, vertical stacking */}
                  {isExpanded && (
                    <div
                      style={{
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--primary)/0.3)',
                        borderTop: 'none',
                        borderRadius: '0 0 10px 10px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                      }}
                    >
                      {/* Stage name (editable here) */}
                      <div>
                        <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                          Stage Name
                        </label>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={e => updateStage(idx, { name: e.target.value })}
                          style={{ ...inpSt, fontSize: '13px', fontWeight: 600, maxWidth: '380px' }}
                        />
                      </div>

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                      {/* Inventory Allocation Section */}
                      <div data-testid={`stage-${stageNumber}-inventory-allocation-section`}>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'hsl(var(--primary))',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                          }}
                        >
                          <Table size={13} /> Inventory Allocation
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <button
                            type="button"
                            data-testid={`stage-${stageNumber}-allocation-all-btn`}
                            onClick={() => updateStage(idx, { allocatedLotIds: undefined })}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: `1px solid ${!stage.allocatedLotIds ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`,
                              background: !stage.allocatedLotIds ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--bg-card))',
                              color: !stage.allocatedLotIds ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                            }}
                          >
                            All Matching Lots ({matchedLots.length})
                          </button>
                          <button
                            type="button"
                            data-testid={`stage-${stageNumber}-allocation-custom-btn`}
                            onClick={() => {
                              if (!stage.allocatedLotIds) {
                                updateStage(idx, { allocatedLotIds: matchedLots.map((l: any) => l._id?.toString() || l.id || '') });
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: `1px solid ${stage.allocatedLotIds ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`,
                              background: stage.allocatedLotIds ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--bg-card))',
                              color: stage.allocatedLotIds ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                            }}
                          >
                            Custom Lot Subset
                          </button>
                        </div>

                        {stage.allocatedLotIds && (
                          <div
                            style={{
                              maxHeight: '180px',
                              overflowY: 'auto',
                              border: '1px solid hsl(var(--border-color))',
                              borderRadius: '8px',
                              padding: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              background: 'hsl(var(--bg-card))',
                            }}
                          >
                            {matchedLots.length === 0 ? (
                              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', padding: '8px', textAlign: 'center' }}>
                                No matching inventory lots found in Section 2 filters.
                              </div>
                            ) : (
                              matchedLots.map((lot: any) => {
                                const lotId = lot._id?.toString() || lot.id || '';
                                const isSelected = (stage.allocatedLotIds || []).includes(lotId);
                                const cases = lot.availableQty ?? lot.quantityCases ?? 0;
                                const title = lot.productId?.description || lot.lotNumber || lot.title || 'Untitled Lot';
                                const sku = lot.productId?.sku || '';
                                const rsl = calculateLotRsl ? calculateLotRsl(lot) : lot.remainingShelfLife ? Math.round(lot.remainingShelfLife * 100) : 0;

                                return (
                                  <label
                                    key={lotId}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      background: isSelected ? 'hsl(var(--primary)/0.06)' : 'transparent',
                                      border: `1px solid ${isSelected ? 'hsl(var(--primary)/0.2)' : 'transparent'}`,
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        type="checkbox"
                                        data-testid={`stage-${stageNumber}-lot-checkbox-${lotId}`}
                                        checked={isSelected}
                                        onChange={() => {
                                          const current = stage.allocatedLotIds || [];
                                          const next = isSelected ? current.filter(id => id !== lotId) : [...current, lotId];
                                          updateStage(idx, { allocatedLotIds: next });
                                        }}
                                      />
                                      <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{title}</span>
                                      {sku && <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>({sku})</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                                      <span>{cases} cs</span>
                                      <span>{rsl}% RSL</span>
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                      {/* Audience — full width */}
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'hsl(var(--primary))',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                          }}
                        >
                          <Users size={13} /> Audience Targeting
                        </div>
                        <div style={{ maxWidth: '540px' }}>
                          <StageAudiencePicker
                            stage={stage}
                            allBuyers={buyers}
                            onChange={updates => updateStage(idx, updates)}
                            onInspectSegment={seg => setInspectingSegment(seg)}
                          />
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                      {/* Polymorphic Pricing & Timing section */}
                      {stage.stageType === 'donation' ? (
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'hsl(var(--primary))',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.07em',
                            }}
                          >
                            <Clock size={13} /> Offer Expiration Window
                          </div>
                          <div style={{ maxWidth: '320px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Acceptance Window</label>
                              <span style={{ fontSize: '10px', color: 'hsl(var(--primary))', fontWeight: 600 }}>{formatWaitTime(stage.waitHours)}</span>
                            </div>
                            {(() => {
                              const currentUnit: 'd' | 'h' | 'm' =
                                stage.waitUnit ||
                                (stage.waitHours >= 24 && stage.waitHours % 24 === 0
                                  ? 'd'
                                  : stage.waitHours < 1 && stage.waitHours > 0
                                    ? 'm'
                                    : 'h');
                              const rawVal =
                                currentUnit === 'd'
                                  ? Number((stage.waitHours / 24).toFixed(4))
                                  : currentUnit === 'm'
                                    ? Math.round(stage.waitHours * 60)
                                    : Number(stage.waitHours.toFixed(4));
                              return (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input
                                    type="number"
                                    min={0.01}
                                    step="any"
                                    value={isNaN(rawVal) || rawVal === 0 ? '' : rawVal}
                                    onChange={e => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                      updateStage(idx, {
                                        waitHours: currentUnit === 'd' ? val * 24 : currentUnit === 'm' ? val / 60 : val,
                                        waitUnit: currentUnit,
                                      });
                                    }}
                                    style={{ ...inpSt, flex: 1 }}
                                  />
                                  <select
                                    value={currentUnit}
                                    onChange={e => {
                                      const newUnit = e.target.value as 'd' | 'h' | 'm';
                                      const currentNumeric = isNaN(rawVal) || rawVal === 0 ? (newUnit === 'm' ? 30 : newUnit === 'd' ? 1 : 24) : rawVal;
                                      const calculatedHours = newUnit === 'd' ? currentNumeric * 24 : newUnit === 'm' ? currentNumeric / 60 : currentNumeric;
                                      updateStage(idx, {
                                        waitUnit: newUnit,
                                        waitHours: calculatedHours,
                                      });
                                    }}
                                    style={{ ...dropSt, width: 'auto', padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                                  >
                                    <option value="d">Days</option>
                                    <option value="h">Hours</option>
                                    <option value="m">Mins</option>
                                  </select>
                                </div>
                              );
                            })()}
                          </div>
                          <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '8px' }}>
                            🎁 Donation partners receive a complimentary surplus inventory transfer offer with {formatWaitTime(stage.waitHours)} to accept before cascading to the next stage.
                          </p>
                        </div>
                      ) : stage.stageType === 'landfill' ? (
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'hsl(var(--error))',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.07em',
                            }}
                          >
                            <Trash2 size={13} /> Disposal & Removal Deadline
                          </div>
                          <div style={{ maxWidth: '320px' }}>
                            <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '5px' }}>
                              Disposal Removal Cutoff Date
                            </label>
                            <input
                              type="date"
                              data-testid={`stage-${stageNumber}-disposal-deadline-input`}
                              value={stage.disposalDeadline || ''}
                              onChange={e => updateStage(idx, { disposalDeadline: e.target.value })}
                              style={inpSt}
                            />
                          </div>
                          <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '8px' }}>
                            🗑️ Waste and bio-disposal partners will be notified of scheduled pickup and physical destruction instructions by the specified deadline.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'hsl(var(--secondary))',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.07em',
                            }}
                          >
                            <Sliders size={13} /> Pricing & Timing
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                            <div>
                              <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '5px' }}>Pricing Rule</label>
                              <select
                                value={stage.discountType}
                                onChange={e => updateStage(idx, { discountType: e.target.value as Stage['discountType'] })}
                                style={dropSt}
                              >
                                <option value="yield">AI Yield Optimizer</option>
                                <option value="fixed">Fixed Markdown (% Off)</option>
                                <option value="floor">Minimum Bid Floor ($)</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '5px' }}>
                                {stage.discountType === 'fixed' ? 'Discount %' : stage.discountType === 'floor' ? 'Floor Price ($)' : 'Value (auto)'}
                              </label>
                              <input
                                type="number"
                                step="any"
                                disabled={stage.discountType === 'yield'}
                                value={stage.discountType === 'yield' ? '' : stage.discountValue === 0 ? '' : stage.discountValue}
                                onChange={e => updateStage(idx, { discountValue: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                                placeholder={stage.discountType === 'yield' ? 'AI-managed' : '0'}
                                style={{ ...inpSt, opacity: stage.discountType === 'yield' ? 0.45 : 1 }}
                              />
                            </div>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Response Window</label>
                                <span style={{ fontSize: '10px', color: 'hsl(var(--primary))', fontWeight: 600 }}>{formatWaitTime(stage.waitHours)}</span>
                              </div>
                              {(() => {
                                const currentUnit: 'd' | 'h' | 'm' =
                                  stage.waitUnit ||
                                  (stage.waitHours >= 24 && stage.waitHours % 24 === 0
                                    ? 'd'
                                    : stage.waitHours < 1 && stage.waitHours > 0
                                      ? 'm'
                                      : 'h');
                                const rawVal =
                                  currentUnit === 'd'
                                    ? Number((stage.waitHours / 24).toFixed(4))
                                    : currentUnit === 'm'
                                      ? Math.round(stage.waitHours * 60)
                                      : Number(stage.waitHours.toFixed(4));
                                return (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input
                                      type="number"
                                      min={0.01}
                                      step="any"
                                      value={isNaN(rawVal) || rawVal === 0 ? '' : rawVal}
                                      onChange={e => {
                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                        updateStage(idx, {
                                          waitHours: currentUnit === 'd' ? val * 24 : currentUnit === 'm' ? val / 60 : val,
                                          waitUnit: currentUnit,
                                        });
                                      }}
                                      style={{ ...inpSt, flex: 1 }}
                                    />
                                    <select
                                      value={currentUnit}
                                      onChange={e => {
                                        const newUnit = e.target.value as 'd' | 'h' | 'm';
                                        const currentNumeric = isNaN(rawVal) || rawVal === 0 ? (newUnit === 'm' ? 30 : newUnit === 'd' ? 1 : 24) : rawVal;
                                        const calculatedHours = newUnit === 'd' ? currentNumeric * 24 : newUnit === 'm' ? currentNumeric / 60 : currentNumeric;
                                        updateStage(idx, {
                                          waitUnit: newUnit,
                                          waitHours: calculatedHours,
                                        });
                                      }}
                                      style={{ ...dropSt, width: 'auto', padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                                    >
                                      <option value="d">Days</option>
                                      <option value="h">Hours</option>
                                      <option value="m">Mins</option>
                                    </select>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '8px' }}>
                            {stage.discountType === 'yield'
                              ? '✦ AI will calculate the optimal yield price dynamically at send time.'
                              : `Buyers receive a ${stage.discountType === 'fixed' ? `${stage.discountValue}% markdown` : `$${stage.discountValue} floor bid`} offer and have ${formatWaitTime(stage.waitHours)} to respond before the next stage triggers.`}
                          </p>
                        </div>
                      )}

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                      {/* Stage Email — Configure button + badge + modal */}
                      <div data-testid={`stage-${stageNumber}-email-editor-section`}>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'hsl(var(--primary))',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                          }}
                        >
                          <Mail size={13} /> Stage Email
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            data-testid={`configure-stage-email-btn-${stageNumber}`}
                            onClick={() => setOpenStageEmailModalIdx(idx)}
                            style={{
                              background: 'hsl(var(--primary)/0.12)',
                              border: '1px solid hsl(var(--primary)/0.4)',
                              color: 'hsl(var(--primary))',
                              borderRadius: '8px',
                              padding: '7px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Mail size={13} /> Configure Stage Email
                          </button>

                          {(stage.emailSubject || stage.emailBodyHtml) && (
                            <span
                              data-testid={`email-configured-badge-${stageNumber}`}
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'hsl(var(--success))',
                                background: 'hsl(var(--success)/0.12)',
                                border: '1px solid hsl(var(--success)/0.3)',
                                borderRadius: '12px',
                                padding: '4px 10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle size={12} /> Email Configured ✓
                            </span>
                          )}

                          {(stage.emailSubject || stage.emailBodyHtml) && (
                            <button
                              type="button"
                              onClick={() => updateStage(idx, { emailBodyHtml: undefined, emailSubject: undefined, emailTemplateId: undefined })}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'hsl(var(--text-muted))',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Per-stage email modal */}
                        <StageEmailModal
                          open={openStageEmailModalIdx === idx}
                          stageIndex={stageNumber}
                          stageType={stage.stageType}
                          disposalDeadline={stage.disposalDeadline}
                          allocatedLotIds={stage.allocatedLotIds}
                          initialData={{
                            emailSubject: stage.emailSubject || '',
                            emailBodyHtml: stage.emailBodyHtml || '',
                            emailTemplateId:
                              stage.emailTemplateId ||
                              (stage.stageType === 'donation'
                                ? 'direct-donation-notice'
                                : stage.stageType === 'landfill'
                                  ? 'disposal-removal-notice'
                                  : 'default'),
                          }}
                          onSave={data => {
                            updateStage(idx, {
                              emailSubject: data.emailSubject,
                              emailBodyHtml: data.emailBodyHtml,
                              emailTemplateId: data.emailTemplateId,
                            });
                            setOpenStageEmailModalIdx(null);
                          }}
                          onClose={() => setOpenStageEmailModalIdx(null)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {stageValidationErrors.length > 0 && (
                <div
                  data-testid={`stage-${stageNumber}-validation-error`}
                  style={{
                    marginTop: '6px',
                    marginLeft: '52px',
                    padding: '10px 14px',
                    background: 'hsl(var(--error) / 0.15)',
                    border: '1px solid hsl(var(--error) / 0.4)',
                    borderRadius: '8px',
                    color: 'hsl(var(--error))',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {stageValidationErrors.map((errMsg, errIdx) => (
                    <div key={errIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={15} color="hsl(var(--error))" />
                      <span>⚠️ Validation Error: {errMsg}</span>
                    </div>
                  ))}
                </div>
              )}

              {isZeroBuyer && (
                <div
                  data-testid="zero-buyer-error-banner"
                  style={{
                    marginTop: '6px',
                    marginLeft: '52px',
                    padding: '10px 14px',
                    background: 'hsl(var(--error) / 0.15)',
                    border: '1px solid hsl(var(--error) / 0.4)',
                    borderRadius: '8px',
                    color: 'hsl(var(--error))',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={15} color="hsl(var(--error))" />
                  <span>
                    ⚠️ Zero-Buyer Selection Error: Stage {stageNumber} has 0 targeted buyers. At least 1 valid buyer must be selected for this stage.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add stage */}
      <button
        type="button"
        onClick={() => {
          const newIdx = stages.length;
          const secList = reduxBuyerLists.find((l: any) => l.type === 'secondary') || reduxBuyerLists[1] || reduxBuyerLists[0];
          setStages(p => [
            ...p,
            {
              stageIndex: p.length,
              stageNumber: p.length + 1,
              name: `Stage ${p.length + 1}: Escalation`,
              buyerMode: 'list',
              buyerListId: secList ? secList._id : 'secondary',
              buyerListName: secList ? secList.name : 'Secondary Liquidators',
              customBuyers: [],
              discountType: 'fixed',
              discountValue: 15,
              waitHours: 24,
            },
          ]);
          setExpandedStageIdx(newIdx);
        }}
        style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: 'hsl(var(--bg-card))',
          border: '1px dashed hsl(var(--primary)/0.4)',
          color: 'hsl(var(--primary))',
          borderRadius: '10px',
          padding: '11px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary)/0.08)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))')}
      >
        <Plus size={14} /> Add Escalation Stage
      </button>
    </div>
  );
};
