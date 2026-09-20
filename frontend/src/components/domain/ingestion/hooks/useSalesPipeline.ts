import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import type { SalesRecord } from '../types/ingestion.types';

export interface UseSalesPipelineOptions {
  onReconcileInvoice?: (record: SalesRecord) => void;
  onAuthorizeDockGatePass?: (record: SalesRecord) => void;
  onLiveFleetTelemetry?: (record: SalesRecord) => void;
}

export function useSalesPipeline({
  onReconcileInvoice,
  onAuthorizeDockGatePass,
  onLiveFleetTelemetry,
}: UseSalesPipelineOptions = {}) {
  const dispatch = useAppDispatch();

  // Redux state
  const rawSalesRecords = useAppSelector((state) => state.ingestion?.salesRecords || []);
  const salesRecordsLoading = useAppSelector((state) => state.ingestion?.salesRecordsLoading || false);

  // Fallback to default high-fidelity Stitch records when no records exist yet
  const salesRecords: SalesRecord[] = useMemo(() => {
    if (rawSalesRecords.length > 0) {
      return rawSalesRecords;
    }
    return INGESTION_CONSTANTS.DEFAULT_SALES_RECORDS as unknown as SalesRecord[];
  }, [rawSalesRecords]);

  // Local filter states
  const [search, setSearch] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [buyer, setBuyer] = useState('');
  const [dc, setDc] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [status, setStatus] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expanded row drawers
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Dynamic filter lists
  const buyersList = useMemo(() => {
    const fromRecords = salesRecords
      .map((r) => r.buyerName || r.buyerCompany || r.buyerEmail || r.customer)
      .filter(Boolean) as string[];
    const combined = Array.from(new Set([...fromRecords, ...INGESTION_CONSTANTS.SALES_FILTER_DEFAULTS.BUYERS]));
    return combined;
  }, [salesRecords]);

  const dcsList = useMemo(() => {
    const fromRecords = salesRecords
      .map((r) => r.warehouse || r.dc || r.location)
      .filter(Boolean) as string[];
    const combined = Array.from(new Set([...fromRecords, ...INGESTION_CONSTANTS.SALES_FILTER_DEFAULTS.DCS]));
    return combined;
  }, [salesRecords]);

  const priceRangesList = useMemo(() => {
    return Array.from(INGESTION_CONSTANTS.SALES_FILTER_DEFAULTS.PRICE_RANGES);
  }, []);

  const statusesList = useMemo(() => {
    return Array.from(INGESTION_CONSTANTS.SALES_FILTER_DEFAULTS.STATUSES);
  }, []);

  // Filtered sales records
  const filteredRecords = useMemo(() => {
    return salesRecords.filter((r: SalesRecord) => {
      const term = search.toLowerCase().trim();
      const prod = (r.productName || r.description || r.product || '').toLowerCase();
      const sku = (r.sku || r.productId || '').toLowerCase();
      const lotNum = (r.lotNumber || r['Lot Number'] || r.lot || r.lotNo || '').toLowerCase();
      const bName = (r.buyerName || r.buyerCompany || r.customer || '').toLowerCase();
      const bEmail = (r.buyerEmail || '').toLowerCase();
      const inv = (r.invoiceNumber || r.contractNumber || r.invoice || '').toLowerCase();
      const warehouse = (r.warehouse || r.dc || r.location || '').toLowerCase();
      const carrier = (r.trackingCarrier || '').toLowerCase();
      const recStatus = (r.status || 'completed / settled').toLowerCase();

      // Search matching across multiple fields
      const matchesSearch =
        !term ||
        prod.includes(term) ||
        sku.includes(term) ||
        lotNum.includes(term) ||
        bName.includes(term) ||
        bEmail.includes(term) ||
        inv.includes(term) ||
        warehouse.includes(term) ||
        carrier.includes(term) ||
        recStatus.includes(term);

      // Lot Number filter
      const matchesLotNumber =
        !lotNumber || lotNum.includes(lotNumber.toLowerCase().trim());

      // Buyer filter
      const matchesBuyer =
        !buyer ||
        buyer === 'all' ||
        bName === buyer.toLowerCase() ||
        bEmail === buyer.toLowerCase() ||
        bName.includes(buyer.toLowerCase());

      // DC filter
      const matchesDC =
        !dc ||
        dc === 'all' ||
        warehouse === dc.toLowerCase() ||
        warehouse.includes(dc.toLowerCase());

      // Create Date filter
      let matchesCreateDate = true;
      if (createDate) {
        const rawDate = r.createdAt || r.saleDate || r.date || r.dateRecorded;
        if (rawDate) {
          const isoDate = new Date(rawDate).toISOString().split('T')[0];
          const matchesIso = isoDate === createDate;
          const matchesStr = rawDate.includes(createDate);
          matchesCreateDate = matchesIso || matchesStr;
        } else {
          matchesCreateDate = false;
        }
      }

      // Price Range filter
      let matchesPrice = true;
      if (priceRange && priceRange !== 'all') {
        const price = r.pricePerCase ?? r.unitPrice ?? r.price ?? 0;
        const pRange = priceRange.toLowerCase();

        if (pRange.includes('<') || pRange.includes('under') || pRange === 'under10') {
          matchesPrice = price < 10;
        } else if (pRange.includes('10 - 20') || pRange.includes('10 - 25') || pRange === '10-25') {
          matchesPrice = price >= 10 && price <= 25;
        } else if (pRange.includes('>') || pRange.includes('over') || pRange === 'over50') {
          matchesPrice = price > 20;
        }
      }

      // Sales Status filter
      let matchesStatus = true;
      if (status && status !== 'all') {
        const sLower = status.toLowerCase();
        if (sLower.includes('settled') || sLower.includes('completed')) {
          matchesStatus = recStatus.includes('settled') || recStatus.includes('completed');
        } else if (sLower.includes('escrow') || sLower.includes('pending')) {
          matchesStatus = recStatus.includes('escrow') || recStatus.includes('pending');
        } else if (sLower.includes('invoiced')) {
          matchesStatus = recStatus.includes('invoiced');
        } else {
          matchesStatus = recStatus === sLower || recStatus.includes(sLower);
        }
      }

      return (
        matchesSearch &&
        matchesLotNumber &&
        matchesBuyer &&
        matchesDC &&
        matchesCreateDate &&
        matchesPrice &&
        matchesStatus
      );
    });
  }, [salesRecords, search, lotNumber, buyer, dc, createDate, priceRange, status]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, lotNumber, buyer, dc, createDate, priceRange, status]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Drawer toggling
  const toggleRow = useCallback((recordId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  }, []);

  const expandAllRows = useCallback(() => {
    const allIds = filteredRecords.map((r) => r._id);
    setExpandedRowIds(new Set(allIds));
  }, [filteredRecords]);

  const collapseAllRows = useCallback(() => {
    setExpandedRowIds(new Set());
  }, []);

  // Compute if all visible are currently open
  const allAreOpen = useMemo(() => {
    if (filteredRecords.length === 0) return false;
    return filteredRecords.every((r) => expandedRowIds.has(r._id));
  }, [filteredRecords, expandedRowIds]);

  // Synchronize Toggle All state with external subscribers & DOM
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toggle-all-state-changed', { detail: { allOpen: allAreOpen } }));
  }, [allAreOpen]);

  // Listen to 'toggle-all-rows' global event
  useEffect(() => {
    const handleToggleAllEvent = () => {
      if (filteredRecords.length === 0) return;
      setExpandedRowIds((prev) => {
        const isAllOpen = filteredRecords.every((r) => prev.has(r._id));
        if (isAllOpen) {
          return new Set();
        } else {
          return new Set(filteredRecords.map((r) => r._id));
        }
      });
    };

    window.addEventListener('toggle-all-rows', handleToggleAllEvent);
    return () => {
      window.removeEventListener('toggle-all-rows', handleToggleAllEvent);
    };
  }, [filteredRecords]);

  // Handlers for filter controls
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
  }, []);

  const handleLotNumberChange = useCallback((val: string) => {
    setLotNumber(val);
  }, []);

  const handleBuyerChange = useCallback((val: string) => {
    setBuyer(val);
  }, []);

  const handleDCChange = useCallback((val: string) => {
    setDc(val);
  }, []);

  const handleCreateDateChange = useCallback((val: string) => {
    setCreateDate(val);
  }, []);

  const handlePriceRangeChange = useCallback((val: string) => {
    setPriceRange(val);
  }, []);

  const handleStatusChange = useCallback((val: string) => {
    setStatus(val);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setLotNumber('');
    setBuyer('');
    setDc('');
    setCreateDate('');
    setPriceRange('');
    setStatus('');
  }, []);

  // Handlers for contextual action CTAs
  const handleReconcileInvoice = useCallback((record: SalesRecord) => {
    if (onReconcileInvoice) {
      onReconcileInvoice(record);
    }
  }, [onReconcileInvoice]);

  const handleAuthorizeDockGatePass = useCallback((record: SalesRecord) => {
    if (onAuthorizeDockGatePass) {
      onAuthorizeDockGatePass(record);
    }
  }, [onAuthorizeDockGatePass]);

  const handleLiveFleetTelemetry = useCallback((record: SalesRecord) => {
    if (onLiveFleetTelemetry) {
      onLiveFleetTelemetry(record);
    }
  }, [onLiveFleetTelemetry]);

  // Live ERP Clearing Count: 92 records from Stitch design or dynamic count
  const clearingRecordCount = useMemo(() => {
    if (rawSalesRecords.length > 0) {
      return rawSalesRecords.length;
    }
    return 92;
  }, [rawSalesRecords]);

  return {
    salesRecords,
    salesRecordsLoading,
    filteredRecords,
    paginatedRecords,
    currentPage,
    totalPages,
    setCurrentPage,
    search,
    lotNumber,
    buyer,
    dc,
    createDate,
    priceRange,
    status,
    buyersList,
    dcsList,
    priceRangesList,
    statusesList,
    clearingRecordCount,
    expandedRowIds,
    allAreOpen,
    toggleRow,
    expandAllRows,
    collapseAllRows,
    handleSearchChange,
    handleLotNumberChange,
    handleBuyerChange,
    handleDCChange,
    handleCreateDateChange,
    handlePriceRangeChange,
    handleStatusChange,
    handleClearFilters,
    handleReconcileInvoice,
    handleAuthorizeDockGatePass,
    handleLiveFleetTelemetry,
  };
}
