import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Cpu, Activity, Zap, Timer, Eye, AlertTriangle, Info, History, X, Layers, MoreVertical, Edit3, Play, Square, Trash2, Clock, Box, Mail, Sliders, CheckCircle2, Filter, ChevronDown, ChevronRight, LayoutTemplate, Send } from 'lucide-react';
import type { AppDispatch, RootState } from '../store';
import {
  setWorkflowSubTab,
  setRunsFilter,
  setShowRunDetailsModal,
  setEditingCampaignId,
  calculateLotRsl
} from '../store/slices/workflowSlice';
import {
  fetchAutomationRunsThunk,
  forceExpireRunThunk,
  fetchLiquidationAutomationsThunk,
  fetchLiquidationCyclesThunk,
  patchLiquidationAutomationStatusThunk,
  deleteLiquidationAutomationThunk
} from '../services/workflowService';
import { LiquidationAutomationStudio } from './LiquidationAutomationStudio';
import { MailboxConnectionCanvas } from './MailboxConnectionCanvas';
import { TipTapTemplateEditor } from './TipTapTemplateEditor';
import { SendBroadcastView } from './SendBroadcastView';
import { useOAuthMailbox } from '../hooks/useOAuthMailbox';
import { selectBuyerLists, selectBuyers, fetchBuyerLists, fetchCoreReferenceData } from '../store/slices/coreSlice';

export const formatDurationHours = (hours: number): string => {
  if (hours == null || isNaN(hours) || hours <= 0) return '0 Mins';
  const totalMins = Math.round(hours * 60);
  if (totalMins > 1440) {
    const d = Math.floor(totalMins / 1440);
    const remMins = totalMins % 1440;
    if (remMins === 0) return `${d} ${d === 1 ? 'Day' : 'Days'}`;
    const h = Math.floor(remMins / 60);
    const m = remMins % 60;
    if (h > 0 && m > 0) return `${d} ${d === 1 ? 'Day' : 'Days'} ${h} ${h === 1 ? 'Hour' : 'Hours'} ${m} Mins`;
    if (h > 0) return `${d} ${d === 1 ? 'Day' : 'Days'} ${h} ${h === 1 ? 'Hour' : 'Hours'}`;
    return `${d} ${d === 1 ? 'Day' : 'Days'} ${m} Mins`;
  }
  if (totalMins < 60) {
    return `${totalMins} Mins`;
  }
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (m === 0) {
    return `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
  }
  return `${h} ${h === 1 ? 'Hour' : 'Hours'} ${m} Mins`;
};

export const formatDurationShort = (hours: number): string => {
  if (hours == null || isNaN(hours) || hours <= 0) return '0m';
  const totalMins = Math.round(hours * 60);
  if (totalMins >= 1440) {
    const d = Math.floor(totalMins / 1440);
    const remMins = totalMins % 1440;
    if (remMins === 0) return `${d}d`;
    const h = Math.floor(remMins / 60);
    const m = remMins % 60;
    if (h > 0 && m > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${d}d ${h}h`;
    return `${d}d ${m}m`;
  }
  if (totalMins < 60) {
    return `${totalMins}m`;
  }
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
};

