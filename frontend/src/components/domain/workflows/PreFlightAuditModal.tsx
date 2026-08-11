import React from 'react';
import { ShieldAlert, X, Calendar } from 'lucide-react';

interface PreFlightAuditModalProps {
  showModal: boolean;
  onClose: () => void;
  onLaunch: () => void;
  isSubmitting: boolean;
  impactMetrics: {
    totalLots: number;
    totalCases: number;
    totalValue: number;
  };
  stages: any[];
  executionType: 'immediate' | 'cron';
  scheduleTime: string;
  workflowTimezone: string;
  emailSubject: string;
  previewHtml: string;
}

const TIER_COLOR: Record<number | string, string> = {
  1: 'hsl(var(--primary))',
  2: 'hsl(var(--secondary))',
  3: 'hsl(var(--border-color))',
  tier1: 'hsl(var(--primary))',
  tier2: 'hsl(var(--secondary))',
  custom: 'hsl(var(--success))',
};

export const PreFlightAuditModal: React.FC<PreFlightAuditModalProps> = ({
  showModal,
  onClose,
  onLaunch,
  isSubmitting,
  impactMetrics,
  stages,
  executionType,
  scheduleTime,
  workflowTimezone,
  emailSubject,
  previewHtml,
}) => {
  if (!showModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '16px', width: '100%', maxWidth: '660px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>

        <div style={{ background: 'hsl(var(--bg-card))', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-color))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <ShieldAlert size={19} color="hsl(var(--primary))" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Pre-Flight Automation Launch Audit</h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}><X size={17} /></button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', background: 'hsl(var(--bg-card))', padding: '13px', borderRadius: '10px' }}>
            <div><span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Matched Lots</span><div style={{ fontSize: '17px', fontWeight: 700 }}>{impactMetrics.totalLots}</div></div>
            <div><span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Case Volume</span><div style={{ fontSize: '17px', fontWeight: 700 }}>{impactMetrics.totalCases.toLocaleString()}</div></div>
            <div><span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Est. Recovery</span><div style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--success))' }}>${impactMetrics.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
          </div>

          {/* Per-stage audience audit */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Stage Audience Audit</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stages.map((s, i) => (
                <div key={i} style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '9px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.buyerMode === 'custom' && s.customBuyers && s.customBuyers.length > 0 ? '7px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ background: 'hsl(var(--primary))', color: 'white', fontSize: '9px', fontWeight: 800, borderRadius: '3px', padding: '1px 6px' }}>Stage {s.stageIndex ?? i + 1}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{s.name}</span>
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      {s.buyerMode === 'list' || s.buyerMode === 'segment'
                        ? <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{s.buyerListName || s.buyerListId || s.buyerSegment || 'Target List'}</span>
                        : <span style={{ color: 'hsl(var(--success))', fontWeight: 600 }}>{s.customBuyers?.length || 0} custom buyer{(s.customBuyers?.length || 0) !== 1 ? 's' : ''}</span>
                      }
                    </div>
                  </div>
                  {s.buyerMode === 'custom' && s.customBuyers && s.customBuyers.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {s.customBuyers.map((b: any) => (
                        <span key={b.id} style={{ fontSize: '10px', background: `${TIER_COLOR[b.tier || 1] || 'hsl(var(--primary))'}18`, border: `1px solid ${TIER_COLOR[b.tier || 1] || 'hsl(var(--primary))'}44`, color: 'hsl(var(--text-primary))', borderRadius: '10px', padding: '2px 8px' }}>{b.name}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '5px' }}>
                    {s.discountType === 'yield' ? 'Pricing: AI Yield Optimizer' : s.discountType === 'fixed' ? `Pricing: ${s.discountValue}% Off` : `Floor: $${s.discountValue}`}
                    {' · '} Wait: {s.waitHours < 1 ? `${Math.round(s.waitHours * 60)}m` : `${s.waitHours}h`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div style={{ fontSize: '12px', background: 'hsl(var(--primary)/0.08)', border: '1px solid hsl(var(--primary)/0.2)', padding: '10px 13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={14} color="hsl(var(--primary))" />
            <span><strong>Execution:</strong> {executionType === 'immediate' ? 'Run Immediately' : `Cron (${workflowTimezone}) @ ${scheduleTime}`}</span>
          </div>

          {/* Email preview */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Email Subject & Body Preview</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--primary))', fontWeight: 600, marginBottom: '8px' }}>Subject: {emailSubject}</div>
            <div
              style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '12px', maxHeight: '140px', overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>

        </div>

        {/* Modal actions */}
        <div style={{ background: 'hsl(var(--bg-card))', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid hsl(var(--border-color))' }}>
          <button type="button" onClick={onClose} disabled={isSubmitting} style={{ background: 'transparent', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-secondary))', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Back to Edit
          </button>
          <button type="button" onClick={onLaunch} disabled={isSubmitting} style={{ background: 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Launching Workflow…' : '🚀 Confirm & Launch'}
          </button>
        </div>

      </div>
    </div>
  );
};
