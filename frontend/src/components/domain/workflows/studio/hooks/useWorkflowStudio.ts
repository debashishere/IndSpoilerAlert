import { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../../../store/hooks';
import {
  selectBuyerLists,
  fetchBuyerLists,
  fetchCoreReferenceData
} from '../../../../../store/slices/coreSlice';
import {
  setEditingCampaignId,
  calculateLotRsl
} from '../../../../../store/slices/workflowSlice';
import { useOAuthMailbox } from '../../../../../hooks/useOAuthMailbox';
import type {
  LiquidationAutomationStudioProps,
  Stage
} from '../types/studio.types';
import {
  TEMPLATE_DEFINITIONS,
  DEFAULT_EMAIL_BODY_HTML
} from '../constants/studioConstants';
import {
  compileFrontendCron,
  getStageBuyerCount,
  getStageValidationErrors,
  resolveStagesWithBuyerLists
} from '../utils/studioCalculations';

export function useWorkflowStudio(props: LiquidationAutomationStudioProps) {
  const {
    supplierId,
    inventoryLots = [],
    buyers = [],
    apiBaseUrl = '/api',
    editingCampaignId = null,
    automationRuns,
    onSuccess,
    onCancel,
  } = props;

  const oauth = useOAuthMailbox(supplierId);

  let reduxBuyerLists: any[] = [];
  try {
    reduxBuyerLists = useAppSelector(selectBuyerLists) || [];
  } catch {
    reduxBuyerLists = [];
  }

  let reduxAutomationRuns: any[] = [];
  try {
    reduxAutomationRuns = useAppSelector((state: any) => state.workflow?.automationRuns) || [];
  } catch {
    reduxAutomationRuns = [];
  }

  let dispatch: any;
  try {
    dispatch = useDispatch();
  } catch {
    dispatch = () => {};
  }

  useEffect(() => {
    if (dispatch) {
      dispatch(fetchBuyerLists() as any);
      dispatch(fetchCoreReferenceData() as any);
    }
  }, [dispatch]);

  // Template & Campaign Cycle Metadata
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('default');
  const [centralTemplates, setCentralTemplates] = useState<any[]>([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [showTemplateDrop, setShowTemplateDrop] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (supplierId) {
      fetch(`${apiBaseUrl}/email-templates?supplierId=${supplierId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.templates) {
            setCentralTemplates(data.templates);
          }
        })
        .catch((err) => console.error('Failed to fetch central email templates:', err));
    }
  }, [supplierId, apiBaseUrl]);

  // Inventory filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [maxRslFilter, setMaxRslFilter] = useState(0.20);
  const [minCasesFilter, setMinCasesFilter] = useState(10);
  const [explicitLotIds, setExplicitLotIds] = useState<string[]>([]);
  const [excludedLotIds, setExcludedLotIds] = useState<string[]>([]);
  const [selectorMode, setSelectorMode] = useState<'automatic' | 'explicit' | 'hybrid'>('automatic');
  const [showLotGrid, setShowLotGrid] = useState(true);
  const [fetchedLots, setFetchedLots] = useState<any[] | null>(null);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);
  const [lotSearch, setLotSearch] = useState('');
  const [lotDcFilter, setLotDcFilter] = useState('');
  const [lotCoaFilter, setLotCoaFilter] = useState('all');

  // Stages — own their own audience
  const [stages, setStages] = useState<Stage[]>(TEMPLATE_DEFINITIONS[0].defaultStages);
  const [expandedStageIdx, setExpandedStageIdx] = useState<number | null>(0);

  // Execution
  const [executionType, setExecutionType] = useState<'immediate' | 'cron'>('immediate');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [workflowTimezone, setWorkflowTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
  const [cronDays, setCronDays] = useState<number[]>([1]);
  const [cronExpression, setCronExpression] = useState<string>('');
  const [isSchedulePopoverOpen, setIsSchedulePopoverOpen] = useState<boolean>(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  // Scope Mode Info Popover state
  const [activeScopeInfoPopover, setActiveScopeInfoPopover] = useState<'dynamic' | 'pinned' | null>(null);
  const scopeInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeScopeInfoPopover) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (scopeInfoRef.current && !scopeInfoRef.current.contains(event.target as Node)) {
        setActiveScopeInfoPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeScopeInfoPopover]);

  useEffect(() => {
    if (!isSchedulePopoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (scheduleRef.current && !scheduleRef.current.contains(event.target as Node)) {
        setIsSchedulePopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSchedulePopoverOpen]);

  // Stage Email Modal state
  const [_activeStageEmailEditorIdx, _setActiveStageEmailEditorIdx] = useState<number | null>(null);
  const [openStageEmailModalIdx, setOpenStageEmailModalIdx] = useState<number | null>(null);

  // Target Buyer Segment Inspection state
  const [inspectingSegment, setInspectingSegment] = useState<string | null>(null);
  const [inspectSearch, setInspectSearch] = useState<string>('');

  useEffect(() => {
    if (!inspectingSegment) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [inspectingSegment]);

  // Feature flag for Section 5
  const SHOW_DYNAMIC_DONATION_SECTION = false;

  // Dynamic Donation & Multi-Entity Diversion Configuration
  const [donationEnabled, setDonationEnabled] = useState<boolean>(true);
  const [donationMaxCases, setDonationMaxCases] = useState<number>(500);
  const [donationDiversionStrategy, setDonationDiversionStrategy] = useState<'percentage_split' | 'priority_cascade'>('percentage_split');
  const [donatingEntities, setDonatingEntities] = useState<Array<{ id: string; name: string; email: string; maxCases: number; allocationPercent: number }>>([
    { id: '1', name: 'Feeding America - Greater Boston', email: 'donations@feedingamerica.org', maxCases: 300, allocationPercent: 60 },
    { id: '2', name: 'City Harvest NYC Rescue', email: 'rescue@cityharvest.org', maxCases: 200, allocationPercent: 40 }
  ]);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityEmail, setNewEntityEmail] = useState('');
  const [newEntityMaxCases, setNewEntityMaxCases] = useState(150);
  const [newEntityAllocPercent, setNewEntityAllocPercent] = useState(30);

  // Donation Email Alert Settings
  const [donationEmailAlertEnabled, setDonationEmailAlertEnabled] = useState<boolean>(true);
  const [donationEmailSubject, setDonationEmailSubject] = useState<string>('[Action Required] Food Rescue Donation Transfer Advice - {{lot_number}} ({{cases}} Cases)');
  const [donationEmailCustomNotes, setDonationEmailCustomNotes] = useState<string>('Please arrange logistics pickup within 48 hours of scheduled pickup date. Reply to confirm dock door appointment and receive 501(c)(3) tax attestation documentation.');
  const [showDonationEmailPreview, setShowDonationEmailPreview] = useState<boolean>(false);

  // Drift Detection & Breakdown Modal
  const [dismissedDriftBanner, setDismissedDriftBanner] = useState(false);
  const [showInventoryDiffModal, setShowInventoryDiffModal] = useState(false);

  // Pre-flight
  const [showPreFlightModal, setShowPreFlightModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset/Hydrate when editingCampaignId changes
  useEffect(() => {
    setDismissedDriftBanner(false);
    if (!editingCampaignId) {
      setSelectedTemplateKey('short_dated_clearance');
      setWorkflowName('Untitled Workflow');
      setStartDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setEndDate(d.toISOString().split('T')[0]);
      setCategoryFilter('');
      setMaxRslFilter(0.20);
      setMinCasesFilter(10);
      setExplicitLotIds([]);
      setExcludedLotIds([]);
      setSelectorMode('automatic');
      setStages(TEMPLATE_DEFINITIONS[0].defaultStages);
      setExecutionType('immediate');
      setScheduleTime('09:00');
      setDonationEnabled(true);
      return;
    }
    const fetchEditingCampaign = async () => {
      try {
        setStartDate(new Date().toISOString().split('T')[0]);
        const d = new Date();
        d.setDate(d.getDate() + 14);
        setEndDate(d.toISOString().split('T')[0]);
        const res = await fetch(`${apiBaseUrl}/liquidation-automations/${editingCampaignId}`);
        if (res.ok) {
          const campaign = await res.json();
          if (campaign) {
            if (campaign.name) setWorkflowName(campaign.name);
            if (campaign.startDate) setStartDate(campaign.startDate.split('T')[0]);
            if (campaign.endDate) setEndDate(campaign.endDate.split('T')[0]);
            if (campaign.templateKey || campaign.templateName) {
              setSelectedTemplateKey(campaign.templateKey || campaign.templateName);
            }
            if (campaign.inventoryFilters) {
              setCategoryFilter(campaign.inventoryFilters.category || '');
              setMaxRslFilter(campaign.inventoryFilters.maxRsl !== undefined ? campaign.inventoryFilters.maxRsl : 0.20);
              setMinCasesFilter(campaign.inventoryFilters.minCases !== undefined ? campaign.inventoryFilters.minCases : 0);
              const expl = (campaign.inventoryFilters.explicitLotIds || []).map((id: any) => id?.toString() || id);
              const excl = (campaign.inventoryFilters.excludedLotIds || []).map((id: any) => id?.toString() || id);
              setExplicitLotIds(expl);
              setExcludedLotIds(excl);
              if (campaign.inventoryFilters.selectorMode) {
                setSelectorMode(campaign.inventoryFilters.selectorMode);
              } else if (expl.length > 0 && (!campaign.inventoryFilters.category || campaign.inventoryFilters.category === '')) {
                setSelectorMode('explicit');
              } else if (expl.length > 0) {
                setSelectorMode('hybrid');
              }
            }
            if (campaign.donationConfig) {
              if (typeof campaign.donationConfig.enabled === 'boolean') setDonationEnabled(campaign.donationConfig.enabled);
              if (typeof campaign.donationConfig.maxCases === 'number') setDonationMaxCases(campaign.donationConfig.maxCases);
              if (campaign.donationConfig.diversionStrategy) setDonationDiversionStrategy(campaign.donationConfig.diversionStrategy);
              if (Array.isArray(campaign.donationConfig.donatingEntities)) setDonatingEntities(campaign.donationConfig.donatingEntities);
              if (typeof campaign.donationConfig.emailAlertEnabled === 'boolean') setDonationEmailAlertEnabled(campaign.donationConfig.emailAlertEnabled);
              if (campaign.donationConfig.emailSubject) setDonationEmailSubject(campaign.donationConfig.emailSubject);
              if (campaign.donationConfig.emailCustomNotes) setDonationEmailCustomNotes(campaign.donationConfig.emailCustomNotes);
            }
            if (Array.isArray(campaign.stages) && campaign.stages.length > 0) {
              setStages(campaign.stages);
            }
            if (campaign.schedule) {
              setExecutionType(campaign.schedule.type || 'immediate');
              setScheduleTime(campaign.schedule.timeOfDay || '09:00');
              setWorkflowTimezone(campaign.schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
              setCronDays(campaign.schedule.daysOfWeek || [1]);
              setCronExpression(campaign.schedule.cronExpression || '');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching campaign for edit:', err);
      }
    };
    fetchEditingCampaign();
  }, [editingCampaignId, apiBaseUrl]);

  // Close template dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) setShowTemplateDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLoadInventory = async () => {
    setIsFetchingInventory(true);
    try {
      const url = supplierId ? `${apiBaseUrl}/inventory?supplierId=${supplierId}` : `${apiBaseUrl}/inventory`;
      const res = await fetch(url);
      if (res.ok) setFetchedLots(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      if (typeof window !== 'undefined') setIsFetchingInventory(false);
    }
  };

  useEffect(() => {
    if (!inventoryLots || inventoryLots.length === 0) {
      handleLoadInventory();
    }
  }, [supplierId, apiBaseUrl, inventoryLots]);

  useEffect(() => {
    if (reduxBuyerLists && reduxBuyerLists.length > 0) {
      setStages(prev => resolveStagesWithBuyerLists(prev, reduxBuyerLists));
    }
  }, [reduxBuyerLists]);

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    setShowTemplateDrop(false);
    const def = TEMPLATE_DEFINITIONS.find(t => t.key === key);
    if (def) {
      setWorkflowName(`${def.name} Campaign`);
      setCategoryFilter(def.defaultFilters.category);
      setMaxRslFilter(def.defaultFilters.maxRsl);
      setMinCasesFilter(def.defaultFilters.minCases);
      setStages(resolveStagesWithBuyerLists(def.defaultStages, reduxBuyerLists));
      setExpandedStageIdx(0);
      setExplicitLotIds([]);
      setExcludedLotIds([]);
      setSelectorMode('automatic');
    }
  };

  const handleClearEditing = () => {
    dispatch(setEditingCampaignId(null));
    setSelectedTemplateKey('short_dated_clearance');
    setWorkflowName('Untitled Workflow');
    setStartDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setEndDate(d.toISOString().split('T')[0]);
    setCategoryFilter('');
    setMaxRslFilter(0.20);
    setMinCasesFilter(10);
    setExplicitLotIds([]);
    setExcludedLotIds([]);
    setSelectorMode('automatic');
    setStages(resolveStagesWithBuyerLists(TEMPLATE_DEFINITIONS[0].defaultStages, reduxBuyerLists));
    setExecutionType('immediate');
    if (onCancel) onCancel();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStage = (idx: number, updates: Partial<Stage>) => {
    setStages(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const handleStageTypeChange = (idx: number, nextType: 'liquidation' | 'donation' | 'landfill') => {
    const current = stages[idx];
    if (!current) return;
    const isDefaultSubject = !current.emailSubject ||
      current.emailSubject.includes('Clearance Offer') ||
      current.emailSubject.includes('Clearance Blast') ||
      current.emailSubject.includes('Donation Transfer Offer') ||
      current.emailSubject.includes('Disposal & Removal Authorization Notice');

    const isDefaultBody = !current.emailBodyHtml ||
      current.emailBodyHtml === DEFAULT_EMAIL_BODY_HTML ||
      !current.emailTemplateId ||
      current.emailTemplateId === 'default' ||
      current.emailTemplateId === 'direct-donation-notice' ||
      current.emailTemplateId === 'disposal-removal-notice';

    updateStage(idx, {
      stageType: nextType,
      ...(isDefaultSubject ? { emailSubject: undefined } : {}),
      ...(isDefaultBody ? { emailBodyHtml: undefined, emailTemplateId: undefined } : {}),
    });
  };

  const activeLots = (Array.isArray(inventoryLots) && inventoryLots.length > 0)
    ? inventoryLots
    : (Array.isArray(fetchedLots) ? fetchedLots : []);

  const matchesAutoFilters = (lot: any) => {
    if (!lot) return false;
    const lotCases = lot.availableQty ?? lot.quantityCases ?? lot.quantity ?? 0;
    if (lotCases <= 0) return false;
    if (lot.status === 'sold' || lot.status === 'liquidated' || lot.status === 'inactive' || lot.status === 'expired') return false;
    const lotRsl = calculateLotRsl(lot);
    if (lotRsl <= 0) return false;
    const lotCat = (typeof lot.productId === 'object' ? lot.productId?.category : '') || lot.category || lot.productCategory || '';
    if (categoryFilter && lotCat && lotCat.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    const normalizedMaxRsl = (maxRslFilter !== undefined && maxRslFilter !== null && maxRslFilter !== 0)
      ? (maxRslFilter >= 100 ? 1.0 : (maxRslFilter >= 1 ? (maxRslFilter === 1 ? 1.0 : maxRslFilter / 100) : maxRslFilter))
      : null;
    if (normalizedMaxRsl !== null && normalizedMaxRsl < 1 && lotRsl > normalizedMaxRsl) return false;
    if (minCasesFilter > 0 && lotCases < minCasesFilter) return false;
    return true;
  };

  const matchedLots = useMemo(() => activeLots.filter((lot: any) => {
    if (!lot) return false;
    const id = lot._id?.toString() || lot.id;
    if (!id) return false;

    if (selectorMode === 'explicit' && explicitLotIds.length > 0) {
      return explicitLotIds.includes(id);
    }
    if (selectorMode === 'hybrid') {
      if (excludedLotIds.includes(id)) return false;
      if (explicitLotIds.includes(id)) return true;
    }

    if (excludedLotIds.includes(id)) return false;
    if (explicitLotIds.includes(id)) return true;
    return matchesAutoFilters(lot);
  }), [activeLots, categoryFilter, maxRslFilter, minCasesFilter, explicitLotIds, excludedLotIds, selectorMode]);

  const displayLots = useMemo(() => activeLots.filter((lot: any) => {
    if (!lot) return false;
    const id = lot._id?.toString() || lot.id;
    if (!id) return false;

    const matchesFilters = matchesAutoFilters(lot) || explicitLotIds.includes(id);
    if (!matchesFilters) return false;

    const q = lotSearch.toLowerCase();
    const desc = (lot.productId?.description || lot.lotNumber || '').toLowerCase();
    const sku = (lot.productId?.sku || '').toLowerCase();
    const matchSearch = !q || desc.includes(q) || sku.includes(q);
    const dc = typeof lot.distributionCenterId === 'object'
      ? (lot.distributionCenterId?.name || lot.distributionCenterId?.code || '')
      : (lot.distributionCenterId || '');
    const matchDC = !lotDcFilter || dc.toLowerCase().includes(lotDcFilter.toLowerCase());
    const hasCoa = lot.complianceStatus === 'verified' || lot.coaS3Uri;
    const matchCoa = lotCoaFilter === 'all' || (lotCoaFilter === 'verified' && hasCoa) || (lotCoaFilter === 'pending' && !hasCoa);
    return matchSearch && matchDC && matchCoa;
  }), [activeLots, categoryFilter, maxRslFilter, minCasesFilter, explicitLotIds, lotSearch, lotDcFilter, lotCoaFilter]);

  const impactMetrics = useMemo(() => {
    const totalLots = matchedLots.length;
    const totalCases = matchedLots.reduce((a, l) => a + (l?.availableQty ?? l?.quantityCases ?? 0), 0);
    const totalValue = matchedLots.reduce((a, l) => {
      const cases = l?.availableQty ?? l?.quantityCases ?? 0;
      return a + cases * (l?.costPerCase || l?.standardSellPrice || 10);
    }, 0);
    const urgentLots = matchedLots.filter(l => {
      const r = typeof l?.remainingShelfLife === 'number' ? (l.remainingShelfLife > 1 ? l.remainingShelfLife / 100 : l.remainingShelfLife) : 1;
      return r <= 0.15;
    }).length;

    const audienceSet = new Set<string>();
    stages.forEach(s => {
      if (s.buyerMode === 'custom') s.customBuyers.forEach(b => audienceSet.add(b.id));
      else {
        const count = getStageBuyerCount(s, reduxBuyerLists, buyers);
        for (let i = 0; i < count; i++) audienceSet.add(`list-${s.buyerListId || s.buyerSegment}-${i}`);
      }
    });
    return { totalLots, totalCases, totalValue, urgentLots, audienceCount: audienceSet.size };
  }, [matchedLots, stages, buyers, reduxBuyerLists]);

  const latestRun = useMemo(() => {
    if (!editingCampaignId) return null;
    const runs = automationRuns || reduxAutomationRuns;
    if (!Array.isArray(runs) || runs.length === 0) return null;
    const matches = runs.filter((r: any) => {
      const aid = r.automationId?._id || r.automationId || r.campaignId?._id || r.campaignId;
      return aid === editingCampaignId;
    });
    if (matches.length === 0) return null;
    return [...matches].sort((a: any, b: any) => {
      const tA = new Date(a.executedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.executedAt || b.createdAt || 0).getTime();
      return tB - tA;
    })[0];
  }, [editingCampaignId, automationRuns, reduxAutomationRuns]);

  const lastRunLotCount = latestRun?.snapshotInventoryIds?.length || 0;
  const currentMatchedCount = matchedLots.length;
  const hasDrift = Boolean(
    editingCampaignId &&
    latestRun &&
    lastRunLotCount > 0 &&
    lastRunLotCount !== currentMatchedCount &&
    !dismissedDriftBanner
  );

  const formattedLastRunDate = useMemo(() => {
    if (!latestRun?.executedAt && !latestRun?.createdAt) return 'the previous run';
    const d = new Date(latestRun.executedAt || latestRun.createdAt);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, [latestRun]);

  const [stageSyncMessage, setStageSyncMessage] = useState<string | null>(null);

  const handleSyncStageAllocations = () => {
    const validMatchedIds = new Set(matchedLots.map((l: any) => l._id?.toString() || l.id));
    setStages(prevStages => prevStages.map(stage => {
      if (Array.isArray(stage.allocatedLotIds)) {
        const purged = stage.allocatedLotIds.filter((id: string) => validMatchedIds.has(id));
        return {
          ...stage,
          allocatedLotIds: purged
        };
      }
      return stage;
    }));
    setStageSyncMessage('Stage allocations synchronized with live inventory.');
    setTimeout(() => setStageSyncMessage(null), 4000);
  };

  const hasInvalidStage = useMemo(() => {
    return stages.some((s, idx) => getStageValidationErrors(s, idx, reduxBuyerLists, buyers).length > 0);
  }, [stages, buyers, reduxBuyerLists]);

  const hasZeroBuyerStage = hasInvalidStage;

  const toggleLot = (lotId: string, included: boolean) => {
    if (included) {
      setExcludedLotIds(p => [...p, lotId]);
      setExplicitLotIds(p => p.filter(id => id !== lotId));
    } else {
      setExplicitLotIds(p => [...p, lotId]);
      setExcludedLotIds(p => p.filter(id => id !== lotId));
      if (selectorMode !== 'hybrid') setSelectorMode('explicit');
    }
  };

  const allDisplaySelected = displayLots.length > 0 && displayLots.every((l: any) => {
    const id = l._id?.toString() || l.id;
    return matchedLots.some((m: any) => (m._id?.toString() || m.id) === id);
  });

  const selectAll = () => {
    setExplicitLotIds(displayLots.map((l: any) => l._id?.toString() || l.id).filter(Boolean));
    setExcludedLotIds([]);
    if (selectorMode !== 'hybrid') setSelectorMode('explicit');
  };

  const deselectAll = () => {
    setExplicitLotIds([]);
    setExcludedLotIds(displayLots.map((l: any) => l._id?.toString() || l.id).filter(Boolean));
  };

  const handleLaunch = async () => {
    if (isSubmitting) return;

    if (!workflowName) {
      alert('Please enter a Campaign / Workflow name.');
      return;
    }
    if (!startDate || !endDate) {
      alert('Please select both Start Date and End Date for the campaign cycle.');
      return;
    }
    if (impactMetrics.totalLots < 1 || impactMetrics.totalCases < 1) {
      alert('Validation Error: At least 1 available and valid inventory lot must be selected, and total cases must be at least 1 to launch a campaign.');
      return;
    }

    for (let i = 0; i < stages.length; i++) {
      const errs = getStageValidationErrors(stages[i], i, reduxBuyerLists, buyers);
      if (errs.length > 0) {
        alert(`Validation Error: ${errs[0]}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let cycleId = '';
      try {
        const cycleRes = await fetch(`${apiBaseUrl}/liquidation-cycles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId,
            name: workflowName,
            startDate,
            endDate,
            status: 'active'
          }),
        });
        if (cycleRes && cycleRes.ok) {
          const cycleData = await cycleRes.json();
          cycleId = cycleData._id || cycleData.id;
        }
      } catch (err) {
        console.warn('Optional LiquidationCycle creation note:', err);
      }

      const computedSelectorMode = selectorMode === 'hybrid'
        ? 'hybrid'
        : (explicitLotIds.length > 0 ? 'explicit' : (selectorMode || 'automatic'));

      const sanitizedStages = stages.map(s => ({
        ...s,
        stageType: s.stageType || 'liquidation'
      }));

      const payload = {
        supplierId,
        liquidationCycleId: cycleId || undefined,
        name: workflowName,
        startDate,
        endDate,
        templateName: selectedTemplateKey,
        templateKey: selectedTemplateKey,
        inventoryFilters: {
          category: categoryFilter,
          maxRsl: maxRslFilter,
          minCases: minCasesFilter,
          explicitLotIds,
          excludedLotIds,
          selectorMode: computedSelectorMode
        },
        stages: sanitizedStages,
        rules: { evaluationWindowHours: typeof stages?.[0]?.waitHours === 'number' && stages[0].waitHours > 0 ? stages[0].waitHours : 48 },
        schedule: { type: executionType, cronExpression: cronExpression.trim() || compileFrontendCron(scheduleTime, cronDays), timeOfDay: scheduleTime, timezone: workflowTimezone, daysOfWeek: cronDays },
        emailTemplate: {
          subject: stages[0]?.emailSubject || 'Distressed Inventory Special Liquidation Offer',
          body: stages[0]?.emailBodyHtml || DEFAULT_EMAIL_BODY_HTML,
          bodyHtml: stages[0]?.emailBodyHtml || DEFAULT_EMAIL_BODY_HTML,
          blocks: []
        },
        donationConfig: {
          enabled: donationEnabled,
          maxCases: donationMaxCases,
          diversionStrategy: donationDiversionStrategy,
          donatingEntities,
          emailAlertEnabled: donationEmailAlertEnabled,
          emailSubject: donationEmailSubject,
          emailCustomNotes: donationEmailCustomNotes
        },
        status: 'active',
        isActive: true,
      };

      const isEditMode = Boolean(editingCampaignId);
      const endpoint = isEditMode
        ? `${apiBaseUrl}/liquidation-automations/${editingCampaignId}`
        : `${apiBaseUrl}/liquidation-automations`;
      const httpMethod = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method: httpMethod, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Failed to launch'); }
      const created = await res.json();
      const targetId = created?._id || created?.id || editingCampaignId;

      if (executionType === 'immediate' && targetId) {
        fetch(`${apiBaseUrl}/liquidation-automations/${targetId}/trigger`, { method: 'POST' })
          .then(async (triggerRes) => {
            if (!triggerRes.ok) {
              const e = await triggerRes.json().catch(() => ({}));
              console.warn('Immediate trigger execution notice:', e.error || triggerRes.statusText);
            }
          })
          .catch((trigErr) => {
            console.warn('Immediate trigger request failed:', trigErr);
          });
      }
      setShowPreFlightModal(false);
      setIsSubmitting(false);
      if (onSuccess) onSuccess('launched');
    } catch (err: any) {
      alert(`Launch Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setShowPreFlightModal(false);
    }
  };

  const handleSaveCampaign = async (targetStatus: 'draft' | 'active' = 'draft') => {
    if (!workflowName) {
      alert('Please enter a Campaign / Workflow name.');
      return;
    }
    if (!startDate || !endDate) {
      alert('Please select both Start Date and End Date for the campaign cycle.');
      return;
    }
    if (impactMetrics.totalLots < 1 || impactMetrics.totalCases < 1) {
      alert('Validation Error: At least 1 available and valid inventory lot must be selected, and total cases must be at least 1 to save a campaign.');
      return;
    }

    for (let i = 0; i < stages.length; i++) {
      const errs = getStageValidationErrors(stages[i], i, reduxBuyerLists, buyers);
      if (errs.length > 0) {
        alert(`Validation Error: ${errs[0]}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let cycleId = '';
      try {
        const cycleRes = await fetch(`${apiBaseUrl}/liquidation-cycles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId,
            name: workflowName,
            startDate,
            endDate,
            status: targetStatus === 'active' ? 'active' : 'draft'
          }),
        });
        if (cycleRes && cycleRes.ok) {
          const cycleData = await cycleRes.json();
          cycleId = cycleData._id || cycleData.id;
        }
      } catch (err) {
        console.warn('Optional LiquidationCycle creation note:', err);
      }

      const computedSelectorMode = selectorMode === 'hybrid'
        ? 'hybrid'
        : (explicitLotIds.length > 0 ? 'explicit' : (selectorMode || 'automatic'));

      const sanitizedStages = stages.map(s => ({
        ...s,
        stageType: s.stageType || 'liquidation'
      }));

      const payload = {
        supplierId,
        liquidationCycleId: cycleId || undefined,
        name: workflowName,
        startDate,
        endDate,
        templateName: selectedTemplateKey,
        templateKey: selectedTemplateKey,
        inventoryFilters: {
          category: categoryFilter,
          maxRsl: maxRslFilter,
          minCases: minCasesFilter,
          explicitLotIds,
          excludedLotIds,
          selectorMode: computedSelectorMode
        },
        stages: sanitizedStages,
        rules: { evaluationWindowHours: typeof stages?.[0]?.waitHours === 'number' && stages[0].waitHours > 0 ? stages[0].waitHours : 48 },
        schedule: { type: executionType, cronExpression: cronExpression.trim() || compileFrontendCron(scheduleTime, cronDays), timeOfDay: scheduleTime, timezone: workflowTimezone, daysOfWeek: cronDays },
        emailTemplate: {
          subject: stages[0]?.emailSubject || 'Distressed Inventory Special Liquidation Offer',
          body: stages[0]?.emailBodyHtml || DEFAULT_EMAIL_BODY_HTML,
          bodyHtml: stages[0]?.emailBodyHtml || DEFAULT_EMAIL_BODY_HTML,
          blocks: []
        },
        donationConfig: {
          enabled: donationEnabled,
          maxCases: donationMaxCases,
          diversionStrategy: donationDiversionStrategy,
          donatingEntities,
          emailAlertEnabled: donationEmailAlertEnabled,
          emailSubject: donationEmailSubject,
          emailCustomNotes: donationEmailCustomNotes
        },
        status: targetStatus,
        isActive: targetStatus === 'active',
      };

      const isEditMode = Boolean(editingCampaignId);
      const endpoint = isEditMode
        ? `${apiBaseUrl}/liquidation-automations/${editingCampaignId}`
        : `${apiBaseUrl}/liquidation-automations`;
      const httpMethod = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to save campaign strategy.');
      }

      dispatch(setEditingCampaignId(null));
      alert(`✅ Campaign strategy "${workflowName}" saved successfully as ${targetStatus.toUpperCase()}!`);
      if (onSuccess) onSuccess(targetStatus === 'active' ? 'launched' : 'saved');
    } catch (err: any) {
      alert(`Save Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDef = TEMPLATE_DEFINITIONS.find(t => t.key === selectedTemplateKey) || TEMPLATE_DEFINITIONS[0];

  return {
    // Redux & Auth
    oauth,
    reduxBuyerLists,
    reduxAutomationRuns,
    dispatch,

    // Campaign Metadata & Presets
    selectedTemplateKey,
    setSelectedTemplateKey,
    selectedDef,
    handleSelectTemplate,
    centralTemplates,
    workflowName,
    setWorkflowName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showTemplateDrop,
    setShowTemplateDrop,
    templateRef,
    handleClearEditing,

    // Schedule & Cron
    executionType,
    setExecutionType,
    scheduleTime,
    setScheduleTime,
    workflowTimezone,
    setWorkflowTimezone,
    cronDays,
    setCronDays,
    cronExpression,
    setCronExpression,
    isSchedulePopoverOpen,
    setIsSchedulePopoverOpen,
    scheduleRef,

    // Inventory Scope & Filters
    categoryFilter,
    setCategoryFilter,
    maxRslFilter,
    setMaxRslFilter,
    minCasesFilter,
    setMinCasesFilter,
    explicitLotIds,
    setExplicitLotIds,
    excludedLotIds,
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

    // Drift Detection & Popovers
    hasDrift,
    latestRun,
    lastRunLotCount,
    currentMatchedCount,
    dismissedDriftBanner,
    setDismissedDriftBanner,
    formattedLastRunDate,
    showInventoryDiffModal,
    setShowInventoryDiffModal,
    activeScopeInfoPopover,
    setActiveScopeInfoPopover,
    scopeInfoRef,

    // Stages
    stages,
    setStages,
    updateStage,
    handleStageTypeChange,
    expandedStageIdx,
    setExpandedStageIdx,
    handleSyncStageAllocations,
    stageSyncMessage,

    // Validation & Metrics
    impactMetrics,
    hasInvalidStage,
    hasZeroBuyerStage,

    // Modals
    openStageEmailModalIdx,
    setOpenStageEmailModalIdx,
    inspectingSegment,
    setInspectingSegment,
    inspectSearch,
    setInspectSearch,
    showPreFlightModal,
    setShowPreFlightModal,

    // Dynamic Donation
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

    // Submission
    isSubmitting,
    setIsSubmitting,
    handleLaunch,
    handleSaveCampaign,
  };
}

export type UseWorkflowStudioReturn = ReturnType<typeof useWorkflowStudio>;
