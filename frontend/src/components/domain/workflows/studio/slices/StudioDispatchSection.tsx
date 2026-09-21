import React from 'react';
import {
  Sliders,
  Play,
  Save,
  HeartHandshake,
  Trash2,
  Mail,
  Eye,
  X
} from 'lucide-react';
import { PreFlightAuditModal } from '../../PreFlightAuditModal';
import { InventoryScopeDiffModal } from '../../InventoryScopeDiffModal';
import { DEFAULT_EMAIL_BODY_HTML } from '../constants/studioConstants';
import type { UseWorkflowStudioReturn } from '../hooks/useWorkflowStudio';

export interface StudioDispatchSectionProps {
  studio: UseWorkflowStudioReturn;
  buyers?: any[];
}

export const StudioDispatchSection: React.FC<StudioDispatchSectionProps> = ({
  studio,
  buyers = []
}) => {
  const {
    SHOW_DYNAMIC_DONATION_SECTION,
    donationEnabled,
    setDonationEnabled,
    donationMaxCases,
    setDonationMaxCases,
    donationDiversionStrategy,
    setDonationDiversionStrategy,
    donatingEntities,
    setDonatingEntities,
    newEntityName,
    setNewEntityName,
    newEntityEmail,
    setNewEntityEmail,
    newEntityMaxCases,
    setNewEntityMaxCases,
    newEntityAllocPercent,
    setNewEntityAllocPercent,
    donationEmailAlertEnabled,
    setDonationEmailAlertEnabled,
    donationEmailSubject,
    setDonationEmailSubject,
    donationEmailCustomNotes,
    setDonationEmailCustomNotes,
    showDonationEmailPreview,
    setShowDonationEmailPreview,
    executionType,
    scheduleTime,
    workflowTimezone,
    impactMetrics,
    stages,
    handleSaveCampaign,
    isSubmitting,
    setIsSubmitting,
    hasZeroBuyerStage,
    showPreFlightModal,
    setShowPreFlightModal,
    handleLaunch,
    showInventoryDiffModal,
    setShowInventoryDiffModal,
    latestRun,
    matchedLots,
    activeLots,
    inspectingSegment,
    setInspectingSegment,
    inspectSearch,
    setInspectSearch,
    reduxBuyerLists
  } = studio;

  const card: React.CSSProperties = {
    background: 'hsl(var(--bg-card))',
    padding: '20px 24px',
    borderRadius: '14px',
    border: '1px solid hsl(var(--border-color))',
    boxShadow: '0 4px 20px -2px rgba(13, 71, 161, 0.06)'
  };
  const h3st: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
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
    transition: 'all 0.2s ease'
  };

  return (
    <>
      {/* SECTION 5: Dynamic Donation & Multi-Entity Diversion (Hidden for base release; enable via SHOW_DYNAMIC_DONATION_SECTION flag) */}
      {SHOW_DYNAMIC_DONATION_SECTION && (
        <div style={card}>
          <h3 style={h3st}><HeartHandshake size={17} color="hsl(var(--primary))" /> 5. Dynamic Donation & Multi-Entity Diversion</h3>
          <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '-4px', marginBottom: '14px' }}>
            Configure fallback donation rules, total case diversion caps, and split allocations across multiple food bank and rescue entities.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--bg-card))', padding: '10px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Enable Auto-Donation Backstop</span>
              <input
                type="checkbox"
                checked={donationEnabled}
                onChange={e => setDonationEnabled(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>

            {donationEnabled && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Max Total Donation Cases</label>
                    <input
                      type="number"
                      value={donationMaxCases}
                      onChange={e => setDonationMaxCases(parseInt(e.target.value, 10) || 0)}
                      style={inpSt}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Multi-Entity Diversion Strategy</label>
                    <select
                      value={donationDiversionStrategy}
                      onChange={e => setDonationDiversionStrategy(e.target.value as any)}
                      style={inpSt}
                    >
                      <option value="percentage_split">Pro-Rata Percentage Split (%)</option>
                      <option value="priority_cascade">Priority Cascade (Fill to Cap)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Donating-To Receiver Entities ({donatingEntities.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {donatingEntities.map((ent, idx) => (
                      <div key={ent.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--bg-card))', padding: '10px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12px' }}>{ent.name}</div>
                          <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{ent.email} • Max {ent.maxCases} Cases • {ent.allocationPercent}% Allocation</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDonatingEntities(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: 'hsl(var(--error))', cursor: 'pointer', padding: '4px' }}
                          title="Remove entity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Entity Form */}
                  <div style={{ background: 'hsl(var(--bg-card))', padding: '12px', borderRadius: '8px', border: '1px dashed hsl(var(--border-color))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>+ Add Donating-To Entity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input type="text" placeholder="Entity Name (e.g. Food Bank)" value={newEntityName} onChange={e => setNewEntityName(e.target.value)} style={{ ...inpSt, fontSize: '11px' }} />
                      <input type="email" placeholder="Contact Email" value={newEntityEmail} onChange={e => setNewEntityEmail(e.target.value)} style={{ ...inpSt, fontSize: '11px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '8px', alignItems: 'center' }}>
                      <input type="number" placeholder="Max Cases" value={newEntityMaxCases} onChange={e => setNewEntityMaxCases(parseInt(e.target.value, 10) || 0)} style={{ ...inpSt, fontSize: '11px' }} />
                      <input type="number" placeholder="Alloc %" value={newEntityAllocPercent} onChange={e => setNewEntityAllocPercent(parseInt(e.target.value, 10) || 0)} style={{ ...inpSt, fontSize: '11px' }} />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (!newEntityName) return;
                          setDonatingEntities(prev => [...prev, { id: Date.now().toString(), name: newEntityName, email: newEntityEmail, maxCases: newEntityMaxCases, allocationPercent: newEntityAllocPercent }]);
                          setNewEntityName(''); setNewEntityEmail('');
                        }}
                        style={{ padding: '6px 10px', fontSize: '11px', height: '30px' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Donating Entity Email Alert Settings */}
                  <div style={{ background: 'hsl(var(--bg-card))', padding: '14px', borderRadius: '8px', border: '1px solid hsl(var(--primary)/0.3)', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <Mail size={13} /> Donating Entity Email Alert Settings
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={donationEmailAlertEnabled}
                          onChange={e => setDonationEmailAlertEnabled(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Send Instant Email Alert
                      </label>
                    </div>

                    {donationEmailAlertEnabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Donation Alert Subject</label>
                          <input
                            type="text"
                            value={donationEmailSubject}
                            onChange={e => setDonationEmailSubject(e.target.value)}
                            style={inpSt}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Logistics & 501(c)(3) Dock Instructions</label>
                          <textarea
                            rows={2}
                            value={donationEmailCustomNotes}
                            onChange={e => setDonationEmailCustomNotes(e.target.value)}
                            style={{ ...inpSt, height: 'auto', resize: 'vertical', fontSize: '11px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowDonationEmailPreview(true)}
                            style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary)/0.3)' }}
                          >
                            <Eye size={13} /> Preview Entity Email Alert
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom: Live Impact Summary Banner & Action Buttons ── */}
      <div style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={17} color="hsl(var(--primary))" /> Live Impact Assessment
          </h3>
          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
            Execution Mode: <strong style={{ color: 'hsl(var(--primary))' }}>{executionType === 'immediate' ? '⚡ Run Immediately' : `🕐 Scheduled Cron (${workflowTimezone})`}</strong>
          </div>
        </div>

        {/* Impact Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'hsl(var(--bg-card))', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Matched Lots</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'hsl(var(--primary))' }}>{impactMetrics.totalLots}</div>
          </div>
          <div style={{ background: 'hsl(var(--bg-card))', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Total Cases</span>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{impactMetrics.totalCases.toLocaleString()}</div>
          </div>
          <div style={{ background: 'hsl(var(--bg-card))', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Est. COGS Recovery</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'hsl(var(--success))' }}>${impactMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: 'hsl(var(--bg-card))', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: 'hsl(var(--text-muted))' }}>RSL Risk</span>
              <span style={{ color: 'hsl(var(--warning))', fontWeight: 600 }}>{impactMetrics.urgentLots} urgent</span>
            </div>
            <div style={{ height: '8px', background: 'hsl(var(--bg-card))', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginTop: '6px' }}>
              <div style={{ width: `${impactMetrics.totalLots > 0 ? (impactMetrics.urgentLots / impactMetrics.totalLots) * 100 : 0}%`, background: 'hsl(var(--error))' }} />
              <div style={{ flex: 1, background: 'hsl(var(--success))' }} />
            </div>
          </div>
        </div>

        {/* Per-Stage Audiences Strip */}
        <div style={{ background: 'hsl(var(--bg-card))', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Stage Audiences</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {stages.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--bg-card))', padding: '6px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', fontSize: '11px' }}>
                <span style={{ background: 'hsl(var(--primary))', color: 'white', fontSize: '9px', fontWeight: 800, borderRadius: '4px', padding: '2px 6px' }}>S{s.stageNumber || i + 1}</span>
                <span style={{ color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>{s.name.replace(/Stage \d+:\s*/, '')}</span>
                {s.buyerMode === 'list' || s.buyerMode === 'segment'
                  ? <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{s.buyerListName || s.buyerListId || s.buyerSegment || 'Target List'}</span>
                  : <span style={{ color: 'hsl(var(--success))', fontWeight: 600 }}>{s.customBuyers.length} custom</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Primary Actions */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
          <button
            type="button"
            data-testid="studio-save-strategy-btn"
            onClick={() => handleSaveCampaign('draft')}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: 'hsl(var(--bg-card))',
              color: 'white',
              border: '1px solid hsl(var(--primary))',
              borderRadius: '10px',
              padding: '13px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            <Save size={15} color="hsl(var(--primary))" />
            <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={() => !hasZeroBuyerStage && setShowPreFlightModal(true)}
            disabled={impactMetrics.totalLots === 0 || hasZeroBuyerStage}
            style={{
              flex: 1,
              background: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' : 'hsl(var(--border-color))',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? 'pointer' : 'not-allowed',
              opacity: hasZeroBuyerStage ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              boxShadow: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? '0 6px 20px hsl(var(--primary)/0.3)' : 'none'
            }}
          >
            <Play size={15} /> Run
          </button>
        </div>
      </div>

      {/* ══ PRE-FLIGHT MODAL ════════════════════════════════════════════════ */}
      <PreFlightAuditModal
        showModal={showPreFlightModal}
        onClose={() => {
          setIsSubmitting(false);
          setShowPreFlightModal(false);
        }}
        onLaunch={handleLaunch}
        isSubmitting={isSubmitting}
        impactMetrics={impactMetrics}
        stages={stages}
        executionType={executionType}
        scheduleTime={scheduleTime}
        workflowTimezone={workflowTimezone}
        emailSubject={stages[0]?.emailSubject || 'Distressed Inventory Special Liquidation Offer'}
        previewHtml={stages[0]?.emailBodyHtml || DEFAULT_EMAIL_BODY_HTML}
      />

      {/* ══ INVENTORY SCOPE DIFF MODAL ═══════════════════════════════════════ */}
      <InventoryScopeDiffModal
        showModal={showInventoryDiffModal}
        onClose={() => setShowInventoryDiffModal(false)}
        historicalRun={latestRun}
        matchedLots={matchedLots}
        allInventoryLots={activeLots}
      />

      {/* ══ BUYER SEGMENT ROSTER INSPECTION MODAL ════════════════════════════ */}
      {inspectingSegment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buyer Segment Data"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: `
              radial-gradient(ellipse at 12% 18%, rgba(227, 242, 253, 0.75) 0%, transparent 50%),
              radial-gradient(ellipse at 88% 22%, rgba(144, 202, 249, 0.65) 0%, transparent 52%),
              radial-gradient(ellipse at 50% 50%, rgba(33, 150, 243, 0.22) 0%, transparent 70%),
              radial-gradient(ellipse at 20% 82%, rgba(13, 71, 161, 0.08) 0%, transparent 50%),
              rgba(255, 255, 255, 0.75)
            `,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'hidden',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setInspectingSegment(null); }}
        >
          <div
            style={{
              backgroundColor: '#F4F8FC',
              border: '2px solid #2196F3',
              borderRadius: '16px',
              width: '680px',
              maxWidth: '92vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(13, 71, 161, 0.25), 0 0 35px rgba(33, 150, 243, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              overflow: 'hidden',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Radiant Blue Top Accent Bar */}
            <div
              style={{
                height: '5px',
                width: '100%',
                background: 'linear-gradient(90deg, #E3F2FD 0%, #90CAF9 25%, #2196F3 65%, #0D47A1 100%)',
              }}
            />

            {/* ── Blue Theme Header ── */}
            <div
              style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)',
                borderBottom: '1px solid rgba(33, 150, 243, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <Eye size={18} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Buyer Segment Data: {reduxBuyerLists.find(s => s._id === inspectingSegment || s.type === inspectingSegment || s.name?.toLowerCase().includes(inspectingSegment.toLowerCase()))?.name || (inspectingSegment === 'primary' ? 'Primary Buyers' : inspectingSegment === 'secondary' ? 'Secondary Liquidators' : inspectingSegment)}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#E3F2FD', fontWeight: 500 }}>
                    Target Buyer List Roster Inspection
                  </span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setInspectingSegment(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Modal Body Content ── */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
              <input
                type="text"
                placeholder="Search buyers by name or email..."
                value={inspectSearch}
                onChange={e => setInspectSearch(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(33, 150, 243, 0.35)',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              />

              <div
                style={{
                  maxHeight: '360px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  borderRadius: '10px',
                  border: '1px solid rgba(33, 150, 243, 0.25)',
                  boxShadow: '0 2px 8px rgba(13, 71, 161, 0.05)',
                  background: '#FFFFFF',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', background: '#FFFFFF' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: '#F0F7FF', borderBottom: '2px solid rgba(33, 150, 243, 0.3)', color: '#0D47A1', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700, position: 'sticky', top: 0, background: '#F0F7FF', zIndex: 10 }}>Name / Company</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, position: 'sticky', top: 0, background: '#F0F7FF', zIndex: 10 }}>Email Address</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, position: 'sticky', top: 0, background: '#F0F7FF', zIndex: 10 }}>Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const matchedList = reduxBuyerLists.find(s => s._id === inspectingSegment || s.type === inspectingSegment || s.name?.toLowerCase().includes(inspectingSegment.toLowerCase()));

                      let targetList: any[] = [];
                      if (matchedList) {
                        if (Array.isArray(matchedList.buyerIds) && matchedList.buyerIds.length > 0) {
                          targetList = matchedList.buyerIds.map((b: any) => {
                            if (typeof b === 'object' && b !== null) return b;
                            const bId = b?.toString();
                            return buyers.find(ub => (ub._id || ub.id)?.toString() === bId) || { _id: bId, name: 'Registered Buyer', email: bId };
                          });
                        } else if (Array.isArray(matchedList.buyerIds) && matchedList.buyerIds.length === 0) {
                          targetList = [];
                        } else if (matchedList.type === 'secondary' || matchedList._id === 'list-secondary' || (matchedList.name || '').toLowerCase().includes('secondary')) {
                          targetList = buyers.filter((b: any) => {
                            const t = (b.tier || '').toLowerCase();
                            return t === 'tier2' || t === 'secondary' || t === 'liquidator' || t === 'all_liquidators';
                          });
                        } else if (matchedList.type === 'primary' || matchedList._id === 'list-primary' || (matchedList.name || '').toLowerCase().includes('primary')) {
                          targetList = buyers.filter((b: any) => {
                            const t = (b.tier || '').toLowerCase();
                            return !t || t === 'tier1' || t === 'primary' || t === 'tier1_retailers';
                          });
                        }
                      } else if (inspectingSegment === 'primary' || inspectingSegment === 'list-primary') {
                        targetList = buyers.filter((b: any) => {
                          const t = (b.tier || '').toLowerCase();
                          return !t || t === 'tier1' || t === 'primary' || t === 'tier1_retailers';
                        });
                      } else if (inspectingSegment === 'secondary' || inspectingSegment === 'list-secondary') {
                        targetList = buyers.filter((b: any) => {
                          const t = (b.tier || '').toLowerCase();
                          return t === 'tier2' || t === 'secondary' || t === 'liquidator' || t === 'all_liquidators';
                        });
                      } else {
                        targetList = [];
                      }

                      const filtered = targetList.filter((b: any) => {
                        if (!inspectSearch) return true;
                        const q = inspectSearch.toLowerCase();
                        return (b.companyName || b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q);
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                              {matchedList ? `No buyers assigned to ${matchedList.name} (0 members configured).` : 'No buyer list selected or configured.'}
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((b: any, idx: number) => (
                        <tr key={b._id || idx} style={{ borderBottom: '1px solid rgba(33, 150, 243, 0.15)', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>{b.companyName || b.name || 'Retail Partner'}</td>
                          <td style={{ padding: '10px 12px', color: '#1E88E5', fontWeight: 500 }}>{b.email || 'n/a'}</td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Jul 15, 2026'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(33, 150, 243, 0.2)', background: '#F0F7FF', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInspectingSegment(null)}
                style={{
                  background: 'linear-gradient(135deg, #2196F3 0%, #0D47A1 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(33, 150, 243, 0.4)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DONATING ENTITY EMAIL ALERT PREVIEW MODAL ════════════════════════ */}
      {showDonationEmailPreview && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))',
            borderRadius: '12px', width: '640px', maxWidth: '90vw', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} color="hsl(var(--primary))" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Donating Entity Email Alert Preview</h3>
              </div>
              <button type="button" onClick={() => setShowDonationEmailPreview(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'hsl(var(--bg-card))', color: 'hsl(var(--text-primary))', fontSize: '0.85rem', fontFamily: 'sans-serif' }}>
              <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                <div><strong>To:</strong> {donatingEntities[0]?.email || 'donations@feedingamerica.org'}</div>
                <div><strong>Subject:</strong> {donationEmailSubject.replace(/\{\{lot_number\}\}/g, 'LOT-9921').replace(/\{\{cases\}\}/g, '300')}</div>
              </div>
              <div style={{ background: 'white', color: 'hsl(var(--text-primary))', padding: '24px', borderRadius: '8px' }}>
                <h2 style={{ color: 'hsl(var(--bg-card))', fontSize: '1.2rem', marginTop: 0 }}>Food Rescue Donation Transfer Advice</h2>
                <p>Dear {donatingEntities[0]?.name || 'Feeding America Partner'} Operations Team,</p>
                <p>We are pleased to inform you that a surplus food inventory donation transfer has been allocated to your organization:</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'hsl(var(--bg-card-hover))', borderBottom: '2px solid hsl(var(--border-color))', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Product SKU</th>
                      <th style={{ padding: '8px' }}>Description</th>
                      <th style={{ padding: '8px' }}>Allocated Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                      <td style={{ padding: '8px' }}>MILK-ORGANIC</td>
                      <td style={{ padding: '8px' }}>Organic Whole Milk 1 Gallon</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>300 Cases</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ background: 'hsl(var(--bg-card-hover))', padding: '12px', borderLeft: '4px solid hsl(var(--primary))', borderRadius: '4px', margin: '16px 0' }}>
                  <strong>Dock Instructions:</strong> {donationEmailCustomNotes}
                </div>
                <p style={{ marginTop: '20px', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>IndSpoiler Alert Surplus Recovery Division</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
