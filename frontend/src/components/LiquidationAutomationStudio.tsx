import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store/hooks';
import { selectBuyerLists, ensureDefaultBuyerLists, fetchBuyerLists, fetchCoreReferenceData } from '../store/slices/coreSlice';
import { setEditingCampaignId, calculateLotRsl } from '../store/slices/workflowSlice';
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
  Info,
  Layers
} from 'lucide-react';
import { PreFlightAuditModal } from './domain/workflows/PreFlightAuditModal';
import { useOAuthMailbox } from '../hooks/useOAuthMailbox';
import { StageEmailModal } from './domain/workflows/StageEmailModal';
import { InventoryScopeDiffModal } from './domain/workflows/InventoryScopeDiffModal';


// ─── Types ────────────────────────────────────────────────────────────────────

export const DYNAMIC_TOKENS_LIST = [
  { key: 'buyer_name', label: 'Buyer Name', icon: Users, description: 'Target buyer company/account name' },
  { key: 'supplier_name', label: 'Supplier Name', icon: LayoutTemplate, description: 'Your organization name' },
  { key: 'lot_title', label: 'Lot Title', icon: Sparkles, description: 'Title or description of matched inventory' },
  { key: 'inventory_table', label: 'Inventory Table', icon: Table, description: 'Itemized HTML table of matched lots' },
  { key: 'quick_bid_link', label: 'Quick Bid Link', icon: Link, description: 'Direct 1-Click bidding URL' },
  { key: 'current_stage_discount', label: 'Stage Markdown', icon: Sliders, description: 'Current stage discount value or floor bid' },
  { key: 'expiry_hours', label: 'Response Deadline', icon: Clock, description: 'Time window before next escalation stage' }
];

