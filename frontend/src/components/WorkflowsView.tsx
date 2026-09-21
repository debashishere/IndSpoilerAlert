import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Cpu, Activity, Zap, Timer, Eye, AlertTriangle, Info, History, X, Layers,
  MoreVertical, Edit3, Play, Square, Trash2, Clock, Box, Mail, Sliders,
  CheckCircle2, Filter, ChevronDown, ChevronRight, Search, Plus, ArrowRight,
  Check, Sparkles, RefreshCw, Calendar, ShieldCheck, Tag, ExternalLink
} from 'lucide-react';
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
import { WorkflowRunHistoryView } from './WorkflowRunHistoryView';
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

  const reduxInventoryList = useSelector((state: RootState) => state.inventory?.inventoryList);
  const inventoryList = (reduxInventoryList && reduxInventoryList.length > 0) ? reduxInventoryList : inventoryLots;
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
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | 'active' | 'stopped' | 'draft'>('all');
  const [historyPopoverCampaignId, setHistoryPopoverCampaignId] = useState<string | null>(null);
  const [matchedScopeSearch, setMatchedScopeSearch] = useState('');

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
    dispatch(fetchBuyerLists(supplierId));
    dispatch(fetchCoreReferenceData({ supplierId }));
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

  const filteredCampaigns = useMemo(() => {
    return liquidationAutomations.filter((c: any) => {
      const status = c.status || 'draft';
      if (campaignStatusFilter !== 'all' && status !== campaignStatusFilter) {
        return false;
      }
      if (!campaignSearchQuery.trim()) return true;
      const q = campaignSearchQuery.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const template = (c.templateName || c.templateKey || '').toLowerCase();
      const category = (c.inventoryFilters?.category || '').toLowerCase();
      const author = (c.createdBy || '').toLowerCase();
      return name.includes(q) || template.includes(q) || category.includes(q) || author.includes(q);
    });
  }, [liquidationAutomations, campaignStatusFilter, campaignSearchQuery]);

  const campaignStats = useMemo(() => {
    const total = liquidationAutomations.length;
    const active = liquidationAutomations.filter((c: any) => c.status === 'active').length;
    const stopped = liquidationAutomations.filter((c: any) => c.status === 'stopped').length;
    const draft = liquidationAutomations.filter((c: any) => !c.status || c.status === 'draft').length;
    
    let totalLotsInScope = 0;
    let totalCasesInScope = 0;
    liquidationAutomations.forEach((c: any) => {
      const scope = getCampaignMatchedScope(c.inventoryFilters);
      totalLotsInScope += scope.lotCount;
      totalCasesInScope += scope.caseCount;
    });

    return { total, active, stopped, draft, totalLotsInScope, totalCasesInScope };
  }, [liquidationAutomations, inventoryList]);

  const renderStatusBadge = (status?: string) => {
    const currentStatus = status || 'draft';
    switch (currentStatus) {
      case 'active':
        return (
          <span className="badge status-badge-active" style={{
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
          <span className="badge status-badge-stopped" style={{
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
          <span className="badge status-badge-completed" style={{
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
          <span className="badge status-badge-draft" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'hsl(var(--bg-card-hover))',
            color: 'hsl(var(--text-muted))',
            border: '1px solid hsl(var(--border-color))',
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
        <span style={{
          background: 'hsl(var(--bg-card-hover) / 50%)',
          color: 'hsl(var(--text-muted))',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          border: '1px solid hsl(var(--border-color) / 40%)'
        }}>
          Not Active
        </span>
      );
    }

    if (campaign.nextRunAt) {
      const nextDate = new Date(campaign.nextRunAt);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            <span>{nextDate.toLocaleDateString()}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', paddingLeft: '16px' }}>
            {nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    }

    const sched = campaign.schedule;
    if (!sched || sched.type === 'immediate') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--primary) / 10%)',
          border: '1px solid hsl(var(--primary) / 25%)',
          padding: '3px 8px',
          borderRadius: '10px',
          fontSize: '0.74rem',
          fontWeight: 600
        }}>
          <Zap size={12} /> Immediate
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            <span>{dayNames || 'Weekly'}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', paddingLeft: '16px' }}>
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
              color: 'hsl(var(--text-primary))',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Executive KPI Metric Strip (Miller's Law 4-Tranche Overview) */}
          {liquidationAutomations.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsl(var(--primary) / 12%)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>
                    Total Strategies
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                    {campaignStats.total}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsl(var(--success) / 12%)', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>
                    Active Dispatchers
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, color: 'hsl(var(--success))', marginTop: '2px' }}>
                    {campaignStats.active}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsl(var(--primary) / 12%)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>
                    Inventory In Scope
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                    {campaignStats.totalCasesInScope.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--text-muted))' }}>cs</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsl(var(--warning) / 12%)', color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>
                    Live Executing Runs
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, color: activeRuns.length > 0 ? 'hsl(var(--warning))' : 'hsl(var(--text-primary))', marginTop: '2px' }}>
                    {activeRuns.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Saved Campaigns Table Container */}
          <div className="card" style={{ padding: '20px', borderRadius: '12px' }}>
            {/* Header with Title and Primary CTA */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'hsl(var(--primary) / 12%)',
                  color: 'hsl(var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'hsl(var(--text-primary))' }}>
                    Saved Campaign Strategies
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '1px' }}>
                    {liquidationAutomations.length} strategy campaign{liquidationAutomations.length !== 1 ? 's' : ''} saved
                  </div>
                </div>
              </div>

              {/* + New Campaign Strategy Primary CTA */}
              <button
                className="btn btn-primary"
                onClick={() => {
                  dispatch(setEditingCampaignId(null));
                  dispatch(setWorkflowSubTab('builder'));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                <span>New Campaign</span>
              </button>
            </div>

            {/* Ergonomic Search & Status Filter Toolbar */}
            {liquidationAutomations.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '8px',
                backgroundColor: 'hsl(var(--bg-card-hover) / 40%)',
                border: '1px solid hsl(var(--border-color) / 50%)'
              }}>
                {/* Search Input with Clear Button */}
                <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type="text"
                    value={campaignSearchQuery}
                    onChange={(e) => setCampaignSearchQuery(e.target.value)}
                    placeholder="Search campaigns by name, template..."
                    style={{
                      width: '100%',
                      padding: '7px 28px 7px 30px',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border-color))',
                      backgroundColor: 'hsl(var(--bg-card))',
                      color: 'hsl(var(--text-primary))',
                      outline: 'none'
                    }}
                  />
                  {campaignSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCampaignSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                      aria-label="Clear Search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginRight: '4px' }}>
                    Status:
                  </span>
                  {[
                    { id: 'all', label: 'All', count: campaignStats.total },
                    { id: 'active', label: 'Active Pipelines', count: campaignStats.active },
                    { id: 'stopped', label: 'Stopped Pipelines', count: campaignStats.stopped },
                    { id: 'draft', label: 'Draft Pipelines', count: campaignStats.draft }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCampaignStatusFilter(tab.id as any)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: campaignStatusFilter === tab.id ? 700 : 500,
                        border: campaignStatusFilter === tab.id ? '1px solid hsl(var(--primary))' : '1px solid transparent',
                        background: campaignStatusFilter === tab.id ? 'hsl(var(--primary) / 15%)' : 'transparent',
                        color: campaignStatusFilter === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        background: campaignStatusFilter === tab.id ? 'hsl(var(--primary) / 25%)' : 'hsl(var(--border-color) / 50%)',
                        color: campaignStatusFilter === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7 UI States: Loading / Zero Total Empty / Filter Empty / Ideal Table */}
            {loading && liquidationAutomations.length === 0 ? (
              <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: '52px',
                    borderRadius: '8px',
                    backgroundColor: 'hsl(var(--bg-card-hover) / 50%)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                ))}
              </div>
            ) : liquidationAutomations.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'hsl(var(--primary) / 12%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--primary))'
                }}>
                  <Layers size={28} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'hsl(var(--text-primary))' }}>
                    No saved campaigns found.
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', maxWidth: '440px', marginTop: '4px', lineHeight: 1.4 }}>
                    Click "+ New Campaign" above to create and save a new liquidation strategy.
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    dispatch(setEditingCampaignId(null));
                    dispatch(setWorkflowSubTab('builder'));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    marginTop: '6px'
                  }}
                >
                  <Plus size={16} />
                  <span>Create First Campaign Strategy</span>
                </button>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Filter size={32} style={{ opacity: 0.4, color: 'hsl(var(--text-muted))' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--text-primary))' }}>
                  No matching campaign strategies
                </div>
                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
                  No saved campaigns matched your current search and filter criteria.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCampaignSearchQuery('');
                    setCampaignStatusFilter('all');
                  }}
                  style={{
                    marginTop: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    border: '1px solid hsl(var(--border-color))',
                    background: 'hsl(var(--bg-card))',
                    color: 'hsl(var(--primary))',
                    cursor: 'pointer'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid hsl(var(--border-color))', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Campaign Name & Template</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Matched Inventory</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ExecutedAt</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Run Time</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created At</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created By</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign: any, cIdx: number) => {
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
                            borderBottom: '1px solid hsl(var(--border-color) / 40%)',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover) / 40%)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            <div
                              style={{ fontWeight: 700, fontSize: '0.88rem', color: 'hsl(var(--primary))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                              onClick={() => setInspectingCampaignStages(campaign)}
                              title="Click to view Strategy Stage Pipeline & Action Breakdown"
                            >
                              <span>{campaign.name || formattedTemplate}</span>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: 'hsl(var(--primary) / 12%)',
                                border: '1px solid hsl(var(--primary) / 28%)',
                                color: 'hsl(var(--primary))',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                Stages →
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>
                                {formattedTemplate}
                              </span>
                              {campaign.inventoryFilters?.category && (
                                <span style={{
                                  fontSize: '0.66rem',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: 'hsl(var(--bg-card-hover))',
                                  color: 'hsl(var(--text-muted))',
                                  border: '1px solid hsl(var(--border-color) / 40%)',
                                  textTransform: 'capitalize'
                                }}>
                                  {campaign.inventoryFilters.category}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {renderStatusBadge(campaign.status)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', color: 'hsl(var(--text-primary))' }}>
                                  {scope.lotCount} <span style={{ fontWeight: 500, fontFamily: 'inherit', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>lots</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontFamily: 'monospace' }}>
                                  {scope.caseCount.toLocaleString()} cases
                                </div>
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
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Inspect Matched Inventory Scope"
                              >
                                <Eye size={13} /> View
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {campaignRuns.length === 0 ? (
                              <span style={{
                                background: 'hsl(var(--bg-card-hover) / 50%)',
                                color: 'hsl(var(--text-muted))',
                                border: '1px solid hsl(var(--border-color) / 40%)',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                Never Executed
                              </span>
                            ) : campaignRuns.length === 1 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-primary))', fontWeight: 600 }}>
                                  {new Date(campaignRuns[0].executedAt || campaignRuns[0].dispatchedAt || campaignRuns[0].createdAt).toLocaleDateString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleInspectRun(campaignRuns[0]._id)}
                                  style={{
                                    background: 'hsl(var(--primary) / 10%)',
                                    border: '1px solid hsl(var(--primary) / 25%)',
                                    color: 'hsl(var(--primary))',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    padding: '2px 5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}
                                  title="Inspect Execution Timeline Data"
                                  aria-label="Inspect Run Data"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ position: 'relative' }}>
                                <button
                                  type="button"
                                  onClick={() => setHistoryPopoverCampaignId(historyPopoverCampaignId === campaign._id ? null : campaign._id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: 'hsl(var(--primary) / 10%)',
                                    border: '1px solid hsl(var(--primary) / 30%)',
                                    color: 'hsl(var(--primary))',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  aria-label="Select Execution Timestamp"
                                >
                                  <History size={12} />
                                  <span>{campaignRuns.length} Runs</span>
                                  <ChevronDown size={12} />
                                </button>

                                {historyPopoverCampaignId === campaign._id && (
                                  <>
                                    <div
                                      style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                                      onClick={() => setHistoryPopoverCampaignId(null)}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: '100%',
                                      marginTop: '4px',
                                      zIndex: 9999,
                                      backgroundColor: 'hsl(var(--bg-card))',
                                      border: '1px solid hsl(var(--border-color))',
                                      borderRadius: '8px',
                                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                      width: '210px',
                                      maxHeight: '180px',
                                      overflowY: 'auto',
                                      padding: '4px 0'
                                    }}>
                                      <div style={{ padding: '6px 10px', fontSize: '0.68rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border-color) / 40%)' }}>
                                        Execution Runs ({campaignRuns.length})
                                      </div>
                                      {campaignRuns.map((r: any) => (
                                        <button
                                          key={r._id}
                                          type="button"
                                          onClick={() => {
                                            handleInspectRun(r._id);
                                            setHistoryPopoverCampaignId(null);
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '7px 10px',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            color: 'hsl(var(--text-primary))',
                                            fontSize: '0.74rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '6px'
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover))')}
                                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                          <span>{new Date(r.executedAt || r.dispatchedAt || r.createdAt).toLocaleDateString()}</span>
                                          <span style={{ fontSize: '0.68rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <Eye size={11} /> View
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {renderNextRunTime(campaign)}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'hsl(var(--text-muted))' }}>
                            {createdDate}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'hsl(var(--text-muted))' }}>
                            {campaign.createdBy || 'Sales Mgr'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDropdown(campaign._id, e.currentTarget, cIdx >= Math.max(1, filteredCampaigns.length - 1));
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
                                    borderRadius: '10px',
                                    boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '160px',
                                    overflow: 'hidden',
                                    padding: '4px 0'
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      handleEditCampaign(campaign._id);
                                      setActiveDropdownId(null);
                                      setDropdownPos(null);
                                    }}
                                    style={{
                                      padding: '9px 14px',
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
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover))')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                                        padding: '9px 14px',
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
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover))')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                                        padding: '9px 14px',
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
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover))')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                      <Square size={14} /> Stop
                                    </button>
                                  )}
                                  <div style={{ height: '1px', backgroundColor: 'hsl(var(--border-color) / 40%)', margin: '3px 0' }} />
                                  <button
                                    onClick={() => {
                                      handleDeleteCampaign(campaign._id);
                                      setActiveDropdownId(null);
                                      setDropdownPos(null);
                                    }}
                                    style={{
                                      padding: '9px 14px',
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
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--error) / 10%)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
        <WorkflowRunHistoryView
          supplierId={supplierId}
          liquidationAutomations={liquidationAutomations}
          automationRuns={automationRuns}
          inventoryList={inventoryList}
          allBids={allBids}
          allBuyers={allBuyers}
          buyerLists={buyerLists}
          loading={loading}
          onForceExpireRun={(runId) => {
            dispatch(forceExpireRunThunk(runId));
          }}
          onEditCampaign={(campaignId) => {
            dispatch(setEditingCampaignId(campaignId));
            dispatch(setWorkflowSubTab('builder'));
          }}
          onSelectLot={onSelectLot}
        />
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--bg-card))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="hsl(var(--primary))" />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'hsl(var(--text-primary))' }}>
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
              <div style={{ background: 'hsl(var(--bg-card))', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
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
              <div style={{ background: 'hsl(var(--bg-card))', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
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
              <div style={{ background: 'hsl(var(--bg-card))', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
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
              <div style={{ background: 'hsl(var(--bg-card))', padding: '14px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> 4. Execution Resolution Outcome
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  <div>Status: <span style={{ fontWeight: 700, textTransform: 'uppercase', color: inspectingRun.status === 'awarded' ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>{inspectingRun.status || 'evaluating'}</span></div>
                  {inspectingRun.resolution?.action && (
                    <div style={{ marginTop: '4px', color: 'hsl(var(--text-secondary))' }}>
                      Resolution Action: <strong style={{ color: 'hsl(var(--text-primary))' }}>{inspectingRun.resolution.action}</strong>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Ergonomic Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid hsl(var(--border-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'hsl(var(--bg-card))'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                Run Snapshot ID: <strong style={{ color: 'hsl(var(--primary))' }}>{inspectingRun._id || inspectingRun.runId}</strong>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInspectingRun(null)}
                style={{ padding: '7px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '8px' }}
              >
                Close
              </button>
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

        const filteredScopeLots = matchedLots.filter((l: any) => {
          if (!matchedScopeSearch.trim()) return true;
          const q = matchedScopeSearch.toLowerCase();
          const lotNum = (l.lotNumber || l.lotId || '').toLowerCase();
          const sku = (l.productId?.sku || l.sku || '').toLowerCase();
          const title = (l.productId?.name || l.description || l.productName || '').toLowerCase();
          const category = (l.productId?.category || l.category || '').toLowerCase();
          const location = (l.warehouseLocation || l.dcLocation || '').toLowerCase();
          return lotNum.includes(q) || sku.includes(q) || title.includes(q) || category.includes(q) || location.includes(q);
        });

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))',
              borderRadius: '14px', width: '840px', maxWidth: '95vw', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--bg-card))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'hsl(var(--primary) / 12%)',
                    color: 'hsl(var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Box size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'hsl(var(--text-primary))' }}>
                      Matched Inventory Scope & Bidding Audit
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      Strategy: <strong style={{ color: 'hsl(var(--primary))' }}>{inspectingMatchedCampaign.name || 'Saved Campaign'}</strong> • Category Filter: <span style={{ textTransform: 'capitalize', color: 'hsl(var(--text-primary))' }}>{inspectingMatchedCampaign.inventoryFilters?.category || 'All Categories'}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInspectingMatchedCampaign(null);
                    setMatchedScopeSearch('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '6px' }}
                  aria-label="Close Scope Modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Impact Summary Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '14px 20px', background: 'hsl(var(--bg-card-hover) / 30%)', borderBottom: '1px solid hsl(var(--border-color) / 50%)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'hsl(var(--primary))' }}>{scopeData.lotCount}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Matched Lots</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'hsl(var(--success))' }}>{scopeData.caseCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Total Cases</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'hsl(var(--text-primary))' }}>${totalValue.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Est. COGS Value</div>
                </div>
              </div>

              {/* In-Modal Filter / Search Bar */}
              {matchedLots.length > 0 && (
                <div style={{ padding: '10px 20px', borderBottom: '1px solid hsl(var(--border-color) / 40%)', backgroundColor: 'hsl(var(--bg-card))' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                    <input
                      type="text"
                      value={matchedScopeSearch}
                      onChange={(e) => setMatchedScopeSearch(e.target.value)}
                      placeholder="Filter matched lots by SKU, title, lot number, or DC..."
                      style={{
                        width: '100%',
                        padding: '6px 28px 6px 30px',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid hsl(var(--border-color))',
                        backgroundColor: 'hsl(var(--bg-card))',
                        color: 'hsl(var(--text-primary))',
                        outline: 'none'
                      }}
                    />
                    {matchedScopeSearch && (
                      <button
                        type="button"
                        onClick={() => setMatchedScopeSearch('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'hsl(var(--text-muted))',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Body: Table of matched lots */}
              <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
                {matchedLots.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                    No active surplus inventory lots match this strategy's current filter criteria.
                  </div>
                ) : filteredScopeLots.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.82rem' }}>
                    No lots match "{matchedScopeSearch}". <button type="button" onClick={() => setMatchedScopeSearch('')} style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lot Number</th>
                        <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SKU / Title</th>
                        <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                        <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cases</th>
                        <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>RSL %</th>
                        <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DC Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScopeLots.map((lot: any, idx: number) => {
                        const lotNum = lot.lotNumber || lot.lotId || `LOT-${idx + 101}`;
                        const sku = lot.productId?.sku || lot.sku || 'N/A';
                        const title = lot.productId?.name || lot.description || lot.productName || 'Surplus Item';
                        const category = lot.productId?.category || lot.category || 'General';
                        const cases = lot.availableQty ?? lot.quantityCases ?? 0;
                        const rslPct = ((lot.remainingShelfLife ?? 0.20) * 100).toFixed(0);
                        const location = lot.warehouseLocation || lot.dcLocation || 'Main DC';

                        return (
                          <tr
                            key={lot._id || lot.id || idx}
                            style={{ borderBottom: '1px solid hsl(var(--border-color) / 30%)', transition: 'background-color 0.15s ease' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover) / 40%)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '10px', fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--primary))' }}>{lotNum}</td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{title}</div>
                              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>SKU: {sku}</div>
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {category}
                              </span>
                            </td>
                            <td style={{ padding: '10px', fontWeight: 700, fontFamily: 'monospace' }}>{cases.toLocaleString()} cases</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ color: Number(rslPct) <= 15 ? 'hsl(var(--warning))' : 'hsl(var(--success))', fontWeight: 700 }}>
                                {rslPct}% RSL
                              </span>
                            </td>
                            <td style={{ padding: '10px', color: 'hsl(var(--text-muted))' }}>{location}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Ergonomic Modal Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid hsl(var(--border-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'hsl(var(--bg-card))'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Showing {filteredScopeLots.length} of {scopeData.lotCount} matched surplus lots
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setInspectingMatchedCampaign(null);
                      setMatchedScopeSearch('');
                    }}
                    style={{ padding: '7px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '8px' }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const targetId = inspectingMatchedCampaign._id;
                      setInspectingMatchedCampaign(null);
                      setMatchedScopeSearch('');
                      handleEditCampaign(targetId);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px' }}
                  >
                    <Sliders size={14} /> Adjust Filter Rules in Builder
                  </button>
                </div>
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
              <div style={{ padding: '18px 24px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--bg-card))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'hsl(var(--primary) / 12%)',
                    color: 'hsl(var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'hsl(var(--text-primary))' }}>
                      Strategy Action Breakdown & Stage Pipeline
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      Strategy: <strong style={{ color: 'hsl(var(--primary))' }}>{c.name || c.templateName}</strong> • Template: <span style={{ textTransform: 'capitalize', color: 'hsl(var(--text-primary))' }}>{(c.templateName || 'custom').replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setInspectingCampaignStages(null)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Schedule & Timing Parameters Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '14px 24px', background: 'hsl(var(--bg-card-hover) / 30%)', borderBottom: '1px solid hsl(var(--border-color) / 50%)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 700 }}>Dispatch Schedule</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'hsl(var(--primary))', marginTop: '2px', textTransform: 'capitalize' }}>{sched.type || 'Immediate'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 700 }}>Timezone / Timing</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-primary))', marginTop: '2px' }}>{sched.timezone || 'UTC'} {sched.timeOfDay ? `@ ${sched.timeOfDay}` : ''}</div>
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

              {/* Modal Body: Interactive Multi-Stage Pipeline */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Visual Pipeline Timeline Cards with Sequential Flow Connectors */}
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
                    <div style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      gap: '12px',
                      overflowX: 'auto',
                      paddingBottom: '6px'
                    }}>
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
                          <React.Fragment key={stg.stageIndex || sIdx}>
                            <div style={{
                              flex: '1 1 240px',
                              minWidth: '220px',
                              background: 'hsl(var(--bg-card))',
                              border: '1px solid hsl(var(--primary) / 35%)',
                              borderRadius: '12px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', background: 'hsl(var(--primary) / 20%)', color: 'hsl(var(--primary))', fontWeight: 800 }}>
                                  STAGE {stg.stageIndex || sIdx + 1}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                                  Duration: {formatDurationHours(stg.waitHours || 24)}
                                </span>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                  <strong style={{ color: 'hsl(var(--text-primary))' }}>{formatDurationHours(stg.waitHours || 24)}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Sequential Waterfall Flow Connector */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--primary))', opacity: 0.6, flexShrink: 0 }}>
                              <ChevronRight size={22} />
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {/* FALLBACK GATE CARD */}
                      <div style={{
                        flex: '1 1 240px',
                        minWidth: '220px',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--error) / 35%)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', background: 'hsl(var(--error) / 20%)', color: 'hsl(var(--error))', fontWeight: 800 }}>
                            FALLBACK GATE
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Final Resolution</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

                {/* Email Template Preview Box with dynamic tokens */}
                <div style={{ background: 'hsl(var(--bg-card))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-color))' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> Stage 1 Email Template & Message Payload
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-primary))', fontWeight: 600, marginBottom: '6px' }}>
                    Subject: {email.subject || 'Liquidation Opportunity Notification'}
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'hsl(var(--text-muted))',
                    backgroundColor: 'hsl(var(--bg-card-hover) / 40%)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid hsl(var(--border-color) / 40%)',
                    lineHeight: '1.6'
                  }}>
                    {email.body || 'Dear Partner,\n\nWe have surplus inventory available for bidding:\n\n{{inventory_table}}\n\nPlease submit your bids prior to window expiration.'}
                  </div>
                </div>

                {/* Strategy Inventory Filters Box */}
                <div style={{ background: 'hsl(var(--bg-card))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-color))' }}>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-primary))', fontWeight: 600, marginBottom: '8px' }}>
                    Strategy Filter Parameters:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '0.78rem' }}>
                    <div style={{ padding: '8px 12px', background: 'hsl(var(--bg-card-hover) / 30%)', borderRadius: '6px', border: '1px solid hsl(var(--border-color) / 30%)' }}>
                      <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.7rem' }}>Category</span>
                      <strong style={{ color: 'hsl(var(--text-primary))', textTransform: 'capitalize', fontSize: '0.85rem' }}>{c.inventoryFilters?.category || 'All Categories'}</strong>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'hsl(var(--bg-card-hover) / 30%)', borderRadius: '6px', border: '1px solid hsl(var(--border-color) / 30%)' }}>
                      <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.7rem' }}>Expiration Cutoff</span>
                      <strong style={{ color: 'hsl(var(--text-primary))', fontSize: '0.85rem' }}>{c.inventoryFilters?.maxDaysUntilExpiration ? `${c.inventoryFilters.maxDaysUntilExpiration} Days` : 'Any RSL'}</strong>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'hsl(var(--bg-card-hover) / 30%)', borderRadius: '6px', border: '1px solid hsl(var(--border-color) / 30%)' }}>
                      <span style={{ color: 'hsl(var(--text-muted))', display: 'block', fontSize: '0.7rem' }}>Minimum Yield Target</span>
                      <strong style={{ color: 'hsl(var(--success))', fontSize: '0.85rem' }}>{yieldPercent}%</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Ergonomic Modal Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid hsl(var(--border-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'hsl(var(--bg-card))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Status:</span>
                  {renderStatusBadge(c.status)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setInspectingCampaignStages(null)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '8px' }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const targetId = c._id;
                      setInspectingCampaignStages(null);
                      handleEditCampaign(targetId);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px' }}
                  >
                    <Edit3 size={14} /> Edit in Campaign Builder
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