interface WorkflowsViewProps {
  supplierId: string;
  inventoryLots?: any[];
  buyers?: any[];
  apiBaseUrl?: string;
  onSelectLot?: (lot: any) => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  supplierId,
  inventoryLots = [],
  buyers = [],
  apiBaseUrl = '/api',
  onSelectLot
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    workflowSubTab,
    automationRuns,
    liquidationAutomations,
    runsFilter,
    showRunDetailsModal,
    selectedRunDetails,
    editingCampaignId,
    loading
  } = useSelector((state: RootState) => state.workflow);

  const inventoryList = useSelector((state: RootState) => state.inventory?.inventoryList || inventoryLots);
  const allBids = useSelector((state: RootState) => state.inventory?.lotHubData?.bidsList || []);
  const buyerLists = useSelector(selectBuyerLists) || [];
  const allBuyers = useSelector(selectBuyers) || [];

  const getMatchedBuyerCount = (matched: any) => {
    if (!matched) return 0;
    if (Array.isArray(matched.buyerIds)) return matched.buyerIds.length;
    if (Array.isArray(allBuyers) && allBuyers.length > 0) {
      const isSec = matched.type === 'secondary' || matched._id === 'list-secondary' || (matched.name || '').toLowerCase().includes('secondary');
      const isPrim = matched.type === 'primary' || matched._id === 'list-primary' || (matched.name || '').toLowerCase().includes('primary');
      if (isSec) {
        const count = allBuyers.filter((b: any) => {
          const t = (b.tier || '').toLowerCase();
          return t === 'tier2' || t === 'secondary' || t === 'liquidator' || t === 'all_liquidators';
        }).length;
        if (count > 0) return count;
      } else if (isPrim) {
        const count = allBuyers.filter((b: any) => {
          const t = (b.tier || '').toLowerCase();
          return !t || t === 'tier1' || t === 'primary' || t === 'tier1_retailers';
        }).length;
        if (count > 0) return count;
      }
    }
    return 0;
  };

  const oauth = useOAuthMailbox(supplierId || '');

  const [nowTime, setNowTime] = useState(Date.now());
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number; bottom?: string } | null>(null);
  const [inspectingRun, setInspectingRun] = useState<any | null>(null);
  const [inspectingMatchedCampaign, setInspectingMatchedCampaign] = useState<any | null>(null);
  const [inspectingCampaignStages, setInspectingCampaignStages] = useState<any | null>(null);
  const [expandedRunBidsId, setExpandedRunBidsId] = useState<string | null>(null);
  const [expandedRunDetailsId, setExpandedRunDetailsId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('all');
  const [collapsedActiveRunIds, setCollapsedActiveRunIds] = useState<Record<string, boolean>>({});
  const [collapsedHistoryRunIds, setCollapsedHistoryRunIds] = useState<Record<string, boolean>>({});
  const [historyDetailsTabMap, setHistoryDetailsTabMap] = useState<Record<string, 'overview' | 'lots' | 'stages' | 'audit'>>({});

  const handleToggleDropdown = (campaignId: string, btnElement: HTMLElement, isBottomRow: boolean = false) => {
    if (activeDropdownId === campaignId) {
      setActiveDropdownId(null);
      setDropdownPos(null);
    } else {
      const rect = btnElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const isPopUp = isBottomRow || spaceBelow < 160;
      const top = isPopUp ? Math.max(10, rect.top - 145) : rect.bottom + 6;
      const right = Math.max(10, window.innerWidth - rect.right);
      setDropdownPos({ top, right, bottom: isPopUp ? '44px' : '' });
      setActiveDropdownId(campaignId);
    }
  };

  const handleInspectRun = async (runId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/liquidation-automations/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setInspectingRun(data);
      } else {
        const localRun = automationRuns.find((r: any) => r._id === runId);
        setInspectingRun(localRun || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dispatch(fetchBuyerLists());
    dispatch(fetchCoreReferenceData());
    if (supplierId) {
      dispatch(fetchLiquidationCyclesThunk(supplierId));
      dispatch(fetchLiquidationAutomationsThunk(supplierId));
      dispatch(fetchAutomationRunsThunk(supplierId));
    }
  }, [supplierId, dispatch]);

  const handleForceExpireRun = async (runId: string) => {
    if (window.confirm('Are you sure you want to force expire this workflow and execute fallback donation?')) {
      try {
        await dispatch(forceExpireRunThunk(runId)).unwrap();
        if (supplierId) {
          dispatch(fetchAutomationRunsThunk(supplierId));
        }
      } catch (err: any) {
        alert(`Failed to force expire run: ${err.message || err}`);
      }
    }
  };

  const handleEditCampaign = (campaignId: string) => {
    dispatch(setEditingCampaignId(campaignId));
    dispatch(setWorkflowSubTab('builder'));
    setActiveDropdownId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActivateCampaign = async (campaignId: string) => {
    try {
      await dispatch(patchLiquidationAutomationStatusThunk({ id: campaignId, status: 'active' })).unwrap();
      if (supplierId) dispatch(fetchLiquidationAutomationsThunk(supplierId));
    } catch (err: any) {
      alert(`Failed to activate campaign: ${err.message || err}`);
    }
    setActiveDropdownId(null);
  };

  const handleStopCampaign = async (campaignId: string) => {
    try {
      await dispatch(patchLiquidationAutomationStatusThunk({ id: campaignId, status: 'stopped' })).unwrap();
      if (supplierId) dispatch(fetchLiquidationAutomationsThunk(supplierId));
    } catch (err: any) {
      alert(`Failed to stop campaign: ${err.message || err}`);
    }
    setActiveDropdownId(null);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign strategy?')) {
      try {
        await dispatch(deleteLiquidationAutomationThunk(campaignId)).unwrap();
        if (supplierId) dispatch(fetchLiquidationAutomationsThunk(supplierId));
      } catch (err: any) {
        alert(`Failed to delete campaign: ${err.message || err}`);
      }
    }
    setActiveDropdownId(null);
  };

  const getCampaignMatchedScope = (filters: any) => {
    if (!filters) return { lotCount: inventoryList.length, caseCount: inventoryList.reduce((a: number, l: any) => a + (l.availableQty || l.quantityCases || 0), 0), matchedLots: inventoryList };

    const matched = inventoryList.filter((lot: any) => {
      if (!lot) return false;
      const id = (lot._id?.toString() || lot.id || '').toString();
      if (!id) return false;

      const explicitLotIds = (filters.explicitLotIds || []).map((e: any) => e?.toString() || e);
      const excludedLotIds = (filters.excludedLotIds || []).map((e: any) => e?.toString() || e);
      const selectorMode = filters.selectorMode || (explicitLotIds.length > 0 ? 'explicit' : 'automatic');

      if (selectorMode === 'explicit' && explicitLotIds.length > 0) {
        return explicitLotIds.includes(id);
      }
      if (selectorMode === 'hybrid') {
        if (excludedLotIds.includes(id)) return false;
        if (explicitLotIds.includes(id)) return true;
      }

      if (excludedLotIds.includes(id)) return false;
      if (explicitLotIds.includes(id)) return true;
      const lotCat = (typeof lot.productId === 'object' ? lot.productId?.category : '') || lot.category || lot.productCategory || '';
      if (filters.category && lotCat && lotCat.toLowerCase() !== filters.category.toLowerCase()) return false;
      const lotRsl = calculateLotRsl(lot);
      const maxRslVal = filters.maxRsl ?? filters.maxRslFilter;
      const normalizedMaxRsl = (maxRslVal !== undefined && maxRslVal !== null && maxRslVal !== 0)
        ? (maxRslVal >= 100 ? 1.0 : (maxRslVal >= 1 ? (maxRslVal === 1 ? 1.0 : maxRslVal / 100) : maxRslVal))
        : null;
      if (normalizedMaxRsl !== null && normalizedMaxRsl < 1 && lotRsl > normalizedMaxRsl) return false;
      const lotCases = lot.availableQty ?? lot.quantityCases ?? lot.quantity ?? 0;
      if (filters.minCases > 0 && lotCases < filters.minCases) return false;
      return true;
    });

    const lotCount = matched.length;
    const caseCount = matched.reduce((a: number, l: any) => a + (l.availableQty || l.quantityCases || 0), 0);
    return { lotCount, caseCount, matchedLots: matched };
  };

  const renderStatusBadge = (status?: string) => {
    const currentStatus = status || 'draft';
    switch (currentStatus) {
      case 'active':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'hsl(var(--success) / 15%)',
            color: 'hsl(var(--success))',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--success))', animation: 'pulse 2s ease-in-out infinite' }} />
            Active
          </span>
        );
      case 'stopped':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'hsl(var(--error) / 15%)',
            color: 'hsl(var(--error))',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase'
          }}>
            Stopped
          </span>
        );
      case 'completed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'hsl(var(--primary) / 15%)',
            color: 'hsl(var(--primary))',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase'
          }}>
            Completed
          </span>
        );
      case 'draft':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'hsl(var(--warning) / 15%)',
            color: 'hsl(var(--warning))',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase'
          }}>
            Draft
          </span>
        );
    }
  };

  const renderNextRunTime = (campaign: any) => {
    if (campaign.status === 'stopped' || campaign.status === 'completed' || campaign.isActive === false) {
      return (
        <span style={{ background: 'hsl(223 47% 12%)', color: 'hsl(var(--text-muted))', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
          Not Active
        </span>
      );
    }

    if (campaign.nextRunAt) {
      const nextDate = new Date(campaign.nextRunAt);
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'hsl(var(--primary))' }}>
            {nextDate.toLocaleDateString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
            {nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    }

    const sched = campaign.schedule;
    if (!sched || sched.type === 'immediate') {
      return (
        <span style={{ color: 'hsl(var(--secondary))', fontSize: '0.75rem', fontWeight: 600 }}>
          ⚡ Immediate
        </span>
      );
    }

    if (sched.type === 'cron') {
      const timeStr = sched.timeOfDay || '09:00';
      const daysArr = Array.isArray(sched.daysOfWeek) ? sched.daysOfWeek : [1];
      const dayNames = daysArr.map((d: number) => ['Su','Mo','Tu','We','Th','Fr','Sa'][d]).join(', ');

      const format12H = (t: string) => {
        let str = String(t).trim();
        let isPM = false; let isAM = false;
        if (/pm/i.test(str)) { isPM = true; str = str.replace(/pm/i, '').trim(); }
        if (/am/i.test(str)) { isAM = true; str = str.replace(/am/i, '').trim(); }
        const parts = str.split(':');
        let h = parseInt(parts[0], 10);
        if (isNaN(h)) return t;
        let m = (parts[1] || '00').replace(/[^0-9]/g, '');
        if (m.length < 2) m = m.padStart(2, '0');
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        const ampm = h >= 12 ? 'PM' : 'AM';
        let displayHour = h % 12;
        if (displayHour === 0) displayHour = 12;
        return `${displayHour}:${m} ${ampm}`;
      };

      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'hsl(var(--primary))' }}>
            🕐 {dayNames || 'Weekly'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
            @ {format12H(timeStr)} ({sched.timezone ? sched.timezone.split('/')[1] || sched.timezone : 'Local'})
          </div>
        </div>
      );
    }

    return <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>—</span>;
  };

  const safeRuns = Array.isArray(automationRuns) ? automationRuns : [];
  const filteredByWorkflow = selectedWorkflowId === 'all'
    ? safeRuns
    : safeRuns.filter((r: any) => {
        const autoId = r.automationId?._id || r.automationId;
        return String(autoId) === String(selectedWorkflowId);
      });

  const activeRuns = filteredByWorkflow.filter(r => r.status === 'evaluating');
  const historicalRuns = filteredByWorkflow.filter(r => runsFilter === 'all' || r.status === runsFilter);

  if (oauth.status === 'missing') {
    return (
      <div className="tab-pane active" style={{ padding: '24px 0' }}>
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={24} style={{ color: 'hsl(var(--primary))' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Liquidation Automations & Campaigns</h2>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
            Manage closeout campaigns, configure rule-based liquidation templates, and monitor automated bidding and disposal workflows.
          </p>
        </div>
        <MailboxConnectionCanvas onConnect={oauth.connectMailbox} loading={oauth.loading} />
      </div>
    );
  }

  return (
    <div className="tab-pane active" style={{ padding: '24px 0' }}>
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={24} style={{ color: 'hsl(var(--primary))' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Liquidation Automations & Campaigns</h2>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
          Manage closeout campaigns, configure rule-based liquidation templates, and monitor automated bidding and disposal workflows.
        </p>
      </div>

      {/* Sub-Tab Navigation: Saved Campaigns / Builder / Runs & History */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        padding: '4px',
        backgroundColor: 'hsl(var(--bg-card-hover) / 30%)',
        borderRadius: '10px',
        border: '1px solid hsl(var(--border-color))'
      }}>
        <button
          className={`btn ${workflowSubTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            dispatch(setEditingCampaignId(null));
            dispatch(setWorkflowSubTab('builder'));
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Cpu size={16} />
          <span>Campaign Builder</span>
        </button>
        <button
          className={`btn ${workflowSubTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => dispatch(setWorkflowSubTab('saved'))}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={16} />
          <span>Saved Campaigns</span>
        </button>
        <button
          className={`btn ${workflowSubTab === 'templates' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => dispatch(setWorkflowSubTab('templates'))}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <LayoutTemplate size={16} />
          <span>Email Builder</span>
        </button>
        <button
          className={`btn ${workflowSubTab === 'broadcast' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => dispatch(setWorkflowSubTab('broadcast'))}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={16} />
          <span>Send Broadcast</span>
        </button>
        <button
          className={`btn ${workflowSubTab === 'runs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            dispatch(setWorkflowSubTab('runs'));
            if (supplierId) {
              dispatch(fetchAutomationRunsThunk(supplierId));
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <Activity size={16} />
          <span>Runs & History</span>
          {activeRuns.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '12px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--warning))',
              color: '#000',
              fontSize: '0.65rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              {activeRuns.length}
            </span>
          )}
        </button>
      </div>

      {/* ======== SAVED CAMPAIGNS SUB-TAB ======== */}
      {workflowSubTab === 'saved' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} style={{ color: 'hsl(var(--primary))' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Saved Campaign Strategies</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
              {liquidationAutomations.length} strategy campaigns saved
            </span>
          </div>

          {liquidationAutomations.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.88rem' }}>
              <Layers size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontWeight: 600 }}>No saved campaigns found.</div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Click "+ New Campaign" above to create and save a new liquidation strategy.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid hsl(var(--border-color))', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase' }}>Campaign Name & Template</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase' }}>Matched Inventory</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase' }}>ExecutedAt</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase' }}>Next Run Time</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase' }}>Created At</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase' }}>Created By</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidationAutomations.map((campaign: any, cIdx: number) => {
                    const scope = getCampaignMatchedScope(campaign.inventoryFilters);
                    const formattedTemplate = (campaign.templateName || campaign.templateKey || 'Strategy Template').replace(/_/g, ' ');
                    const createdDate = campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'Today';

                    const campaignRuns = automationRuns.filter((r: any) =>
                      r.automationId === campaign._id ||
                      r.automationId?._id === campaign._id ||
                      (typeof r.automationId === 'string' && r.automationId === campaign._id)
                    );

                    return (
                      <tr
                        key={campaign._id}
                        style={{
                          borderBottom: '1px solid hsl(var(--border-color) / 50%)',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div
                            style={{ fontWeight: 700, fontSize: '0.88rem', color: 'hsl(var(--primary))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setInspectingCampaignStages(campaign)}
                            title="Click to view Strategy Stage Pipeline & Action Breakdown"
                          >
                            <span>{campaign.name || formattedTemplate}</span>
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'hsl(var(--primary) / 15%)', border: '1px solid hsl(var(--primary) / 30%)', color: 'hsl(var(--primary))' }}>
                              Stages →
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', textTransform: 'capitalize', marginTop: '2px' }}>
                            {formattedTemplate}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {renderStatusBadge(campaign.status)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{scope.lotCount} lots</div>
                              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>{scope.caseCount.toLocaleString()} cases</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setInspectingMatchedCampaign(campaign)}
                              style={{
                                background: 'hsl(var(--primary) / 12%)',
                                border: '1px solid hsl(var(--primary) / 30%)',
                                color: 'hsl(var(--primary))',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Inspect Matched Inventory Scope"
                            >
                              <Eye size={13} /> View
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {campaignRuns.length === 0 ? (
                            <span style={{ background: 'hsl(223 47% 12%)', color: 'hsl(var(--text-muted))', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                              Never Executed
                            </span>
                          ) : campaignRuns.length === 1 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-primary))' }}>
                                {new Date(campaignRuns[0].executedAt || campaignRuns[0].dispatchedAt || campaignRuns[0].createdAt).toLocaleDateString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleInspectRun(campaignRuns[0]._id)}
                                style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', cursor: 'pointer', padding: '2px' }}
                                title="Inspect Execution Timeline Data"
                                aria-label="Inspect Run Data"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          ) : (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleInspectRun(e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              style={{
                                background: 'hsl(223 47% 8%)',
                                border: '1px solid hsl(var(--border-color))',
                                borderRadius: '6px',
                                color: 'hsl(var(--primary))',
                                padding: '4px 6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              aria-label="Select Execution Timestamp"
                            >
                              <option value="" disabled>History ({campaignRuns.length} runs)...</option>
                              {campaignRuns.map((r: any) => (
                                <option key={r._id} value={r._id}>
                                  {new Date(r.executedAt || r.dispatchedAt || r.createdAt).toLocaleString()}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {renderNextRunTime(campaign)}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'hsl(var(--text-muted))' }}>
                          {createdDate}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'hsl(var(--text-muted))' }}>
                          {campaign.createdBy || 'Debashis Roy (Sales Mgr)'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDropdown(campaign._id, e.currentTarget, cIdx >= Math.max(1, liquidationAutomations.length - 1));
                            }}
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            aria-label="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdownId === campaign._id && dropdownPos && (
                            <>
                              <div
                                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(null);
                                  setDropdownPos(null);
                                }}
                              />
                              <div
                                style={{
                                  position: 'fixed',
                                  right: `${dropdownPos.right}px`,
                                  top: dropdownPos.bottom ? 'auto' : `${dropdownPos.top}px`,
                                  bottom: dropdownPos.bottom || '',
                                  zIndex: 9999,
                                  backgroundColor: 'hsl(var(--bg-card))',
                                  border: '1px solid hsl(var(--border-color))',
                                  borderRadius: '8px',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  width: '150px',
                                  overflow: 'hidden'
                                }}
                              >
                                <button
                                  onClick={() => {
                                    handleEditCampaign(campaign._id);
                                    setActiveDropdownId(null);
                                    setDropdownPos(null);
                                  }}
                                  style={{
                                    padding: '10px 14px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    color: 'hsl(var(--text-primary))',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  <Edit3 size={14} /> Edit
                                </button>
                                {campaign.status !== 'active' ? (
                                  <button
                                    onClick={() => {
                                      handleActivateCampaign(campaign._id);
                                      setActiveDropdownId(null);
                                      setDropdownPos(null);
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      color: 'hsl(var(--success))',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <Play size={14} /> Activate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleStopCampaign(campaign._id);
                                      setActiveDropdownId(null);
                                      setDropdownPos(null);
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      color: 'hsl(var(--warning))',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <Square size={14} /> Stop
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleDeleteCampaign(campaign._id);
                                    setActiveDropdownId(null);
                                    setDropdownPos(null);
                                  }}
                                  style={{
                                    padding: '10px 14px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    color: 'hsl(var(--error))',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======== EMAIL BUILDER SUB-TAB ======== */}
      {workflowSubTab === 'templates' && (
        <div style={{ marginTop: '8px' }}>
          <TipTapTemplateEditor
            supplierId={supplierId}
            inventoryLots={inventoryList}
            apiBaseUrl={apiBaseUrl}
          />
        </div>
      )}

      {/* ======== SEND BROADCAST SUB-TAB ======== */}
      {workflowSubTab === 'broadcast' && (
        <div style={{ marginTop: '8px' }}>
          <SendBroadcastView
            supplierId={supplierId}
            inventoryLots={inventoryList}
            buyers={buyers}
            apiBaseUrl={apiBaseUrl}
          />
        </div>
      )}

      {/* ======== BUILDER SUB-TAB ======== */}

      {workflowSubTab === 'builder' && (
        <LiquidationAutomationStudio
          supplierId={supplierId}
          inventoryLots={inventoryList}
          buyers={buyers}
          apiBaseUrl={apiBaseUrl}
          editingCampaignId={editingCampaignId}
          onSuccess={(mode) => {
            dispatch(setEditingCampaignId(null));
            dispatch(fetchLiquidationAutomationsThunk(supplierId));
            if (mode === 'saved') {
              dispatch(setWorkflowSubTab('saved'));
            } else {
              dispatch(fetchAutomationRunsThunk(supplierId));
              dispatch(setWorkflowSubTab('runs'));
            }
          }}
        />
      )}

      {/* ======== RUNS & HISTORY SUB-TAB ======== */}
      {workflowSubTab === 'runs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Saved Workflow Lineage Filter Bar */}
          <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', border: '1px solid hsl(var(--border-color))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Filter size={16} style={{ color: 'hsl(var(--primary))' }} />
              <label htmlFor="workflow-filter-select" style={{ fontWeight: 700, fontSize: '0.84rem' }}>Filter Runs by Saved Workflow Strategy:</label>
              <select
                id="workflow-filter-select"
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="all">All Saved Workflows ({liquidationAutomations.length})</option>
                {liquidationAutomations.map((auto: any) => (
                  <option key={auto._id} value={auto._id}>
                    {auto.name || auto.templateName}
                  </option>
                ))}
              </select>
            </div>
            {selectedWorkflowId !== 'all' && (
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedWorkflowId('all')}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Clear Workflow Filter
              </button>
            )}
          </div>

          {/* Currently Active Runs Feed */}
          <div className="card" style={{ border: '1px solid hsl(var(--warning) / 40%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} style={{ color: 'hsl(var(--warning))' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Active Workflow Evaluations</h3>
                {loading && <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Refreshing...</span>}
              </div>
              {activeRuns.length > 0 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const newMap: Record<string, boolean> = {};
                      activeRuns.forEach(r => { newMap[r._id] = false; });
                      setCollapsedActiveRunIds(newMap);
                    }}
                    style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                  >
                    Expand All Cards
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const newMap: Record<string, boolean> = {};
                      activeRuns.forEach(r => { newMap[r._id] = true; });
                      setCollapsedActiveRunIds(newMap);
                    }}
                    style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                  >
                    Collapse All Cards
                  </button>
                </div>
              )}
            </div>

            {activeRuns.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                <Timer size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <div>No active workflow evaluations running{selectedWorkflowId !== 'all' ? ' for this strategy' : ''}.</div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Trigger a manual run or wait for scheduled automation dispatch.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeRuns.map(run => {
                  const linkedAuto = liquidationAutomations.find(a => a._id === (run.automationId?._id || run.automationId));
                  const timeLeftMs = new Date(run.evaluationEndsAt).getTime() - nowTime;
                  const isExpired = timeLeftMs <= 0;
                  const hoursLeft = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)));
                  const minutesLeft = Math.max(0, Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60)));
                  const secondsLeft = Math.max(0, Math.floor((timeLeftMs % (1000 * 60)) / 1000));

                  const runBids = allBids.filter((b: any) =>
                    run.snapshotInventoryIds?.some((lotId: string) => {
                      const bidLotId = b.inventoryLotId?._id || b.inventoryLotId;
                      return bidLotId === lotId;
                    })
                  );
                  const bestBidPrice = runBids.length > 0
                    ? Math.max(...runBids.map((b: any) => b.price || 0))
                    : null;

                  const isCardCollapsed = collapsedActiveRunIds[run._id] || false;

                  return (
                    <div
                      key={run._id}
                      style={{
                        padding: '16px',
                        backgroundColor: 'hsl(var(--bg-card-hover) / 20%)',
                        borderRadius: '10px',
                        border: '1px solid hsl(var(--warning) / 25%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'hsl(var(--warning))', animation: 'pulse 2s ease-in-out infinite' }}>⚡</span>
                            <span>{linkedAuto?.name || run.campaignSnapshot?.name || 'Workflow Run'}</span>
                            <button
                              type="button"
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid hsl(var(--primary) / 40%)',
                                backgroundColor: 'hsl(var(--primary) / 10%)',
                                color: 'hsl(var(--primary))',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              onClick={() => dispatch(setWorkflowSubTab('saved'))}
                              title="View saved workflow strategy card"
                            >
                              View Saved Strategy →
                            </button>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                            Run Type: {run.runType} | Dispatched: {new Date(run.dispatchedAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setCollapsedActiveRunIds(prev => ({ ...prev, [run._id]: !isCardCollapsed }))}
                            style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                          >
                            {isCardCollapsed ? 'Expand' : 'Collapse'}
                          </button>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: 'hsl(var(--warning) / 15%)',
                            color: 'hsl(var(--warning))',
                            fontWeight: 700
                          }}>
                            EVALUATING
                          </span>
                        </div>
                      </div>

                      {!isCardCollapsed && (
                        <>

                      {/* Metrics Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isExpired ? 'hsl(var(--error))' : 'hsl(var(--warning))' }}>
                            {isExpired ? 'EXPIRED' : `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Active Stage Countdown</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                            {runBids.length}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Bids Received</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: bestBidPrice ? 'hsl(var(--success))' : 'hsl(var(--text-muted))' }}>
                            {bestBidPrice ? `$${bestBidPrice.toFixed(2)}` : '--'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Best Bid/Case</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                            {run.snapshotInventoryIds?.length || 0}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Snapshot Lots</div>
                        </div>
                      </div>

                      {/* Active Campaign Multi-Stage Execution Pipeline */}
                      {(() => {
                        const primaryList = buyerLists.find((l: any) => l.type === 'primary');
                        const secondaryList = buyerLists.find((l: any) => l.type === 'secondary');
                        const rawStages = run.campaignSnapshot?.stages || linkedAuto?.stages || [];
                        const stagesList = Array.isArray(rawStages) && rawStages.length > 0 ? rawStages : [
                          {
                            stageIndex: 1,
                            name: `Stage 1: ${primaryList ? primaryList.name : 'Primary Buyers'}`,
                            buyerMode: 'list',
                            buyerListId: primaryList ? primaryList._id : 'primary',
                            buyerListName: primaryList ? primaryList.name : 'Primary Buyers',
                            waitHours: linkedAuto?.rules?.evaluationWindowHours || 24,
                            discountValue: 0
                          },
                          {
                            stageIndex: 2,
                            name: `Stage 2: Escalation & ${secondaryList ? secondaryList.name : 'Secondary Buyers'}`,
                            buyerMode: 'list',
                            buyerListId: secondaryList ? secondaryList._id : 'secondary',
                            buyerListName: secondaryList ? secondaryList.name : 'Secondary Buyers',
                            waitHours: 24,
                            discountValue: 15
                          }
                        ];

                        const currentStageIdx = run.currentStageIndex !== undefined ? run.currentStageIndex : 0;
                        const donationConfig = run.campaignSnapshot?.donationConfig || linkedAuto?.donationConfig;

                        return (
                          <div style={{
                            backgroundColor: 'hsl(var(--bg-card) / 70%)',
                            borderRadius: '8px',
                            border: '1px solid hsl(var(--border-color) / 60%)',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Layers size={14} style={{ color: 'hsl(var(--primary))' }} />
                                <span>Campaign Action Stage Pipeline</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', backgroundColor: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))' }}>
                                  Stage {Math.min(currentStageIdx + 1, stagesList.length)} of {stagesList.length} Active
                                </span>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                                Staged Waterfall Workflow
                              </span>
                            </div>

                            {/* Stage Stepper Horizontal Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stagesList.length + 1}, 1fr)`, gap: '10px', alignItems: 'stretch' }}>
                              {stagesList.map((stg: any, sIdx: number) => {
                                const isActive = sIdx === currentStageIdx;
                                const isPassed = sIdx < currentStageIdx;
                                const isPending = sIdx > currentStageIdx;

                                let statusBadge = { label: 'PENDING / QUEUED', bg: 'hsl(var(--bg-card))', color: 'hsl(var(--text-muted))', border: 'hsl(var(--border-color) / 60%)' };
                                if (isActive) {
                                  statusBadge = isExpired
                                    ? { label: '⚠️ WINDOW EXPIRED', bg: 'hsl(var(--error) / 15%)', color: 'hsl(var(--error))', border: 'hsl(var(--error) / 40%)' }
                                    : { label: '🟢 ACTIVE (WINDOW RUNNING)', bg: 'hsl(var(--warning) / 15%)', color: 'hsl(var(--warning))', border: 'hsl(var(--warning) / 40%)' };
                                } else if (isPassed) {
                                  statusBadge = { label: '✓ COMPLETED', bg: 'hsl(var(--success) / 15%)', color: 'hsl(var(--success))', border: 'hsl(var(--success) / 40%)' };
                                }

                                const buyerDesc = (() => {
                                  if (stg.buyerMode === 'custom') {
                                    return `${stg.customBuyers?.length || 0} Custom Buyers`;
                                  }
                                  const targetId = stg.buyerListId || stg.buyerSegment;
                                  const matched = buyerLists.find((l: any) => l._id === targetId || l.type === targetId);
                                  if (matched) {
                                    const count = getMatchedBuyerCount(matched);
                                    return `${matched.name} (${count} buyer${count !== 1 ? 's' : ''})`;
                                  }
                                  if (stg.buyerListName) return stg.buyerListName;
                                  if (stg.buyerSegment) return stg.buyerSegment.replace(/_/g, ' ');
                                  return 'All Buyers';
                                })();

                                const runExecutedAt = run.executedAt || run.dispatchedAt || run.createdAt;
                                let prevWaitHours = 0;
                                for (let i = 0; i < sIdx; i++) {
                                  prevWaitHours += (stagesList[i]?.waitHours || 24);
                                }
                                const stageExecutedAtDate = runExecutedAt ? new Date(new Date(runExecutedAt).getTime() + prevWaitHours * 60 * 60 * 1000) : null;
                                const stageExecutedAtFormatted = stageExecutedAtDate
                                  ? stageExecutedAtDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
                                  : '--';

                                return (
                                  <div
                                    key={stg.stageIndex || sIdx}
                                    style={{
                                      backgroundColor: isActive ? 'hsl(var(--warning) / 6%)' : 'hsl(223 47% 8%)',
                                      border: `1px solid ${statusBadge.border}`,
                                      borderRadius: '8px',
                                      padding: '10px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '6px',
                                      boxShadow: isActive ? '0 0 12px hsl(var(--warning) / 15%)' : 'none'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isActive ? 'hsl(var(--warning))' : 'hsl(var(--primary))' }}>
                                        STAGE {stg.stageIndex || sIdx + 1}
                                      </span>
                                      <span style={{
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '8px',
                                        backgroundColor: statusBadge.bg,
                                        color: statusBadge.color
                                      }}>
                                        {statusBadge.label}
                                      </span>
                                    </div>

                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                                      {stg.name || `Stage ${sIdx + 1}`}
                                    </div>

                                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: 'auto' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                        <span>Target Audience:</span>
                                        <strong style={{ color: 'hsl(var(--text-primary))', textTransform: 'capitalize' }}>{buyerDesc}</strong>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                        <span>Discount:</span>
                                        <strong style={{ color: stg.discountValue ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>
                                          {stg.discountValue ? `${stg.discountValue}% Off` : 'Standard'}
                                        </strong>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                        <span>Duration:</span>
                                        <strong>{formatDurationHours(stg.waitHours || 24)} Window</strong>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', paddingTop: '2px', borderTop: '1px dashed hsl(var(--border-color) / 40%)' }}>
                                        <span>Executed At:</span>
                                        <strong style={{ color: isActive ? 'hsl(var(--warning))' : isPassed ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}>
                                          {stageExecutedAtFormatted}
                                        </strong>
                                      </div>
                                    </div>

                                    {isActive && (
                                      <div style={{
                                        marginTop: '4px',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: isExpired ? 'hsl(var(--error) / 12%)' : 'hsl(var(--warning) / 12%)',
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        color: isExpired ? 'hsl(var(--error))' : 'hsl(var(--warning))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        <Clock size={12} />
                                        <span>{isExpired ? 'Window Expired' : `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s left`}</span>
                                      </div>
                                    )}

                                    {isPending && (
                                      <div style={{
                                        marginTop: '4px',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: 'hsl(var(--bg-card))',
                                        fontSize: '0.65rem',
                                        color: 'hsl(var(--text-muted))'
                                      }}>
                                        Waiting for Stage {sIdx} evaluation
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Fallback Node */}
                              <div style={{
                                backgroundColor: 'hsl(223 47% 8%)',
                                border: '1px dashed hsl(var(--border-color) / 70%)',
                                borderRadius: '8px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'hsl(var(--error))' }}>
                                    FALLBACK
                                  </span>
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '8px',
                                    backgroundColor: 'hsl(var(--bg-card))',
                                    color: 'hsl(var(--text-muted))'
                                  }}>
                                    UP NEXT
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                                  {donationConfig?.enabled !== false ? 'Auto-Donate / Markdown' : 'Escalate Review'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: 'auto' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', marginBottom: '4px' }}>
                                    <span>Executed At:</span>
                                    <strong style={{ color: 'hsl(var(--error))' }}>
                                      {run.evaluationEndsAt ? new Date(run.evaluationEndsAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : '--'}
                                    </strong>
                                  </div>
                                  <div>
                                    Triggers automatically if all buyer stages pass without award.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setExpandedRunBidsId(expandedRunBidsId === run._id ? null : run._id)}
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderColor: expandedRunBidsId === run._id ? 'hsl(var(--primary))' : undefined,
                            color: expandedRunBidsId === run._id ? 'hsl(var(--primary))' : undefined,
                            backgroundColor: expandedRunBidsId === run._id ? 'hsl(var(--primary) / 15%)' : undefined
                          }}
                        >
                          <Eye size={14} /> {expandedRunBidsId === run._id ? 'Hide Bids' : 'View Bids'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleForceExpireRun(run._id)}
                          style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--error))' }}
                        >
                          <AlertTriangle size={14} /> Force Expire & Donate
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setExpandedRunDetailsId(expandedRunDetailsId === run._id ? null : run._id)}
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderColor: expandedRunDetailsId === run._id ? 'hsl(var(--primary))' : undefined,
                            color: expandedRunDetailsId === run._id ? 'hsl(var(--primary))' : undefined,
                            backgroundColor: expandedRunDetailsId === run._id ? 'hsl(var(--primary) / 15%)' : undefined
                          }}
                        >
                          <Info size={14} /> {expandedRunDetailsId === run._id ? 'Hide Details' : 'Details'}
                        </button>
                      </div>

                      {/* Inline Bids Evaluation Table (In-place rendering without navigation) */}
                      {expandedRunBidsId === run._id && (
                        <div style={{
                          marginTop: '12px',
                          padding: '16px',
                          backgroundColor: 'hsl(223 47% 7%)',
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border-color))',
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                          animation: 'fadeIn 0.15s ease-in-out'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Eye size={14} /> Active Bids Evaluation Panel ({runBids.length})
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                              In-place Live Bid Inspector
                            </span>
                          </div>

                          {runBids.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.82rem', background: 'hsl(223 47% 9%)', borderRadius: '6px' }}>
                              No buyer bids have been submitted yet for the inventory lots in this evaluation run. Bids will render here in real-time as buyers submit offers.
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                                    <th style={{ padding: '8px' }}>Buyer Company / Email</th>
                                    <th style={{ padding: '8px' }}>Target SKU</th>
                                    <th style={{ padding: '8px' }}>Bid / Case</th>
                                    <th style={{ padding: '8px' }}>Quantity</th>
                                    <th style={{ padding: '8px' }}>Total Offer</th>
                                    <th style={{ padding: '8px' }}>Submitted</th>
                                    <th style={{ padding: '8px' }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {runBids.map((bid: any, bIdx: number) => {
                                    const buyerName = bid.buyerName || bid.companyName || bid.buyerId?.companyName || bid.buyerEmail || bid.buyerId?.email || 'Retail Buyer';
                                    const sku = bid.sku || bid.inventoryLotId?.sku || bid.lotNumber || 'Lot SKU';
                                    const price = bid.price || bid.bidPrice || 0;
                                    const cases = bid.quantityCases || bid.quantity || 0;
                                    const totalVal = price * cases;
                                    return (
                                      <tr key={bid._id || bIdx} style={{ borderBottom: '1px solid hsl(var(--border-color) / 30%)' }}>
                                        <td style={{ padding: '8px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{buyerName}</td>
                                        <td style={{ padding: '8px', color: 'hsl(var(--primary))', fontWeight: 600 }}>{sku}</td>
                                        <td style={{ padding: '8px', fontWeight: 700, color: 'hsl(var(--success))' }}>${price.toFixed(2)}</td>
                                        <td style={{ padding: '8px', fontWeight: 600 }}>{cases.toLocaleString()} cases</td>
                                        <td style={{ padding: '8px', fontWeight: 700 }}>${totalVal.toLocaleString()}</td>
                                        <td style={{ padding: '8px', color: 'hsl(var(--text-muted))' }}>{bid.createdAt ? new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</td>
                                        <td style={{ padding: '8px' }}>
                                          <span style={{
                                            padding: '3px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                                            backgroundColor: bid.status === 'accepted' ? 'hsl(var(--success) / 15%)' : 'hsl(var(--warning) / 15%)',
                                            color: bid.status === 'accepted' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                                          }}>
                                            {bid.status || 'pending'}
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
                      )}

                      {/* Inline Run Details Panel (In-place rendering without opening modal) */}
                      {expandedRunDetailsId === run._id && (
                        <div style={{
                          marginTop: '12px',
                          padding: '16px',
                          backgroundColor: 'hsl(223 47% 7%)',
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border-color))',
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                          animation: 'fadeIn 0.15s ease-in-out'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Info size={14} /> Automation Run Execution Details
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                              In-place Run Audit Panel
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.8rem', backgroundColor: 'hsl(223 47% 9%)', padding: '14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color)/40%)' }}>
                            <div>
                              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Run Identifier</div>
                              <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--primary))' }}>{run._id}</div>
                            </div>
                            <div>
                              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Linked Strategy</div>
                              <div style={{ fontWeight: 700 }}>{linkedAuto?.name || 'Workflow Automation'}</div>
                            </div>
                            <div>
                              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Dispatched At</div>
                              <div style={{ fontWeight: 600 }}>{new Date(run.dispatchedAt).toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Evaluation Window Ends</div>
                              <div style={{ fontWeight: 600 }}>{new Date(run.evaluationEndsAt).toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Execution Mode / Type</div>
                              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{run.runType || 'Scheduled'}</div>
                            </div>
                            <div>
                              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Snapshot Inventory Lots</div>
                              <div style={{ fontWeight: 600 }}>{run.snapshotInventoryIds?.length || 0} Lots</div>
                            </div>
                          </div>

                          {run.resolution && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'hsl(223 47% 9%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color)/40%)', fontSize: '0.8rem' }}>
                              <div style={{ fontWeight: 700, color: 'hsl(var(--warning))', marginBottom: '4px' }}>Resolution Audit Details:</div>
                              <pre style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-muted))', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(run.resolution, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Run History & Audit Log Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} style={{ color: 'hsl(var(--primary))' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Run History & Audit Log</h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))', fontWeight: 700 }}>
                  {historicalRuns.length} Logs
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {historicalRuns.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const newMap: Record<string, boolean> = {};
                        historicalRuns.forEach(r => { newMap[r._id] = false; });
                        setCollapsedHistoryRunIds(newMap);
                      }}
                      style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                    >
                      Expand All Cards
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const newMap: Record<string, boolean> = {};
                        historicalRuns.forEach(r => { newMap[r._id] = true; });
                        setCollapsedHistoryRunIds(newMap);
                      }}
                      style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                    >
                      Collapse All Cards
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['all', 'evaluating', 'awarded', 'fallback_executed', 'failed'] as const).map(filterVal => (
                    <button
                      key={filterVal}
                      className={`btn ${runsFilter === filterVal ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => dispatch(setRunsFilter(filterVal))}
                      style={{ fontSize: '0.7rem', padding: '4px 10px', textTransform: 'capitalize' }}
                    >
                      {filterVal === 'all' ? 'All' : filterVal === 'fallback_executed' ? 'Fallback' : filterVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {historicalRuns.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.82rem' }}>
                No completed or failed runs found{runsFilter !== 'all' ? ` for filter: ${runsFilter}` : ''}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historicalRuns.map(run => {
                  const linkedAuto = liquidationAutomations.find(a => a._id === (run.automationId?._id || run.automationId));
                  const isCollapsed = collapsedHistoryRunIds[run._id] || false;

                  const statusColorMap: Record<string, string> = {
                    awarded: 'hsl(var(--success))',
                    fallback_executed: 'hsl(var(--warning))',
                    failed: 'hsl(var(--error))',
                    dispatched: 'hsl(var(--primary))'
                  };
                  const statusColor = statusColorMap[run.status] || 'hsl(var(--text-muted))';

                  // Calculate bids & financial recovery metrics
                  const runBids = allBids.filter((b: any) =>
                    run.snapshotInventoryIds?.some((lotId: string) => {
                      const bidLotId = b.inventoryLotId?._id || b.inventoryLotId;
                      return bidLotId === lotId;
                    })
                  );

                  let winningBidPrice: number | null = null;
                  let totalCasesCount = run.resolution?.totalCases || 0;
                  let totalDollarValue = run.resolution?.totalValue || 0;

                  if (run.resolution) {
                    if (run.resolution.winningPrice) winningBidPrice = run.resolution.winningPrice;
                    if (run.resolution.action === 'auto_award' && !winningBidPrice && runBids.length > 0) {
                      winningBidPrice = Math.max(...runBids.map((b: any) => b.price || 0));
                    }
                  }

                  if (!totalDollarValue && winningBidPrice && totalCasesCount) {
                    totalDollarValue = winningBidPrice * totalCasesCount;
                  }

                  let resolutionSummary = '--';
                  if (run.resolution) {
                    const action = run.resolution.action;
                    if (action === 'auto_award') {
                      const buyer = run.resolution.targetBuyerId;
                      const buyerName = typeof buyer === 'object' ? (buyer?.companyName || buyer?.name || buyer?.company) : buyer;
                      resolutionSummary = `Awarded${buyerName ? ` to ${buyerName}` : ''}`;
                    } else if (action === 'auto_donate') {
                      resolutionSummary = 'Diverted to food bank donation';
                    } else if (action === 'yield_markdown') {
                      resolutionSummary = 'Yield markdown retry triggered';
                    } else if (action === 'escalate_review') {
                      resolutionSummary = 'Escalated for manual review';
                    } else if (action === 'hold_confirmation') {
                      resolutionSummary = 'Held for manual confirmation';
                    }
                  }

                  const activeDetailsTab = historyDetailsTabMap[run._id] || 'overview';

                  return (
                    <div
                      key={run._id}
                      data-testid="history-execution-card"
                      style={{
                        padding: '16px',
                        backgroundColor: 'hsl(var(--bg-card-hover) / 20%)',
                        borderRadius: '10px',
                        border: '1px solid hsl(var(--border-color) / 60%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Collapsible Card Header Summary Bar */}
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setCollapsedHistoryRunIds(prev => ({ ...prev, [run._id]: !isCollapsed }))}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            aria-label={isCollapsed ? 'Expand card' : 'Collapse card'}
                          >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{linkedAuto?.name || run.campaignSnapshot?.name || run.campaignSnapshot?.templateName || 'Saved Workflow'}</span>
                              <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', fontFamily: 'monospace' }}>
                                #{String(run._id).slice(-6).toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                              Dispatched: {new Date(run.dispatchedAt).toLocaleString()} | Execution Type: {run.runType || 'Scheduled'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {totalDollarValue > 0 && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--success))', backgroundColor: 'hsl(var(--success) / 10%)', padding: '3px 10px', borderRadius: '12px', border: '1px solid hsl(var(--success) / 30%)' }}>
                              ${totalDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Recovered
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: `${statusColor}15`,
                            color: statusColor,
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            {run.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Expanded View Content */}
                      {!isCollapsed && (
                        <>
                          {/* 4-Card Execution Metrics Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '4px' }}>
                            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                                {run.snapshotInventoryIds?.length || 0} Lots ({totalCasesCount ? `${totalCasesCount} cases` : 'Snapshot'})
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Snapshot Scope</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                                {runBids.length}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Total Bids Received</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: winningBidPrice ? 'hsl(var(--success))' : 'hsl(var(--text-muted))' }}>
                                {winningBidPrice ? `$${winningBidPrice.toFixed(2)}/case` : '--'}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Winning Bid Price</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'hsl(var(--bg-card) / 60%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color) / 50%)' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: totalDollarValue ? 'hsl(var(--success))' : 'hsl(var(--text-primary))' }}>
                                {totalDollarValue ? `$${totalDollarValue.toLocaleString()}` : '--'}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Total Recovery Value</div>
                            </div>
                          </div>

                          {/* Action Buttons Bar */}
                          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setExpandedRunBidsId(expandedRunBidsId === run._id ? null : run._id)}
                              style={{
                                fontSize: '0.78rem',
                                padding: '6px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderColor: expandedRunBidsId === run._id ? 'hsl(var(--primary))' : undefined,
                                color: expandedRunBidsId === run._id ? 'hsl(var(--primary))' : undefined,
                                backgroundColor: expandedRunBidsId === run._id ? 'hsl(var(--primary) / 15%)' : undefined
                              }}
                            >
                              <Eye size={14} /> {expandedRunBidsId === run._id ? 'Hide Bids' : `View Bids (${runBids.length})`}
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setExpandedRunDetailsId(expandedRunDetailsId === run._id ? null : run._id)}
                              style={{
                                fontSize: '0.78rem',
                                padding: '6px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderColor: expandedRunDetailsId === run._id ? 'hsl(var(--primary))' : undefined,
                                color: expandedRunDetailsId === run._id ? 'hsl(var(--primary))' : undefined,
                                backgroundColor: expandedRunDetailsId === run._id ? 'hsl(var(--primary) / 15%)' : undefined
                              }}
                            >
                              <Info size={14} /> {expandedRunDetailsId === run._id ? 'Hide Details' : 'Details'}
                            </button>
                          </div>

                          {/* Inline Bids Evaluation Table */}
                          {expandedRunBidsId === run._id && (
                            <div style={{
                              marginTop: '8px',
                              padding: '16px',
                              backgroundColor: 'hsl(223 47% 7%)',
                              borderRadius: '8px',
                              border: '1px solid hsl(var(--border-color))'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Eye size={14} /> Buyer Bids Log ({runBids.length})
                                </div>
                              </div>
                              {runBids.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.82rem' }}>
                                  No buyer bids were submitted during this run execution window.
                                </div>
                              ) : (
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                                        <th style={{ padding: '8px' }}>Buyer Company</th>
                                        <th style={{ padding: '8px' }}>Target SKU</th>
                                        <th style={{ padding: '8px' }}>Bid / Case</th>
                                        <th style={{ padding: '8px' }}>Quantity</th>
                                        <th style={{ padding: '8px' }}>Total Offer</th>
                                        <th style={{ padding: '8px' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {runBids.map((bid: any, bIdx: number) => {
                                        const buyerName = bid.buyerName || bid.companyName || bid.buyerId?.companyName || bid.buyerEmail || bid.buyerId?.email || 'Buyer';
                                        const sku = bid.sku || bid.inventoryLotId?.sku || 'Lot SKU';
                                        const price = bid.price || bid.bidPrice || 0;
                                        const cases = bid.quantityCases || bid.quantity || 0;
                                        return (
                                          <tr key={bid._id || bIdx} style={{ borderBottom: '1px solid hsl(var(--border-color) / 30%)' }}>
                                            <td style={{ padding: '8px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{buyerName}</td>
                                            <td style={{ padding: '8px', color: 'hsl(var(--primary))' }}>{sku}</td>
                                            <td style={{ padding: '8px', fontWeight: 700, color: 'hsl(var(--success))' }}>${price.toFixed(2)}</td>
                                            <td style={{ padding: '8px' }}>{cases.toLocaleString()} cases</td>
                                            <td style={{ padding: '8px', fontWeight: 700 }}>${(price * cases).toLocaleString()}</td>
                                            <td style={{ padding: '8px' }}>
                                              <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700, backgroundColor: bid.status === 'accepted' ? 'hsl(var(--success) / 15%)' : 'hsl(var(--warning) / 15%)', color: bid.status === 'accepted' ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                                                {bid.status || 'evaluated'}
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
                          )}

                          {/* Inline Multi-Tab Execution Details Panel */}
                          {expandedRunDetailsId === run._id && (
                            <div style={{
                              marginTop: '8px',
                              padding: '16px',
                              backgroundColor: 'hsl(223 47% 7%)',
                              borderRadius: '8px',
                              border: '1px solid hsl(var(--border-color))'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Info size={14} /> Execution Details & Audit Panel
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {(['overview', 'lots', 'stages', 'audit'] as const).map(tabKey => (
                                    <button
                                      key={tabKey}
                                      className={`btn ${activeDetailsTab === tabKey ? 'btn-primary' : 'btn-secondary'}`}
                                      onClick={() => setHistoryDetailsTabMap(prev => ({ ...prev, [run._id]: tabKey }))}
                                      style={{ fontSize: '0.68rem', padding: '3px 8px', textTransform: 'capitalize' }}
                                    >
                                      {tabKey === 'overview' ? 'Overview' : tabKey === 'lots' ? 'Target Lots' : tabKey === 'stages' ? 'Stage History' : 'Raw Audit'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {activeDetailsTab === 'overview' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.8rem', backgroundColor: 'hsl(223 47% 9%)', padding: '14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color)/40%)' }}>
                                  <div>
                                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Run Identifier</div>
                                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--primary))' }}>{run._id}</div>
                                  </div>
                                  <div>
                                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Linked Strategy</div>
                                    <div style={{ fontWeight: 700 }}>{linkedAuto?.name || run.campaignSnapshot?.name || 'Workflow Automation'}</div>
                                  </div>
                                  <div>
                                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Dispatched At</div>
                                    <div style={{ fontWeight: 600 }}>{new Date(run.dispatchedAt).toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Execution Mode</div>
                                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{run.runType || 'Scheduled'}</div>
                                  </div>
                                  <div>
                                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>Resolution Summary</div>
                                    <div style={{ fontWeight: 600 }}>{resolutionSummary}</div>
                                  </div>
                                </div>
                              )}

                              {activeDetailsTab === 'lots' && (
                                <div style={{ fontSize: '0.8rem', backgroundColor: 'hsl(223 47% 9%)', padding: '12px', borderRadius: '8px' }}>
                                  <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', marginBottom: '8px' }}>Snapshot Lot Identifiers ({run.snapshotInventoryIds?.length || 0}):</div>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {run.snapshotInventoryIds?.map((lotId: string, idx: number) => (
                                      <span key={idx} style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'hsl(var(--primary) / 15%)', color: 'hsl(var(--primary))', fontWeight: 600, fontSize: '0.72rem' }}>
                                        Lot ID: {lotId}
                                      </span>
                                    )) || <div>No snapshot lot IDs attached.</div>}
                                  </div>
                                </div>
                              )}

                              {activeDetailsTab === 'stages' && (
                                <div style={{ fontSize: '0.8rem', backgroundColor: 'hsl(223 47% 9%)', padding: '12px', borderRadius: '8px' }}>
                                  <div style={{ fontWeight: 700, marginBottom: '6px', color: 'hsl(var(--primary))' }}>Stage Progression Record:</div>
                                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                                    Run evaluated across {run.campaignSnapshot?.stages?.length || 2} campaign stage gates and executed final resolution action: <strong>{run.resolution?.action || run.status}</strong>.
                                  </div>
                                </div>
                              )}

                              {activeDetailsTab === 'audit' && (
                                <div style={{ padding: '12px', backgroundColor: 'hsl(223 47% 9%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color)/40%)', fontSize: '0.8rem' }}>
                                  <pre style={{ margin: 0, fontSize: '0.72rem', color: 'hsl(var(--text-muted))', whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(run.resolution || run, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Run Details Modal */}
      {showRunDetailsModal && selectedRunDetails && (
        <div
          className="modal-overlay"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => dispatch(setShowRunDetailsModal(false))}
        >
          <div
            className="card"
            style={{ maxWidth: '640px', width: '90%', maxHeight: '80vh', overflowY: 'auto', padding: '28px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => dispatch(setShowRunDetailsModal(false))}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={20} style={{ color: 'hsl(var(--primary))' }} />
              Automation Run Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div><strong>Run ID:</strong> {selectedRunDetails._id}</div>
              <div><strong>Dispatched:</strong> {new Date(selectedRunDetails.dispatchedAt).toLocaleString()}</div>
              <div><strong>Status:</strong> {selectedRunDetails.status}</div>
              {selectedRunDetails.resolution && (
                <div style={{ padding: '12px', backgroundColor: 'hsl(var(--bg-card-hover) / 40%)', borderRadius: '8px' }}>
                  <strong>Resolution Details:</strong>
                  <pre style={{ margin: '8px 0 0 0', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedRunDetails.resolution, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ SALES-FRIENDLY WORKFLOW EXECUTION AUDIT MODAL ════════════════════════ */}
      {inspectingRun && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))',
            borderRadius: '14px', width: '780px', maxWidth: '95vw', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(223 47% 7%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="hsl(var(--primary))" />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                    Workflow Execution Timeline Data Snapshot
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                    Executed At: <strong style={{ color: 'hsl(var(--primary))' }}>{new Date(inspectingRun.executedAt || inspectingRun.dispatchedAt || inspectingRun.createdAt).toLocaleString()}</strong> • Mode: <span style={{ textTransform: 'capitalize' }}>{inspectingRun.runType || 'scheduled'}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setInspectingRun(null)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body with 4 Structured Sales Sections */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Section 1: Affected Inventory Lots */}
              <div style={{ background: 'hsl(223 47% 9%)', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Box size={14} /> 1. Affected Inventory Lots ({inspectingRun.affectedInventoryLots?.length || inspectingRun.snapshotInventoryIds?.length || 0})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px' }}>Lot Number</th>
                      <th style={{ padding: '6px 8px' }}>SKU</th>
                      <th style={{ padding: '6px 8px' }}>Description</th>
                      <th style={{ padding: '6px 8px' }}>Cases</th>
                      <th style={{ padding: '6px 8px' }}>RSL</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inspectingRun.affectedInventoryLots || []).length > 0 ? (
                      inspectingRun.affectedInventoryLots.map((item: any, i: number) => {
                        const targetLotId = item.lotId?._id || item.lotId || (inspectingRun.snapshotInventoryIds && inspectingRun.snapshotInventoryIds[i]);
                        const matchedLot = inventoryList.find((l: any) => (l._id || l.id) === targetLotId);
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border-color)/30%)' }}>
                            <td style={{ padding: '8px', fontWeight: 700, color: 'hsl(var(--primary))' }}>{item.lotNumber || item.lotId || `LOT-${i+101}`}</td>
                            <td style={{ padding: '8px' }}>{item.sku || 'N/A'}</td>
                            <td style={{ padding: '8px' }}>{item.description || 'Surplus Inventory'}</td>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{(item.cases || 0).toLocaleString()} cases</td>
                            <td style={{ padding: '8px' }}>{((item.rsl || 0.10) * 100).toFixed(0)}% RSL</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              {matchedLot && onSelectLot ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInspectingRun(null);
                                    onSelectLot(matchedLot);
                                  }}
                                  style={{
                                    background: 'hsl(var(--primary)/0.15)',
                                    border: '1px solid hsl(var(--primary)/0.3)',
                                    color: 'hsl(var(--primary))',
                                    borderRadius: '4px',
                                    padding: '3px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  View Bids →
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '12px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>No affected inventory lot metadata recorded for this run.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 2: Targeted Buyer Email List */}
              <div style={{ background: 'hsl(223 47% 9%)', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> 2. Targeted Buyer Email List ({inspectingRun.buyerEmails?.length || 0})
                </div>
                {(inspectingRun.buyerEmails || []).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {inspectingRun.buyerEmails.map((email: string, i: number) => (
                      <span key={i} style={{ background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary)/0.3)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>No target buyer email addresses were recorded for this execution run.</div>
                )}
              </div>

              {/* Section 3: Campaign Settings Snapshot */}
              <div style={{ background: 'hsl(223 47% 9%)', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} /> 3. Frozen Campaign Settings & Rules Snapshot
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.72rem' }}>Strategy Name</div>
                    <div style={{ fontWeight: 700 }}>{inspectingRun.campaignSnapshot?.name || 'Clearance Strategy'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.72rem' }}>Template</div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{(inspectingRun.campaignSnapshot?.templateName || 'category_liquidation').replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.72rem' }}>Category Filter</div>
                    <div style={{ fontWeight: 600 }}>{inspectingRun.campaignSnapshot?.inventoryFilters?.category || 'All Categories'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.72rem' }}>Auto-Donation Diversion</div>
                    <div style={{ fontWeight: 600 }}>{inspectingRun.campaignSnapshot?.donationConfig?.enabled ? `Enabled (${inspectingRun.campaignSnapshot.donationConfig.maxCases} cases cap)` : 'Disabled'}</div>
                  </div>
                </div>
              </div>

              {/* Section 4: Resolution Outcome */}
              <div style={{ background: 'hsl(223 47% 9%)', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> 4. Execution Resolution Outcome
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  <div>Status: <span style={{ fontWeight: 700, textTransform: 'uppercase', color: inspectingRun.status === 'awarded' ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>{inspectingRun.status || 'evaluating'}</span></div>
                  {inspectingRun.resolution?.action && (
                    <div style={{ marginTop: '4px', color: 'hsl(var(--text-secondary))' }}>
                      Resolution Action: <strong style={{ color: '#fff' }}>{inspectingRun.resolution.action}</strong>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══ MATCHED SURPLUS INVENTORY SCOPE INSPECTION MODAL ════════════════════════ */}
      {inspectingMatchedCampaign && (() => {
        const scopeData = getCampaignMatchedScope(inspectingMatchedCampaign.inventoryFilters);
        const matchedLots = scopeData.matchedLots || [];
        const totalValue = matchedLots.reduce((acc: number, l: any) => {
          const cases = l.availableQty ?? l.quantityCases ?? 0;
          const unitCost = l.costPerCase || l.standardSellPrice || 10;
          return acc + (cases * unitCost);
        }, 0);

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))',
              borderRadius: '14px', width: '820px', maxWidth: '95vw', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(223 47% 7%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box size={20} color="hsl(var(--primary))" />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                      Matched Inventory Scope
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      Strategy: <strong style={{ color: 'hsl(var(--primary))' }}>{inspectingMatchedCampaign.name || 'Saved Campaign'}</strong> • Category Filter: <span style={{ textTransform: 'capitalize', color: '#fff' }}>{inspectingMatchedCampaign.inventoryFilters?.category || 'All Categories'}</span>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setInspectingMatchedCampaign(null)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Impact Summary Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '14px 20px', background: 'hsl(223 47% 9%)', borderBottom: '1px solid hsl(var(--border-color) / 50%)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>{scopeData.lotCount}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Matched Lots</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--success))' }}>{scopeData.caseCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Total Cases</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>${totalValue.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Est. COGS Value</div>
                </div>
              </div>

              {/* Modal Body: Table of matched lots */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                {matchedLots.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                    No active surplus inventory lots match this strategy's current filter criteria.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Lot Number</th>
                        <th style={{ padding: '8px' }}>SKU / Title</th>
                        <th style={{ padding: '8px' }}>Category</th>
                        <th style={{ padding: '8px' }}>Cases</th>
                        <th style={{ padding: '8px' }}>RSL %</th>
                        <th style={{ padding: '8px' }}>DC Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedLots.map((lot: any, idx: number) => {
                        const lotNum = lot.lotNumber || lot.lotId || `LOT-${idx + 101}`;
                        const sku = lot.productId?.sku || lot.sku || 'N/A';
                        const title = lot.productId?.name || lot.description || lot.productName || 'Surplus Item';
                        const category = lot.productId?.category || lot.category || 'General';
                        const cases = lot.availableQty ?? lot.quantityCases ?? 0;
                        const rslPct = ((lot.remainingShelfLife ?? 0.20) * 100).toFixed(0);
                        const location = lot.warehouseLocation || lot.dcLocation || 'Main DC';

                        return (
                          <tr key={lot._id || lot.id || idx} style={{ borderBottom: '1px solid hsl(var(--border-color) / 30%)' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 700, color: 'hsl(var(--primary))' }}>{lotNum}</td>
                            <td style={{ padding: '10px 8px' }}>
                              <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{title}</div>
                              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>SKU: {sku}</div>
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {category}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px', fontWeight: 700 }}>{cases.toLocaleString()} cases</td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{ color: Number(rslPct) <= 15 ? 'hsl(var(--warning))' : 'hsl(var(--success))', fontWeight: 700 }}>
                                {rslPct}% RSL
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px', color: 'hsl(var(--text-muted))' }}>{location}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ SAVED WORKFLOW STRATEGY STAGES & ACTION TIMELINE MODAL ════════════════ */}
      {inspectingCampaignStages && (() => {
        const c = inspectingCampaignStages;
        const evalHours = c.rules?.evaluationWindowHours || 24;
        const floorPrice = c.rules?.minimumBidFloorPrice || 12.0;
        const matchScore = c.rules?.minimumMatchScore || 70;
        const yieldPercent = c.rules?.minimumYieldRecoveryPercent || 40;
        const sched = c.schedule || {};
        const email = c.emailTemplate || {};

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))',
              borderRadius: '16px', width: '920px', maxWidth: '95vw', maxHeight: '88vh',
              display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(223 47% 7%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Layers size={22} color="hsl(var(--primary))" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                      Workflow Strategy Stage & Action Timeline
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      Strategy: <strong style={{ color: 'hsl(var(--primary))' }}>{c.name || c.templateName}</strong> • Template: <span style={{ textTransform: 'capitalize', color: '#fff' }}>{(c.templateName || 'custom').replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setInspectingCampaignStages(null)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Schedule & Timing Parameters Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '14px 24px', background: 'hsl(223 47% 9%)', borderBottom: '1px solid hsl(var(--border-color) / 50%)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 700 }}>Dispatch Schedule</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'hsl(var(--primary))', marginTop: '2px', textTransform: 'capitalize' }}>{sched.type || 'Immediate'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 700 }}>Timezone / Timing</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>{sched.timezone || 'UTC'} {sched.timeOfDay ? `@ ${sched.timeOfDay}` : ''}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 700 }}>Evaluation Window</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'hsl(var(--warning))', marginTop: '2px' }}>{formatDurationHours(evalHours)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 700 }}>Historic Dispatches</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'hsl(var(--success))', marginTop: '2px' }}>{c.stats?.totalRuns || 0} Runs ({c.stats?.totalAwarded || 0} Awarded)</div>
                </div>
              </div>

              {/* Modal Body: Interactive 3-Stage Pipeline */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Visual Pipeline Timeline Cards */}
                {(() => {
                  const primaryList = buyerLists.find((l: any) => l.type === 'primary');
                  const secondaryList = buyerLists.find((l: any) => l.type === 'secondary');
                  const dynamicStages = (Array.isArray(c.stages) && c.stages.length > 0) ? c.stages : [
                    {
                      stageIndex: 1,
                      name: `Stage 1: ${primaryList ? primaryList.name : 'Primary Buyers'}`,
                      buyerMode: 'list',
                      buyerListId: primaryList ? primaryList._id : 'primary',
                      buyerListName: primaryList ? primaryList.name : 'Primary Buyers',
                      discountType: 'fixed',
                      discountValue: 20,
                      waitHours: evalHours
                    },
                    {
                      stageIndex: 2,
                      name: `Stage 2: ${secondaryList ? secondaryList.name : 'Secondary Liquidators'}`,
                      buyerMode: 'list',
                      buyerListId: secondaryList ? secondaryList._id : 'secondary',
                      buyerListName: secondaryList ? secondaryList.name : 'Secondary Liquidators',
                      discountType: 'fixed',
                      discountValue: 40,
                      waitHours: 48
                    }
                  ];

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dynamicStages.length + 1}, 1fr)`, gap: '16px' }}>
                      {dynamicStages.map((stg: any, sIdx: number) => {
                        const buyerDesc = (() => {
                          if (stg.buyerMode === 'custom') {
                            return `${stg.customBuyers?.length || 0} Custom Buyers`;
                          }
                          const targetId = stg.buyerListId || stg.buyerSegment;
                          const matched = buyerLists.find((l: any) => l._id === targetId || l.type === targetId);
                          if (matched) {
                            const count = getMatchedBuyerCount(matched);
                            return `${matched.name} (${count} buyer${count !== 1 ? 's' : ''})`;
                          }
                          if (stg.buyerListName) return stg.buyerListName;
                          if (stg.buyerSegment) return stg.buyerSegment.replace(/_/g, ' ');
                          return 'All Buyers';
                        })();
                        const discountDesc = stg.discountType === 'yield'
                          ? 'AI Yield Recovery'
                          : stg.discountType === 'fixed'
                          ? `${stg.discountValue || 0}% Off`
                          : `$${stg.discountValue || 0}/case Floor`;

                        return (
                          <div key={stg.stageIndex || sIdx} style={{ background: 'hsl(223 47% 9%)', border: '1px solid hsl(var(--primary) / 35%)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', background: 'hsl(var(--primary) / 20%)', color: 'hsl(var(--primary))', fontWeight: 800 }}>
                                STAGE {stg.stageIndex || sIdx + 1}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                                Duration: {formatDurationHours(stg.waitHours || 24)}
                              </span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Zap size={16} style={{ color: 'hsl(var(--warning))' }} /> {stg.name || `Stage ${sIdx + 1}`}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>
                              Targeted buyer segment evaluation window with customized pricing rule & discount escalation.
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid hsl(var(--border-color) / 40%)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'hsl(var(--text-muted))' }}>Target Roster:</span>
                                <strong style={{ color: 'hsl(var(--primary))', textTransform: 'capitalize' }}>{buyerDesc}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'hsl(var(--text-muted))' }}>Discount / Strategy:</span>
                                <strong style={{ color: 'hsl(var(--warning))' }}>{discountDesc}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'hsl(var(--text-muted))' }}>Evaluation Window:</span>
                                <strong style={{ color: '#fff' }}>{formatDurationHours(stg.waitHours || 24)}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* FALLBACK GATE CARD */}
                      <div style={{ background: 'hsl(223 47% 9%)', border: '1px solid hsl(var(--error) / 35%)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', background: 'hsl(var(--error) / 20%)', color: 'hsl(var(--error))', fontWeight: 800 }}>
                            FALLBACK GATE
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Final Resolution</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={16} style={{ color: 'hsl(var(--error))' }} /> Resolution & Fallback Diversion
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>
                          Evaluates buyer offers upon completion of all stage windows. If no bid passes floor (${floorPrice.toFixed(2)}/case, min {matchScore}% match score), executes fallback.
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid hsl(var(--border-color) / 40%)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>Floor / Guardrail:</span>
                            <strong style={{ color: 'hsl(var(--success))' }}>${floorPrice.toFixed(2)}/case ({yieldPercent}% Yield)</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>On Success:</span>
                            <strong style={{ color: 'hsl(var(--success))', textTransform: 'capitalize' }}>{(c.rules?.onSuccess || 'auto_award').replace(/_/g, ' ')}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>On Fallback:</span>
                            <strong style={{ color: 'hsl(var(--warning))', textTransform: 'capitalize' }}>{(c.rules?.onFallback || 'auto_donate').replace(/_/g, ' ')}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Email Template Preview Box */}
                <div style={{ background: 'hsl(223 47% 9%)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-color))' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> Stage 1 Email Template & Message Payload
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
                    Subject: {email.subject || 'Liquidation Opportunity Notification'}
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'hsl(var(--text-muted))',
                    backgroundColor: 'hsl(223 47% 6%)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid hsl(var(--border-color) / 40%)'
                  }}>
                    {email.body || 'Dear Partner,\n\nWe have surplus inventory available for bidding:\n\n{{inventory_table}}\n\nPlease submit your bids prior to window expiration.'}
                  </div>
                </div>

                {/* Strategy Inventory Filters Box */}
                <div style={{ background: 'hsl(223 47% 9%)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-color))' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={14} /> Matched Inventory Filter Criteria
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Category Filter: </span>
                      <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{c.inventoryFilters?.category || 'All Categories'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Max Expiration (RSL): </span>
                      <strong style={{ color: '#fff' }}>{c.inventoryFilters?.maxDaysUntilExpiration ? `${c.inventoryFilters.maxDaysUntilExpiration} Days` : 'Any RSL'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Minimum Yield Target: </span>
                      <strong style={{ color: 'hsl(var(--success))' }}>{yieldPercent}%</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
