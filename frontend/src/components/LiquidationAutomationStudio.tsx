import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store/hooks';
import { selectBuyerLists, ensureDefaultBuyerLists } from '../store/slices/coreSlice';
import { setEditingCampaignId } from '../store/slices/workflowSlice';
import {
  Zap,
  Play,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Check,
  Sliders,
  Users,
  UserPlus,
  Mail,
  Image,
  Link,
  PenLine,
  Eye,
  Edit3,
  Tag,
  Trash2,
  GripVertical,
  Plus,
  Search,
  CheckSquare,
  Square,
  LayoutTemplate,
  Save,
  HeartHandshake,
  Copy,
  Smartphone,
  Monitor,
  Table,
  Send,
  Info
} from 'lucide-react';
import { PreFlightAuditModal } from './domain/workflows/PreFlightAuditModal';
import { useOAuthMailbox } from '../hooks/useOAuthMailbox';
import { TipTapTemplateEditor } from './TipTapTemplateEditor';
import { SmartAudienceLotSelector } from './SmartAudienceLotSelector';
import { LiveDevicePreview } from './LiveDevicePreview';
import { SendBroadcastView } from './SendBroadcastView';


// ─── Types ────────────────────────────────────────────────────────────────────

export const formatWaitTime = (hours: number): string => {
  if (!hours || hours <= 0) return '0m';
  const totalMins = Math.round(hours * 60);
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const format12HourTime = (timeStr: string): string => {
  if (!timeStr) return '09:00 AM';
  let t = String(timeStr).trim();
  let isPM = false;
  let isAM = false;
  if (/pm/i.test(t)) { isPM = true; t = t.replace(/pm/i, '').trim(); }
  if (/am/i.test(t)) { isAM = true; t = t.replace(/am/i, '').trim(); }

  const parts = t.split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return timeStr;
  let m = (parts[1] || '00').replace(/[^0-9]/g, '');
  if (m.length < 2) m = m.padStart(2, '0');

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  const ampm = h >= 12 ? 'PM' : 'AM';
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${m} ${ampm}`;
};

export interface LiquidationAutomationStudioProps {
  supplierId: string;
  supplierName?: string;
  inventoryLots: any[];
  buyers: any[];
  apiBaseUrl: string;
  editingCampaignId?: string | null;
  initialEmailBuilderTab?: 'preview' | 'editor' | 'broadcast';
  onSuccess?: (mode?: 'saved' | 'launched') => void;
  onCancel?: () => void;
}

export interface TemplateDefinition {
  key: string;
  name: string;
  icon: string;
  description: string;
  badge: string;
  flowSteps: { label: string; detail: string; icon: string }[];
  defaultFilters: { category: string; maxRsl: number; minCases: number };
  defaultStages: Stage[];
  defaultRules: {
    onSuccess: string;
    onFallback: string;
    minimumBidFloorPrice: number;
    minimumYieldRecoveryPercent: number;
  };
}

/** A single buyer entry — can be from registry or hand-added */
interface BuyerEntry {
  id: string;
  name: string;
  email: string;
  tier: 'tier1' | 'tier2' | 'liquidator' | 'custom';
  isNew?: boolean;
}

/**
 * Stage — owns BOTH its timing/pricing rules AND its audience targeting.
 * buyerMode = 'segment'  → use a named segment label
 * buyerMode = 'custom'   → use the curated customBuyers list
 */
interface Stage {
  stageIndex: number;
  name: string;
  // Audience
  buyerMode: 'list' | 'custom' | 'segment';
  buyerListId: string;       // BuyerList._id — used when buyerMode === 'list'
  buyerListName: string;     // display label for the selected list
  buyerSegment?: string;     // legacy fallback
  customBuyers: BuyerEntry[]; // used when buyerMode === 'custom'
  // Pricing
  discountType: 'yield' | 'fixed' | 'floor';
  discountValue: number;
  waitHours: number;
  waitUnit?: 'h' | 'm';
}

export function getStageBuyerCount(stage: Stage, buyerListsOrBuyers: any[] = []): number {
  if (stage.buyerMode === 'custom') {
    return stage.customBuyers ? stage.customBuyers.length : 0;
  }
  const targetId = stage.buyerListId || stage.buyerSegment;
  if (!targetId || targetId === 'empty_segment') {
    return 0;
  }

  const isListArray = buyerListsOrBuyers && buyerListsOrBuyers.some(b => b && Array.isArray(b.buyerIds));
  if (isListArray) {
    const list = buyerListsOrBuyers.find((l: any) => l._id === targetId || l.type === targetId);
    if (list && Array.isArray(list.buyerIds)) {
      return list.buyerIds.length;
    }
    return 0;
  }

  const effectiveLists = ensureDefaultBuyerLists();
  const matchedList = effectiveLists.find((l: any) => l._id === targetId || l.type === targetId);
  if (matchedList && Array.isArray(matchedList.buyerIds)) {
    return matchedList.buyerIds.length;
  }

  if (buyerListsOrBuyers && buyerListsOrBuyers.length > 0 && !buyerListsOrBuyers.some(b => b && Array.isArray(b.buyerIds))) {
    return buyerListsOrBuyers.length;
  }

  return 0;
}

// Email builder
export type EmailBlockType = 'text' | 'image' | 'logo' | 'link' | 'signature' | 'divider' | 'inventory_table' | 'header' | 'cta' | 'footer';

export interface EmailColumnConfig {
  sku?: boolean;
  description?: boolean;
  cases?: boolean;
  expirationDate?: boolean;
  msrp?: boolean;
  discountPrice?: boolean;
}

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  content: string;
  url?: string;
  altText?: string;
  signatureName?: string;
  signatureTitle?: string;
  align?: 'left' | 'center' | 'right';
  columnConfig?: EmailColumnConfig;
};

// ─── Constants ────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10); }

const TIER_COLOR: Record<string, string> = {
  tier1: 'hsl(221,83%,63%)',
  tier2: 'hsl(262,83%,68%)',
  liquidator: 'hsl(38,92%,60%)',
  custom: 'hsl(160,60%,55%)',
};

export function resolveStagesWithBuyerLists(stages: Stage[], buyerLists: any[]): Stage[] {
  if (!buyerLists || buyerLists.length === 0) return stages;
  const primaryList = buyerLists.find((l: any) => l.type === 'primary');
  const secondaryList = buyerLists.find((l: any) => l.type === 'secondary');

  return stages.map(s => {
    if (s.buyerMode === 'list' || s.buyerMode === 'segment') {
      let targetId = s.buyerListId || s.buyerSegment;
      let matched = buyerLists.find((l: any) => l._id === targetId || l.type === targetId);
      if (!matched && (targetId === 'primary' || targetId === 'tier1' || targetId === 'tier1_retailers')) {
        matched = primaryList || buyerLists[0];
      }
      if (!matched && (targetId === 'secondary' || targetId === 'all_liquidators' || targetId === 'liquidator')) {
        matched = secondaryList || buyerLists[1] || buyerLists[0];
      }
      if (matched) {
        return {
          ...s,
          buyerMode: 'list',
          buyerListId: matched._id,
          buyerListName: matched.name,
          buyerSegment: matched._id,
        };
      }
    }
    return s;
  });
}

const DEFAULT_STAGES: Stage[] = [
  {
    stageIndex: 1,
    name: 'Stage 1: Primary Buyers',
    buyerMode: 'list',
    buyerListId: 'primary',
    buyerListName: 'Primary Buyers',
    customBuyers: [],
    discountType: 'fixed',
    discountValue: 20,
    waitHours: 24,
  },
  {
    stageIndex: 2,
    name: 'Stage 2: Secondary Liquidators',
    buyerMode: 'list',
    buyerListId: 'secondary',
    buyerListName: 'Secondary Liquidators',
    customBuyers: [],
    discountType: 'fixed',
    discountValue: 40,
    waitHours: 48,
  },
];

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    key: 'short_dated_clearance',
    name: 'Aggressive Short-Dated Clearance (3-Stage)',
    icon: 'AlertTriangle',
    description: 'Rapidly liquidate inventory expiring within 30 days by targeting Tier 1 buyers first, then cascading to secondary liquidators with food bank backstop.',
    badge: 'High Expiration Urgency',
    flowSteps: [
      { label: 'Filter Stock', detail: 'Items with RSL ≤ 20%', icon: 'Filter' },
      { label: 'Stage 1 Offer', detail: 'Primary Retailers @ 20% Off (24h)', icon: 'Users' },
      { label: 'Stage 2 Blast', detail: 'Secondary Liquidators @ 40% Off', icon: 'Zap' },
      { label: 'Resolution', detail: 'Auto-award highest bid or donate remainder', icon: 'AlertTriangle' },
    ],
    defaultFilters: { category: '', maxRsl: 0.20, minCases: 10 },
    defaultStages: DEFAULT_STAGES,
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 5.0, minimumYieldRecoveryPercent: 30 },
  },
  {
    key: 'category_liquidation',
    name: 'Category Liquidation & Cold-Chain Fast-Track',
    icon: 'Zap',
    description: 'Automated FEFO allocation and AI yield pricing tailored by product category (Dairy, Produce, Chilled Foods, Beverages, Dry Goods).',
    badge: 'Category & Cold-Chain FEFO',
    flowSteps: [
      { label: 'Filter Category', detail: 'Select Product Category (RSL ≤ 25%)', icon: 'Filter' },
      { label: 'AI Yield Pricing', detail: 'Dynamic elasticity curve recommendation', icon: 'Sparkles' },
      { label: 'Direct Offer', detail: 'Category-Verified Buyers (36h)', icon: 'Mail' },
      { label: 'Resolution', detail: 'Auto-generate BOL & PO upon award', icon: 'CheckCircle' },
    ],
    defaultFilters: { category: 'Dairy', maxRsl: 0.25, minCases: 5 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: Category Preferred Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'yield', discountValue: 0, waitHours: 36 },
      { stageIndex: 2, name: 'Stage 2: Open Market Jobbers', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 30, waitHours: 24 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 8.0, minimumYieldRecoveryPercent: 40 },
  },
  {
    key: 'coa_verified_priority',
    name: 'COA-Verified Primary Buyer Priority',
    icon: 'CheckCircle',
    description: 'Restricts offers exclusively to buyers with verified COA compliance credentials before cascading discounts to secondary markets.',
    badge: 'FDA Compliance Priority',
    flowSteps: [
      { label: 'COA Verification', detail: 'Check FDA Certificate of Analysis', icon: 'CheckCircle' },
      { label: 'Stage 1 Exclusive', detail: 'COA-Verified Buyers @ 15% Off', icon: 'Users' },
      { label: 'Stage 2 Cascade', detail: 'Open Marketplace @ 35% Off', icon: 'Zap' },
      { label: 'Resolution', detail: 'Auto-award PO with compliance logs', icon: 'CheckCircle' },
    ],
    defaultFilters: { category: '', maxRsl: 0.35, minCases: 10 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: COA-Verified Primary Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 15, waitHours: 48 },
      { stageIndex: 2, name: 'Stage 2: Secondary Wholesale Buyers', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 35, waitHours: 24 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 10.0, minimumYieldRecoveryPercent: 45 },
  },
  {
    key: 'standard_tiered_markdown',
    name: 'Standard Tiered Markdown (14-Day Cycle)',
    icon: 'Sliders',
    description: 'Balanced recovery strategy over a 14-day cycle with gradual weekly markdown steps for maximum margin recovery.',
    badge: 'Balanced 14-Day Cycle',
    flowSteps: [
      { label: 'Filter Stock', detail: 'Items with RSL ≤ 40%', icon: 'Filter' },
      { label: 'Week 1 Markdown', detail: 'Primary Tier @ 10% Off', icon: 'Zap' },
      { label: 'Week 2 Markdown', detail: 'Secondary Tier @ 25% Off', icon: 'Zap' },
      { label: 'Final Salvage', detail: 'Clearing Markdown @ 50% Off', icon: 'CheckCircle' },
    ],
    defaultFilters: { category: '', maxRsl: 0.40, minCases: 15 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: Week 1 Primary Tier', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 10, waitHours: 72 },
      { stageIndex: 2, name: 'Stage 2: Week 2 Secondary Tier', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 25, waitHours: 72 },
      { stageIndex: 3, name: 'Stage 3: Final Salvage Markdown', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 50, waitHours: 48 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 6.0, minimumYieldRecoveryPercent: 35 },
  },
  {
    key: 'smart_bidding_auction',
    name: 'Auto-Negotiate Private B2B Auction',
    icon: 'Sparkles',
    description: 'Automates private B2B bidding rounds for surplus lots, accepting highest bid at stage expiry or auto-awarding if reserve floor price is met.',
    badge: 'Bidding Auction',
    flowSteps: [
      { label: 'Select Stock', detail: 'Active Surplus Lots', icon: 'Filter' },
      { label: 'Auction Round', detail: 'Private Bidding Window (48h)', icon: 'Clock' },
      { label: 'Floor Check', detail: 'AI Reserve Floor Valuation', icon: 'Sparkles' },
      { label: 'Resolution', detail: 'Auto-Award Highest Bidder', icon: 'CheckCircle' },
    ],
    defaultFilters: { category: '', maxRsl: 0.30, minCases: 20 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: Private Bidding Auction Round', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'yield', discountValue: 0, waitHours: 48 },
      { stageIndex: 2, name: 'Stage 2: Backup Flash Offer', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 35, waitHours: 24 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'escalate_review', minimumBidFloorPrice: 7.5, minimumYieldRecoveryPercent: 50 },
  },
  {
    key: 'direct_closeout_blast',
    name: 'Flash Sale Closeout Blast',
    icon: 'Zap',
    description: 'Dispatches immediate discount offer sheets to secondary buyers and jobbers based on remaining shelf-life days.',
    badge: 'Flash Sale',
    flowSteps: [
      { label: 'Flash Markdown', detail: 'Immediate 25% Off Wholesale', icon: 'Zap' },
      { label: 'Broadcast Offer', detail: 'Email Offer Sheet to All Buyers', icon: 'Mail' },
      { label: '48h Window', detail: 'First-Come Awarding Window', icon: 'Clock' },
      { label: 'Resolution', detail: 'Auto-Award or Donate Remainder', icon: 'CheckCircle' },
    ],
    defaultFilters: { category: '', maxRsl: 0.25, minCases: 10 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: Flash Broadcast to All Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 25, waitHours: 48 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 5.0, minimumYieldRecoveryPercent: 30 },
  },
  {
    key: 'auto_donate_safeguard',
    name: 'Auto-Donate & Landfill Diversion',
    icon: 'CheckCircle',
    description: 'Monitors product expiration thresholds and automatically creates tax-deductible donation transfers to certified food rescue partners.',
    badge: 'Zero-Waste Safeguard',
    flowSteps: [
      { label: 'Expiration Audit', detail: 'Items near critical cutoff (RSL ≤ 10%)', icon: 'Filter' },
      { label: 'Charity Match', detail: 'Match Certified Food Banks', icon: 'Users' },
      { label: 'Tax Offset', detail: 'Calculate CO2 & Tax Offset', icon: 'Sparkles' },
      { label: 'Resolution', detail: 'Generate Donation Transfer PO', icon: 'CheckCircle' },
    ],
    defaultFilters: { category: '', maxRsl: 0.10, minCases: 1 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: Food Rescue & Bank Transfer', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 100, waitHours: 12 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 0.0, minimumYieldRecoveryPercent: 0 },
  },
  {
    key: 'overstock_volume_liquidation',
    name: 'Overstock Volume Liquidation',
    icon: 'Users',
    description: 'Clear large surplus overstock lots (≥ 100 cases) to bulk secondary buyers at tiered volume discounts with partial awarding.',
    badge: 'High Volume Recovery',
    flowSteps: [
      { label: 'Filter Stock', detail: 'Lots ≥ 100 cases', icon: 'Filter' },
      { label: 'Volume Discount', detail: 'Tiered volume pricing (-30%)', icon: 'Zap' },
      { label: 'Wholesale Blast', detail: 'All Registered Bulk Buyers', icon: 'Users' },
      { label: 'Resolution', detail: 'Partial awarding enabled', icon: 'CheckCircle' },
    ],
    defaultFilters: { category: '', maxRsl: 0.50, minCases: 100 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: All Wholesale Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 30, waitHours: 48 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_recycle', minimumBidFloorPrice: 4.0, minimumYieldRecoveryPercent: 25 },
  },
  {
    key: 'custom_stage_gate',
    name: 'Custom Automation Studio',
    icon: 'Sliders',
    description: 'Build a custom multi-stage liquidation workflow from scratch with custom stage-gate rules, wait delays, and email templates.',
    badge: 'Custom Builder',
    flowSteps: [
      { label: 'Custom Filters', detail: 'Define exact lot parameters', icon: 'Filter' },
      { label: 'Custom Stages', detail: 'Configure rules & buyer tiers', icon: 'Users' },
      { label: 'Schedule', detail: 'Set execution triggers & timezones', icon: 'Clock' },
    ],
    defaultFilters: { category: '', maxRsl: 0.30, minCases: 0 },
    defaultStages: [
      { stageIndex: 1, name: 'Stage 1: Custom Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'yield', discountValue: 0, waitHours: 24 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 5.0, minimumYieldRecoveryPercent: 30 },
  },
];

const DEFAULT_EMAIL_BLOCKS: EmailBlock[] = [
  { id: genId(), type: 'logo', content: '', altText: 'Company Logo', align: 'center' },
  { id: genId(), type: 'text', content: 'Dear {{contact_name}},\n\nWe have surplus inventory available for immediate acquisition under short-dated terms.', align: 'left' },
  { id: genId(), type: 'inventory_table', content: '{{inventory_table}}', align: 'left' },
  { id: genId(), type: 'text', content: 'Please reply or place your bid before the evaluation window expires.', align: 'left' },
  { id: genId(), type: 'signature', content: '', signatureName: 'Sales Team', signatureTitle: 'Surplus Recovery Division', align: 'left' },
];

// ─── Stage Audience Picker ────────────────────────────────────────────────────
// Embedded inside each stage card. Owns buyer targeting for that stage only.

interface StageAudiencePickerProps {
  stage: Stage;
  allBuyers: any[];
  onChange: (updates: Partial<Stage>) => void;
  onInspectSegment?: (segment: string) => void;
}

const StageAudiencePicker: React.FC<StageAudiencePickerProps> = ({ stage, allBuyers, onChange, onInspectSegment }) => {
  let reduxBuyerLists: any[] = [];
  try {
    reduxBuyerLists = useAppSelector(selectBuyerLists) || [];
  } catch {
    reduxBuyerLists = [];
  }
  const isListMode = stage.buyerMode === 'list' || stage.buyerMode === 'segment';

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTier, setNewTier] = useState<BuyerEntry['tier']>('custom');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredBuyers = allBuyers.filter(b => {
    const q = search.toLowerCase();
    const name = (b.companyName || b.name || '').toLowerCase();
    const email = (b.email || '').toLowerCase();
    return !search || name.includes(q) || email.includes(q);
  });

  const addFromRegistry = (b: any) => {
    const id = b._id || b.id || b.email;
    if (stage.customBuyers.some(s => s.id === id)) return;
    onChange({
      customBuyers: [...stage.customBuyers, {
        id,
        name: b.companyName || b.name || b.email,
        email: b.email || '',
        tier: b.tier || 'tier1',
      }],
    });
  };

  const addNewBuyer = () => {
    if (!newEmail || !newName) return;
    onChange({
      customBuyers: [...stage.customBuyers, {
        id: genId(),
        name: newName,
        email: newEmail,
        tier: newTier,
        isNew: true,
      }],
    });
    setNewName(''); setNewEmail(''); setNewTier('custom'); setShowAddForm(false);
  };

  const removeBuyer = (id: string) => {
    onChange({ customBuyers: stage.customBuyers.filter(b => b.id !== id) });
  };

  const inputSt: React.CSSProperties = {
    background: 'hsl(223 47% 8%)',
    border: '1px solid hsl(var(--border-color))',
    borderRadius: '6px',
    padding: '7px 9px',
    color: '#fff',
    fontSize: '12px',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0', background: 'hsl(223 47% 8%)', borderRadius: '8px', padding: '3px', border: '1px solid hsl(var(--border-color))' }}>
        {(['list', 'custom'] as const).map(mode => {
          const isActive = mode === 'list' ? isListMode : stage.buyerMode === 'custom';
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ buyerMode: mode })}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '5px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: isActive
                  ? 'hsl(var(--primary))'
                  : 'transparent',
                color: isActive ? '#fff' : 'hsl(var(--text-muted))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              {mode === 'list'
                ? <><Users size={12} /> Buyer List</>
                : <><UserPlus size={12} /> Custom List</>
              }
            </button>
          );
        })}
      </div>

      {/* Buyer List mode */}
      {isListMode && (() => {
        const effectiveBuyerLists = ensureDefaultBuyerLists(reduxBuyerLists);
        const selectedListObj = effectiveBuyerLists.find(l => l._id === (stage.buyerListId || stage.buyerSegment) || l.type === (stage.buyerListId || stage.buyerSegment));
        const listBuyerCount = selectedListObj ? (selectedListObj.buyerIds ? selectedListObj.buyerIds.length : 0) : getStageBuyerCount(stage, effectiveBuyerLists);

        return (
          <div>
            <label style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Target Buyer List</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={stage.buyerListId || stage.buyerSegment || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    onChange({ buyerMode: 'custom' });
                  } else {
                    const selected = effectiveBuyerLists.find(l => l._id === val || l.type === val);
                    onChange({
                      buyerMode: 'list',
                      buyerListId: selected ? selected._id : val,
                      buyerListName: selected ? selected.name : (val === 'primary' ? 'Primary Buyers' : val === 'secondary' ? 'Secondary Liquidators' : val),
                      buyerSegment: val,
                    });
                  }
                }}
                style={{ ...inputSt, padding: '8px 10px', flex: 1 }}
              >
                {effectiveBuyerLists.map(list => {
                  const count = list.buyerIds ? list.buyerIds.length : 0;
                  const isEmpty = count === 0;
                  return (
                    <option
                      key={list._id || list.type}
                      value={list._id || list.type}
                      disabled={isEmpty}
                    >
                      {list.name} — {count} buyers{isEmpty ? ' (Error: No buyers configured)' : ''}
                    </option>
                  );
                })}
                {stage.buyerListId && !effectiveBuyerLists.some(l => l._id === stage.buyerListId || l.type === stage.buyerListId) && (
                  <option value={stage.buyerListId} disabled>
                    {stage.buyerListName || 'Select a list'} — 0 buyers (Error: No buyers configured)
                  </option>
                )}
                <option value="custom">— Custom selection —</option>
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onInspectSegment && onInspectSegment(stage.buyerListId || stage.buyerSegment || '')}
                title="Inspect Buyer Data (Name, Email, Reg Date)"
                style={{ padding: '7px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '34px', background: 'hsl(223 47% 12%)', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', color: 'hsl(var(--primary))', cursor: 'pointer' }}
              >
                <Eye size={15} />
              </button>
            </div>

            {listBuyerCount === 0 && (
              <div
                data-testid="zero-buyer-error-banner"
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'hsl(var(--error) / 10%)',
                  border: '1px solid hsl(var(--error) / 30%)',
                  borderRadius: '6px',
                  color: 'hsl(var(--error))',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={14} />
                <span>
                  Error: No buyers configured in {selectedListObj?.name || stage.buyerListName || 'selected list'}. List is empty (0 buyers) and unselectable.
                </span>
              </div>
            )}

            <p style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '5px' }}>
              Targets buyers in this list. Click the Eye button to inspect roster data (Name, Email, Registration Date).
            </p>
          </div>
        );
      })()}

      {/* Custom List mode */}
      {stage.buyerMode === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Selected pills */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                {stage.customBuyers.length} buyer{stage.customBuyers.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: showAddForm ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                  border: `1px solid ${showAddForm ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border-color))'}`,
                  color: showAddForm ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                  borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <UserPlus size={10} /> Add New
              </button>
            </div>

            {stage.customBuyers.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', padding: '8px 10px', background: 'hsl(223 47% 8%)', borderRadius: '6px', border: '1px dashed hsl(var(--border-color))', textAlign: 'center' }}>
                No buyers selected — search below or add new
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {stage.customBuyers.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: `${TIER_COLOR[b.tier] || 'hsl(var(--primary))'}18`,
                    border: `1px solid ${TIER_COLOR[b.tier] || 'hsl(var(--primary))'}44`,
                    borderRadius: '16px', padding: '3px 8px 3px 6px',
                  }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: TIER_COLOR[b.tier] || 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: '#000', flexShrink: 0 }}>
                      {b.name.charAt(0)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>
                      {b.name}
                      {b.isNew && <span style={{ marginLeft: '3px', fontSize: '9px', color: 'hsl(var(--success))' }}>NEW</span>}
                    </span>
                    <button type="button" onClick={() => removeBuyer(b.id)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex' }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new buyer mini-form */}
          {showAddForm && (
            <div style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.2)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><UserPlus size={11} /> New Buyer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <input type="text" placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} style={inputSt} />
                <input type="email" placeholder="Email *" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputSt} />
              </div>
              <select value={newTier} onChange={e => setNewTier(e.target.value as BuyerEntry['tier'])} style={inputSt}>
                <option value="tier1">Tier 1 — Primary Retailer</option>
                <option value="tier2">Tier 2 — Regional</option>
                <option value="liquidator">Liquidator</option>
                <option value="custom">Custom</option>
              </select>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-secondary))', borderRadius: '5px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={addNewBuyer} disabled={!newName || !newEmail} style={{ background: newName && newEmail ? 'hsl(var(--primary))' : 'hsl(var(--border-color))', border: 'none', color: '#fff', borderRadius: '5px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, cursor: newName && newEmail ? 'pointer' : 'not-allowed' }}>
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* Registry search dropdown */}
          <div ref={dropRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                placeholder={`Search ${allBuyers.length} registered buyers…`}
                value={search}
                onChange={e => { setSearch(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                style={{ ...inputSt, paddingLeft: '28px' }}
              />
            </div>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 40,
                background: 'hsl(223 47% 10%)', border: '1px solid hsl(var(--border-color))',
                borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                maxHeight: '180px', overflowY: 'auto',
              }}>
                {filteredBuyers.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '11px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                    {allBuyers.length === 0 ? 'No buyers in registry' : 'No matches found'}
                  </div>
                ) : filteredBuyers.map(b => {
                  const id = b._id || b.id || b.email;
                  const alreadyAdded = stage.customBuyers.some(s => s.id === id);
                  const tier = b.tier || 'tier1';
                  return (
                    <div
                      key={id}
                      onClick={() => !alreadyAdded && addFromRegistry(b)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', cursor: alreadyAdded ? 'default' : 'pointer',
                        borderBottom: '1px solid hsl(223 47% 14%)',
                        opacity: alreadyAdded ? 0.5 : 1,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLElement).style.background = 'hsl(223 47% 14%)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${TIER_COLOR[tier]}22`, border: `1px solid ${TIER_COLOR[tier]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: TIER_COLOR[tier] }}>
                          {(b.companyName || b.name || 'B').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{b.companyName || b.name || b.email}</div>
                          <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{b.email}</div>
                        </div>
                      </div>
                      {alreadyAdded
                        ? <Check size={13} color="hsl(var(--success))" />
                        : <Plus size={13} color="hsl(var(--primary))" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Email Builder ────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<EmailBlockType, string> = {
  header: 'Header',
  text: 'Text Paragraph',
  image: 'Image',
  logo: 'Logo',
  link: 'CTA Link',
  cta: 'CTA Button',
  signature: 'Signature',
  footer: 'Compliance Footer',
  divider: 'Divider',
  inventory_table: 'Inventory Table',
};
const BLOCK_ICONS: Record<EmailBlockType, React.ReactNode> = {
  header: <LayoutTemplate size={13} />,
  text: <PenLine size={13} />,
  image: <Image size={13} />,
  logo: <Image size={13} />,
  link: <Link size={13} />,
  cta: <Zap size={13} />,
  signature: <PenLine size={13} />,
  footer: <CheckCircle size={13} />,
  divider: <span style={{ fontSize: 11 }}>—</span>,
  inventory_table: <Table size={13} />,
};

const STARTER_TEMPLATES: Record<string, { label: string; blocks: EmailBlock[] }> = {
  short_dated: {
    label: 'Short-Dated Clearance',
    blocks: [
      { id: genId(), type: 'header', content: 'URGENT SHORT-DATED CLEARANCE OFFER', align: 'center' },
      { id: genId(), type: 'text', content: 'Dear {{buyer_name}},\n\nWe have distress inventory expiring soon with up to {{discount_percent}} markdown. Please review the inventory table below for immediate allocation within {{offer_expiry_hours}} hours.', align: 'left' },
      { id: genId(), type: 'inventory_table', content: '{{inventory_table}}', columnConfig: { sku: true, description: true, cases: true, expirationDate: true, msrp: true, discountPrice: true }, align: 'left' },
      { id: genId(), type: 'cta', content: 'Place Bid / Claim Inventory', url: 'https://indspoileralert.com/deals', align: 'center' },
      { id: genId(), type: 'footer', content: 'Logistics & Compliance Verified — Express Freight Delivery Available.', align: 'center' },
    ],
  },
  fefo_fast_track: {
    label: 'Category FEFO Fast-Track',
    blocks: [
      { id: genId(), type: 'header', content: 'CATEGORY FEFO LIQUIDATION NOTICE', align: 'center' },
      { id: genId(), type: 'text', content: 'Dear {{buyer_name}},\n\nSpecial category liquidation notice for active buyers. The following fresh inventory lots are fast-tracked for immediate FEFO release.', align: 'left' },
      { id: genId(), type: 'inventory_table', content: '{{inventory_table}}', columnConfig: { sku: true, description: true, cases: true, expirationDate: true, msrp: true, discountPrice: true }, align: 'left' },
      { id: genId(), type: 'cta', content: 'Review FEFO Lots', url: 'https://indspoileralert.com/fefo', align: 'center' },
      { id: genId(), type: 'signature', content: '', signatureName: 'IndSpoilerAlert Operations', signatureTitle: 'Surplus Recovery Team', align: 'left' },
    ],
  },
  fda_coa: {
    label: 'FDA COA Verified Exclusive',
    blocks: [
      { id: genId(), type: 'header', content: 'FDA COA VERIFIED SURPLUS OFFER', align: 'center' },
      { id: genId(), type: 'text', content: 'Dear {{buyer_name}},\n\n100% FDA COA Verified surplus inventory available exclusively for qualified B2B buyers. Full compliance documentation available upon request.', align: 'left' },
      { id: genId(), type: 'inventory_table', content: '{{inventory_table}}', columnConfig: { sku: true, description: true, cases: true, expirationDate: true, msrp: true, discountPrice: true }, align: 'left' },
      { id: genId(), type: 'cta', content: 'Request Certificate & Order', url: 'https://indspoileralert.com/coa', align: 'center' },
      { id: genId(), type: 'footer', content: 'All lots include verified Certificate of Analysis compliance documentation.', align: 'center' },
    ],
  },
};

function buildBlockHtml(blocks: EmailBlock[], isPreview: boolean = false): string {
  return blocks.map(b => {
    const al = b.align || 'left';
    let rawContent = b.content || '';
    if (isPreview) {
      rawContent = rawContent
        .replace(/\{\{buyer_name\}\}/g, 'Acme Wholesale Markets')
        .replace(/\{\{contact_name\}\}/g, 'Valued Buyer')
        .replace(/\{\{discount_percent\}\}/g, '25%')
        .replace(/\{\{offer_expiry_hours\}\}/g, '48')
        .replace(/\{\{expiration_window\}\}/g, '48 Hours');
    }

    switch (b.type) {
      case 'header':
        return `<div style="text-align:${al};margin:16px 0;background:linear-gradient(135deg,#1e293b,#0f172a);padding:16px;border-radius:8px;border:1px solid #334155;"><h2 style="margin:0;font-size:18px;color:#38bdf8;font-weight:700;">${rawContent || 'SPECIAL CLEARANCE OFFER'}</h2></div>`;
      case 'logo':
        return `<div style="text-align:${al};margin:12px 0;">${b.url ? `<img src="${b.url}" alt="${b.altText || 'Logo'}" style="max-height:60px;max-width:200px;" />` : `<div style="display:inline-block;background:#1e293b;border:1px dashed #334155;border-radius:8px;padding:10px 20px;color:#94a3b8;font-size:13px;">[Company Logo]</div>`}</div>`;
      case 'image':
        return `<div style="text-align:${al};margin:12px 0;">${b.url ? `<img src="${b.url}" alt="${b.altText||''}" style="max-width:100%;border-radius:8px;" />` : `<div style="background:#1e293b;border:1px dashed #334155;border-radius:8px;padding:20px;text-align:center;color:#64748b;font-size:12px;">[Image placeholder]</div>`}</div>`;
      case 'text':
        return `<p style="font-size:14px;line-height:1.7;color:#e2e8f0;text-align:${al};margin:10px 0;white-space:pre-wrap;">${rawContent}</p>`;
      case 'link':
      case 'cta':
        return `<div style="text-align:${al};margin:14px 0;"><a href="${b.url||'#'}" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">${rawContent||'Click Here'}</a></div>`;
      case 'signature':
        return `<div style="margin-top:20px;padding-top:14px;border-top:1px solid #1e293b;text-align:${al};"><div style="font-weight:700;font-size:14px;color:#f8fafc;">${b.signatureName||'Name'}</div><div style="font-size:12px;color:#94a3b8;">${b.signatureTitle||'Title'}</div></div>`;
      case 'footer':
        return `<div style="margin-top:24px;padding:12px;background:#0f172a;border-radius:6px;border:1px solid #1e293b;font-size:11px;color:#94a3b8;text-align:${al};">${rawContent || 'Logistics & Compliance Verified — Express Freight Delivery Available.'}</div>`;
      case 'divider':
        return `<hr style="border:none;border-top:1px solid #1e293b;margin:16px 0;" />`;
      case 'inventory_table': {
        const col = b.columnConfig || {};
        const showSku = col.sku !== false;
        const showDesc = col.description !== false;
        const showCases = col.cases !== false;
        const showExp = col.expirationDate !== false;
        const showMsrp = col.msrp !== false;
        const showPrice = col.discountPrice !== false;

        return `
          <div style="margin:16px 0;overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;">
              <thead>
                <tr style="background:#1e293b;color:#94a3b8;text-align:left;">
                  ${showSku ? '<th style="padding:8px 10px;">SKU</th>' : ''}
                  ${showDesc ? '<th style="padding:8px 10px;">Description</th>' : ''}
                  ${showCases ? '<th style="padding:8px 10px;">Cases</th>' : ''}
                  ${showExp ? '<th style="padding:8px 10px;">Expiry Date</th>' : ''}
                  ${showMsrp ? '<th style="padding:8px 10px;">MSRP</th>' : ''}
                  ${showPrice ? '<th style="padding:8px 10px;">Discount Price</th>' : ''}
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #1e293b;color:#e2e8f0;">
                  ${showSku ? '<td style="padding:8px 10px;font-family:monospace;">SKU-9921</td>' : ''}
                  ${showDesc ? '<td style="padding:8px 10px;">Organic Whole Milk 1 gal</td>' : ''}
                  ${showCases ? '<td style="padding:8px 10px;">450 cs</td>' : ''}
                  ${showExp ? '<td style="padding:8px 10px;">2026-08-05</td>' : ''}
                  ${showMsrp ? '<td style="padding:8px 10px;text-decoration:line-through;color:#94a3b8;">$24.00</td>' : ''}
                  ${showPrice ? '<td style="padding:8px 10px;color:#34d399;font-weight:bold;">$18.00</td>' : ''}
                </tr>
                <tr style="border-bottom:1px solid #1e293b;color:#e2e8f0;">
                  ${showSku ? '<td style="padding:8px 10px;font-family:monospace;">SKU-4402</td>' : ''}
                  ${showDesc ? '<td style="padding:8px 10px;">Greek Yogurt Strawberry 6oz</td>' : ''}
                  ${showCases ? '<td style="padding:8px 10px;">1,200 cs</td>' : ''}
                  ${showExp ? '<td style="padding:8px 10px;">2026-08-12</td>' : ''}
                  ${showMsrp ? '<td style="padding:8px 10px;text-decoration:line-through;color:#94a3b8;">$16.50</td>' : ''}
                  ${showPrice ? '<td style="padding:8px 10px;color:#34d399;font-weight:bold;">$11.55</td>' : ''}
                </tr>
              </tbody>
            </table>
          </div>`;
      }
      default: return '';
    }
  }).join('');
}

interface EmailBuilderProps { blocks: EmailBlock[]; onChange: (b: EmailBlock[]) => void; }

const EmailBuilder: React.FC<EmailBuilderProps> = ({ blocks, onChange }) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  const update = (id: string, u: Partial<EmailBlock>) => onChange(blocks.map(b => b.id === id ? { ...b, ...u } : b));
  const del = (id: string) => onChange(blocks.filter(b => b.id !== id));
  
  const duplicate = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const target = blocks[idx];
    const newBlock: EmailBlock = {
      ...JSON.parse(JSON.stringify(target)),
      id: genId(),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    onChange(newBlocks);
  };

  const move = (id: string, dir: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === blocks.length - 1) return;
    const arr = [...blocks];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    onChange(arr);
  };

  const add = (type: EmailBlockType) => {
    const nb: EmailBlock = {
      id: genId(), type, content: type === 'text' ? 'Enter text…' : type === 'header' ? 'SPECIAL OFFER' : type === 'cta' ? 'Claim Inventory' : type === 'footer' ? 'Logistics & Compliance Verified.' : '', align: 'left',
      ...(type === 'signature' ? { signatureName: 'Your Name', signatureTitle: 'Title' } : {}),
      ...(type === 'link' || type === 'cta' ? { url: 'https://', content: 'Click Here' } : {}),
      ...(type === 'inventory_table' ? { columnConfig: { sku: true, description: true, cases: true, expirationDate: true, msrp: true, discountPrice: true } } : {}),
    };
    onChange([...blocks, nb]);
    setEditId(nb.id);
  };

  const injectToken = (token: string) => {
    if (!editId) {
      if (blocks.length > 0) {
        const textBlock = blocks.find(b => b.type === 'text' || b.type === 'header' || b.type === 'cta') || blocks[0];
        update(textBlock.id, { content: (textBlock.content || '') + ' ' + token });
      }
      return;
    }
    const current = blocks.find(b => b.id === editId);
    if (current) {
      update(current.id, { content: (current.content || '') + ' ' + token });
    }
  };

  const loadPreset = (presetKey: string) => {
    const preset = STARTER_TEMPLATES[presetKey];
    if (preset) {
      onChange(preset.blocks);
    }
  };

  const inputSt: React.CSSProperties = {
    width: '100%', background: 'hsl(223 47% 9%)', border: '1px solid hsl(var(--border-color))',
    borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '12px', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Preset Starters & Token Pills Bar */}
      <div style={{ background: 'hsl(223 47% 8%)', border: '1px solid hsl(var(--border-color))', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} color="hsl(var(--primary))" /> Starter Email Templates:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(STARTER_TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => loadPreset(key)}
                style={{
                  background: 'hsl(var(--primary) / 0.1)',
                  border: '1px solid hsl(var(--primary) / 0.3)',
                  color: 'hsl(var(--primary))',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Quick Token Injectors:</span>
          {['{{inventory_table}}', '{{buyer_name}}', '{{discount_percent}}', '{{offer_expiry_hours}}'].map(tok => (
            <button
              key={tok}
              type="button"
              onClick={() => injectToken(tok)}
              style={{
                background: 'hsl(223 47% 12%)',
                border: '1px solid hsl(var(--border-color))',
                color: 'hsl(var(--secondary))',
                borderRadius: '12px',
                padding: '3px 9px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + {tok}
            </button>
          ))}
        </div>
      </div>

      {/* Main Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {(['header', 'text', 'inventory_table', 'cta', 'footer', 'logo', 'image', 'signature', 'divider'] as EmailBlockType[]).map(t => (
            <button key={t} type="button" onClick={() => add(t)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(223 47% 12%)', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-secondary))', borderRadius: '6px', padding: '4px 9px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
              {BLOCK_ICONS[t]} +{BLOCK_LABELS[t]}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {preview && (
            <div style={{ display: 'flex', background: 'hsl(223 47% 8%)', borderRadius: '6px', border: '1px solid hsl(var(--border-color))', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', border: 'none',
                  background: viewport === 'desktop' ? 'hsl(var(--primary))' : 'transparent',
                  color: viewport === 'desktop' ? '#fff' : 'hsl(var(--text-muted))',
                  fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <Monitor size={11} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', border: 'none',
                  background: viewport === 'mobile' ? 'hsl(var(--primary))' : 'transparent',
                  color: viewport === 'mobile' ? '#fff' : 'hsl(var(--text-muted))',
                  fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <Smartphone size={11} /> Mobile
              </button>
            </div>
          )}

          <button type="button" onClick={() => setPreview(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: preview ? 'hsl(var(--primary)/0.15)' : 'transparent', border: '1px solid hsl(var(--primary)/0.4)', color: 'hsl(var(--primary))', borderRadius: '6px', padding: '4px 11px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            <Eye size={13} /> {preview ? 'Edit Blocks' : 'Live Preview'}
          </button>
        </div>
      </div>

      {preview ? (
        <div style={{ display: 'flex', justifyContent: 'center', background: '#030712', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', padding: '24px 12px' }}>
          <div
            style={{
              width: viewport === 'mobile' ? '375px' : '100%',
              maxWidth: viewport === 'mobile' ? '375px' : '680px',
              background: '#090d16',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: viewport === 'mobile' ? '24px' : '12px',
              padding: '24px',
              minHeight: '200px',
              fontSize: '13px',
              color: '#e2e8f0',
              lineHeight: 1.6,
              boxShadow: viewport === 'mobile' ? '0 0 0 10px #1e293b' : 'none',
              transition: 'all 0.2s ease-in-out'
            }}
            dangerouslySetInnerHTML={{ __html: buildBlockHtml(blocks, true) }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {blocks.map((bl, idx) => {
            const isEdit = editId === bl.id;
            const colConfig = bl.columnConfig || {};
            return (
              <div
                key={bl.id}
                data-testid="email-block"
                style={{
                  background: isEdit ? 'hsl(var(--primary)/0.05)' : 'hsl(223 47% 9%)',
                  border: `1px solid ${isEdit ? 'hsl(var(--primary)/0.35)' : 'hsl(var(--border-color))'}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.15s'
                }}
              >
                {/* Header Toolbar */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 12px', cursor: 'pointer',
                    background: isEdit ? 'hsl(var(--primary)/0.09)' : 'transparent',
                    borderBottom: isEdit ? '1px solid hsl(var(--primary)/0.2)' : '1px solid transparent'
                  }}
                  onClick={() => setEditId(isEdit ? null : bl.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GripVertical size={13} color="hsl(var(--text-muted))" />
                    <span style={{ color: isEdit ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }}>{BLOCK_ICONS[bl.type]}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: isEdit ? '#fff' : 'hsl(var(--text-secondary))' }}>{BLOCK_LABELS[bl.type]}</span>
                    {(bl.type === 'text' || bl.type === 'header' || bl.type === 'cta' || bl.type === 'footer') && (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bl.content.slice(0, 55)}{bl.content.length > 55 ? '…' : ''}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button type="button" title="Move Up" onClick={e => { e.stopPropagation(); move(bl.id, 'up'); }} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'hsl(var(--border-color))' : 'hsl(var(--text-muted))', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '12px', padding: '2px 3px' }}>▲</button>
                    <button type="button" title="Move Down" onClick={e => { e.stopPropagation(); move(bl.id, 'down'); }} disabled={idx === blocks.length - 1} style={{ background: 'none', border: 'none', color: idx === blocks.length - 1 ? 'hsl(var(--border-color))' : 'hsl(var(--text-muted))', cursor: idx === blocks.length - 1 ? 'default' : 'pointer', fontSize: '12px', padding: '2px 3px' }}>▼</button>
                    <button type="button" title="Duplicate" onClick={e => { e.stopPropagation(); duplicate(bl.id); }} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '2px 3px', display: 'flex' }}><Copy size={12} /></button>
                    <button type="button" title="Delete" onClick={e => { e.stopPropagation(); del(bl.id); }} style={{ background: 'none', border: 'none', color: 'hsl(var(--error))', cursor: 'pointer', padding: '2px 3px', display: 'flex' }}><Trash2 size={12} /></button>
                  </div>
                </div>

                {/* Fields */}
                {isEdit && (
                  <div style={{ padding: '10px 13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bl.type !== 'divider' && bl.type !== 'inventory_table' && (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginRight: '2px' }}>Align:</span>
                        {(['left', 'center', 'right'] as const).map(a => (
                          <button key={a} type="button" onClick={() => update(bl.id, { align: a })}
                            style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', background: bl.align === a ? 'hsl(var(--primary))' : 'hsl(223 47% 12%)', border: `1px solid ${bl.align === a ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`, color: bl.align === a ? '#fff' : 'hsl(var(--text-muted))' }}>
                            {a.charAt(0).toUpperCase() + a.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}

                    {(bl.type === 'text' || bl.type === 'header' || bl.type === 'cta' || bl.type === 'footer') && (
                      <textarea
                        value={bl.content}
                        rows={bl.type === 'text' ? 3 : 2}
                        onChange={e => update(bl.id, { content: e.target.value })}
                        placeholder="Content text or tokens (e.g. {{buyer_name}}, {{inventory_table}})"
                        style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }}
                      />
                    )}

                    {(bl.type === 'image' || bl.type === 'logo') && (<>
                      <input type="url" value={bl.url || ''} placeholder="Image URL (https://…)" onChange={e => update(bl.id, { url: e.target.value })} style={inputSt} />
                      <input type="text" value={bl.altText || ''} placeholder="Alt text" onChange={e => update(bl.id, { altText: e.target.value })} style={inputSt} />
                    </>)}

                    {(bl.type === 'link' || bl.type === 'cta') && (
                      <input type="url" value={bl.url || ''} placeholder="Link Target URL (https://…)" onChange={e => update(bl.id, { url: e.target.value })} style={inputSt} />
                    )}

                    {bl.type === 'signature' && (<>
                      <input type="text" value={bl.signatureName || ''} placeholder="Name" onChange={e => update(bl.id, { signatureName: e.target.value })} style={inputSt} />
                      <input type="text" value={bl.signatureTitle || ''} placeholder="Title" onChange={e => update(bl.id, { signatureTitle: e.target.value })} style={inputSt} />
                    </>)}

                    {bl.type === 'inventory_table' && (
                      <div style={{ background: 'hsl(223 47% 8%)', padding: '10px', borderRadius: '6px', border: '1px dashed hsl(var(--border-color))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))' }}>📋 Table Column Visibility Configuration</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                          {[
                            { key: 'sku', label: 'Product SKU' },
                            { key: 'description', label: 'Description' },
                            { key: 'cases', label: 'Quantity Cases' },
                            { key: 'expirationDate', label: 'Expiration Date' },
                            { key: 'msrp', label: 'MSRP' },
                            { key: 'discountPrice', label: 'Discount Price' },
                          ].map(col => {
                            const isChecked = colConfig[col.key as keyof EmailColumnConfig] !== false;
                            return (
                              <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#e2e8f0', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    update(bl.id, {
                                      columnConfig: {
                                        ...colConfig,
                                        [col.key]: e.target.checked
                                      }
                                    });
                                  }}
                                />
                                {col.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {bl.type === 'divider' && <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Horizontal rule — no configuration needed.</div>}
                  </div>
                )}
              </div>
            );
          })}

          {blocks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-muted))', fontSize: '12px', border: '1px dashed hsl(var(--border-color))', borderRadius: '8px' }}>
              No blocks yet — use the toolbar above to add content.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const LiquidationAutomationStudio: React.FC<LiquidationAutomationStudioProps> = ({
  supplierId,
  supplierName: customSupplierName,
  inventoryLots = [],
  buyers = [],
  apiBaseUrl,
  editingCampaignId = null,
  initialEmailBuilderTab = 'preview',
  onSuccess,
  onCancel,
}) => {
  const oauth = useOAuthMailbox(supplierId);
  let reduxBuyerLists: any[] = [];
  try {
    reduxBuyerLists = useAppSelector(selectBuyerLists) || [];
  } catch {
    reduxBuyerLists = [];
  }
  let dispatch: any;
  try {
    dispatch = useDispatch();
  } catch {
    dispatch = () => {};
  }

  const handleClearEditing = () => {
    dispatch(setEditingCampaignId(null));
    setSelectedTemplateKey('short_dated_clearance');
    setWorkflowName('Short-Dated Clearance Campaign');
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

  // Template & Campaign Cycle Metadata
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('default');
  const [centralTemplates, setCentralTemplates]       = useState<any[]>([]);
  const [workflowName, setWorkflowName]               = useState('Short-Dated Clearance Campaign');
  const [startDate, setStartDate]                     = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate]                         = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [showTemplateDrop, setShowTemplateDrop]         = useState(false);
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
  const [maxRslFilter, setMaxRslFilter]     = useState(0.20);
  const [minCasesFilter, setMinCasesFilter] = useState(10);
  const [explicitLotIds, setExplicitLotIds] = useState<string[]>([]);
  const [excludedLotIds, setExcludedLotIds] = useState<string[]>([]);
  const [selectorMode, setSelectorMode]     = useState<'automatic' | 'explicit' | 'hybrid'>('automatic');
  const [showLotGrid, setShowLotGrid]       = useState(true);
  const [fetchedLots, setFetchedLots]       = useState<any[] | null>(null);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);
  const [lotSearch, setLotSearch]         = useState('');
  const [lotDcFilter, setLotDcFilter]     = useState('');
  const [lotCoaFilter, setLotCoaFilter]   = useState('all');

  // Stages — now own their own audience
  const [stages, setStages] = useState<Stage[]>(TEMPLATE_DEFINITIONS[0].defaultStages);
  // Accordion: which stage is expanded (null = all collapsed)
  const [expandedStageIdx, setExpandedStageIdx] = useState<number | null>(0);

  // Execution
  const [executionType, setExecutionType]     = useState<'immediate' | 'cron'>('immediate');
  const [scheduleTime, setScheduleTime]       = useState('09:00');
  const [workflowTimezone, setWorkflowTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
  const [cronDays, setCronDays]               = useState<number[]>([1]);

  // Email builder
  const [emailSubject, setEmailSubject] = useState('Distressed Inventory Special Liquidation Offer');
  const [emailBlocks, setEmailBlocks]   = useState<EmailBlock[]>(DEFAULT_EMAIL_BLOCKS);

  // Target Buyer Segment Inspection state
  const [inspectingSegment, setInspectingSegment] = useState<string | null>(null);
  const [inspectSearch, setInspectSearch]           = useState<string>('');

  // Feature flag to hide Section 5 (Dynamic Donation & Multi-Entity Diversion) for base release.
  // Set to true to re-enable Section 5 in future phases.
  const SHOW_DYNAMIC_DONATION_SECTION = false;

  // Dynamic Donation & Multi-Entity Diversion Configuration
  const [donationEnabled, setDonationEnabled]                   = useState<boolean>(true);
  const [donationMaxCases, setDonationMaxCases]                 = useState<number>(500);
  const [donationDiversionStrategy, setDonationDiversionStrategy] = useState<'percentage_split' | 'priority_cascade'>('percentage_split');
  const [donatingEntities, setDonatingEntities]                 = useState<Array<{ id: string; name: string; email: string; maxCases: number; allocationPercent: number }>>([
    { id: '1', name: 'Feeding America - Greater Boston', email: 'donations@feedingamerica.org', maxCases: 300, allocationPercent: 60 },
    { id: '2', name: 'City Harvest NYC Rescue', email: 'rescue@cityharvest.org', maxCases: 200, allocationPercent: 40 }
  ]);
  const [newEntityName, setNewEntityName]         = useState('');
  const [newEntityEmail, setNewEntityEmail]       = useState('');
  const [newEntityMaxCases, setNewEntityMaxCases] = useState(150);
  const [newEntityAllocPercent, setNewEntityAllocPercent] = useState(30);

  // Donation Email Alert Settings
  const [donationEmailAlertEnabled, setDonationEmailAlertEnabled] = useState<boolean>(true);
  const [donationEmailSubject, setDonationEmailSubject]           = useState<string>('[Action Required] Food Rescue Donation Transfer Advice - {{lot_number}} ({{cases}} Cases)');
  const [donationEmailCustomNotes, setDonationEmailCustomNotes]   = useState<string>('Please arrange logistics pickup within 48 hours of scheduled pickup date. Reply to confirm dock door appointment and receive 501(c)(3) tax attestation documentation.');
  const [showDonationEmailPreview, setShowDonationEmailPreview]   = useState<boolean>(false);

  // Pre-flight
  const [showPreFlightModal, setShowPreFlightModal] = useState(false);
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [previewHtml, setPreviewHtml]               = useState('');
  const [emailEditorMode, setEmailEditorMode]       = useState<'standard' | 'tiptap'>('standard');
  const [emailBuilderSubTab, setEmailBuilderSubTab] = useState<'preview' | 'editor' | 'broadcast'>(initialEmailBuilderTab);

  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showDynamicDataPanel, setShowDynamicDataPanel] = useState<boolean>(true);
  const [activeConceptStep, setActiveConceptStep]       = useState<number>(1);
  const [stepperStep, setStepperStep]                   = useState<number>(1);
  const [completedSteps, setCompletedSteps]             = useState<number[]>([1]);

  const handleInsertTokenToSubject = (tokenKey: string) => {
    const tokenTag = `{{${tokenKey}}}`;
    if (!emailSubject.includes(tokenTag)) {
      setEmailSubject((prev) => (prev ? `${prev} ${tokenTag}` : tokenTag));
    }
    setCopiedToken(tokenKey);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const dynamicTokensList = [
    { key: 'buyer_name', label: 'Buyer Name', icon: Users, description: 'Target buyer company/account name' },
    { key: 'supplier_name', label: 'Supplier Name', icon: LayoutTemplate, description: 'Your organization name' },
    { key: 'lot_title', label: 'Lot Title', icon: Sparkles, description: 'Title or description of matched inventory' },
    { key: 'inventory_table', label: 'Inventory Table', icon: Table, description: 'Itemized HTML table of matched lots' },
    { key: 'quick_bid_link', label: 'Quick Bid Link', icon: Link, description: 'Direct 1-Click bidding URL' },
    { key: 'current_stage_discount', label: 'Stage Markdown', icon: Sliders, description: 'Current stage discount value or floor bid' },
    { key: 'expiry_hours', label: 'Response Deadline', icon: Clock, description: 'Time window before next escalation stage' }
  ];

  useEffect(() => {
    if (initialEmailBuilderTab) {
      setEmailBuilderSubTab(initialEmailBuilderTab);
    }
  }, [initialEmailBuilderTab]);

  // Hydration effect when editing an existing campaign
  useEffect(() => {
    if (!editingCampaignId) {
      setSelectedTemplateKey('short_dated_clearance');
      setWorkflowName('Short-Dated Clearance Campaign');
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
      setEmailSubject('Distressed Inventory Special Liquidation Offer');
      setEmailBlocks(DEFAULT_EMAIL_BLOCKS);
      setDonationEnabled(true);
      return;
    }
    const fetchEditingCampaign = async () => {
      try {
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
            }
            if (campaign.emailTemplate) {
              if (campaign.emailTemplate.subject) setEmailSubject(campaign.emailTemplate.subject);
              if (Array.isArray(campaign.emailTemplate.blocks)) setEmailBlocks(campaign.emailTemplate.blocks);
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
    } catch (err) { console.error(err); }
    finally {
      if (typeof window !== 'undefined') setIsFetchingInventory(false);
    }
  };

  useEffect(() => {
    if (!inventoryLots) {
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

  const updateStage = (idx: number, updates: Partial<Stage>) => {
    setStages(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const activeLots = Array.isArray(inventoryLots) ? inventoryLots : (Array.isArray(fetchedLots) ? fetchedLots : []);

  const matchedLots = useMemo(() => activeLots.filter((lot: any) => {
    if (!lot) return false;
    const id = lot._id?.toString() || lot.id;
    if (!id) return false;

    if (selectorMode === 'explicit') {
      return explicitLotIds.includes(id);
    }
    if (selectorMode === 'hybrid') {
      if (excludedLotIds.includes(id)) return false;
      if (explicitLotIds.includes(id)) return true;
    }

    if (excludedLotIds.includes(id)) return false;
    if (explicitLotIds.includes(id)) return true;
    if (categoryFilter && lot.productId?.category !== categoryFilter) return false;
    if (maxRslFilter > 0 && (lot.remainingShelfLife ?? 1) > maxRslFilter) return false;
    if (minCasesFilter > 0 && (lot.availableQty ?? lot.quantityCases ?? 0) < minCasesFilter) return false;
    return true;
  }), [activeLots, categoryFilter, maxRslFilter, minCasesFilter, explicitLotIds, excludedLotIds, selectorMode]);

  const displayLots = useMemo(() => activeLots.filter((lot: any) => {
    const q = lotSearch.toLowerCase();
    const desc = (lot.productId?.description || lot.lotNumber || '').toLowerCase();
    const sku  = (lot.productId?.sku || '').toLowerCase();
    const matchSearch = !q || desc.includes(q) || sku.includes(q);
    const dc = typeof lot.distributionCenterId === 'object'
      ? (lot.distributionCenterId?.name || lot.distributionCenterId?.code || '')
      : (lot.distributionCenterId || '');
    const matchDC  = !lotDcFilter || dc.toLowerCase().includes(lotDcFilter.toLowerCase());
    const hasCoa   = lot.complianceStatus === 'verified' || lot.coaS3Uri;
    const matchCoa = lotCoaFilter === 'all' || (lotCoaFilter === 'verified' && hasCoa) || (lotCoaFilter === 'pending' && !hasCoa);
    return matchSearch && matchDC && matchCoa;
  }), [activeLots, lotSearch, lotDcFilter, lotCoaFilter]);

  const impactMetrics = useMemo(() => {
    const totalLots  = matchedLots.length;
    const totalCases = matchedLots.reduce((a, l) => a + (l?.availableQty ?? l?.quantityCases ?? 0), 0);
    const totalValue = matchedLots.reduce((a, l) => {
      const cases = l?.availableQty ?? l?.quantityCases ?? 0;
      return a + cases * (l?.costPerCase || l?.standardSellPrice || 10);
    }, 0);
    const urgentLots = matchedLots.filter(l => (l?.remainingShelfLife ?? 1) <= 0.15).length;
    // Total unique audience across all stages
    const audienceSet = new Set<string>();
    stages.forEach(s => {
      if (s.buyerMode === 'custom') s.customBuyers.forEach(b => audienceSet.add(b.id));
      else {
        const count = getStageBuyerCount(s, reduxBuyerLists.length > 0 ? reduxBuyerLists : buyers);
        for (let i = 0; i < count; i++) audienceSet.add(`list-${s.buyerListId || s.buyerSegment}-${i}`);
      }
    });
    return { totalLots, totalCases, totalValue, urgentLots, audienceCount: audienceSet.size };
  }, [matchedLots, stages, buyers, reduxBuyerLists]);

  const hasZeroBuyerStage = useMemo(() => {
    return stages.some(s => getStageBuyerCount(s, reduxBuyerLists.length > 0 ? reduxBuyerLists : buyers) === 0);
  }, [stages, buyers, reduxBuyerLists]);

  const dynamicDataContext = useMemo<Record<string, string>>(() => {
    // 1. Lot Title
    let lotTitle = '[No Inventory Selected]';
    if (matchedLots.length === 1) {
      const lot = matchedLots[0];
      lotTitle = lot.title || lot.productId?.description || lot.lotNumber || 'Surplus Item';
    } else if (matchedLots.length > 1) {
      const primary = matchedLots[0].title || matchedLots[0].productId?.description || matchedLots[0].lotNumber || 'Surplus Item';
      const extraCount = matchedLots.length - 1;
      const lotLabel = extraCount === 1 ? 'additional lot' : 'additional lots';
      lotTitle = `${primary} (+${extraCount} ${lotLabel})`;
    }

    // 2. Buyer Name
    let buyerName = '[No Buyer Selected]';
    const stage1 = stages?.[0];
    if (stage1) {
      if (stage1.buyerMode === 'list' || stage1.buyerMode === 'segment') {
        const listLabel = stage1.buyerListName || stage1.buyerListId || stage1.buyerSegment || 'Target Buyer List';
        const count = getStageBuyerCount(stage1, reduxBuyerLists.length > 0 ? reduxBuyerLists : buyers);
        buyerName = count > 0 ? `${listLabel} (${count} buyers)` : '[No Buyer Selected]';
      } else if (stage1.customBuyers && stage1.customBuyers.length > 0) {
        const targetId = typeof stage1.customBuyers[0] === 'object' ? stage1.customBuyers[0].id : stage1.customBuyers[0];
        const firstBuyer = buyers.find((b: any) => (b._id?.toString() || b.id) === targetId);
        const name = firstBuyer ? (firstBuyer.companyName || firstBuyer.name || firstBuyer.email) : 'Custom Targeted Buyer';
        buyerName = stage1.customBuyers.length > 1 ? `${name} (+${stage1.customBuyers.length - 1} more)` : name;
      } else if (buyers && buyers.length > 0) {
        buyerName = buyers[0].companyName || buyers[0].name || buyers[0].email || 'Registered Buyer';
      }
    } else if (buyers && buyers.length > 0) {
      buyerName = buyers[0].companyName || buyers[0].name || buyers[0].email || 'Registered Buyer';
    }

    // 3. Supplier Name (Sanitize raw hex ObjectIDs / internal IDs like 6a61abe7b15358bc3 or sup-101)
    const isRawId = (str?: string) => {
      if (!str) return true;
      return /^[a-f0-9]{12,32}$/i.test(str) || /^sup-[a-z0-9-]+$/i.test(str) || /^id-[a-z0-9-]+$/i.test(str);
    };
    const supplierName = (customSupplierName && !isRawId(customSupplierName))
      ? customSupplierName
      : (!isRawId(supplierId) ? supplierId : 'Unilever Supply Operations');

    // 4. Stage Discount
    let stageDiscount = '[No Stage Discount Set]';
    if (stage1) {
      if (stage1.discountType === 'fixed' && typeof stage1.discountValue === 'number' && stage1.discountValue > 0) {
        stageDiscount = `${stage1.discountValue}% Markdown`;
      } else if (stage1.discountType === 'yield') {
        stageDiscount = 'Yield Bidding Round';
      } else if (typeof stage1.discountValue === 'number' && stage1.discountValue > 0) {
        stageDiscount = `${stage1.discountValue}% Off`;
      }
    }

    // 5. Expiry Hours
    let expiryHours = '[No Deadline Set]';
    if (stage1 && typeof stage1.waitHours === 'number' && stage1.waitHours > 0) {
      expiryHours = `${stage1.waitHours} Hours`;
    }

    // 6. Quick Bid Link
    const quickBidLink = 'https://indspoileralert.com/bid?token=demo-token-123';

    // 7. Inventory Table HTML
    let inventoryTable = '<div style="padding: 12px; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center; color: #64748b; font-size: 13px; background: #f8fafc;">[No Inventory Selected - Select lots in Step 1]</div>';
    if (matchedLots.length > 0) {
      const rows = matchedLots.map((lot: any, idx: number) => {
        const sku = lot.productId?.sku || lot.lotNumber || `LOT-${idx + 1}`;
        const desc = lot.title || lot.productId?.description || 'Surplus Inventory Item';
        const qty = lot.availableQty ?? lot.quantityCases ?? 0;
        const rsl = lot.remainingShelfLife ? `${Math.round(lot.remainingShelfLife * 100)}% RSL` : 'N/A';
        return `<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 12px; font-weight: 600;">${sku}</td><td style="padding: 8px 12px;">${desc}</td><td style="padding: 8px 12px; text-align: right; font-weight: 600;">${qty} cs</td><td style="padding: 8px 12px; text-align: right; color: #64748b;">${rsl}</td></tr>`;
      }).join('');
      inventoryTable = `<table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;"><thead style="background-color: #f1f5f9; color: #334155; text-align: left;"><tr><th style="padding: 8px 12px;">SKU / Lot #</th><th style="padding: 8px 12px;">Product Description</th><th style="padding: 8px 12px; text-align: right;">Quantity</th><th style="padding: 8px 12px; text-align: right;">Shelf Life</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const derived = {
      buyer_name: buyerName,
      supplier_name: supplierName,
      lot_title: lotTitle,
      current_stage_discount: stageDiscount,
      expiry_hours: expiryHours,
      quick_bid_link: quickBidLink,
      inventory_table: inventoryTable
    };

    return { ...derived, ...manualOverrides };
  }, [matchedLots, stages, buyers, supplierId, manualOverrides]);

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

  useEffect(() => {
    if (showPreFlightModal) setPreviewHtml(buildBlockHtml(emailBlocks));
  }, [showPreFlightModal, emailBlocks]);

  const handleLaunch = async () => {
    setIsSubmitting(true);
    try {
      const computedSelectorMode = selectorMode === 'hybrid'
        ? 'hybrid'
        : (explicitLotIds.length > 0 ? 'explicit' : (selectorMode || 'automatic'));

      const payload = {
        supplierId,
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
        stages,
        rules: { evaluationWindowHours: typeof stages?.[0]?.waitHours === 'number' && stages[0].waitHours > 0 ? stages[0].waitHours : 48 },
        schedule: { type: executionType, timeOfDay: scheduleTime, timezone: workflowTimezone, daysOfWeek: cronDays },
        emailTemplate: { subject: emailSubject, blocks: emailBlocks },
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
      const targetId = created._id || editingCampaignId;

      if (executionType === 'immediate' && targetId) {
        await fetch(`${apiBaseUrl}/liquidation-automations/${targetId}/trigger`, { method: 'POST' });
      }
      setShowPreFlightModal(false);
      if (onSuccess) onSuccess('launched');
    } catch (err: any) {
      alert(`Launch Error: ${err.message}`);
    } finally { setIsSubmitting(false); }
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
        if (cycleRes.ok) {
          const cycleData = await cycleRes.json();
          cycleId = cycleData._id || cycleData.id;
        }
      } catch (err) {
        console.warn('Optional LiquidationCycle creation note:', err);
      }

      const computedSelectorMode = selectorMode === 'hybrid'
        ? 'hybrid'
        : (explicitLotIds.length > 0 ? 'explicit' : (selectorMode || 'automatic'));

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
        stages,
        rules: { evaluationWindowHours: typeof stages?.[0]?.waitHours === 'number' && stages[0].waitHours > 0 ? stages[0].waitHours : 48 },
        schedule: { type: executionType, timeOfDay: scheduleTime, timezone: workflowTimezone, daysOfWeek: cronDays },
        emailTemplate: { subject: emailSubject, blocks: emailBlocks },
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

  // ── Shared styles ──────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: 'hsl(var(--bg-card))', padding: '20px 24px', borderRadius: '14px', border: '1px solid hsl(var(--border-color))' };
  const h3st: React.CSSProperties = { fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' };
  const inpSt: React.CSSProperties = { background: 'hsl(223 47% 9%)', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '9px 10px', color: '#fff', fontSize: '13px', width: '100%', boxSizing: 'border-box' };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="liquidation-automation-studio animate-fadeIn"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: editingCampaignId ? '20px' : '8px 0',
        borderRadius: '16px',
        border: editingCampaignId ? '2px solid hsl(var(--warning))' : '1px solid transparent',
        boxShadow: editingCampaignId ? '0 0 20px hsl(var(--warning) / 15%)' : 'none',
        transition: 'all 0.25s ease-in-out'
      }}
    >
      {oauth.status === 'expired' && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'hsl(var(--destructive)/0.1)', border: '1px solid hsl(var(--destructive)/0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="hsl(var(--destructive))" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--destructive))', margin: 0 }}>Your Mailbox Connection has Expired</h3>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: '4px 0 0' }}>Please re-authenticate to launch campaigns. You still have read-only access to historical data.</p>
            </div>
          </div>
          <button type="button" onClick={oauth.connectMailbox} style={{ padding: '8px 16px', borderRadius: '8px', background: 'hsl(var(--destructive))', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            Re-authenticate Now
          </button>
        </div>
      )}

      {/* ══ EDITING CAMPAIGN OVERLAY BANNER ═════════════════════════════════ */}
      {editingCampaignId && (
        <div style={{
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
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: 'hsl(var(--warning) / 20%)',
              border: '1px solid hsl(var(--warning) / 40%)',
              color: 'hsl(var(--warning))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Edit3 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'hsl(var(--warning))', letterSpacing: '-0.01em' }}>
                  Editing Saved Campaign Strategy
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'hsl(var(--warning) / 20%)',
                  border: '1px solid hsl(var(--warning) / 40%)',
                  color: 'hsl(var(--warning))',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  ID: {editingCampaignId}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '3px' }}>
                Currently editing parameters for <strong style={{ color: '#fff' }}>"{workflowName}"</strong>. Save will update this saved strategy.
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
                transition: 'all 0.15s ease'
              }}
            >
              <X size={15} /> Clear & Start New Campaign
            </button>
          </div>
        </div>
      )}

      {/* ══ TOP BAR: Name + Execution + Launch ══════════════════════════════ */}
      <div style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>

          {/* Left: branding + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <Zap size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Liquidation Automation Studio</h2>
                <span style={{ background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary)/0.3)', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>Production Grade</span>
              </div>
              <input type="text" value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="Enter workflow name…"
                style={{ marginTop: '6px', ...inpSt, maxWidth: '320px', fontWeight: 500, fontSize: '13px' }} />
            </div>
          </div>

          {/* Centre: Execution mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '290px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '5px' }}><Zap size={12} /> Execution Mode</div>
            <div style={{ display: 'flex', gap: '7px' }}>
              {(['immediate', 'cron'] as const).map(mode => (
                <button key={mode} type="button" onClick={() => setExecutionType(mode)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: executionType === mode ? `1px solid hsl(var(--${mode === 'immediate' ? 'primary' : 'secondary'}))` : '1px solid hsl(var(--border-color))', background: executionType === mode ? `hsl(var(--${mode === 'immediate' ? 'primary' : 'secondary'})/0.15)` : 'transparent', color: '#fff' }}>
                  {mode === 'immediate' ? '⚡ Run Now' : '🕐 Scheduled'}
                </button>
              ))}
            </div>
            {executionType === 'cron' && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => {
                    const sel = cronDays.includes(i);
                    return <button key={d} type="button" onClick={() => setCronDays(p => sel ? p.filter(x => x !== i) : [...p, i])}
                      style={{ padding: '3px 7px', borderRadius: '4px', border: '1px solid hsl(var(--border-color))', background: sel ? 'hsl(var(--secondary))' : 'hsl(var(--bg-card))', color: '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>{d}</button>;
                  })}
                </div>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  style={{ background: 'hsl(223 47% 9%)', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '4px 7px', color: '#fff', fontSize: '11px' }} />
                <span style={{ fontSize: '11px', color: 'hsl(var(--primary))', fontWeight: 600, background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.25)', padding: '3px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                  {format12HourTime(scheduleTime)}
                </span>
              </div>
            )}
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {onCancel && <button type="button" onClick={onCancel} style={{ background: 'transparent', color: 'hsl(var(--text-secondary))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>← Back</button>}
            <button
              type="button"
              onClick={() => handleSaveCampaign('draft')}
              disabled={isSubmitting || oauth.status === 'expired' || hasZeroBuyerStage}
              style={{
                background: 'hsl(223 47% 12%)',
                color: '#fff',
                border: '1px solid hsl(var(--primary))',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: (isSubmitting || oauth.status === 'expired' || hasZeroBuyerStage) ? 'not-allowed' : 'pointer',
                opacity: (oauth.status === 'expired' || hasZeroBuyerStage) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              <Save size={15} color="hsl(var(--primary))" />
              <span>{isSubmitting ? 'Saving...' : 'Save as Draft'}</span>
            </button>
            <button type="button" onClick={() => !hasZeroBuyerStage && setShowPreFlightModal(true)} disabled={impactMetrics.totalLots === 0 || oauth.status === 'expired' || hasZeroBuyerStage}
              style={{ background: (impactMetrics.totalLots > 0 && oauth.status !== 'expired' && !hasZeroBuyerStage) ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' : 'hsl(var(--border-color))', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '13px', cursor: (impactMetrics.totalLots > 0 && oauth.status !== 'expired' && !hasZeroBuyerStage) ? 'pointer' : 'not-allowed', opacity: (oauth.status === 'expired' || hasZeroBuyerStage) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '7px', boxShadow: (impactMetrics.totalLots > 0 && oauth.status !== 'expired' && !hasZeroBuyerStage) ? '0 4px 14px hsl(var(--primary)/0.35)' : 'none' }}>
              <Play size={15} /> Launch Active Campaign
            </button>
          </div>
        </div>
      </div>

      {/* ══ SECTION 1: Campaign Setup & Strategy Template ════════════════════ */}
      <div id="campaign-template-section" style={card}>
        <h3 style={h3st}><LayoutTemplate size={17} color="hsl(var(--primary))" /> 1. Stage-Gate Workflow Template & Campaign Setup</h3>

        {/* Campaign Cycle Metadata Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
              Campaign Cycle Name
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              placeholder="e.g. Q3 Surplus Liquidation Campaign"
              style={inpSt}
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
              style={inpSt}
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
              style={inpSt}
            />
          </div>
        </div>

        <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px' }}>
          Sales Strategy Template
        </label>
        <div ref={templateRef} style={{ position: 'relative', maxWidth: '480px', marginBottom: '16px' }}>
          <button type="button" onClick={() => setShowTemplateDrop(p => !p)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(223 47% 9%)', border: `1px solid ${showTemplateDrop ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`, borderRadius: '10px', padding: '12px 16px', color: '#fff', cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'hsl(var(--secondary)/0.15)', color: 'hsl(var(--secondary))', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', border: '1px solid hsl(var(--secondary)/0.2)' }}>{selectedDef.badge}</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{selectedDef.name}</span>
            </div>
            {showTemplateDrop ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showTemplateDrop && (
            <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 50, background: 'hsl(223 47% 10%)', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
              {TEMPLATE_DEFINITIONS.map(t => {
                const sel = selectedTemplateKey === t.key;
                return (
                  <div key={t.key} onClick={() => handleSelectTemplate(t.key)}
                    style={{ padding: '13px 16px', cursor: 'pointer', background: sel ? 'hsl(var(--primary)/0.08)' : 'transparent', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'hsl(223 47% 14%)'; }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ background: 'hsl(var(--secondary)/0.15)', color: 'hsl(var(--secondary))', fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '8px' }}>{t.badge}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{t.name}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', margin: 0, maxWidth: '380px' }}>{t.description}</p>
                    </div>
                    {sel && <Check size={15} color="hsl(var(--primary))" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logic flow */}
        <div style={{ background: 'hsl(223 47% 8%)', border: '1px dashed hsl(var(--primary)/0.4)', borderRadius: '10px', padding: '13px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <Sparkles size={14} color="hsl(var(--primary))" />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Logic Flow: <span style={{ color: 'hsl(var(--primary))' }}>{selectedDef.name}</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {selectedDef.flowSteps.map((step, i) => (
              <React.Fragment key={i}>
                <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                  <div style={{ background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))', width: '22px', height: '22px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{i + 1}</div>
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

      {/* ══ MAIN BODY: Full-Width 100% Canvas ════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

        {/* SECTION 2: Inventory Selector */}
        <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ ...h3st, margin: 0 }}><Filter size={17} color="hsl(var(--primary))" /> 2. Matching Inventory Lots</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button type="button" onClick={handleLoadInventory} disabled={isFetchingInventory}
                  style={{ background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary)/0.3)', borderRadius: '6px', padding: '4px 11px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {isFetchingInventory ? 'Loading…' : '🔄 Load Live'}
                </button>
                <button type="button" onClick={() => setShowLotGrid(p => !p)}
                  style={{ background: 'transparent', color: 'hsl(var(--primary))', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  {showLotGrid ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showLotGrid ? 'Hide Grid' : `View (${matchedLots.length})`}
                </button>
              </div>
            </div>

            {/* Filter row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Category</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inpSt}>
                  <option value="">All Categories</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Produce">Produce</option>
                  <option value="Meat & Poultry">Meat & Poultry</option>
                  <option value="Dry Goods">Dry Goods</option>
                  <option value="Frozen Foods">Frozen Foods</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Max RSL: <strong style={{ color: 'hsl(var(--warning))' }}>{Math.round(maxRslFilter * 100)}%</strong></label>
                <input type="range" min="0.05" max="0.50" step="0.05" value={maxRslFilter} onChange={e => setMaxRslFilter(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Min Cases</label>
                <input type="number" value={minCasesFilter} onChange={e => setMinCasesFilter(parseInt(e.target.value) || 0)} style={inpSt} />
              </div>
            </div>

            {showLotGrid && (
              <div style={{ background: 'hsl(223 47% 8%)', border: '1px solid hsl(var(--border-color))', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Search row */}
                <div style={{ padding: '9px 13px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center', background: 'hsl(223 47% 10%)' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                    <input type="text" placeholder="Search lots…" value={lotSearch} onChange={e => setLotSearch(e.target.value)}
                      style={{ ...inpSt, paddingLeft: '26px', padding: '6px 6px 6px 26px', fontSize: '12px', borderRadius: '6px', background: 'hsl(223 47% 9%)' }} />
                  </div>
                  <select value={lotDcFilter} onChange={e => setLotDcFilter(e.target.value)} style={{ ...inpSt, width: 'auto', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', background: 'hsl(223 47% 9%)' }}>
                    <option value="">All DCs</option>
                    {[...new Set(activeLots.map((l: any) => typeof l.distributionCenterId === 'object' ? (l.distributionCenterId?.name || '') : (l.distributionCenterId || '')).filter(Boolean))].map(dc => <option key={dc} value={dc}>{dc}</option>)}
                  </select>
                  <select value={lotCoaFilter} onChange={e => setLotCoaFilter(e.target.value)} style={{ ...inpSt, width: 'auto', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', background: 'hsl(223 47% 9%)' }}>
                    <option value="all">All Compliance</option>
                    <option value="verified">COA Verified</option>
                    <option value="pending">COA Pending</option>
                  </select>
                </div>
                {/* Header row */}
                <div style={{ background: 'hsl(223 47% 12%)', padding: '7px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button" onClick={allDisplaySelected ? deselectAll : selectAll}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', background: allDisplaySelected ? 'hsl(var(--primary)/0.15)' : 'transparent', border: `1px solid ${allDisplaySelected ? 'hsl(var(--primary)/0.4)' : 'hsl(var(--border-color))'}`, color: allDisplaySelected ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      {allDisplaySelected ? <CheckSquare size={11} /> : <Square size={11} />}
                      {allDisplaySelected ? 'Deselect All' : 'Select All'}
                    </button>
                    <span>Lots ({displayLots.length})</span>
                  </div>
                  <span style={{ color: 'hsl(var(--primary))' }}>{matchedLots.length} in workflow</span>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {activeLots.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>No lots loaded — click Load Live above.</div>
                  ) : displayLots.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>No lots match your filters.</div>
                  ) : displayLots.map((lot: any) => {
                    const lotId   = lot._id?.toString() || lot.id;
                    const isIn    = matchedLots.some((m: any) => (m._id?.toString() || m.id) === lotId);
                    const isExpl  = explicitLotIds.includes(lotId);
                    const isExcl  = excludedLotIds.includes(lotId);
                    const desc    = lot.productId?.description || 'Surplus Item';
                    const sku     = lot.productId?.sku || lot.lotNumber || 'SKU';
                    const cases   = lot.availableQty ?? lot.quantityCases ?? 0;
                    const rsl     = Math.round((lot.remainingShelfLife ?? 0.2) * 100);
                    const hasCoa  = lot.complianceStatus === 'verified' || lot.coaS3Uri;
                    const dc      = typeof lot.distributionCenterId === 'object' ? (lot.distributionCenterId?.name || lot.distributionCenterId?.code || 'Main DC') : (lot.distributionCenterId || 'Main DC');
                    return (
                      <div key={lotId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 15px', borderBottom: '1px solid hsl(223 27% 14%)', background: isIn ? 'transparent' : 'hsl(346 84% 50%/0.04)', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <input type="checkbox" checked={isIn} onChange={() => toggleLot(lotId, isIn)} style={{ width: '14px', height: '14px', accentColor: 'hsl(var(--primary))', cursor: 'pointer' }} />
                          <div>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                              <span>{desc}</span>
                              <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>({sku})</span>
                              {isExpl && <span style={{ background: 'hsl(var(--success)/0.15)', color: 'hsl(var(--success))', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>EXPLICIT</span>}
                              {isExcl && <span style={{ background: 'hsl(var(--error)/0.15)', color: 'hsl(var(--error))', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>EXCLUDED</span>}
                            </div>
                            <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'flex', gap: '10px', marginTop: '1px' }}>
                              <span>DC: {dc}</span>
                              <span>Exp: {lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: rsl <= 15 ? 'hsl(var(--error))' : 'hsl(var(--warning))' }}>{rsl}% RSL</span>
                          <span style={{ fontSize: '11px', fontWeight: 600 }}>{cases} cases</span>
                          {hasCoa
                            ? <span style={{ color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}><CheckCircle size={11} /> COA</span>
                            : <span style={{ color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}><AlertTriangle size={11} /> Pending</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 3: Stage-Gate Timeline
              Each stage card now contains its own Audience Picker.
              No separate Section 4 — audience lives with its stage.
             ══════════════════════════════════════════════════════ */}
          <div style={card}>
            <h3 style={h3st}><Clock size={17} color="hsl(var(--primary))" /> 3. Stage-Gate Escalation Timeline</h3>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: '-8px 0 16px', lineHeight: 1.5 }}>
              Each stage escalates to a different audience at a different price. Click any stage to configure its audience and pricing.
            </p>

            {/* Visual timeline spine */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {stages.map((stage, idx) => {
                const isExpanded = expandedStageIdx === idx;
                const isListMode = stage.buyerMode === 'list' || stage.buyerMode === 'segment';
                const listLabel = stage.buyerListName || stage.buyerListId || stage.buyerSegment || 'Target List';
                const audienceSummary = isListMode ? listLabel : `${stage.customBuyers.length} custom buyer${stage.customBuyers.length !== 1 ? 's' : ''}`;
                const pricingSummary = stage.discountType === 'yield' ? 'AI Yield' : stage.discountType === 'fixed' ? `${stage.discountValue}% Off` : `$${stage.discountValue} Floor`;
                const stageBuyerCount = getStageBuyerCount(stage, reduxBuyerLists.length > 0 ? reduxBuyerLists : buyers);
                const isZeroBuyer = stageBuyerCount === 0;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', marginBottom: idx < stages.length - 1 ? '8px' : '0' }}>
                    <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>

                    {/* Left spine: number + connector line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px', flexShrink: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                        background: isExpanded ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' : 'hsl(223 47% 14%)',
                        border: `2px solid ${isExpanded ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 800,
                        color: isExpanded ? '#fff' : 'hsl(var(--text-muted))',
                        transition: 'all 0.2s', cursor: 'pointer', zIndex: 1,
                      }} onClick={() => setExpandedStageIdx(isExpanded ? null : idx)}>
                        {stage.stageIndex}
                      </div>
                      {idx < stages.length - 1 && (
                        <div style={{ width: '2px', flex: 1, minHeight: '20px', background: 'hsl(var(--border-color))', margin: '4px 0' }} />
                      )}
                    </div>

                    {/* Right: card */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Collapsed summary row — always visible */}
                      <div
                        onClick={() => setExpandedStageIdx(isExpanded ? null : idx)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: isExpanded ? 'hsl(var(--primary) / 0.08)' : 'hsl(223 47% 9%)',
                          border: `1px solid ${isExpanded ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--border-color))'}`,
                          borderRadius: isExpanded ? '10px 10px 0 0' : '10px',
                          cursor: 'pointer', transition: 'all 0.18s',
                          flexWrap: 'wrap', gap: '8px',
                        }}
                        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'hsl(223 47% 12%)'; }}
                        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'hsl(223 47% 9%)'; }}
                      >
                        {/* Left: name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '140px' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: 700,
                            color: isExpanded ? 'hsl(var(--primary))' : '#e2e8f0',
                          }}>{stage.name}</span>
                        </div>

                        {/* Centre: summary chips */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {/* Token Binding Indicator */}
                          <span data-testid="buyer-name-token-binding-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(217 91% 60% / 0.12)', border: '1px solid hsl(217 91% 60% / 0.3)', color: '#60a5fa', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            🔗 Attached: &#123;&#123;buyer_name&#125;&#125; token bound to stage buyer selection
                          </span>
                          {/* Audience chip */}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.25)', color: 'hsl(var(--primary))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <Users size={11} /> {audienceSummary}
                          </span>
                          {/* Pricing chip */}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--secondary)/0.12)', border: '1px solid hsl(var(--secondary)/0.25)', color: 'hsl(var(--secondary))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <Sliders size={11} /> {pricingSummary}
                          </span>
                          {/* Wait chip */}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--text-muted)/0.08)', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            <Clock size={11} /> {formatWaitTime(stage.waitHours)} window
                          </span>
                        </div>

                        {/* Right: controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {stages.length > 1 && (
                            <button type="button"
                              onClick={e => { e.stopPropagation(); setStages(p => p.filter((_, i) => i !== idx)); setExpandedStageIdx(null); }}
                              style={{ background: 'none', border: 'none', color: 'hsl(var(--error))', cursor: 'pointer', padding: '4px', display: 'flex', opacity: 0.6, borderRadius: '4px' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}
                            ><Trash2 size={13} /></button>
                          )}
                          <div style={{ color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded panel — full width, vertical stacking */}
                      {isExpanded && (
                        <div style={{
                          background: 'hsl(223 47% 8%)',
                          border: '1px solid hsl(var(--primary)/0.3)',
                          borderTop: 'none',
                          borderRadius: '0 0 10px 10px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                        }}>

                          {/* Stage name (editable here) */}
                          <div>
                            <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Stage Name</label>
                            <input
                              type="text"
                              value={stage.name}
                              onChange={e => updateStage(idx, { name: e.target.value })}
                              style={{ ...inpSt, fontSize: '13px', fontWeight: 600, maxWidth: '380px' }}
                            />
                          </div>

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                          {/* Audience — full width */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
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

                          {/* Pricing & Timing — three fields in a row */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                              <Sliders size={13} /> Pricing & Timing
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                              <div>
                                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '5px' }}>Pricing Rule</label>
                                <select
                                  value={stage.discountType}
                                  onChange={e => updateStage(idx, { discountType: e.target.value as Stage['discountType'] })}
                                  style={inpSt}
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
                                  disabled={stage.discountType === 'yield'}
                                  value={stage.discountValue}
                                  onChange={e => updateStage(idx, { discountValue: parseFloat(e.target.value) || 0 })}
                                  placeholder={stage.discountType === 'yield' ? 'AI-managed' : ''}
                                  style={{ ...inpSt, opacity: stage.discountType === 'yield' ? 0.45 : 1 }}
                                />
                              </div>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                  <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Response Window</label>
                                  <span style={{ fontSize: '10px', color: 'hsl(var(--primary))', fontWeight: 600 }}>{formatWaitTime(stage.waitHours)}</span>
                                </div>
                                {(() => {
                                  const currentUnit = stage.waitUnit || (stage.waitHours < 1 && stage.waitHours > 0 ? 'm' : 'h');
                                  const rawVal = currentUnit === 'm'
                                    ? Math.round(stage.waitHours * 60)
                                    : Number(stage.waitHours.toFixed(2));
                                  return (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <input
                                        type="number"
                                        min={0.01}
                                        step="any"
                                        value={isNaN(rawVal) || rawVal === 0 ? '' : rawVal}
                                        onChange={e => {
                                          const val = parseFloat(e.target.value) || 0;
                                          updateStage(idx, {
                                            waitHours: currentUnit === 'm' ? val / 60 : val,
                                            waitUnit: currentUnit
                                          });
                                        }}
                                        style={{ ...inpSt, flex: 1 }}
                                      />
                                      <select
                                        value={currentUnit}
                                        onChange={e => {
                                          const newUnit = e.target.value as 'h' | 'm';
                                          updateStage(idx, { waitUnit: newUnit });
                                        }}
                                        style={{ background: 'hsl(223 47% 9%)', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '4px 6px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                                      >
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
                                : `Buyers receive a ${stage.discountType === 'fixed' ? `${stage.discountValue}% markdown` : `$${stage.discountValue} floor bid`} offer and have ${formatWaitTime(stage.waitHours)} to respond before the next stage triggers.`
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                    {isZeroBuyer && (
                      <div data-testid="zero-buyer-error-banner" style={{ marginTop: '6px', marginLeft: '52px', padding: '10px 14px', background: 'hsl(0 84% 60% / 0.15)', border: '1px solid hsl(0 84% 60% / 0.4)', borderRadius: '8px', color: '#f87171', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} color="#f87171" />
                        <span>⚠️ Zero-Buyer Selection Error: Stage {stage.stageIndex} has 0 targeted buyers. At least 1 valid buyer must be selected for this stage.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add stage */}
            <button type="button"
              onClick={() => {
                const newIdx = stages.length;
                const secList = reduxBuyerLists.find((l: any) => l.type === 'secondary') || reduxBuyerLists[1] || reduxBuyerLists[0];
                setStages(p => [...p, {
                  stageIndex: p.length + 1,
                  name: `Stage ${p.length + 1}: Escalation`,
                  buyerMode: 'list',
                  buyerListId: secList ? secList._id : 'secondary',
                  buyerListName: secList ? secList.name : 'Secondary Liquidators',
                  customBuyers: [],
                  discountType: 'fixed',
                  discountValue: 15,
                  waitHours: 24
                }]);
                setExpandedStageIdx(newIdx);
              }}
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '7px', background: 'hsl(223 47% 9%)', border: '1px dashed hsl(var(--primary)/0.4)', color: 'hsl(var(--primary))', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary)/0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'hsl(223 47% 9%)'}
            >
              <Plus size={14} /> Add Escalation Stage
            </button>
          </div>

          {/* SECTION 4: Email Builder & Live Preview — Concept C Minimal Productivity Layout */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ ...h3st, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={17} color="hsl(var(--primary))" />
                    <span>4. Email Template</span>
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>(Attach Centralized Email Template)</span>
                  </h3>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary)/0.3)' }}>
                    CONCEPT C – Minimal Productivity Layout (Streamlined)
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                  Select centralized templates, customize dynamic preview context, and inspect responsive desktop & mobile rendering.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--success))', background: 'hsl(var(--success)/0.12)', padding: '4px 10px', borderRadius: '12px', border: '1px solid hsl(var(--success)/0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> Client-Facing Simple Builder
                </span>
              </div>
            </div>

            {/* Progressive 3-Step Email Template Stepper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Step Pills Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'hsl(223 47% 8%)', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', padding: '10px 14px' }}>
                {[
                  { id: 1, label: '1. Template', icon: LayoutTemplate },
                  { id: 2, label: '2. Subject', icon: PenLine },
                  { id: 3, label: '3. Preview & Override', icon: Eye }
                ].map((st) => {
                  const StepIcon = st.icon;
                  const isActive = stepperStep === st.id;
                  const isCompleted = completedSteps.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStepperStep(st.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: 1,
                        backgroundColor: isActive ? 'hsl(var(--primary)/0.15)' : 'hsl(223 47% 10%)',
                        border: isActive ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                        color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <StepIcon size={14} color={isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'} />
                      <span>{st.label}</span>
                      {isCompleted && <CheckCircle size={13} color="hsl(var(--success))" />}
                    </button>
                  );
                })}
              </div>

                {/* STEP 1: Choose Email Template */}
                <div
                  id="sec-concept-template"
                  style={{
                    background: 'hsl(223 47% 8%)',
                    border: stepperStep === 1 ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                    borderRadius: '12px',
                    padding: '16px',
                    opacity: 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LayoutTemplate size={16} color="hsl(var(--primary))" />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>Step 1: Select Central Email Template</span>
                    </div>
                    {completedSteps.includes(1) && (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--success))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} /> Selection Confirmed
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px' }}>
                      Select Email Template
                    </label>
                    <select
                      value={selectedTemplateKey}
                      onChange={(e) => setSelectedTemplateKey(e.target.value)}
                      style={{ ...inpSt, fontWeight: 600, fontSize: '12px', width: '100%', maxWidth: '500px' }}
                      data-testid="attach-email-template-select"
                    >
                      <optgroup label="System Default Email Templates">
                        <option value="default">Standard Liquidation Offer Sheet (Clearance)</option>
                        <option value="short-dated-auction">Urgent Short-Dated Surplus Alert (Auction)</option>
                        <option value="direct-donation-notice">Food Bank Direct Donation Transfer Notice (Donation)</option>
                      </optgroup>
                      {centralTemplates.length > 0 && (
                        <optgroup label="Custom Centralized Templates">
                          {centralTemplates.map((tpl: any) => (
                            <option key={tpl.templateId || tpl._id} value={tpl.templateId}>
                              {tpl.name} ({tpl.category || 'Custom'})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {stepperStep === 1 && (
                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
                          setStepperStep(2);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px hsl(var(--primary)/0.3)'
                        }}
                      >
                        <span>Next: Configure Subject Line</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 2: Email Subject Line */}
                <div
                  style={{
                    background: 'hsl(223 47% 8%)',
                    border: stepperStep === 2 ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                    borderRadius: '12px',
                    padding: '16px',
                    opacity: 1,
                    pointerEvents: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PenLine size={16} color="hsl(var(--primary))" />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>Step 2: Subject Line</span>
                    </div>
                    {completedSteps.includes(2) && (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--success))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} /> Subject Configured
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px' }}>
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Distressed Stock Clearance Notice"
                      style={{ ...inpSt, fontSize: '12px', fontWeight: 500, width: '100%', maxWidth: '600px' }}
                    />
                  </div>

                  {stepperStep === 2 && (
                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setStepperStep(1)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '8px 14px' }}
                      >
                        ← Back to Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedSteps((prev) => Array.from(new Set([...prev, 1, 2])));
                          setStepperStep(3);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px hsl(var(--primary)/0.3)'
                        }}
                      >
                        <span>Next: Preview & Overrides</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 3: Dynamic Data Context & Live Preview */}
                <div
                  id="sec-concept-preview"
                  style={{
                    background: 'hsl(223 47% 7%)',
                    border: stepperStep === 3 ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                    borderRadius: '12px',
                    padding: '16px',
                    opacity: 1,
                    pointerEvents: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={15} color="hsl(var(--primary))" />
                      <span style={{ background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>Step 3</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        Dynamic Data Context & Preview Overrides
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: 'hsl(217 91% 60% / 0.15)', color: 'hsl(217 91% 60%)', border: '1px solid hsl(217 91% 60% / 0.3)' }}>
                        {matchedLots.length} Matched Lots Active
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {Object.keys(manualOverrides).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setManualOverrides({})}
                          style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          Reset to Workflow Values ↺
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowDynamicDataPanel(!showDynamicDataPanel)}
                        style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {showDynamicDataPanel ? 'Hide Controls ^' : 'Manage Values v'}
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '-2px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Info size={13} color="hsl(var(--primary))" /> Dynamic data will be automatically loaded from selected data in the current workflow.
                  </p>

                  {/* Summary Context Cards (Mock UI Strip) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px',
                    padding: '12px',
                    background: 'hsl(223 47% 9%)',
                    borderRadius: '10px',
                    border: '1px solid hsl(var(--border-color))',
                    marginBottom: showDynamicDataPanel ? '12px' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid hsl(var(--border-color))', paddingRight: '8px' }}>
                      <Users size={16} color="hsl(var(--primary))" />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Buyer</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-primary))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={dynamicDataContext.buyer_name}>
                          {dynamicDataContext.buyer_name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid hsl(var(--border-color))', paddingRight: '8px' }}>
                      <LayoutTemplate size={16} color="hsl(var(--primary))" />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Supplier</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-primary))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={dynamicDataContext.supplier_name}>
                          {dynamicDataContext.supplier_name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid hsl(var(--border-color))', paddingRight: '8px' }}>
                      <Sparkles size={16} color="hsl(var(--primary))" />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Lot Title</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-primary))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={dynamicDataContext.lot_title}>
                          {dynamicDataContext.lot_title}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid hsl(var(--border-color))', paddingRight: '8px' }}>
                      <Sliders size={16} color="hsl(var(--primary))" />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Stage Discount</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                          {dynamicDataContext.current_stage_discount}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid hsl(var(--border-color))', paddingRight: '8px' }}>
                      <Clock size={16} color="hsl(var(--primary))" />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Deadline</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                          {dynamicDataContext.expiry_hours}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link size={16} color="hsl(var(--primary))" />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Quick Bid Link</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--primary))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={dynamicDataContext.quick_bid_link}>
                          {dynamicDataContext.quick_bid_link}
                        </div>
                      </div>
                    </div>
                  </div>

                  {showDynamicDataPanel && (
                    <div style={{ paddingTop: '12px', borderTop: '1px solid hsl(var(--border-color))', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Target Buyer Name
                        </label>
                        <input
                          type="text"
                          value={dynamicDataContext.buyer_name || ''}
                          onChange={(e) => setManualOverrides((prev) => ({ ...prev, buyer_name: e.target.value }))}
                          style={{ ...inpSt, fontSize: '11px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Supplier Org
                        </label>
                        <input
                          type="text"
                          value={dynamicDataContext.supplier_name || ''}
                          onChange={(e) => setManualOverrides((prev) => ({ ...prev, supplier_name: e.target.value }))}
                          style={{ ...inpSt, fontSize: '11px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Lot Title
                        </label>
                        <input
                          type="text"
                          value={dynamicDataContext.lot_title || ''}
                          onChange={(e) => setManualOverrides((prev) => ({ ...prev, lot_title: e.target.value }))}
                          style={{ ...inpSt, fontSize: '11px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Stage Discount
                        </label>
                        <input
                          type="text"
                          value={dynamicDataContext.current_stage_discount || ''}
                          onChange={(e) => setManualOverrides((prev) => ({ ...prev, current_stage_discount: e.target.value }))}
                          style={{ ...inpSt, fontSize: '11px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Response Deadline
                        </label>
                        <input
                          type="text"
                          value={dynamicDataContext.expiry_hours || ''}
                          onChange={(e) => setManualOverrides((prev) => ({ ...prev, expiry_hours: e.target.value }))}
                          style={{ ...inpSt, fontSize: '11px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Quick Bid Link
                        </label>
                        <input
                          type="text"
                          value={dynamicDataContext.quick_bid_link || ''}
                          onChange={(e) => setManualOverrides((prev) => ({ ...prev, quick_bid_link: e.target.value }))}
                          style={{ ...inpSt, fontSize: '11px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Device Viewport Preview */}
                  <div style={{ marginTop: '12px' }}>
                    <LiveDevicePreview
                      subject={emailSubject || 'Distressed Stock Clearance Notice'}
                      bodyHtml={
                        selectedTemplateKey === 'short-dated-auction'
                          ? `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 8px; background: #fff5f5;"><div style="background-color: #dc2626; color: #ffffff; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 16px;">⚡ LIMITED TIME LIQUIDATION AUCTION</div><p>Hi <strong>{{buyer_name}}</strong>,</p><p>The following short-dated inventory has been scheduled for priority liquidation. Special offer: <strong>{{current_stage_discount}}</strong>. Response deadline: <strong>{{expiry_hours}}</strong>.</p><div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div><div style="text-align: center; margin-top: 24px;"><a href="{{quick_bid_link}}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Place Auction Bid Now</a></div></div>`
                          : selectedTemplateKey === 'direct-donation-notice'
                          ? `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4;"><h2 style="color: #166534; margin-top: 0;">🌱 Community Surplus Donation | {{supplier_name}}</h2><p>Dear <strong>{{buyer_name}}</strong> partner,</p><p>We are pleased to allocate the following fresh surplus products for zero-cost donation transfer. Response window: <strong>{{expiry_hours}}</strong>.</p><div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div><p style="font-size: 13px; color: #15803d; text-align: center; margin-top: 20px; font-weight: 600;">Thank you for helping divert quality food from landfill to families in need.</p></div>`
                          : (centralTemplates.find((t: any) => t.templateId === selectedTemplateKey)?.bodyHtml || `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;"><h2 style="color: #4f46e5; margin-top: 0;">Clearance Opportunity | {{supplier_name}}</h2><p>Hello <strong>{{buyer_name}}</strong>,</p><p>We have immediate surplus inventory available for liquidation. Stage offer: <strong>{{current_stage_discount}}</strong> (Response window: {{expiry_hours}}). Please review the itemized offer sheet below:</p><div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div><br/><p style="text-align: center;"><a href="{{quick_bid_link}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Submit 1-Click Bid</a></p></div>`)
                      }
                      context={dynamicDataContext}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* SECTION 5: Dynamic Donation & Multi-Entity Diversion (Hidden for base release; enable via SHOW_DYNAMIC_DONATION_SECTION flag) */}
          {SHOW_DYNAMIC_DONATION_SECTION && (
            <div style={card}>
              <h3 style={h3st}><HeartHandshake size={17} color="hsl(var(--primary))" /> 5. Dynamic Donation & Multi-Entity Diversion</h3>
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '-4px', marginBottom: '14px' }}>
                Configure fallback donation rules, total case diversion caps, and split allocations across multiple food bank and rescue entities.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(223 47% 8%)', padding: '10px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
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
                          <div key={ent.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(223 47% 8%)', padding: '10px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
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
                      <div style={{ background: 'hsl(223 47% 7%)', padding: '12px', borderRadius: '8px', border: '1px dashed hsl(var(--border-color))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      <div style={{ background: 'hsl(223 47% 8%)', padding: '14px', borderRadius: '8px', border: '1px solid hsl(var(--primary)/0.3)', marginTop: '8px' }}>
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
            <div style={{ background: 'hsl(223 47% 8%)', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Matched Lots</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'hsl(var(--primary))' }}>{impactMetrics.totalLots}</div>
            </div>
            <div style={{ background: 'hsl(223 47% 8%)', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Total Cases</span>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{impactMetrics.totalCases.toLocaleString()}</div>
            </div>
            <div style={{ background: 'hsl(223 47% 8%)', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Est. COGS Recovery</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'hsl(var(--success))' }}>${impactMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ background: 'hsl(223 47% 8%)', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'hsl(var(--text-muted))' }}>RSL Risk</span>
                <span style={{ color: 'hsl(var(--warning))', fontWeight: 600 }}>{impactMetrics.urgentLots} urgent</span>
              </div>
              <div style={{ height: '8px', background: 'hsl(223 47% 16%)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginTop: '6px' }}>
                <div style={{ width: `${impactMetrics.totalLots > 0 ? (impactMetrics.urgentLots / impactMetrics.totalLots) * 100 : 0}%`, background: 'hsl(var(--error))' }} />
                <div style={{ flex: 1, background: 'hsl(var(--success))' }} />
              </div>
            </div>
          </div>

          {/* Per-Stage Audiences Strip */}
          <div style={{ background: 'hsl(223 47% 8%)', padding: '12px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Stage Audiences</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stages.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(223 47% 12%)', padding: '6px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', fontSize: '11px' }}>
                  <span style={{ background: 'hsl(var(--primary))', color: '#fff', fontSize: '9px', fontWeight: 800, borderRadius: '4px', padding: '2px 6px' }}>S{s.stageIndex}</span>
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
              onClick={() => handleSaveCampaign('draft')}
              disabled={isSubmitting || oauth.status === 'expired' || hasZeroBuyerStage}
              style={{
                flex: 1,
                background: 'hsl(223 47% 12%)',
                color: '#fff',
                border: '1px solid hsl(var(--primary))',
                borderRadius: '10px',
                padding: '13px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: (isSubmitting || oauth.status === 'expired' || hasZeroBuyerStage) ? 'not-allowed' : 'pointer',
                opacity: (oauth.status === 'expired' || hasZeroBuyerStage) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              <Save size={15} color="hsl(var(--primary))" />
              <span>{isSubmitting ? 'Saving...' : 'Save as Draft'}</span>
            </button>

            <button type="button" onClick={() => !hasZeroBuyerStage && setShowPreFlightModal(true)} disabled={impactMetrics.totalLots === 0 || oauth.status === 'expired' || hasZeroBuyerStage}
              style={{ flex: 1, background: (impactMetrics.totalLots > 0 && oauth.status !== 'expired' && !hasZeroBuyerStage) ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' : 'hsl(var(--border-color))', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 700, fontSize: '13px', cursor: (impactMetrics.totalLots > 0 && oauth.status !== 'expired' && !hasZeroBuyerStage) ? 'pointer' : 'not-allowed', opacity: (oauth.status === 'expired' || hasZeroBuyerStage) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: (impactMetrics.totalLots > 0 && oauth.status !== 'expired' && !hasZeroBuyerStage) ? '0 6px 20px hsl(var(--primary)/0.3)' : 'none' }}>
              <Play size={15} /> Launch Active Campaign
            </button>
          </div>
        </div>

      {/* ══ PRE-FLIGHT MODAL ════════════════════════════════════════════════ */}
      <PreFlightAuditModal
        showModal={showPreFlightModal}
        onClose={() => setShowPreFlightModal(false)}
        onLaunch={handleLaunch}
        isSubmitting={isSubmitting}
        impactMetrics={impactMetrics}
        stages={stages}
        executionType={executionType}
        scheduleTime={scheduleTime}
        workflowTimezone={workflowTimezone}
        emailSubject={emailSubject}
        previewHtml={previewHtml}
      />

      {/* ══ BUYER SEGMENT ROSTER INSPECTION MODAL ════════════════════════════ */}
      {inspectingSegment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '12px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid hsl(var(--border-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={18} color="hsl(var(--primary))" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Buyer Segment Data: {reduxBuyerLists.find(s => s._id === inspectingSegment || s.type === inspectingSegment)?.name || inspectingSegment}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSegment(null)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
              <input
                type="text"
                placeholder="Search buyers by name or email..."
                value={inspectSearch}
                onChange={e => setInspectSearch(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid hsl(var(--border-color))',
                  backgroundColor: 'hsl(223 47% 8%)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Name / Company</th>
                    <th style={{ padding: '8px' }}>Email Address</th>
                    <th style={{ padding: '8px' }}>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const matchedList = reduxBuyerLists.find(s => s._id === inspectingSegment || s.type === inspectingSegment);
                    
                    const targetList = matchedList
                      ? (matchedList.buyerIds || []).map((b: any) => {
                          if (typeof b === 'object' && b !== null) return b;
                          const bId = b?.toString();
                          return buyers.find(ub => (ub._id || ub.id)?.toString() === bId) || { _id: bId, name: 'Registered Buyer', email: bId };
                        })
                      : buyers;

                    const filtered = targetList.filter((b: any) => {
                      if (!inspectSearch) return true;
                      const q = inspectSearch.toLowerCase();
                      return (b.companyName || b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q);
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                            {matchedList ? `No buyers assigned to ${matchedList.name} (0 members configured).` : 'No buyers found.'}
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((b: any, idx: number) => (
                      <tr key={b._id || idx} style={{ borderBottom: '1px solid hsl(var(--border-color)/30%)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>{b.companyName || b.name || 'Retail Partner'}</td>
                        <td style={{ padding: '10px 8px', color: 'hsl(var(--primary))' }}>{b.email || 'n/a'}</td>
                        <td style={{ padding: '10px 8px', color: 'hsl(var(--text-muted))' }}>
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Jul 15, 2026'}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
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
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'hsl(223 47% 6%)', color: '#fff', fontSize: '0.85rem', fontFamily: 'sans-serif' }}>
              <div style={{ background: 'hsl(223 47% 10%)', border: '1px solid hsl(var(--border-color))', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                <div><strong>To:</strong> {donatingEntities[0]?.email || 'donations@feedingamerica.org'}</div>
                <div><strong>Subject:</strong> {donationEmailSubject.replace(/\{\{lot_number\}\}/g, 'LOT-9921').replace(/\{\{cases\}\}/g, '300')}</div>
              </div>
              <div style={{ background: '#fff', color: '#1a1a1a', padding: '24px', borderRadius: '8px' }}>
                <h2 style={{ color: '#0f172a', fontSize: '1.2rem', marginTop: 0 }}>Food Rescue Donation Transfer Advice</h2>
                <p>Dear {donatingEntities[0]?.name || 'Feeding America Partner'} Operations Team,</p>
                <p>We are pleased to inform you that a surplus food inventory donation transfer has been allocated to your organization:</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Product SKU</th>
                      <th style={{ padding: '8px' }}>Description</th>
                      <th style={{ padding: '8px' }}>Allocated Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px' }}>MILK-ORGANIC</td>
                      <td style={{ padding: '8px' }}>Organic Whole Milk 1 Gallon</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>300 Cases</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ background: '#f8fafc', padding: '12px', borderLeft: '4px solid #3b82f6', borderRadius: '4px', margin: '16px 0' }}>
                  <strong>Dock Instructions:</strong> {donationEmailCustomNotes}
                </div>
                <p style={{ marginTop: '20px', color: '#64748b', fontSize: '0.8rem' }}>IndSpoiler Alert Surplus Recovery Division</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
