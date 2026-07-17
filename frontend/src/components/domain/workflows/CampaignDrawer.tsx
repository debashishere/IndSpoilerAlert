import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, X } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../store';
import {
  setShowCampaignDrawer,
  setCampaignWizardStep,
  setSelectorMode,
  resetCampaignWizard
} from '../../../store/slices/workflowSlice';
import {
  createLiquidationCycleThunk,
  updateLiquidationCycleThunk,
  createLiquidationAutomationThunk,
  updateLiquidationAutomationThunk,
  fetchLiquidationCyclesThunk,
  fetchLiquidationAutomationsThunk
} from '../../../services/workflowService';

export const CampaignDrawer: React.FC<{ supplierId: string }> = ({ supplierId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    showCampaignDrawer,
    editingCampaignId,
    campaignWizardStep,
    liquidationCycles,
    liquidationAutomations,
    selectorMode,
    explicitLotIds,
    excludedLotIds
  } = useSelector((state: RootState) => state.workflow);

  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleStartDate, setNewCycleStartDate] = useState('');
  const [newCycleEndDate, setNewCycleEndDate] = useState('');
  const [selectedAutomationTemplate, setSelectedAutomationTemplateLocal] = useState('');
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [maxRslFilter, setMaxRslFilter] = useState(0.20);
  const [minCasesFilter, setMinCasesFilter] = useState(10);
  const [stageGates] = useState([
    { stageNumber: 1, name: 'Primary Tier Bargain', discountType: 'percentage_off_wholesale', discountValue: 15, waitHours: 24, buyerMode: 'segment', buyerSegment: 'Tier 1 Wholesale', autoExecute: true },
    { stageNumber: 2, name: 'Broad Market Clearance', discountType: 'percentage_off_wholesale', discountValue: 35, waitHours: 48, buyerMode: 'all', autoExecute: true },
    { stageNumber: 3, name: 'Final Salvage / Donation Divert', discountType: 'fixed_price', discountValue: 1.0, waitHours: 12, buyerMode: 'all', autoExecute: false },
  ]);

  useEffect(() => {
    if (editingCampaignId) {
      const cycle = liquidationCycles.find(c => c._id === editingCampaignId || c.id === editingCampaignId);
      if (cycle) {
        setNewCycleName(cycle.name || '');
        setNewCycleStartDate(cycle.startDate ? new Date(cycle.startDate).toISOString().split('T')[0] : '');
        setNewCycleEndDate(cycle.endDate ? new Date(cycle.endDate).toISOString().split('T')[0] : '');
      }
      const linkedAuto = liquidationAutomations.find(a => (a.liquidationCycleId?._id || a.liquidationCycleId) === editingCampaignId);
      if (linkedAuto) {
        setWorkflowName(linkedAuto.name || '');
        setSelectedAutomationTemplateLocal(linkedAuto.templateKey || linkedAuto.templateName || '');
        if (linkedAuto.inventoryFilters) {
          setCategoryFilter(linkedAuto.inventoryFilters.category || '');
          setMaxRslFilter(linkedAuto.inventoryFilters.maxRsl || 0.20);
          setMinCasesFilter(linkedAuto.inventoryFilters.minCases || 10);
        }
      }
    } else {
      setNewCycleName('');
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 86400000);
      setNewCycleStartDate(now.toISOString().split('T')[0]);
      setNewCycleEndDate(in30.toISOString().split('T')[0]);
    }
  }, [editingCampaignId, liquidationCycles, liquidationAutomations]);

  const handleSaveCampaignAndWorkflow = async () => {
    if (!newCycleName || !newCycleStartDate || !newCycleEndDate) {
      alert('Campaign Name and Dates are required.');
      return;
    }
    setIsCreatingCycle(true);
    try {
      let cycleId = editingCampaignId;
      const cyclePayload = {
        name: newCycleName,
        supplierId,
        startDate: new Date(newCycleStartDate).toISOString(),
        endDate: new Date(newCycleEndDate).toISOString(),
        status: 'active'
      };

      if (editingCampaignId) {
        const res = await dispatch(updateLiquidationCycleThunk({ id: editingCampaignId, payload: cyclePayload })).unwrap();
        cycleId = res._id || res.id;
      } else {
        const res = await dispatch(createLiquidationCycleThunk(cyclePayload)).unwrap();
        cycleId = res._id || res.id;
      }

      const autoPayload = {
        name: workflowName || `${(selectedAutomationTemplate || 'short_dated_clearance').replace(/_/g, ' ')} Campaign`,
        supplierId,
        liquidationCycleId: cycleId,
        templateName: selectedAutomationTemplate || 'short_dated_clearance',
        templateKey: selectedAutomationTemplate || 'short_dated_clearance',
        executionType: 'immediate',
        inventoryFilters: {
          category: categoryFilter,
          maxRsl: maxRslFilter,
          minCases: minCasesFilter,
          explicitLotIds: (selectorMode === 'explicit' || selectorMode === 'hybrid') ? explicitLotIds : undefined,
          excludedLotIds: (selectorMode === 'hybrid') ? excludedLotIds : undefined
        },
        stages: stageGates,
        emailTemplate: {
          subject: 'Distressed Inventory Special Liquidation Offer',
          customIntro: 'We are liquidating select excess inventory immediately.'
        },
        status: 'active'
      };

      const existingAuto = liquidationAutomations.find(a => (a.liquidationCycleId?._id || a.liquidationCycleId) === cycleId);
      if (existingAuto) {
        await dispatch(updateLiquidationAutomationThunk({ id: existingAuto._id || existingAuto.id, payload: autoPayload })).unwrap();
      } else {
        await dispatch(createLiquidationAutomationThunk(autoPayload)).unwrap();
      }

      alert(editingCampaignId ? 'Campaign and Workflow successfully updated!' : 'Campaign and Workflow successfully created!');
      dispatch(setShowCampaignDrawer(false));
      dispatch(resetCampaignWizard());
      dispatch(fetchLiquidationCyclesThunk(supplierId));
      dispatch(fetchLiquidationAutomationsThunk(supplierId));
    } catch (err: any) {
      alert(`Error saving campaign: ${err.message || err}`);
    } finally {
      setIsCreatingCycle(false);
    }
  };

  if (!showCampaignDrawer) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 999 }} onClick={() => dispatch(setShowCampaignDrawer(false))}>
      <div
        className="drawer-container"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '720px',
          height: '100%',
          backgroundColor: 'hsl(var(--bg-card))',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid hsl(var(--border-color))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid hsl(var(--border-color))', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'hsl(var(--primary))' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {editingCampaignId ? 'Edit Liquidation Campaign' : 'Create Liquidation Campaign'}
            </h3>
          </div>
          <button className="drawer-close" onClick={() => dispatch(setShowCampaignDrawer(false))}>
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border-color))', backgroundColor: 'hsl(var(--bg-card-hover) / 10%)' }}>
          {[
            { step: 1, label: '📅 Campaign' },
            { step: 2, label: '🤖 Strategy' },
            { step: 3, label: '📦 Rules & Filters' },
            { step: 4, label: '📨 Email Notification' }
          ].map(s => (
            <div
              key={s.step}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderBottom: campaignWizardStep === s.step ? '3px solid hsl(var(--primary))' : 'none',
                color: campaignWizardStep === s.step ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (campaignWizardStep === 1 && (!newCycleName || !newCycleStartDate || !newCycleEndDate)) {
                  alert('Please complete Campaign Details (Step 1) first.');
                  return;
                }
                dispatch(setCampaignWizardStep(s.step));
              }}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {campaignWizardStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>
                Define the name and duration for your liquidation campaign cycle. This groups closeout lots, sales sheets, and automation logs.
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Campaign Name</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '0.9rem' }}
                  placeholder="e.g., Q3 Closeout Event & Warehouse Sweep"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Start Date</label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '0.9rem' }}
                    value={newCycleStartDate}
                    onChange={(e) => setNewCycleStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>End Date</label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '0.9rem' }}
                    value={newCycleEndDate}
                    onChange={(e) => setNewCycleEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {campaignWizardStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))' }}>
                Choose Campaign Strategy Template
              </div>
              {[
                { key: 'short_dated_clearance', title: 'Short-Dated Clearance Sweep', desc: 'Aggressive multi-tier discount schedule optimized for items nearing expiration.' },
                { key: 'category_overstock', title: 'Category Overstock Liquidation', desc: 'Steady wholesale discount structure to clear excess bulk inventory.' },
                { key: 'distressed_salvage', title: 'Distressed & Salvage Recovery', desc: 'Direct bids with donation fallback for items needing urgent clearance.' }
              ].map(t => (
                <div
                  key={t.key}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: selectedAutomationTemplate === t.key ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                    backgroundColor: selectedAutomationTemplate === t.key ? 'hsl(var(--primary) / 10%)' : 'hsl(var(--bg-card-hover) / 20%)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedAutomationTemplateLocal(t.key)}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          )}

          {campaignWizardStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Inventory Selection Mode</label>
                <select
                  className="input"
                  style={{ width: '100%', padding: '10px 12px' }}
                  value={selectorMode}
                  onChange={(e) => dispatch(setSelectorMode(e.target.value as any))}
                >
                  <option value="automatic">Automatic Rule-Based Filters</option>
                  <option value="explicit">Explicit Manual Lot Checkboxes</option>
                  <option value="hybrid">Hybrid (Rules + Explicit Exclusions/Inclusions)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Max Remaining Shelf Life (RSL)</label>
                  <input
                    type="number"
                    step="0.05"
                    className="input"
                    style={{ width: '100%', padding: '10px 12px' }}
                    value={maxRslFilter}
                    onChange={(e) => setMaxRslFilter(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Min Cases Volume</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%', padding: '10px 12px' }}
                    value={minCasesFilter}
                    onChange={(e) => setMinCasesFilter(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

          {campaignWizardStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))' }}>
                Review and finalize stage-gate discount rules and notification settings.
              </div>
              {stageGates.map((sg, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', backgroundColor: 'hsl(var(--bg-card-hover) / 10%)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'hsl(var(--primary))' }}>Stage {sg.stageNumber}: {sg.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    Discount: {sg.discountValue}% · Wait: {sg.waitHours < 1 ? `${Math.round(sg.waitHours * 60)} mins` : `${sg.waitHours} hours`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="drawer-footer" style={{ borderTop: '1px solid hsl(var(--border-color))', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(setShowCampaignDrawer(false))} disabled={isCreatingCycle}>
            Cancel
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            {campaignWizardStep > 1 && (
              <button type="button" className="btn btn-secondary" onClick={() => dispatch(setCampaignWizardStep(campaignWizardStep - 1))}>
                Back
              </button>
            )}
            {campaignWizardStep < 4 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (campaignWizardStep === 1 && (!newCycleName || !newCycleStartDate || !newCycleEndDate)) {
                    alert('Campaign Name and Dates are required.');
                    return;
                  }
                  if (campaignWizardStep === 2 && !selectedAutomationTemplate) {
                    alert('Please select a sales strategy template.');
                    return;
                  }
                  dispatch(setCampaignWizardStep(campaignWizardStep + 1));
                }}
              >
                Next Step
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSaveCampaignAndWorkflow} disabled={isCreatingCycle}>
                {isCreatingCycle ? 'Saving...' : editingCampaignId ? 'Update Campaign & Strategy' : 'Save Campaign & Strategy'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
