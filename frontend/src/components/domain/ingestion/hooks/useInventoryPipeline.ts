import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setFilterSearch,
  setFilterSupplier,
  setFilterDC,
  setFilterCategory,
  setFilterStatus,
  selectFilteredInventoryLots,
  setSelectedLot,
  openRiskModal,
  openComplianceModal,
} from '../../../../store/slices/inventorySlice';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';

export interface UseInventoryPipelineOptions {
  onOpenLotHub?: (lot: any) => void;
}

export function useInventoryPipeline({ onOpenLotHub }: UseInventoryPipelineOptions = {}) {
  const dispatch = useAppDispatch();

  // Redux state
  const inventoryList = useAppSelector((state) => state.inventory?.inventoryList || []);
  const inventoryLoading = useAppSelector((state) => state.inventory?.loading || false);
  const suppliers = useAppSelector((state) => state.core?.suppliers || []);

  const search = useAppSelector((state) => state.inventory?.listFilterSearch || '');
  const supplier = useAppSelector((state) => state.inventory?.listFilterSupplier || '');
  const dc = useAppSelector((state) => state.inventory?.listFilterDC || '');
  const category = useAppSelector((state) => state.inventory?.listFilterCategory || '');
  const status = useAppSelector((state) => state.inventory?.listFilterStatus || '');

  const filteredLots = useAppSelector(selectFilteredInventoryLots);

  // Local state for expanded row drawers
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Dynamic filter lists
  const suppliersList = useMemo(() => {
    const fromLots = inventoryList.map((lot: any) => lot.supplierId?.name || lot.supplier).filter(Boolean);
    const fromCore = suppliers.map((s: any) => s.name).filter(Boolean);
    const combined = Array.from(new Set([...fromLots, ...fromCore, ...INGESTION_CONSTANTS.INVENTORY_FILTER_DEFAULTS.SUPPLIERS]));
    return combined;
  }, [inventoryList, suppliers]);

  const dcsList = useMemo(() => {
    const fromLots = inventoryList.map((lot: any) => lot.distributionCenterId?.name || lot.warehouse || lot.location).filter(Boolean);
    const combined = Array.from(new Set([...fromLots, ...INGESTION_CONSTANTS.INVENTORY_FILTER_DEFAULTS.DCS]));
    return combined;
  }, [inventoryList]);

  const categoriesList = useMemo(() => {
    const fromLots = inventoryList.map((lot: any) => lot.productId?.category || lot.category).filter(Boolean);
    const combined = Array.from(new Set([...fromLots, ...INGESTION_CONSTANTS.INVENTORY_FILTER_DEFAULTS.CATEGORIES]));
    return combined;
  }, [inventoryList]);

  const statusesList = useMemo(() => {
    return Array.from(INGESTION_CONSTANTS.INVENTORY_FILTER_DEFAULTS.STATUSES);
  }, []);

  // Drawer toggling
  const toggleRow = useCallback((lotId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(lotId)) {
        next.delete(lotId);
      } else {
        next.add(lotId);
      }
      return next;
    });
  }, []);

  const expandAllRows = useCallback(() => {
    const allIds = filteredLots.map((l: any) => l._id);
    setExpandedRowIds(new Set(allIds));
  }, [filteredLots]);

  const collapseAllRows = useCallback(() => {
    setExpandedRowIds(new Set());
  }, []);

  // Compute if all visible are currently open
  const allAreOpen = useMemo(() => {
    if (filteredLots.length === 0) return false;
    return filteredLots.every((l: any) => expandedRowIds.has(l._id));
  }, [filteredLots, expandedRowIds]);

  // Synchronize Toggle All state with external subscribers & DOM
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toggle-all-state-changed', { detail: { allOpen: allAreOpen } }));
  }, [allAreOpen]);

  // Listen to 'toggle-all-rows' global event
  useEffect(() => {
    const handleToggleAllEvent = () => {
      if (filteredLots.length === 0) return;
      setExpandedRowIds((prev) => {
        const isAllOpen = filteredLots.every((l: any) => prev.has(l._id));
        if (isAllOpen) {
          return new Set();
        } else {
          return new Set(filteredLots.map((l: any) => l._id));
        }
      });
    };

    window.addEventListener('toggle-all-rows', handleToggleAllEvent);
    return () => {
      window.removeEventListener('toggle-all-rows', handleToggleAllEvent);
    };
  }, [filteredLots]);

  // Filter actions
  const handleSearchChange = useCallback((val: string) => {
    dispatch(setFilterSearch(val));
  }, [dispatch]);

  const handleSupplierChange = useCallback((val: string) => {
    dispatch(setFilterSupplier(val));
  }, [dispatch]);

  const handleDCChange = useCallback((val: string) => {
    dispatch(setFilterDC(val));
  }, [dispatch]);

  const handleCategoryChange = useCallback((val: string) => {
    dispatch(setFilterCategory(val));
  }, [dispatch]);

  const handleStatusChange = useCallback((val: string) => {
    dispatch(setFilterStatus(val));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(setFilterSearch(''));
    dispatch(setFilterSupplier(''));
    dispatch(setFilterDC(''));
    dispatch(setFilterCategory(''));
    dispatch(setFilterStatus(''));
  }, [dispatch]);

  // Action dispatches
  const handleOpenLotHub = useCallback((lot: any) => {
    dispatch(setSelectedLot(lot));
    if (onOpenLotHub) {
      onOpenLotHub(lot);
    }
  }, [dispatch, onOpenLotHub]);

  const handleOpenRiskModal = useCallback((lot: any) => {
    dispatch(setSelectedLot(lot));
    dispatch(openRiskModal(lot));
  }, [dispatch]);

  const handleOpenComplianceModal = useCallback((lot: any) => {
    dispatch(setSelectedLot(lot));
    dispatch(openComplianceModal(lot));
  }, [dispatch]);

  return {
    inventoryList,
    inventoryLoading,
    filteredLots,
    search,
    supplier,
    dc,
    category,
    status,
    suppliersList,
    dcsList,
    categoriesList,
    statusesList,
    expandedRowIds,
    allAreOpen,
    toggleRow,
    expandAllRows,
    collapseAllRows,
    handleSearchChange,
    handleSupplierChange,
    handleDCChange,
    handleCategoryChange,
    handleStatusChange,
    handleClearFilters,
    handleOpenLotHub,
    handleOpenRiskModal,
    handleOpenComplianceModal,
  };
}
