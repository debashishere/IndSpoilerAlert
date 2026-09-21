import {
  Users,
  LayoutTemplate,
  Sparkles,
  Table,
  Link,
  Sliders,
  Clock
} from 'lucide-react';
import type { Stage, TemplateDefinition, DynamicTokenItem } from '../types/studio.types';

export const DYNAMIC_TOKENS_LIST: DynamicTokenItem[] = [
  { key: 'buyer_name', label: 'Buyer Name', icon: Users, description: 'Target buyer company/account name' },
  { key: 'supplier_name', label: 'Supplier Name', icon: LayoutTemplate, description: 'Your organization name' },
  { key: 'lot_title', label: 'Lot Title', icon: Sparkles, description: 'Title or description of matched inventory' },
  { key: 'inventory_table', label: 'Inventory Table', icon: Table, description: 'Itemized HTML table of matched lots' },
  { key: 'quick_bid_link', label: 'Quick Bid Link', icon: Link, description: 'Direct 1-Click bidding URL' },
  { key: 'current_stage_discount', label: 'Stage Markdown', icon: Sliders, description: 'Current stage discount value or floor bid' },
  { key: 'expiry_hours', label: 'Response Deadline', icon: Clock, description: 'Time window before next escalation stage' }
];

export const TIER_COLOR: Record<string, string> = {
  tier1: 'hsl(221,83%,63%)',
  tier2: 'hsl(262,83%,68%)',
  liquidator: 'hsl(38,92%,60%)',
  custom: 'hsl(160,60%,55%)',
};

export const DEFAULT_EMAIL_BODY_HTML = `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
<h2 style="color: #2563eb; margin-top: 0;">Clearance Opportunity | {{supplier_name}}</h2>
<p>Hello <strong>{{buyer_name}}</strong>,</p>
<p>We have immediate surplus inventory available for liquidation. Stage offer: <strong>{{current_stage_discount}}</strong> (Response window: {{expiry_hours}}). Please review the itemized offer sheet below:</p>
<div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
<br/>
<p style="text-align: center;"><a href="{{quick_bid_link}}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Bid Now</a></p>
</div>`;

export const DEFAULT_STAGES: Stage[] = [
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

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
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
