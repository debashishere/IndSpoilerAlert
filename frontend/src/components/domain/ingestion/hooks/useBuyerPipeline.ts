import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import type { BuyerRecord } from '../types/ingestion.types';
import type { Buyer } from '../../../../store/slices/coreSlice';

export interface UseBuyerPipelineOptions {
  onEditBuyerProfile?: (buyer: BuyerRecord) => void;
  onSendLotTender?: (buyer: BuyerRecord) => void;
  onForwardShortDatedOffers?: (buyer: BuyerRecord) => void;
  onRouteZeroWasteDonation?: (buyer: BuyerRecord) => void;
}

export function useBuyerPipeline({
  onEditBuyerProfile,
  onSendLotTender,
  onForwardShortDatedOffers,
  onRouteZeroWasteDonation,
}: UseBuyerPipelineOptions = {}) {
  const rawBuyers = useAppSelector((state) => state.core?.buyers || []);

  // Redux buyer search / tier sync if set externally
  const reduxSearch = useAppSelector((state) => state.ingestion?.buyerSearch || '');
  const reduxTierFilter = useAppSelector((state) => state.ingestion?.buyerTierFilter || 'all');

  // Convert raw core buyers into normalized BuyerRecord entries, or fallback to default high-fidelity Stitch records
  const buyers: BuyerRecord[] = useMemo(() => {
    if (rawBuyers.length > 0) {
      return rawBuyers.map((b: Buyer, idx: number): BuyerRecord => {
        const id = b._id || `buyer-${idx}`;
        const companyName = b.companyName || b.name || 'Unnamed Enterprise';
        const tier = b.tier
          ? b.tier === 'tier1'
            ? 'Tier 1'
            : b.tier === 'tier2'
            ? 'Tier 2'
            : b.tier.charAt(0).toUpperCase() + b.tier.slice(1)
          : 'Tier 1';

        const isActive = b.isActive !== false;
        const optInBidding = b.optInBidding !== false;
        const optInSales = b.optInSales !== false;

        return {
          ...b,
          _id: id,
          id,
          buyerId: b.buyerId || `BYR-${id.slice(-6).toUpperCase()}`,
          companyName,
          name: b.name || companyName,
          email: b.email || 'procurement@enterprise.com',
          tier,
          networkSubtitle: b.networkSubtitle || `ID: ${b.buyerId || `BYR-${id.slice(-4).toUpperCase()}`} • Enterprise Buyer`,
          preferencesPrimary: b.preferencesPrimary || (b.categories?.[0] ? `${b.categories[0]} Priority` : 'General Catalog Priority'),
          preferencesSecondary:
            b.preferencesSecondary ||
            (b.excludedAllergens && b.excludedAllergens.length > 0
              ? `Allergen Filter (${b.excludedAllergens.join(', ')})`
              : optInBidding && optInSales
              ? 'Full Opt-In • Verified Network'
              : 'Standard B2B Opt-In'),
          createDate: b.createDate || (b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US') : '01/14/2025'),
          updateDate: b.updateDate || (b.updatedAt ? new Date(b.updatedAt).toLocaleDateString('en-US') : '09/17/2026'),
          status: b.status || (isActive ? 'Active Compliant' : 'Inactive'),
          isActive,
          optInBidding,
          optInSales,
          procurementOfficers: b.procurementOfficers || [
            {
              name: b.name || 'Procurement Lead',
              title: 'Director of Procurement',
              email: b.email,
            },
          ],
          categories: b.categories || ['Dry & Ambient', 'Surplus Overstock'],
          hubFacilities: b.hubFacilities || ['Regional Logistics Hub'],
          tenderActionType: b.tenderActionType || 'Send Lot Tender',
        };
      });
    }
    return INGESTION_CONSTANTS.DEFAULT_BUYER_RECORDS as unknown as BuyerRecord[];
  }, [rawBuyers]);

  // Local filter states
  const [search, setSearch] = useState(reduxSearch);
  const [tier, setTier] = useState(reduxTierFilter === 'all' ? '' : reduxTierFilter);
  const [status, setStatus] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer / Modal states
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerRecord | null>(null);
  const [isAddBuyerModalOpen, setIsAddBuyerModalOpen] = useState(false);
  const [isBuyerListModalOpen, setIsBuyerListModalOpen] = useState(false);

  // Dynamic filter lists
  const tiersList = useMemo(() => {
    return Array.from(INGESTION_CONSTANTS.BUYER_FILTER_DEFAULTS.TIERS);
  }, []);

  const statusesList = useMemo(() => {
    return Array.from(INGESTION_CONSTANTS.BUYER_FILTER_DEFAULTS.STATUSES);
  }, []);

  // Filtered buyers
  const filteredBuyers = useMemo(() => {
    return buyers.filter((b: BuyerRecord) => {
      // 1. Inactive filtering
      if (!showInactive && b.isActive === false) {
        return false;
      }

      // 2. Keyword search
      const term = search.toLowerCase().trim();
      const compName = (b.companyName || b.name || '').toLowerCase();
      const email = (b.email || '').toLowerCase();
      const bId = (b.buyerId || b._id || '').toLowerCase();
      const sub = (b.networkSubtitle || '').toLowerCase();
      const officerNames = (b.procurementOfficers || []).map((o) => o.name.toLowerCase()).join(' ');

      const matchesSearch =
        !term ||
        compName.includes(term) ||
        email.includes(term) ||
        bId.includes(term) ||
        sub.includes(term) ||
        officerNames.includes(term);

      // 3. Tier filter
      let matchesTier = true;
      if (tier && tier !== 'all' && tier !== 'All Tiers') {
        const tLower = tier.toLowerCase();
        const bTier = (b.tier || '').toLowerCase();
        if (tLower.includes('tier 1') || tLower === 'tier1') {
          matchesTier = bTier.includes('tier 1') || bTier === 'tier1';
        } else if (tLower.includes('tier 2') || tLower === 'tier2') {
          matchesTier = bTier.includes('tier 2') || bTier === 'tier2';
        } else if (tLower.includes('liquidator')) {
          matchesTier = bTier.includes('liquidator');
        } else if (tLower.includes('custom')) {
          matchesTier = bTier.includes('custom');
        } else {
          matchesTier = bTier === tLower || bTier.includes(tLower);
        }
      }

      // 4. Status & Channel filter
      let matchesStatus = true;
      if (status && status !== 'all' && status !== 'All Statuses') {
        const sLower = status.toLowerCase();
        const bStatus = (b.status || '').toLowerCase();
        const bPrefs = (b.preferencesSecondary || '').toLowerCase();

        if (sLower.includes('active compliant') || sLower === 'active') {
          matchesStatus = b.isActive !== false;
        } else if (sLower.includes('inactive')) {
          matchesStatus = b.isActive === false;
        } else if (sLower.includes('full opt-in')) {
          matchesStatus = b.optInBidding !== false && b.optInSales !== false;
        } else if (sLower.includes('allergen filter')) {
          matchesStatus =
            bPrefs.includes('allergen') ||
            (b.excludedAllergens && b.excludedAllergens.length > 0) ||
            bStatus.includes('allergen');
        } else if (sLower.includes('no-bidding') || sLower.includes('opt-out bidding')) {
          matchesStatus = b.optInBidding === false;
        } else if (sLower.includes('no-sales') || sLower.includes('opt-out sales')) {
          matchesStatus = b.optInSales === false;
        } else {
          matchesStatus = bStatus.includes(sLower);
        }
      }

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [buyers, search, tier, status, showInactive]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, tier, status, showInactive, pageSize]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredBuyers.length / pageSize));
  const paginatedBuyers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBuyers.slice(start, start + pageSize);
  }, [filteredBuyers, currentPage, pageSize]);

  // Drawer toggling
  const toggleRow = useCallback((buyerId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(buyerId)) {
        next.delete(buyerId);
      } else {
        next.add(buyerId);
      }
      return next;
    });
  }, []);

  const expandAllRows = useCallback(() => {
    const allIds = filteredBuyers.map((b) => b._id);
    setExpandedRowIds(new Set(allIds));
  }, [filteredBuyers]);

  const collapseAllRows = useCallback(() => {
    setExpandedRowIds(new Set());
  }, []);

  // Compute if all visible are currently open
  const allAreOpen = useMemo(() => {
    if (filteredBuyers.length === 0) return false;
    return filteredBuyers.every((b) => expandedRowIds.has(b._id));
  }, [filteredBuyers, expandedRowIds]);

  // Synchronize Toggle All state with external subscribers
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toggle-all-state-changed', { detail: { allOpen: allAreOpen } }));
  }, [allAreOpen]);

  // Listen to 'toggle-all-rows' global event
  useEffect(() => {
    const handleToggleAllEvent = () => {
      if (filteredBuyers.length === 0) return;
      setExpandedRowIds((prev) => {
        const isAllOpen = filteredBuyers.every((b) => prev.has(b._id));
        if (isAllOpen) {
          return new Set();
        } else {
          return new Set(filteredBuyers.map((b) => b._id));
        }
      });
    };

    window.addEventListener('toggle-all-rows', handleToggleAllEvent);
    return () => {
      window.removeEventListener('toggle-all-rows', handleToggleAllEvent);
    };
  }, [filteredBuyers]);

  // Listen to external modal trigger events
  useEffect(() => {
    const handleOpenAddBuyer = () => setIsAddBuyerModalOpen(true);
    const handleOpenBuyerLists = () => setIsBuyerListModalOpen(true);

    window.addEventListener('open-add-buyer-modal', handleOpenAddBuyer);
    window.addEventListener('open-buyer-list-manager', handleOpenBuyerLists);

    return () => {
      window.removeEventListener('open-add-buyer-modal', handleOpenAddBuyer);
      window.removeEventListener('open-buyer-list-manager', handleOpenBuyerLists);
    };
  }, []);

  // Handlers for filter controls
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
  }, []);

  const handleTierChange = useCallback((val: string) => {
    setTier(val);
  }, []);

  const handleStatusChange = useCallback((val: string) => {
    setStatus(val);
  }, []);

  const handleShowInactiveChange = useCallback((val: boolean) => {
    setShowInactive(val);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setTier('');
    setStatus('');
    setShowInactive(false);
  }, []);

  // Actions
  const handleEditBuyerProfile = useCallback(
    (buyer: BuyerRecord) => {
      setSelectedBuyer(buyer);
      setIsDetailDrawerOpen(true);
      if (onEditBuyerProfile) {
        onEditBuyerProfile(buyer);
      }
    },
    [onEditBuyerProfile]
  );

  const handleCloseDetailDrawer = useCallback(() => {
    setIsDetailDrawerOpen(false);
    setSelectedBuyer(null);
  }, []);

  const handleSendLotTender = useCallback(
    (buyer: BuyerRecord) => {
      if (onSendLotTender) {
        onSendLotTender(buyer);
      }
    },
    [onSendLotTender]
  );

  const handleForwardShortDatedOffers = useCallback(
    (buyer: BuyerRecord) => {
      if (onForwardShortDatedOffers) {
        onForwardShortDatedOffers(buyer);
      }
    },
    [onForwardShortDatedOffers]
  );

  const handleRouteZeroWasteDonation = useCallback(
    (buyer: BuyerRecord) => {
      if (onRouteZeroWasteDonation) {
        onRouteZeroWasteDonation(buyer);
      }
    },
    [onRouteZeroWasteDonation]
  );

  return {
    buyers,
    filteredBuyers,
    paginatedBuyers,
    currentPage,
    totalPages,
    setCurrentPage,
    search,
    tier,
    status,
    showInactive,
    tiersList,
    statusesList,
    expandedRowIds,
    allAreOpen,
    currentPage,
    pageSize,
    totalPages,
    paginatedBuyers,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    isDetailDrawerOpen,
    selectedBuyer,
    isAddBuyerModalOpen,
    isBuyerListModalOpen,
    setIsAddBuyerModalOpen,
    setIsBuyerListModalOpen,
    toggleRow,
    expandAllRows,
    collapseAllRows,
    handleSearchChange,
    handleTierChange,
    handleStatusChange,
    handleShowInactiveChange,
    handleClearFilters,
    handleEditBuyerProfile,
    handleCloseDetailDrawer,
    handleSendLotTender,
    handleForwardShortDatedOffers,
    handleRouteZeroWasteDonation,
  };
}
