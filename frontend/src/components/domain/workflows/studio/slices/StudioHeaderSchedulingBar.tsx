import React from 'react';
import {
  Zap,
  Play,
  Save,
  Clock,
  Check,
  X,
  Edit3,
  LayoutTemplate,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { UseWorkflowStudioReturn } from '../hooks/useWorkflowStudio';
import { TEMPLATE_DEFINITIONS } from '../constants/studioConstants';
import { format12HourTime, compileFrontendCron } from '../utils/studioCalculations';

interface StudioHeaderSchedulingBarProps {
  studio: UseWorkflowStudioReturn;
  editingCampaignId?: string | null;
  onCancel?: () => void;
}

export const StudioHeaderSchedulingBar: React.FC<StudioHeaderSchedulingBarProps> = ({
  studio,
  editingCampaignId,
  onCancel,
}) => {
  const {
    workflowName,
    setWorkflowName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedTemplateKey,
    selectedDef,
    handleSelectTemplate,
    showTemplateDrop,
    setShowTemplateDrop,
    templateRef,
    handleClearEditing,
    executionType,
    setExecutionType,
    scheduleTime,
    setScheduleTime,
    cronDays,
    setCronDays,
    setCronExpression,
    isSchedulePopoverOpen,
    setIsSchedulePopoverOpen,
    scheduleRef,
    impactMetrics,
    hasZeroBuyerStage,
    setShowPreFlightModal,
    isSubmitting,
    handleSaveCampaign,
  } = studio;

  // Shared institutional card and input tokens adhering to ux-v1
  const card: React.CSSProperties = {
    background: 'hsl(var(--bg-card))',
    padding: '22px 24px',
    borderRadius: '14px',
    border: '1px solid hsl(var(--border-color) / 0.7)',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
  };

  const h3st: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'hsl(var(--text-primary))',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const inpSt: React.CSSProperties = {
    background: 'hsl(var(--bg-card))',
    border: '1px solid hsl(var(--border-color))',
    borderRadius: '8px',
    minHeight: '40px',
    padding: '9px 14px',
    color: 'hsl(var(--text-primary))',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  const dropSt: React.CSSProperties = {
    background: 'hsl(var(--bg-card))',
    border: '1px solid hsl(var(--border-color))',
    borderRadius: '8px',
    minHeight: '40px',
    padding: '9px 14px',
    color: 'hsl(var(--text-primary))',
    fontSize: '13px',
    fontWeight: 600,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <>
      {/* ══ EDITING CAMPAIGN OVERLAY BANNER ═════════════════════════════════ */}
      {editingCampaignId && (
        <div
          style={{
            backgroundColor: 'hsl(var(--warning) / 12%)',
            border: '1px solid hsl(var(--warning) / 45%)',
            borderRadius: '14px',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
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
              <Edit3 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'hsl(var(--warning))', letterSpacing: '-0.01em' }}>
                  Editing Saved Campaign Strategy
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'hsl(var(--warning) / 20%)',
                    border: '1px solid hsl(var(--warning) / 40%)',
                    color: 'hsl(var(--warning))',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  ID: {editingCampaignId}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '3px' }}>
                Currently editing parameters for <strong style={{ color: 'hsl(var(--text-primary))' }}>"{workflowName}"</strong>. Save will update this saved strategy.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleClearEditing}
              style={{
                background: 'hsl(var(--bg-card))',
                color: 'hsl(var(--text-primary))',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={15} /> Clear & Start New Campaign
            </button>
          </div>
        </div>
      )}

      {/* ══ TOP BAR: Name + Execution + Launch ══════════════════════════════ */}
      <div style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left: branding + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <Zap size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Workflow Campaign Name <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px', lineHeight: 1 }} title="Required">*</span>
              </label>
              <input
                type="text"
                data-testid="workflow-name-input"
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name…"
                style={{
                  ...inpSt,
                  maxWidth: '340px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: 'hsl(var(--text-primary))',
                }}
              />
            </div>
          </div>

          {/* Centre: Execution mode */}
          <div
            ref={scheduleRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              minWidth: '240px',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Zap size={12} /> Execution Mode
            </div>
            <div style={{ display: 'flex', gap: '7px', justifyContent: 'center', width: '100%', maxWidth: '260px' }}>
              <button
                type="button"
                onClick={() => {
                  setExecutionType('immediate');
                  setIsSchedulePopoverOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: executionType === 'immediate' ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                  background: executionType === 'immediate' ? 'hsl(var(--primary)/0.15)' : 'hsl(var(--bg-card))',
                  color: executionType === 'immediate' ? 'hsl(var(--primary))' : 'hsl(var(--text-primary))',
                }}
              >
                ⚡ Run Now
              </button>
              <button
                type="button"
                onClick={() => {
                  if (executionType !== 'cron') {
                    setExecutionType('cron');
                    setIsSchedulePopoverOpen(true);
                  } else {
                    setIsSchedulePopoverOpen(prev => !prev);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: executionType === 'cron' ? '1px solid hsl(var(--secondary))' : '1px solid hsl(var(--border-color))',
                  background: executionType === 'cron' ? 'hsl(var(--secondary)/0.15)' : 'hsl(var(--bg-card))',
                  color: executionType === 'cron' ? 'hsl(var(--primary))' : 'hsl(var(--text-primary))',
                }}
              >
                🕐 Scheduled {executionType === 'cron' ? (isSchedulePopoverOpen ? '▲' : '▼') : ''}
              </button>
            </div>
            {executionType === 'cron' && isSchedulePopoverOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '6px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: 'hsl(var(--bg-card))',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-color))',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  minWidth: '285px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-color)/0.5)', paddingBottom: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} /> Configure Schedule
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSchedulePopoverOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Close schedule picker"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => {
                      const sel = cronDays.includes(i);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            const nextDays = sel ? cronDays.filter(x => x !== i) : [...cronDays, i];
                            setCronDays(nextDays);
                            setCronExpression(compileFrontendCron(scheduleTime, nextDays));
                          }}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '4px',
                            border: '1px solid hsl(var(--border-color))',
                            background: sel ? 'hsl(var(--primary))' : 'hsl(var(--bg-card))',
                            color: sel ? 'white' : 'hsl(var(--text-primary))',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => {
                      setScheduleTime(e.target.value);
                      setCronExpression(compileFrontendCron(e.target.value, cronDays));
                    }}
                    style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '4px 7px', color: 'hsl(var(--text-primary))', fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'hsl(var(--primary))', fontWeight: 600, background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.25)', padding: '3px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                    {format12HourTime(scheduleTime)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setIsSchedulePopoverOpen(false)}
                    style={{
                      background: 'hsl(var(--primary))',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '3px 9px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Check size={11} /> Apply Schedule
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', flex: 1, minWidth: '260px', flexWrap: 'wrap' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: 'transparent',
                  color: 'hsl(var(--text-secondary))',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              data-testid="save-campaign-btn"
              data-test-action="save-strategy"
              aria-label="Save Strategy"
              id="studio-save-strategy-btn"
              onClick={() => handleSaveCampaign('draft')}
              disabled={isSubmitting}
              style={{
                background: 'hsl(var(--bg-card))',
                color: 'hsl(var(--text-primary))',
                border: '1px solid hsl(var(--primary))',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <Save size={15} color="hsl(var(--primary))" />
              <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              type="button"
              data-testid="open-preflight-btn"
              onClick={() => !hasZeroBuyerStage && setShowPreFlightModal(true)}
              disabled={impactMetrics.totalLots === 0 || hasZeroBuyerStage}
              style={{
                background: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage)
                  ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))'
                  : 'hsl(var(--border-color))',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? 'pointer' : 'not-allowed',
                opacity: hasZeroBuyerStage ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? '0 4px 14px hsl(var(--primary)/0.35)' : 'none',
              }}
            >
              <Play size={15} /> Run
            </button>
          </div>
        </div>
      </div>

      {/* ══ SECTION 1: Campaign Setup & Strategy Template ════════════════════ */}
      <div id="campaign-template-section" style={card}>
        <h3 style={h3st}>
          <LayoutTemplate size={17} color="hsl(var(--primary))" /> 1. Sales Cycle & Workflow Template
        </h3>

        {/* Campaign Cycle Metadata Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
              Campaign Cycle Name <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              placeholder="e.g. Q3 Surplus Liquidation Campaign"
              style={{ ...inpSt, color: 'hsl(var(--text-primary))' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
              Cycle Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ ...inpSt, color: 'hsl(var(--text-primary))' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
              Cycle End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ ...inpSt, color: 'hsl(var(--text-primary))' }}
            />
          </div>
        </div>

        <label style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-primary))', display: 'block', marginBottom: '6px', letterSpacing: '0.01em' }}>
          Sales Strategy Template
        </label>
        <div ref={templateRef} style={{ position: 'relative', maxWidth: '480px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setShowTemplateDrop(p => !p)}
            style={{
              ...dropSt,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              border: `1px solid ${showTemplateDrop ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: 'hsl(var(--primary) / 0.12)',
                  color: 'hsl(var(--primary))',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  border: '1px solid hsl(var(--primary) / 0.25)',
                }}
              >
                {selectedDef.badge}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                {selectedDef.name}
              </span>
            </div>
            {showTemplateDrop ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showTemplateDrop && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 14px 40px -4px rgba(0, 0, 0, 0.25), 0 6px 18px rgba(0, 0, 0, 0.1)',
              }}
            >
              {TEMPLATE_DEFINITIONS.map(t => {
                const sel = selectedTemplateKey === t.key;
                return (
                  <div
                    key={t.key}
                    onClick={() => handleSelectTemplate(t.key)}
                    style={{
                      padding: '13px 16px',
                      cursor: 'pointer',
                      background: sel ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                      borderBottom: '1px solid hsl(var(--border-color))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (!sel) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card-hover))';
                    }}
                    onMouseLeave={e => {
                      if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            background: 'hsl(var(--primary) / 0.12)',
                            color: 'hsl(var(--primary))',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid hsl(var(--primary) / 0.25)',
                          }}
                        >
                          {t.badge}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                          {t.name}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', margin: 0, maxWidth: '380px' }}>
                        {t.description}
                      </p>
                    </div>
                    {sel && <Check size={15} color="hsl(var(--primary))" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logic flow */}
        <div style={{ background: 'hsl(var(--bg-card))', border: '1px dashed hsl(var(--primary)/0.4)', borderRadius: '10px', padding: '13px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <Sparkles size={14} color="hsl(var(--primary))" />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>
              Logic Flow: <span style={{ color: 'hsl(var(--primary))' }}>{selectedDef.name}</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {selectedDef.flowSteps.map((step, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    background: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '150px',
                  }}
                >
                  <div
                    style={{
                      background: 'hsl(var(--primary)/0.15)',
                      color: 'hsl(var(--primary))',
                      width: '22px',
                      height: '22px',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{step.label}</div>
                    <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{step.detail}</div>
                  </div>
                </div>
                {i < selectedDef.flowSteps.length - 1 && <ArrowRight size={13} color="hsl(var(--text-muted))" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
