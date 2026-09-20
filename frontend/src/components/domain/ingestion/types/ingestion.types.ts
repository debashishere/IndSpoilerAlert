import type { PipelineTab } from '../../../../store/slices/ingestionSlice';

export type IngestionTarget = 'inventory' | 'sales' | 'buyers';

export interface TelemetryMetrics {
  portfolioValue: string;
  portfolioSubtext: string;
  criticalRsl: string;
  criticalRslSubtext: string;
  liquidationVelocity: string;
  liquidationVelocitySubtext: string;
  matchedBuyers: string;
  matchedBuyersSubtext: string;
}

export interface IngestionTelemetryBarProps {
  className?: string;
}

export interface IngestionHubConnectorsProps {
  className?: string;
  onOpenUploadModal?: () => void;
  defaultCollapsed?: boolean;
}

export interface PipelineSwitcherBarProps {
  className?: string;
  activeTab: PipelineTab;
  onTabChange: (tab: PipelineTab) => void;
  onOpenBuyerLists?: () => void;
  onAddBuyer?: () => void;
  onToggleAll?: () => void;
}

export interface IngestionViewProps {
  onOpenLotHub?: (lot: any) => void;
}

export interface UnifiedIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: IngestionTarget;
  onIngestComplete?: (target: IngestionTarget, file: File) => void;
}

export interface InventoryFilterBarProps {
  className?: string;
  search: string;
  supplier: string;
  dc: string;
  category: string;
  status: string;
  suppliersList: string[];
  dcsList: string[];
  categoriesList: string[];
  statusesList: string[];
  onSearchChange: (val: string) => void;
  onSupplierChange: (val: string) => void;
  onDCChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onClearFilters: () => void;
}

export interface InventoryRowInspectionDrawerProps {
  lot: any;
  onOpenLotHub?: (lot: any) => void;
  onOpenComplianceModal?: (lot: any) => void;
  onPushToBidding?: (lot: any) => void;
  onQuarantine?: (lot: any) => void;
}

export interface InventoryModernTableProps {
  lots: any[];
  expandedRowIds: Set<string>;
  onToggleRow: (lotId: string) => void;
  onOpenLotHub?: (lot: any) => void;
  onOpenRiskModal?: (lot: any) => void;
  onOpenComplianceModal?: (lot: any) => void;
}

export interface SalesRecord {
  _id: string;
  contractNumber?: string;
  invoiceNumber?: string;
  productName?: string;
  description?: string;
  product?: string;
  sku: string;
  lotNumber: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerCompany?: string;
  buyerNode?: string;
  warehouse?: string;
  dc?: string;
  location?: string;
  storageTemp?: string;
  dockType?: string;
  quantitySold: number;
  pricePerCase: number;
  totalRevenue?: number;
  totalValue?: number;
  status: string;
  saleDate?: string;
  dateRecorded?: string;
  createdAt?: string;
  updatedAt?: string;
  trackingCarrier?: string;
  deliveryWindow?: string;
  pickupTerms?: string;
  appointmentTerms?: string;
  telemetryGps?: string;
  telemetrySpeed?: string;
  grossSale?: number;
  netRemitted?: number;
  escrowStatus?: string;
  settlementTerms?: string;
  [key: string]: any;
}

export interface SalesFilterBarProps {
  className?: string;
  search: string;
  lotNumber: string;
  buyer: string;
  dc: string;
  createDate: string;
  priceRange: string;
  status: string;
  clearingRecordCount: number;
  buyersList: string[];
  dcsList: string[];
  priceRangesList: string[];
  statusesList: string[];
  onSearchChange: (val: string) => void;
  onLotNumberChange: (val: string) => void;
  onBuyerChange: (val: string) => void;
  onDCChange: (val: string) => void;
  onCreateDateChange: (val: string) => void;
  onPriceRangeChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onClearFilters: () => void;
}

export interface SalesRowInspectionDrawerProps {
  record: SalesRecord;
  onReconcileInvoice?: (record: SalesRecord) => void;
  onAuthorizeDockGatePass?: (record: SalesRecord) => void;
  onLiveFleetTelemetry?: (record: SalesRecord) => void;
}

export interface SalesModernTableProps {
  records: SalesRecord[];
  expandedRowIds: Set<string>;
  onToggleRow: (recordId: string) => void;
  onReconcileInvoice?: (record: SalesRecord) => void;
  onAuthorizeDockGatePass?: (record: SalesRecord) => void;
  onLiveFleetTelemetry?: (record: SalesRecord) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export interface BuyerRecord {
  _id: string;
  id?: string;
  buyerId?: string;
  companyName: string;
  name?: string;
  email: string;
  tier?: string;
  networkSubtitle?: string;
  preferencesPrimary?: string;
  preferencesSecondary?: string;
  createDate?: string;
  updateDate?: string;
  status?: string;
  isActive?: boolean;
  optInBidding?: boolean;
  optInSales?: boolean;
  procurementOfficers?: Array<{ name: string; title?: string; email: string }>;
  categories?: string[];
  hubFacilities?: string[];
  tenderActionType?: string;
  [key: string]: any;
}

export interface BuyerFilterBarProps {
  className?: string;
  search: string;
  tier: string;
  status: string;
  showInactive: boolean;
  tiersList: string[];
  statusesList: string[];
  onSearchChange: (val: string) => void;
  onTierChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onShowInactiveChange: (val: boolean) => void;
  onClearFilters: () => void;
}

export interface BuyerRowInspectionDrawerProps {
  buyer: BuyerRecord;
  onEditBuyerProfile?: (buyer: BuyerRecord) => void;
  onSendLotTender?: (buyer: BuyerRecord) => void;
  onForwardShortDatedOffers?: (buyer: BuyerRecord) => void;
  onRouteZeroWasteDonation?: (buyer: BuyerRecord) => void;
}

export interface BuyerModernTableProps {
  buyers: BuyerRecord[];
  expandedRowIds: Set<string>;
  onToggleRow: (buyerId: string) => void;
  onEditBuyerProfile?: (buyer: BuyerRecord) => void;
  onSendLotTender?: (buyer: BuyerRecord) => void;
  onForwardShortDatedOffers?: (buyer: BuyerRecord) => void;
  onRouteZeroWasteDonation?: (buyer: BuyerRecord) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
}

export interface AddBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyerAdded?: (buyer: any) => void;
  supplierId?: string;
}
