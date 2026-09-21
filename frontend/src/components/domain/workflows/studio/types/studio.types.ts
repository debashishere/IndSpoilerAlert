import type { LucideIcon } from 'lucide-react';

export type BuyerMode = 'list' | 'custom' | 'segment';

export interface BuyerEntry {
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
}

export interface LiquidationAutomationStudioProps {
  supplierId: string;
  supplierName?: string;
  inventoryLots?: any[];
  buyers?: any[];
  apiBaseUrl?: string;
  editingCampaignId?: string | null;
  automationRuns?: any[];
  initialEmailBuilderTab?: 'preview' | 'editor' | 'broadcast';
  buyerLists?: any[];
  onSuccess?: (mode?: 'saved' | 'launched') => void;
  onCancel?: () => void;
}

export interface DynamicTokenItem {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
}