export const formatWaitTime = (hours: number): string => {
  if (!hours || hours <= 0) return '0m';
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
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const compileFrontendCron = (timeOfDay: string, daysOfWeek: number[]): string => {
  let timeStr = String(timeOfDay || '09:00').trim();
  let isPM = false;
  let isAM = false;
  if (/pm/i.test(timeStr)) { isPM = true; timeStr = timeStr.replace(/pm/i, '').trim(); }
  if (/am/i.test(timeStr)) { isAM = true; timeStr = timeStr.replace(/am/i, '').trim(); }

  const parts = timeStr.split(':');
  let hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;

  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  const daysStr = daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek.join(',') : '*';
  return `${minute} ${hour} * * ${daysStr}`;
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
  automationRuns?: any[];
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
export type BuyerMode = 'list' | 'custom' | 'segment';

/** A single buyer entry — can be from registry or hand-added */
interface BuyerEntry {
  id: string;
  name: string;
  email: string;
  tier: 'tier1' | 'tier2' | 'liquidator' | 'custom';
  isNew?: boolean;
}

export interface Stage {
  stageIndex: number;
  stageNumber?: number;
  name: string;
  stageType?: 'liquidation' | 'donation' | 'landfill';
  disposalDeadline?: string;
  allocatedLotIds?: string[];
  buyerMode: BuyerMode;
  buyerListId?: string;      // BuyerList._id — used when buyerMode === 'list'
  buyerListName?: string;    // display label for the selected list
  buyerSegment?: string;     // backward-compatibility field — maps to buyerListId
  customBuyers: BuyerEntry[];
  discountType: 'yield' | 'fixed' | 'floor';
  discountValue: number;
  waitHours: number;
  waitUnit?: 'd' | 'h' | 'm';
  emailTemplateId?: string;
  emailSubject?: string;
  emailBodyHtml?: string;
}

export function getStageBuyerCount(stage: Stage, buyerListsOrBuyers: any[] = [], allBuyersFallback: any[] = []): number {
  if (stage.buyerMode === 'custom') {
    return stage.customBuyers ? stage.customBuyers.length : 0;
  }
  const targetId = stage.buyerListId || stage.buyerSegment || (stage.stageIndex === 1 || stage.stageIndex === 2 || stage.stageNumber === 2 ? 'secondary' : 'primary');
  if (!targetId || targetId === 'empty_segment') {
    return 0;
  }

  const isListArray = buyerListsOrBuyers && buyerListsOrBuyers.some(b => b && Array.isArray(b.buyerIds));
  const effectiveLists = ensureDefaultBuyerLists(isListArray ? buyerListsOrBuyers : []);

  let matched = effectiveLists.find((l: any) => l._id === targetId || l.type === targetId || l.id === targetId);
  if (!matched && (targetId === 'primary' || targetId === 'tier1' || targetId === 'tier1_retailers')) {
    matched = effectiveLists.find((l: any) => l.type === 'primary') || effectiveLists[0];
  }
  if (!matched && (targetId === 'secondary' || targetId === 'all_liquidators' || targetId === 'liquidator')) {
    matched = effectiveLists.find((l: any) => l.type === 'secondary') || effectiveLists[1] || effectiveLists[0];
  }

  if (matched && Array.isArray(matched.buyerIds)) {
    return matched.buyerIds.length;
  }

  const candidateBuyers = !isListArray && buyerListsOrBuyers && buyerListsOrBuyers.length > 0
    ? buyerListsOrBuyers
    : allBuyersFallback;

  if (candidateBuyers && candidateBuyers.length > 0) {
    const isSec = targetId === 'secondary' || (matched && matched.type === 'secondary');
    const filtered = candidateBuyers.filter((b: any) => {
      const t = String(b.tier ?? '').toLowerCase();
      if (isSec) return t === 'tier2' || t === 'secondary' || t === 'liquidator' || t === 'all_liquidators' || t === '2';
      return !t || t === 'tier1' || t === 'primary' || t === 'tier1_retailers' || t === '1';
    });
    if (filtered.length > 0) return filtered.length;
    if (!isListArray) return candidateBuyers.length;
  }

  if (matched && matched.buyerIds?.length === 0) {
    return 0;
  }

  return 0;
}

export function getStageValidationErrors(
  stage: Stage,
  stageIndex: number,
  reduxBuyerLists: any[] = [],
  buyers: any[] = []
): string[] {
  const errors: string[] = [];
  const sType = stage.stageType || 'liquidation';
  const sNum = stage.stageNumber || (stage.stageIndex != null ? (stage.stageIndex === 0 || stage.stageIndex > 0 && stage.stageIndex <= stageIndex ? stage.stageIndex + 1 : stage.stageIndex) : stageIndex + 1);
  const buyerCount = getStageBuyerCount(stage, reduxBuyerLists, buyers);

  if (sType === 'donation') {
    if (buyerCount === 0) {
      errors.push(`Donation Stage ${sNum} requires at least 1 targeted charity or non-profit partner.`);
    }
    if (stage.allocatedLotIds !== undefined && Array.isArray(stage.allocatedLotIds) && stage.allocatedLotIds.length === 0) {
      errors.push(`Donation Stage ${sNum} requires at least 1 allocated inventory lot.`);
    }
    if (typeof stage.waitHours !== 'number' || stage.waitHours <= 0) {
      errors.push(`Donation Stage ${sNum} requires a valid response window (> 0 hours).`);
    }
  } else if (sType === 'landfill') {
    if (buyerCount === 0) {
      errors.push(`Landfill Stage ${sNum} requires at least 1 disposal contact or partner.`);
    }
    if (stage.allocatedLotIds !== undefined && Array.isArray(stage.allocatedLotIds) && stage.allocatedLotIds.length === 0) {
      errors.push(`Landfill Stage ${sNum} requires at least 1 allocated inventory lot.`);
    }
    if (!stage.disposalDeadline || !stage.disposalDeadline.trim()) {
      errors.push(`Landfill Stage ${sNum} requires a valid disposal deadline date.`);
    }
  } else {
    // Liquidation
    if (buyerCount === 0) {
      errors.push(`Liquidation Stage ${sNum} requires at least 1 targeted buyer.`);
    }
    if (stage.discountType === 'fixed' || stage.discountType === 'floor') {
      if (typeof stage.discountValue !== 'number' || stage.discountValue <= 0 || isNaN(stage.discountValue)) {
        errors.push(`Liquidation Stage ${sNum} requires a valid discount value (> 0).`);
      }
    }
    if (typeof stage.waitHours !== 'number' || stage.waitHours <= 0) {
      errors.push(`Liquidation Stage ${sNum} requires a valid response window (> 0 hours).`);
    }
    if (stage.allocatedLotIds !== undefined && Array.isArray(stage.allocatedLotIds) && stage.allocatedLotIds.length === 0) {
      errors.push(`Liquidation Stage ${sNum} requires at least 1 allocated inventory lot.`);
    }
  }

  return errors;
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

export const DEFAULT_EMAIL_BODY_HTML = `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
<h2 style="color: #2563eb; margin-top: 0;">Clearance Opportunity | {{supplier_name}}</h2>
<p>Hello <strong>{{buyer_name}}</strong>,</p>
<p>We have immediate surplus inventory available for liquidation. Stage offer: <strong>{{current_stage_discount}}</strong> (Response window: {{expiry_hours}}). Please review the itemized offer sheet below:</p>
<div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
<br/>
<p style="text-align: center;"><a href="{{quick_bid_link}}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Bid Now</a></p>
</div>`;

const DEFAULT_STAGES: Stage[] = [
  {
    stageIndex: 0,
    stageNumber: 1,
    name: 'Stage 1: Primary Buyers',
    buyerMode: 'list',
    buyerListId: 'primary',
    buyerListName: 'Primary Buyers',
    customBuyers: [],
    discountType: 'fixed',
    discountValue: 20,
    waitHours: 24,
    emailSubject: 'Stage 1 Priority Clearance Offer',
    emailBodyHtml: DEFAULT_EMAIL_BODY_HTML
  },
  {
    stageIndex: 1,
    stageNumber: 2,
    name: 'Stage 2: Secondary Liquidators',
    buyerMode: 'list',
    buyerListId: 'secondary',
    buyerListName: 'Secondary Liquidators',
    customBuyers: [],
    discountType: 'fixed',
    discountValue: 40,
    waitHours: 48,
    emailSubject: 'Stage 2 Secondary Clearance Blast',
    emailBodyHtml: DEFAULT_EMAIL_BODY_HTML
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: Category Preferred Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'yield', discountValue: 0, waitHours: 36 },
      { stageIndex: 1, stageNumber: 2, name: 'Stage 2: Open Market Jobbers', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 30, waitHours: 24 },
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: COA-Verified Primary Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 15, waitHours: 48 },
      { stageIndex: 1, stageNumber: 2, name: 'Stage 2: Secondary Wholesale Buyers', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 35, waitHours: 24 },
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: Week 1 Primary Tier', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 10, waitHours: 72 },
      { stageIndex: 1, stageNumber: 2, name: 'Stage 2: Week 2 Secondary Tier', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 25, waitHours: 72 },
      { stageIndex: 2, stageNumber: 3, name: 'Stage 3: Final Salvage Markdown', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 50, waitHours: 48 },
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: Private Bidding Auction Round', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'yield', discountValue: 0, waitHours: 48 },
      { stageIndex: 1, stageNumber: 2, name: 'Stage 2: Backup Flash Offer', buyerMode: 'list', buyerListId: 'secondary', buyerListName: 'Secondary Liquidators', customBuyers: [], discountType: 'fixed', discountValue: 35, waitHours: 24 },
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: Flash Broadcast to All Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 25, waitHours: 48 },
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: Food Rescue & Bank Transfer', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 100, waitHours: 12 },
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: All Wholesale Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'fixed', discountValue: 30, waitHours: 48 },
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
      { stageIndex: 0, stageNumber: 1, name: 'Stage 1: Custom Buyers', buyerMode: 'list', buyerListId: 'primary', buyerListName: 'Primary Buyers', customBuyers: [], discountType: 'yield', discountValue: 0, waitHours: 24 },
    ],
    defaultRules: { onSuccess: 'auto_award', onFallback: 'auto_donate', minimumBidFloorPrice: 5.0, minimumYieldRecoveryPercent: 30 },
  },
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
    background: 'hsl(var(--bg-card))',
    border: '1px solid hsl(var(--border-color))',
    borderRadius: '6px',
    padding: '7px 9px',
    color: 'hsl(var(--text-primary))',
    fontSize: '12px',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0', background: 'hsl(var(--bg-card))', borderRadius: '8px', padding: '3px', border: '1px solid hsl(var(--border-color))' }}>
        {(['list', 'custom'] as const).map(mode => {
          const isActive = mode === 'list' ? isListMode : stage.buyerMode === 'custom';
          return (
            <button
              key={mode}
              type="button"
              data-testid={`stage-audience-mode-${mode}`}
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
                color: isActive ? 'white' : 'hsl(var(--text-muted))',
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

        const getListCount = (list: any) => {
          if (!list) return 0;
          if (Array.isArray(list.buyerIds)) return list.buyerIds.length;
          if (Array.isArray(allBuyers) && allBuyers.length > 0) {
            const isSec = list.type === 'secondary' || list._id === 'list-secondary' || (list.name || '').toLowerCase().includes('secondary');
            const isPrim = list.type === 'primary' || list._id === 'list-primary' || (list.name || '').toLowerCase().includes('primary');
            if (isSec) {
              const count = allBuyers.filter((b: any) => {
                const t = String(b.tier ?? '').toLowerCase();
                return t === 'tier2' || t === 'secondary' || t === 'liquidator' || t === 'all_liquidators' || t === '2';
              }).length;
              if (count > 0) return count;
            } else if (isPrim) {
              const count = allBuyers.filter((b: any) => {
                const t = String(b.tier ?? '').toLowerCase();
                return !t || t === 'tier1' || t === 'primary' || t === 'tier1_retailers' || t === '1';
              }).length;
              if (count > 0) return count;
            }
          }
          return 0;
        };

        const listBuyerCount = selectedListObj ? getListCount(selectedListObj) : getStageBuyerCount(stage, effectiveBuyerLists, allBuyers);
        const isListConfigured = !!(stage.buyerListId || stage.buyerSegment) && listBuyerCount > 0;

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
                {effectiveBuyerLists.length === 0 ? (
                  <option value="">No buyer lists found (Create lists in Buyer Registry)</option>
                ) : (
                  effectiveBuyerLists.map(list => {
                    const count = getListCount(list);
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
                  })
                )}
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
                disabled={!isListConfigured}
                onClick={() => isListConfigured && onInspectSegment && onInspectSegment(stage.buyerListId || stage.buyerSegment || '')}
                title={
                  !(stage.buyerListId || stage.buyerSegment)
                    ? 'No buyer list selected'
                    : listBuyerCount === 0
                    ? 'Selected buyer list has 0 buyers configured'
                    : 'Inspect Buyer Data (Name, Email, Reg Date)'
                }
                style={{
                  padding: '7px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '34px',
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '6px',
                  color: 'hsl(var(--primary))',
                  cursor: isListConfigured ? 'pointer' : 'not-allowed',
                  opacity: isListConfigured ? 1 : 0.45,
                }}
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
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', padding: '8px 10px', background: 'hsl(var(--bg-card))', borderRadius: '6px', border: '1px dashed hsl(var(--border-color))', textAlign: 'center' }}>
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
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: TIER_COLOR[b.tier] || 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: 'hsl(var(--text-primary))', flexShrink: 0 }}>
                      {b.name.charAt(0)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--border-color))' }}>
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
                <button type="button" onClick={addNewBuyer} disabled={!newName || !newEmail} style={{ background: newName && newEmail ? 'hsl(var(--primary))' : 'hsl(var(--border-color))', border: 'none', color: newName && newEmail ? 'white' : 'hsl(var(--text-muted))', borderRadius: '5px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, cursor: newName && newEmail ? 'pointer' : 'not-allowed' }}>
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
                background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))',
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
                        borderBottom: '1px solid hsl(var(--bg-card))',
                        opacity: alreadyAdded ? 0.5 : 1,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${TIER_COLOR[tier]}22`, border: `1px solid ${TIER_COLOR[tier]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: TIER_COLOR[tier] }}>
                          {(b.companyName || b.name || 'B').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{b.companyName || b.name || b.email}</div>
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



// ─── Main Component ───────────────────────────────────────────────────────────

export const LiquidationAutomationStudio: React.FC<LiquidationAutomationStudioProps> = ({
  supplierId,
  supplierName: customSupplierName,
  inventoryLots = [],
  buyers = [],
  apiBaseUrl = '/api',
  editingCampaignId = null,
  automationRuns,
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

  // Template & Campaign Cycle Metadata
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('default');
  const [centralTemplates, setCentralTemplates]       = useState<any[]>([]);
  const [workflowName, setWorkflowName]               = useState('Untitled Workflow');
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
  const [cronExpression, setCronExpression]   = useState<string>('');
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
  const [inspectSearch, setInspectSearch]           = useState<string>('');

  // Lock document body scroll when Target Buyer Segment Inspection modal is open
  useEffect(() => {
    if (!inspectingSegment) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [inspectingSegment]);

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

  // Drift Detection & Breakdown Modal
  const [dismissedDriftBanner, setDismissedDriftBanner] = useState(false);
  const [showInventoryDiffModal, setShowInventoryDiffModal] = useState(false);

  // Pre-flight
  const [showPreFlightModal, setShowPreFlightModal] = useState(false);
  const [isSubmitting, setIsSubmitting]             = useState(false);

  // Hydration effect when editing an existing campaign
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
    } catch (err) { console.error(err); }
    finally {
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
    const sku  = (lot.productId?.sku || '').toLowerCase();
    const matchSearch = !q || desc.includes(q) || sku.includes(q);
    const dc = typeof lot.distributionCenterId === 'object'
      ? (lot.distributionCenterId?.name || lot.distributionCenterId?.code || '')
      : (lot.distributionCenterId || '');
    const matchDC  = !lotDcFilter || dc.toLowerCase().includes(lotDcFilter.toLowerCase());
    const hasCoa   = lot.complianceStatus === 'verified' || lot.coaS3Uri;
    const matchCoa = lotCoaFilter === 'all' || (lotCoaFilter === 'verified' && hasCoa) || (lotCoaFilter === 'pending' && !hasCoa);
    return matchSearch && matchDC && matchCoa;
  }), [activeLots, categoryFilter, maxRslFilter, minCasesFilter, explicitLotIds, lotSearch, lotDcFilter, lotCoaFilter]);

  const impactMetrics = useMemo(() => {
    const totalLots  = matchedLots.length;
    const totalCases = matchedLots.reduce((a, l) => a + (l?.availableQty ?? l?.quantityCases ?? 0), 0);
    const totalValue = matchedLots.reduce((a, l) => {
      const cases = l?.availableQty ?? l?.quantityCases ?? 0;
      return a + cases * (l?.costPerCase || l?.standardSellPrice || 10);
    }, 0);
    const urgentLots = matchedLots.filter(l => {
      const r = typeof l?.remainingShelfLife === 'number' ? (l.remainingShelfLife > 1 ? l.remainingShelfLife / 100 : l.remainingShelfLife) : 1;
      return r <= 0.15;
    }).length;
    // Total unique audience across all stages
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
        // Fire-and-forget trigger request so we don't wait for buyer email dispatches to close the window
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

  // ── Shared styles & Control Hierarchy Shadow System ────────────────────────
  const card: React.CSSProperties = { background: 'hsl(var(--bg-card))', padding: '20px 24px', borderRadius: '14px', border: '1px solid hsl(var(--border-color))', boxShadow: '0 4px 20px -2px rgba(13, 71, 161, 0.06)' };
  const h3st: React.CSSProperties = { fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' };
  const inpSt: React.CSSProperties = { background: 'hsl(var(--bg-card))', border: '1.5px solid hsl(var(--border-color))', borderRadius: '8px', padding: '9px 12px', color: 'hsl(var(--text-primary))', fontSize: '13px', width: '100%', boxSizing: 'border-box', boxShadow: 'inset 0 2px 4px rgba(13, 71, 161, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)', transition: 'all 0.2s ease' };
  const dropSt: React.CSSProperties = { background: 'linear-gradient(180deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-card-hover)) 100%)', border: '1.5px solid rgba(33, 150, 243, 0.4)', borderRadius: '8px', padding: '9px 12px', color: 'hsl(var(--text-primary))', fontSize: '13px', fontWeight: 600, width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(13, 71, 161, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)', cursor: 'pointer', transition: 'all 0.2s ease' };
  const btnSt: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(33, 150, 243, 0.35), 0 2px 4px rgba(13, 71, 161, 0.2)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>

          {/* Left: branding + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <Zap size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>New Workflow</h2>
                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '16px', lineHeight: 1 }} title="Required">*</span>
              </div>
              <input type="text" data-testid="workflow-name-input" value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="Enter workflow name…"
                style={{ marginTop: '6px', ...inpSt, maxWidth: '200px', fontWeight: 500, fontSize: '13px' }} />
            </div>
          </div>

          {/* Centre: Execution mode */}
          <div ref={scheduleRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', position: 'relative' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Zap size={12} /> Execution Mode</div>
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
                  color: executionType === 'immediate' ? 'hsl(var(--primary))' : 'hsl(var(--text-primary))'
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
                  color: executionType === 'cron' ? 'hsl(var(--primary))' : 'hsl(var(--text-primary))'
                }}
              >
                🕐 Scheduled {executionType === 'cron' ? (isSchedulePopoverOpen ? '▲' : '▼') : ''}
              </button>
            </div>
            {executionType === 'cron' && isSchedulePopoverOpen && (
              <div style={{
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
                minWidth: '285px'
              }}>
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
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => {
                      const sel = cronDays.includes(i);
                      return (
                        <button key={d} type="button" onClick={() => {
                          const nextDays = sel ? cronDays.filter(x => x !== i) : [...cronDays, i];
                          setCronDays(nextDays);
                          setCronExpression(compileFrontendCron(scheduleTime, nextDays));
                        }}
                          style={{ padding: '3px 7px', borderRadius: '4px', border: '1px solid hsl(var(--border-color))', background: sel ? 'hsl(var(--primary))' : 'hsl(var(--bg-card))', color: sel ? 'white' : 'hsl(var(--text-primary))', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>{d}</button>
                      );
                    })}
                  </div>
                  <input type="time" value={scheduleTime} onChange={e => {
                    setScheduleTime(e.target.value);
                    setCronExpression(compileFrontendCron(e.target.value, cronDays));
                  }}
                    style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '4px 7px', color: 'hsl(var(--text-primary))', fontSize: '11px' }} />
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
                      gap: '4px'
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
            {onCancel && <button type="button" onClick={onCancel} style={{ background: 'transparent', color: 'hsl(var(--text-secondary))', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>← Back</button>}
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
              style={{ background: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' : 'hsl(var(--border-color))', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '13px', cursor: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? 'pointer' : 'not-allowed', opacity: hasZeroBuyerStage ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '7px', boxShadow: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? '0 4px 14px hsl(var(--primary)/0.35)' : 'none' }}>
              <Play size={15} /> Run
            </button>
          </div>
        </div>
      </div>

      {/* ══ SECTION 1: Campaign Setup & Strategy Template ════════════════════ */}
      <div id="campaign-template-section" style={card}>
        <h3 style={h3st}><LayoutTemplate size={17} color="hsl(var(--primary))" /> 1. Sales Cycle & Workflow Template</h3>

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
              style={{ ...inpSt, maxWidth: '220px' }}
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

        <label style={{ fontSize: '12px', fontWeight: 800, color: '#0d47a1', display: 'block', marginBottom: '6px', letterSpacing: '0.01em' }}>
          Sales Strategy Template
        </label>
        <div ref={templateRef} style={{ position: 'relative', maxWidth: '480px', marginBottom: '16px' }}>
          <button type="button" onClick={() => setShowTemplateDrop(p => !p)}
            style={{ ...dropSt, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', border: `1.5px solid ${showTemplateDrop ? 'hsl(var(--primary))' : 'rgba(33, 150, 243, 0.4)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(13, 71, 161, 0.12)', color: '#0d47a1', fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '8px', border: '1.5px solid rgba(13, 71, 161, 0.3)', boxShadow: '0 1px 3px rgba(13, 71, 161, 0.12)' }}>{selectedDef.badge}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{selectedDef.name}</span>
            </div>
            {showTemplateDrop ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showTemplateDrop && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: 'hsl(var(--bg-card))', border: '1.5px solid rgba(144, 202, 249, 0.5)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 14px 40px -4px rgba(13, 71, 161, 0.28), 0 6px 18px rgba(0,0,0,0.12)' }}>
              {TEMPLATE_DEFINITIONS.map(t => {
                const sel = selectedTemplateKey === t.key;
                return (
                  <div key={t.key} onClick={() => handleSelectTemplate(t.key)}
                    style={{ padding: '13px 16px', cursor: 'pointer', background: sel ? 'rgba(33, 150, 243, 0.08)' : 'transparent', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card-hover))'; }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ background: 'rgba(13, 71, 161, 0.12)', color: '#0d47a1', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(13, 71, 161, 0.25)' }}>{t.badge}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{t.name}</span>
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
        <div style={{ background: 'hsl(var(--bg-card))', border: '1px dashed hsl(var(--primary)/0.4)', borderRadius: '10px', padding: '13px 18px' }}>
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
              animation: 'fadeIn 0.2s ease-in-out'
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
                  flexShrink: 0
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
                  transition: 'all 0.15s ease'
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
                  transition: 'all 0.15s ease'
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
                  gap: '5px'
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
              gap: '8px'
            }}
          >
            <Check size={14} /> {stageSyncMessage}
          </div>
        )}

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
                width: 'fit-content'
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
                    transition: 'all 0.15s ease'
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
                    transition: 'all 0.15s ease'
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
                    transition: 'all 0.15s ease'
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
                    transition: 'all 0.15s ease'
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
                    animation: 'fadeIn 0.15s ease-out'
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
                          justifyContent: 'center'
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
                            marginTop: '2px'
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
                        borderRadius: '4px'
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
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Max RSL: <strong style={{ color: 'hsl(var(--warning))' }}>{maxRslFilter >= 1 ? '100% (All RSL)' : `${Math.round(maxRslFilter * 100)}%`}</strong></label>
                <input type="range" min="0.05" max="1.00" step="0.05" value={maxRslFilter} onChange={e => setMaxRslFilter(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'hsl(var(--primary))' }} />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Min Cases</label>
                <input type="number" step="any" placeholder="0" value={minCasesFilter === 0 ? '' : minCasesFilter} onChange={e => setMinCasesFilter(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} style={{ ...inpSt, padding: '6px 10px', fontSize: '12px', width: '100%' }} />
              </div>
            </div>

            {showLotGrid && (
              <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Search row */}
                <div style={{ padding: '9px 13px', borderBottom: '1px solid hsl(var(--border-color))', display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center', background: 'hsl(var(--bg-card))' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                    <input type="text" placeholder="Search lots…" value={lotSearch} onChange={e => setLotSearch(e.target.value)}
                      style={{ ...inpSt, paddingLeft: '26px', padding: '6px 6px 6px 26px', fontSize: '12px', borderRadius: '6px' }} />
                  </div>
                  <select value={lotDcFilter} onChange={e => setLotDcFilter(e.target.value)} style={{ ...dropSt, width: 'auto', padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}>
                    <option value="">All DCs</option>
                    {[...new Set(activeLots.map((l: any) => typeof l.distributionCenterId === 'object' ? (l.distributionCenterId?.name || '') : (l.distributionCenterId || '')).filter(Boolean))].map(dc => <option key={dc} value={dc}>{dc}</option>)}
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
                    const rsl     = Math.round(calculateLotRsl(lot) * 100);
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
                const stageNumber = stage.stageNumber || idx + 1;
                const isExpanded = expandedStageIdx === idx;
                const isListMode = stage.buyerMode === 'list' || stage.buyerMode === 'segment';
                const listLabel = stage.buyerListName || stage.buyerListId || stage.buyerSegment || 'Target List';
                const audienceSummary = isListMode ? listLabel : `${stage.customBuyers.length} custom buyer${stage.customBuyers.length !== 1 ? 's' : ''}`;
                const pricingSummary = stage.discountType === 'yield' ? 'AI Yield' : stage.discountType === 'fixed' ? `${stage.discountValue}% Off` : `$${stage.discountValue} Floor`;
                const stageBuyerCount = getStageBuyerCount(stage, reduxBuyerLists, buyers);
                const stageValidationErrors = getStageValidationErrors(stage, idx, reduxBuyerLists, buyers);
                const isZeroBuyer = (!stage.stageType || stage.stageType === 'liquidation') && stageBuyerCount === 0;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', marginBottom: idx < stages.length - 1 ? '8px' : '0' }}>
                    <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>

                    {/* Left spine: number + connector line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px', flexShrink: 0 }}>
                      <div
                        data-testid={`stage-${stageNumber}-circle`}
                        style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          background: isExpanded ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' : 'hsl(var(--bg-card))',
                          border: `2px solid ${isExpanded ? 'hsl(var(--primary))' : 'hsl(var(--border-color))'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 800,
                          color: isExpanded ? 'white' : 'hsl(var(--text-muted))',
                          transition: 'all 0.2s', cursor: 'pointer', zIndex: 1,
                        }} onClick={() => setExpandedStageIdx(isExpanded ? null : idx)}>
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
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: isExpanded ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--bg-card))',
                          border: `1px solid ${isExpanded ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--border-color))'}`,
                          borderRadius: isExpanded ? '10px 10px 0 0' : '10px',
                          cursor: 'pointer', transition: 'all 0.18s',
                          flexWrap: 'wrap', gap: '8px',
                        }}
                        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))'; }}
                        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))'; }}
                      >
                        {/* Left: name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '140px' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: 700,
                            color: isExpanded ? 'hsl(var(--primary))' : 'hsl(var(--border-color))',
                          }}>{stage.name}</span>
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
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Table size={11} /> {stage.allocatedLotIds && stage.allocatedLotIds.length !== matchedLots.length ? `${stage.allocatedLotIds.length} of ${matchedLots.length} Lots Allocated` : `All Lots (${matchedLots.length})`}
                          </span>
                          {/* Audience chip */}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.25)', color: 'hsl(var(--primary))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <Users size={11} /> {audienceSummary}
                          </span>
                          {/* Pricing / Mode chip */}
                          {stage.stageType === 'donation' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.25)', color: 'hsl(var(--primary))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <HeartHandshake size={11} /> Donation Transfer (Complimentary)
                            </span>
                          ) : stage.stageType === 'landfill' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--error)/0.12)', border: '1px solid hsl(var(--error)/0.25)', color: 'hsl(var(--error))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <Trash2 size={11} /> Disposal Deadline: {stage.disposalDeadline || 'Not set'}
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--secondary)/0.12)', border: '1px solid hsl(var(--secondary)/0.25)', color: 'hsl(var(--secondary))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <Sliders size={11} /> {pricingSummary}
                            </span>
                          )}
                          {/* Wait chip - shown for liquidation and donation */}
                          {stage.stageType !== 'landfill' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--text-muted)/0.08)', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              <Clock size={11} /> {formatWaitTime(stage.waitHours)} window
                            </span>
                          )}
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
                          background: 'hsl(var(--bg-card))',
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

                          {/* Inventory Allocation Section */}
                          <div data-testid={`stage-${stageNumber}-inventory-allocation-section`}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
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
                              <div style={{
                                maxHeight: '180px',
                                overflowY: 'auto',
                                border: '1px solid hsl(var(--border-color))',
                                borderRadius: '8px',
                                padding: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                background: 'hsl(var(--bg-card))'
                              }}>
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
                                    const rsl = calculateLotRsl ? calculateLotRsl(lot) : (lot.remainingShelfLife ? Math.round(lot.remainingShelfLife * 100) : 0);

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
                                          fontSize: '12px'
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

                          {/* Polymorphic Pricing & Timing section */}
                          {stage.stageType === 'donation' ? (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                <Clock size={13} /> Offer Expiration Window
                              </div>
                              <div style={{ maxWidth: '320px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                  <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Acceptance Window</label>
                                  <span style={{ fontSize: '10px', color: 'hsl(var(--primary))', fontWeight: 600 }}>{formatWaitTime(stage.waitHours)}</span>
                                </div>
                                {(() => {
                                  const currentUnit: 'd' | 'h' | 'm' = stage.waitUnit || (stage.waitHours >= 24 && stage.waitHours % 24 === 0 ? 'd' : stage.waitHours < 1 && stage.waitHours > 0 ? 'm' : 'h');
                                  const rawVal = currentUnit === 'd'
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
                                            waitUnit: currentUnit
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
                                            waitHours: calculatedHours
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
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--error))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                <Trash2 size={13} /> Disposal & Removal Deadline
                              </div>
                              <div style={{ maxWidth: '320px' }}>
                                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '5px' }}>Disposal Removal Cutoff Date</label>
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
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
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
                                    value={stage.discountType === 'yield' ? '' : (stage.discountValue === 0 ? '' : stage.discountValue)}
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
                                    const currentUnit: 'd' | 'h' | 'm' = stage.waitUnit || (stage.waitHours >= 24 && stage.waitHours % 24 === 0 ? 'd' : stage.waitHours < 1 && stage.waitHours > 0 ? 'm' : 'h');
                                    const rawVal = currentUnit === 'd'
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
                                              waitUnit: currentUnit
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
                                              waitHours: calculatedHours
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
                                  : `Buyers receive a ${stage.discountType === 'fixed' ? `${stage.discountValue}% markdown` : `$${stage.discountValue} floor bid`} offer and have ${formatWaitTime(stage.waitHours)} to respond before the next stage triggers.`
                                }
                              </p>
                            </div>
                          )}

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid hsl(var(--border-color))' }} />

                          {/* Stage Email — Configure button + badge + modal */}
                          <div data-testid={`stage-${stageNumber}-email-editor-section`}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                              <Mail size={13} /> Stage Email
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                data-testid={`configure-stage-email-btn-${stageNumber}`}
                                onClick={() => setOpenStageEmailModalIdx(idx)}
                                style={{ background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.4)', color: 'hsl(var(--primary))', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Mail size={13} /> Configure Stage Email
                              </button>

                              {(stage.emailSubject || stage.emailBodyHtml) && (
                                <span
                                  data-testid={`email-configured-badge-${stageNumber}`}
                                  style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--success))', background: 'hsl(var(--success)/0.12)', border: '1px solid hsl(var(--success)/0.3)', borderRadius: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <CheckCircle size={12} /> Email Configured ✓
                                </span>
                              )}

                              {(stage.emailSubject || stage.emailBodyHtml) && (
                                <button
                                  type="button"
                                  onClick={() => updateStage(idx, { emailBodyHtml: undefined, emailSubject: undefined, emailTemplateId: undefined })}
                                  style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
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
                                emailTemplateId: stage.emailTemplateId || (stage.stageType === 'donation' ? 'direct-donation-notice' : stage.stageType === 'landfill' ? 'disposal-removal-notice' : 'default'),
                              }}
                              onSave={(data) => {
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
                          gap: '4px'
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
                      <div data-testid="zero-buyer-error-banner" style={{ marginTop: '6px', marginLeft: '52px', padding: '10px 14px', background: 'hsl(var(--error) / 0.15)', border: '1px solid hsl(var(--error) / 0.4)', borderRadius: '8px', color: 'hsl(var(--error))', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} color="hsl(var(--error))" />
                        <span>⚠️ Zero-Buyer Selection Error: Stage {stageNumber} has 0 targeted buyers. At least 1 valid buyer must be selected for this stage.</span>
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
                  stageIndex: p.length,
                  stageNumber: p.length + 1,
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
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '7px', background: 'hsl(var(--bg-card))', border: '1px dashed hsl(var(--primary)/0.4)', color: 'hsl(var(--primary))', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary)/0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--bg-card))'}
            >
              <Plus size={14} /> Add Escalation Stage
            </button>
          </div>




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

            <button type="button" onClick={() => !hasZeroBuyerStage && setShowPreFlightModal(true)} disabled={impactMetrics.totalLots === 0 || hasZeroBuyerStage}
              style={{ flex: 1, background: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' : 'hsl(var(--border-color))', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 700, fontSize: '13px', cursor: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? 'pointer' : 'not-allowed', opacity: hasZeroBuyerStage ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: (impactMetrics.totalLots > 0 && !hasZeroBuyerStage) ? '0 6px 20px hsl(var(--primary)/0.3)' : 'none' }}>
              <Play size={15} /> Run
            </button>
          </div>
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
    </div>
  );
};
