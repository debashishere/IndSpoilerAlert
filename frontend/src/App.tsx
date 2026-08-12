


import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Database, 
  Cpu, 
  X,
  MapPin,
  Tag,
  ShieldAlert,
  Heart,
  Recycle,
  TrendingUp,
  BarChart3,
  ShoppingBag,
  Mail,
  Inbox,
  List,
  ShieldCheck,
  Truck,
  Users
} from 'lucide-react';
import { getBuyers } from './services/networkService';
import { DEFAULT_SUPPLIERS } from './services/coreService';
import { ThemeToggle } from './components/shell';
const LotOperationsHubView = React.lazy(() => import('./components/LotOperationsHubView').then(m => ({ default: m.LotOperationsHubView })));
const WorkflowsView = React.lazy(() => import('./components/WorkflowsView').then(m => ({ default: m.WorkflowsView })));
const LogisticsView = React.lazy(() => import('./views/LogisticsView').then(m => ({ default: m.LogisticsView || m.default })));
const InventoryListView = React.lazy(() => import('./views/InventoryListView').then(m => ({ default: m.InventoryListView })));
const IngestionView = React.lazy(() => import('./views/IngestionView').then(m => ({ default: m.IngestionView || m.default })));
import { useDispatch } from 'react-redux';
import { setActiveTab as setActiveTabRedux, setReturnTab as setReturnTabRedux, fetchCoreReferenceData, fetchBuyerLists } from './store/slices/coreSlice';
import { setBuyerAuth } from './store/slices/authSlice';
import { fetchShipmentsThunk } from './store/slices/logisticsSlice';
import { fetchInventoryLotsThunk } from './services/inventoryService';
const AnalyticsView = React.lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView || m.default })));
const MarketplaceLandingView = React.lazy(() => import('./views/marketplace/MarketplaceLandingView').then(m => ({ default: m.MarketplaceLandingView || m.default })));
import { MarketplaceLayout } from './components/shell/MarketplaceLayout';
import { InteractiveTour } from './components/InteractiveTour';
import { SettingsView } from './views/SettingsView';
import { EmailCommunicationsView } from './views/EmailCommunicationsView';
import { EmailsHubView } from './views/EmailsHubView';
import { QuickBidModal } from './components/QuickBidModal';
import { SHOW_DISTRESSED_ANALYTICS, SHOW_FREIGHT_LOGISTICS } from './components/shell/Sidebar';
import { useAuth } from './context/AuthContext';
import { PublicLandingPage } from './views/PublicLandingPage';


const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const SIDECAR_BASE_URL = import.meta.env.VITE_SIDECAR_URL || '/sidecar';

interface Supplier {
  _id: string;
  name: string;
  companyCode: string;
  preferredDisposition: string;
}

interface IngestionResponse {
  documentId?: string;
  _id?: string;
  ingestionJobId?: string;
  fileName: string;
  rawGrid: string[][];
  suggestedMapping: Record<string, string>;
}

export default function App() {
  const dispatch = useDispatch();
  const fetchShipments = async () => {
    dispatch(fetchShipmentsThunk() as any);
  };
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'email-comms' || tab === 'mails') return 'inbox';
    if (tab && ['ingestion', 'dashboard', 'analytics', 'marketplace', 'inventory', 'logistics', 'lot-hub', 'workflows', 'inbox', 'settings'].includes(tab)) {
      return tab as any;
    }
    return (localStorage.getItem('indSpoilerAlert_activeTab') as any) || 'ingestion';
  };
  const [activeTab, setActiveTab] = useState<'ingestion' | 'dashboard' | 'analytics' | 'marketplace' | 'inventory' | 'logistics' | 'lot-hub' | 'workflows' | 'inbox' | 'settings'>(getInitialTab);
  const [returnTab, setReturnTab] = useState<string | null>(null);
  const isLandingMode = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'landing' || params.get('landing') === 'true';
    }
    return false;
  };
  const [forceLanding, setForceLanding] = useState<boolean>(isLandingMode);
  const { isAuthenticated, isLoading, user, token, logout } = useAuth();
  const isSupplier = Boolean(user?.profiles?.supplier);

  useEffect(() => {
    dispatch(fetchCoreReferenceData() as any);
    dispatch(fetchBuyerLists() as any);
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(setBuyerAuth({
        buyer: {
          id: user.uid,
          email: user.email,
          companyName: user.displayName || user.email.split('@')[0],
          isVerified: true,
        },
        token: token || `mock-token-${user.uid}`,
      }));
    }
  }, [user, token, dispatch]);

  useEffect(() => {
    const supplierOnlyRoutes = ['ingestion', 'inventory', 'workflows', 'lot-hub', 'analytics', 'logistics'];
    if (!isSupplier && supplierOnlyRoutes.includes(activeTab)) {
      setActiveTab('marketplace');
    }
  }, [isSupplier, activeTab]);
  const [quickBidToken, setQuickBidToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || params.get('quickBidToken') || null;
  });

  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [selectedLotHubId, setSelectedLotHubId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('lotId') || null;
  });
  const [lotHubSubTab, setLotHubSubTab] = useState<'details' | 'bids' | 'activities'>(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subtab');
    if (sub && ['details', 'bids', 'activities'].includes(sub)) {
      return sub as any;
    }
    return 'details';
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEFAULT_SUPPLIERS);
  const [selectedSupplier, setSelectedSupplier] = useState<string>(DEFAULT_SUPPLIERS[0]._id);
  const [file, setFile] = useState<File | null>(null);
  const [_dragActive, _setDragActive] = useState<boolean>(false);
  const [_loading, _setLoading] = useState<boolean>(false);
  const [_loadingStep, _setLoadingStep] = useState<string>('');
  const [_error, _setError] = useState<string | null>(null);
  
  // Parsed result states
  const [parsedResult, setParsedResult] = useState<IngestionResponse | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // dbField -> headerName
  const [_semanticRules, _setSemanticRules] = useState<Array<{ sourceKey: string; targetKey: string; transform: string }>>([]);
  const [_newRuleSource, _setNewRuleSource] = useState<string>('');
  const [_newRuleTarget, _setNewRuleTarget] = useState<string>('');
  const [_newRuleTransform, _setNewRuleTransform] = useState<string>('');

  
  // Health states
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [sidecarHealthy, setSidecarHealthy] = useState<boolean | null>(null);
  
  // Status check
  const [isImported, setIsImported] = useState<boolean>(false);


  // Buyer Marketplace States
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyerEmail, setSelectedBuyerEmail] = useState<string>('');
  const [_listingsLoading, setListingsLoading] = useState<boolean>(false);


  // Award Email Modal States
  const [showAwardModal, setShowAwardModal] = useState<boolean>(false);
  const [selectedBidToAward, setSelectedBidToAward] = useState<any | null>(null);
  const [emailDraftSubject, setEmailDraftSubject] = useState<string>('');
  const [emailDraftBody, setEmailDraftBody] = useState<string>('');
  const [showEmailSentVisualizer, setShowEmailSentVisualizer] = useState<boolean>(false);
  const [visualizerEmailDetails, setVisualizerEmailDetails] = useState<any | null>(null);
  const [importCount, setImportCount] = useState<number>(0);
  const [importedLotIds, setImportedLotIds] = useState<string[]>([]);

  // V2 Negotiation & Award States
  const [awardedQtyInput, setAwardedQtyInput] = useState<number>(0);
  
  const _fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const complianceFileInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Compliance States
  const [complianceDocType, setComplianceDocType] = useState<'COA' | 'BATCH_RECORD' | 'FSMA_ATTESTATION' | 'ORGANIC_CERT'>('COA');
  const [complianceFile, setComplianceFile] = useState<File | null>(null);
  const [complianceUploading, setComplianceUploading] = useState<boolean>(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // Dashboard & Drawer States
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [, setLiquidationCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [, setAutomationList] = useState<any[]>([]);

  const [selectedLot, setSelectedLot] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  
  // Drawer child states (Risk, Opp, Listing, Pricing, matches)
  const [riskData, setRiskData] = useState<any | null>(null);
  const [opportunityData, setOpportunityData] = useState<any | null>(null);
  const [listingData, setListingData] = useState<any | null>(null);
  const [pricingData, setPricingData] = useState<any | null>(null);
  const [buyerMatches, setBuyerMatches] = useState<any[]>([]);
  
  // Sliders states
  const [sliderDays, setSliderDays] = useState<number>(30);
  const [sliderQty, setSliderQty] = useState<number>(100);
  const [pricingLoading, setPricingLoading] = useState<boolean>(false);
  
  // Transaction States
  const [txSuccess, setTxSuccess] = useState<boolean>(false);
  const [txDetails, setTxDetails] = useState<any | null>(null);
  const [txLoading, setTxLoading] = useState<boolean>(false);

  // Bidding, Disposal, and Analytics States
  const [bids, setBids] = useState<any[]>([]);
  const [bidsLoading, setBidsLoading] = useState<boolean>(false);


  // Negotiation States
  const [selectedLotForNegotiation, setSelectedLotForNegotiation] = useState<any | null>(null);
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);
  const [isTypingSimulated, setIsTypingSimulated] = useState<boolean>(false);
  const [lotActivities, setLotActivities] = useState<any[]>([]);
  const [activeActivityFilter, setActiveActivityFilter] = useState<'all' | 'email' | 'call' | 'meeting' | 'note'>('all');
  const [selectedFormType, setSelectedFormType] = useState<'call' | 'meeting' | 'note' | 'email'>('call');
  const [activityRecipientInput, setActivityRecipientInput] = useState<string>('');
  const [activitySubjectInput, setActivitySubjectInput] = useState<string>('');
  const [activityContentInput, setActivityContentInput] = useState<string>('');

  // Pagination & Sorting States (setters still used by fetch functions)
  const [_inventoryLoading, setInventoryLoading] = useState<boolean>(false);

  const [_allBids, setAllBids] = useState<any[]>([]);
  const [_isFetchingAllBids, setIsFetchingAllBids] = useState<boolean>(false);

  const [_salesRecords, setSalesRecords] = useState<any[]>([]);
  const [_salesRecordsLoading, setSalesRecordsLoading] = useState<boolean>(false);

  // Sales Ingestion Pipeline States
  const [_salesFile, _setSalesFile] = useState<File | null>(null);
  const [_salesDragActive, _setSalesDragActive] = useState<boolean>(false);
  const [_salesLoading, _setSalesLoading] = useState<boolean>(false);
  const [_salesLoadingStep, _setSalesLoadingStep] = useState<string>('');
  const [_salesError, _setSalesError] = useState<string | null>(null);
  const [_salesParsedResult, _setSalesParsedResult] = useState<IngestionResponse | null>(null);
  const [_salesMappings, _setSalesMappings] = useState<Record<string, string>>({});
  const [_salesIsImported, _setSalesIsImported] = useState<boolean>(false);
  const [_salesImportCount, _setSalesImportCount] = useState<number>(0);
  const [_salesImportWarnings, _setSalesImportWarnings] = useState<string[]>([]);



  // Check backend and sidecar health
  const checkHealth = React.useCallback(async () => {
    try {
      const backendRes = await fetch(`${API_BASE_URL}/health`);
      setBackendHealthy(backendRes.ok);
    } catch {
      setBackendHealthy(false);
    }

    try {
      const sidecarRes = await fetch(`${SIDECAR_BASE_URL}/health`);
      if (sidecarRes.ok) {
        const data = await sidecarRes.json();
        setSidecarHealthy(Boolean(data && (data.status === 200 || data.status === 'OK' || data.status === 'SideCar is healthy' || data.status)));
      } else {
        setSidecarHealthy(false);
      }
    } catch {
      setSidecarHealthy(false);
    }
  }, []);

  const checkHealthRef = useRef(checkHealth);
  useEffect(() => {
    checkHealthRef.current = checkHealth;
  }, [checkHealth]);

  useEffect(() => {
    checkHealthRef.current();
    const interval = setInterval(() => {
      checkHealthRef.current();
    }, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sidebarExpanded && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarExpanded]);

  // Load suppliers separately
  const loadSuppliers = React.useCallback(async () => {
    try {
      const suppliersRes = await fetch(`${API_BASE_URL}/suppliers`);
      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        const list = (data && data.length > 0) ? data : DEFAULT_SUPPLIERS;
        setSuppliers(list);
        if (list.length > 0) {
          setSelectedSupplier(prev => prev || list[0]._id);
        }
      } else {
        setSuppliers(DEFAULT_SUPPLIERS);
        setSelectedSupplier(prev => prev || DEFAULT_SUPPLIERS[0]._id);
      }
    } catch (err) {
      console.error("Failed to load suppliers, using default list:", err);
      setSuppliers(DEFAULT_SUPPLIERS);
      setSelectedSupplier(prev => prev || DEFAULT_SUPPLIERS[0]._id);
    }
  }, []);

  const loadSuppliersRef = useRef(loadSuppliers);
  useEffect(() => {
    loadSuppliersRef.current = loadSuppliers;
  }, [loadSuppliers]);

  useEffect(() => {
    loadSuppliersRef.current();
    const interval = setInterval(() => {
      loadSuppliersRef.current();
    }, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);


  // Fetch buyers list using networkService
  const fetchBuyers = async () => {
    try {
      const data = await getBuyers();
      setBuyers(data);
      if (data.length > 0 && !selectedBuyerEmail) {
        setSelectedBuyerEmail(data[0].email || '');
      }
    } catch (err) {
      console.error("Error fetching buyers:", err);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  // Fetch inventory dashboard
  const fetchInventory = async (cycleId?: string) => {
    setInventoryLoading(true);
    const targetCycleId = cycleId !== undefined ? cycleId : selectedCycleId;
    try {
      const url = targetCycleId 
        ? `${API_BASE_URL}/inventory?liquidationCycleId=${targetCycleId}`
        : `${API_BASE_URL}/inventory`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInventoryList(data);
        // Also populate Redux store so modular InventoryListView can read it
        dispatch(fetchInventoryLotsThunk(targetCycleId || undefined) as any);
        if (selectedLotHubId) {
          const target = data.find((l: any) => l._id === selectedLotHubId);
          if (target && (!selectedLot || selectedLot._id !== selectedLotHubId)) {
            openLotOperationsHub(target, false, lotHubSubTab);
          }
        }
      } else {
        console.error(`Inventory API error: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error("Error fetching inventory lots:", err);
    } finally {
      setTimeout(() => setInventoryLoading(false), 500);
    }
  };

  const fetchLiquidationCycles = async (supplierId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/liquidation-cycles?supplierId=${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        setLiquidationCycles(data);
      }
    } catch (err) {
      console.error("Error fetching liquidation cycles:", err);
    }
  };





  const fetchLiquidationAutomations = async (supplierId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/liquidation-automations?supplierId=${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        setAutomationList(data);
      }
    } catch (err) {
      console.error("Error fetching liquidation automations:", err);
    }
  };

  const fetchAllBids = async () => {
    setIsFetchingAllBids(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bids`);
      if (res.ok) {
        const data = await res.json();
        setAllBids(data);
      }
    } catch (err) {
      console.error("Error fetching all bids:", err);
    } finally {
      setIsFetchingAllBids(false);
    }
  };










  useEffect(() => {
    if (selectedSupplier) {
      fetchLiquidationCycles(selectedSupplier);
      fetchLiquidationAutomations(selectedSupplier);
      setSelectedCycleId(''); // Reset selected cycle on supplier switch
    }
  }, [selectedSupplier]);

  // Fetch sales records from backend
  const fetchSalesRecords = async () => {
    setSalesRecordsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sales`);
      if (res.ok) {
        const data = await res.json();
        setSalesRecords(data);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setSalesRecordsLoading(false);
    }
  };



  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'marketplace' || activeTab === 'lot-hub' || activeTab === 'workflows') {
      fetchInventory(selectedCycleId);
      fetchSalesRecords();
    }
  }, [activeTab, selectedCycleId]);

  const openLotOperationsHub = async (lot: any, navigate = true, targetSubTab: 'details' | 'bids' | 'activities' = 'details') => {
    setSelectedLot(lot);
    setSelectedLotForNegotiation(lot);
    setSelectedLotHubId(lot._id);
    setLotHubSubTab(targetSubTab);
    
    setDrawerLoading(true);
    setTxSuccess(false);
    setTxDetails(null);
    setRiskData(null);
    setOpportunityData(null);
    setListingData(null);
    setPricingData(null);
    setBuyerMatches([]);
    setBids([]);

    if (navigate) {
      if (activeTab !== 'lot-hub') {
        setReturnTab(activeTab);
        dispatch(setReturnTabRedux(activeTab as any));
      }
      setActiveTab('lot-hub');
      dispatch(setActiveTabRedux('lot-hub'));
    }

    try {
      // 1. Fetch CRM items
      fetchBids(lot._id);
      fetchNegotiationBids(lot._id);
      fetchLotActivities(lot._id);

      // 2. Assess Risk
      const riskRes = await fetch(`${API_BASE_URL}/inventory/lot/${lot._id}/assess-risk`, {
        method: 'POST'
      });
      if (!riskRes.ok) throw new Error("Failed to assess risk");
      const riskResult = await riskRes.json();
      
      setRiskData(riskResult.risk);
      setOpportunityData(riskResult.opportunity);
      setListingData(riskResult.listing);
      
      setSliderDays(riskResult.risk.daysRemaining);
      setSliderQty(lot.quantityCases);

      // 3. Fetch Initial Pricing
      if (riskResult.opportunity) {
        await fetchPricing(riskResult.opportunity._id, riskResult.risk.daysRemaining, lot.quantityCases);
      }

      // 4. Fetch Matches
      if (riskResult.listing) {
        await fetchMatches(riskResult.listing._id);
      }

    } catch (err) {
      console.error("Error opening lot operations hub:", err);
    } finally {
      setDrawerLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('indSpoilerAlert_activeTab', activeTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    if (activeTab === 'lot-hub' && selectedLotHubId) {
      params.set('lotId', selectedLotHubId);
      params.set('subtab', lotHubSubTab);
    } else {
      params.delete('lotId');
      params.delete('subtab');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, '', newUrl);
  }, [activeTab, selectedLotHubId, lotHubSubTab]);

  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'marketplace' || activeTab === 'lot-hub' || activeTab === 'workflows') {
      fetchInventory();
      fetchSalesRecords();
      fetchAllBids();
    }
    if (activeTab === 'workflows' && selectedSupplier) {
      fetchLiquidationAutomations(selectedSupplier);
    }
  }, [activeTab, selectedSupplier]);



  const handleUpdateLotCompliance = async (lotId: string, updates: { fdaRegulated?: boolean; temperatureMin?: any; temperatureMax?: any }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/lot/${lotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedLot = await res.json();
        setSelectedLot(updatedLot);
        // Also update in inventoryList
        setInventoryList(prev => prev.map(item => item._id === lotId ? { ...item, ...updatedLot } : item));
      } else {
        const err = await res.json();
        alert(`Error updating lot: ${err.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error updating lot: ${err.message}`);
    }
  };

  const handleUploadComplianceDoc = async () => {
    if (!selectedLot || !complianceFile) return;
    setComplianceUploading(true);
    setComplianceError(null);
    try {
      const formData = new FormData();
      formData.append('file', complianceFile);
      formData.append('docType', complianceDocType);

      const res = await fetch(`${API_BASE_URL}/inventory/lot/${selectedLot._id}/compliance`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload compliance document.');
      }

      const doc = await res.json();
      
      // Update selectedLot locally
      const updatedDocs = [...(selectedLot.complianceDocs || []), doc];
      const newSelectedLot = { ...selectedLot, complianceDocs: updatedDocs };
      setSelectedLot(newSelectedLot);
      
      // Update in inventoryList
      setInventoryList(prev => prev.map(item => item._id === selectedLot._id ? { ...item, complianceDocs: updatedDocs } : item));
      
      setComplianceFile(null);
      if (complianceFileInputRef.current) {
        complianceFileInputRef.current.value = '';
      }
      alert('Compliance document uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setComplianceError(err.message || 'An error occurred during file upload.');
    } finally {
      setComplianceUploading(false);
    }
  };

  const _handleSelectLotById = async (id: string) => {
    let lot = inventoryList.find(l => l._id === id);
    if (lot) {
      openLotOperationsHub(lot, true, 'details');
      return;
    }
    // Lot not in current list — fetch fresh data directly
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`);
      if (res.ok) {
        const data = await res.json();
        setInventoryList(data);
        const found = data.find((l: any) => l._id === id);
        if (found) {
          openLotOperationsHub(found, true, 'details');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };






  // Drawer / Detail Functions


  const fetchPricing = async (oppId: string, days: number, qty: number) => {
    setPricingLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/opportunity/${oppId}/pricing/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysRemaining: days, quantity: qty })
      });
      if (res.ok) {
        const pricing = await res.json();
        setPricingData(pricing);
      }
    } catch (err) {
      console.error("Error loading pricing recommendation:", err);
    } finally {
      setPricingLoading(false);
    }
  };

  const fetchMatches = async (listingId: string) => {
    setBuyersLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/marketplace/listing/${listingId}/matches`);
      if (res.ok) {
        const matchesData = await res.json();
        setBuyerMatches(matchesData.matches || []);
      }
    } catch (err) {
      console.error("Error loading buyer matches:", err);
    } finally {
      setBuyersLoading(false);
    }
  };


  const fetchBids = async (lotId: string) => {
    setBidsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids`);
      if (res.ok) {
        const data = await res.json();
        setBids(data.bids || []);
      }
    } catch (err) {
      console.error("Error fetching bids:", err);
    } finally {
      setBidsLoading(false);
    }
  };

  const handleEnableBidding = async (lotToEnable?: any) => {
    const targetLot = lotToEnable || selectedLot;
    if (!targetLot) return;
    setBidsLoading(true);
    try {
      // Auto-assess risk to initialize Opportunity & Listing if they don't exist yet
      if (!targetLot.opportunity || !targetLot.listing) {
        const riskRes = await fetch(`${API_BASE_URL}/inventory/lot/${targetLot._id}/assess-risk`, {
          method: 'POST'
        });
        if (!riskRes.ok) {
          throw new Error("Failed to auto-initialize opportunity and listing.");
        }
      }

      const res = await fetch(`${API_BASE_URL}/inventory/${targetLot._id}/bids/enable`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (targetLot === selectedLot) {
          setListingData(data.listing);
        }
        
        alert("Bidding has been enabled! Simulated buyer bids will arrive in 5 seconds.");
        fetchInventory(); // Refresh lot status list
        
        // Seeded bids arrive in 5 seconds in the backend. Let's fetch them after 5.5 seconds
        setTimeout(() => {
          if (selectedLot && selectedLot._id === targetLot._id) {
            fetchBids(selectedLot._id);
          }
          if (selectedLotForNegotiation && selectedLotForNegotiation._id === targetLot._id) {
            fetchNegotiationBids(targetLot._id);
          }
        }, 5500);

        // Fetch immediately
        if (selectedLot && selectedLot._id === targetLot._id) {
          fetchBids(selectedLot._id);
        }
        if (selectedLotForNegotiation && selectedLotForNegotiation._id === targetLot._id) {
          fetchNegotiationBids(targetLot._id);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error enabling bidding: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("Error enabling bidding:", err);
      alert(`Error: ${err.message || 'Could not enable bidding'}`);
    } finally {
      setBidsLoading(false);
    }
  };

  const evaluateBid = (bidPrice: number, recommendedPrice?: number, standardSellPrice?: number) => {
    const targetPrice = recommendedPrice || 0;
    const stdPrice = standardSellPrice || 0;
    
    if (targetPrice > 0 && bidPrice >= targetPrice * 0.95) {
      return {
        status: 'OPTIMAL',
        label: 'Optimal Yield',
        color: 'hsl(var(--success))',
        bg: 'hsl(var(--success) / 10%)',
        warning: ''
      };
    } else if (stdPrice > 0 && bidPrice >= stdPrice * 0.5) {
      return {
        status: 'ACCEPTABLE',
        label: 'Acceptable Yield',
        color: 'hsl(var(--warning))',
        bg: 'hsl(var(--warning) / 10%)',
        warning: ''
      };
    } else {
      return {
        status: 'LOW_RECOVERY',
        label: 'Low Recovery',
        color: 'hsl(var(--error))',
        bg: 'hsl(var(--error) / 10%)',
        warning: 'This bid recovers less than the tax write-off value of donating. We recommend diverting to Donation instead.'
      };
    }
  };



  const handleAwardBid = async (bidId: string, emailSent: string) => {
    if (!selectedLot) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${selectedLot._id}/bids/${bidId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSent, emailSubject: emailDraftSubject, awardedQty: awardedQtyInput })
      });
      if (res.ok) {
        const txData = await res.json();
        setTxDetails(txData);
        setTxSuccess(true);
        setShowAwardModal(false);
        setVisualizerEmailDetails({
          to: selectedBidToAward?.buyerId?.companyName || 'Retail Buyer',
          subject: emailDraftSubject,
          body: emailSent,
          date: new Date().toLocaleString(),
          previewUrl: txData.emailSentResult?.previewUrl
        });
        setShowEmailSentVisualizer(true);
        fetchInventory(); // Refresh lot status list
        fetchBids(selectedLot._id);
        fetchLotActivities(selectedLot._id);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to award bid.");
      }
    } catch (err: any) {
      console.error("Error awarding bid:", err);
      alert(err.message || "An unexpected error occurred while awarding the bid.");
    } finally {
      setTxLoading(false);
    }
  };

  const _handlePlaceBid = async (listingId: string, quantity: number, price: number) => {
    if (!selectedBuyerEmail) return;
    setListingsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/marketplace/listing/${listingId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerEmail: selectedBuyerEmail,
          quantity,
          price,
          directPurchase: false
        })
      });
      if (res.ok) {
        alert("Your competitive bid has been successfully submitted! It will appear in the Supplier's Bidding Hub.");
        fetchInventory(); // Refresh lot list to show new bids
      }
    } catch (err) {
      console.error("Error submitting bid:", err);
    } finally {
      setListingsLoading(false);
    }
  };

  const _handleBuyerBuyItNow = async (lot: any, pricingData: any, availableQty: number) => {
    if (!selectedBuyerEmail) return;
    setSelectedLot(lot);
    setDrawerLoading(true);
    setTxLoading(true);
    setTxSuccess(false);
    setTxDetails(null);
    try {
      const res = await fetch(`${API_BASE_URL}/marketplace/listing/${lot.listing._id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerEmail: selectedBuyerEmail,
          quantity: availableQty,
          price: pricingData?.price || 0,
          directPurchase: true
        })
      });
      if (res.ok) {
        const txData = await res.json();
        setTxDetails(txData);
        setTxSuccess(true);
        fetchInventory(); // Refresh list
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error executing buy it now: ${errorData.error || 'Unknown error'}`);
        setSelectedLot(null);
      }
    } catch (err) {
      console.error("Error executing buy it now:", err);
      setSelectedLot(null);
    } finally {
      setTxLoading(false);
      setDrawerLoading(false);
    }
  };

  const [negotiationBids, setNegotiationBids] = useState<any[]>([]);
  const [negotiationBidsLoading, setNegotiationBidsLoading] = useState<boolean>(false);

  const [buyersLoading, setBuyersLoading] = useState<boolean>(false);
  const [partialAwardCases, setPartialAwardCases] = useState<number | ''>('');
  const [selectedBidForNegotiation, setSelectedBidForNegotiation] = useState<any | null>(null);
  const [negotiationChatInput, setNegotiationChatInput] = useState<string>('');
  const [counterOfferPrice, setCounterOfferPrice] = useState<number | ''>('');
  const [counterOfferQty, setCounterOfferQty] = useState<number | ''>('');
  const [counterOfferTerms, setCounterOfferTerms] = useState<string>('');

  const handleSuggestPricing = async (lot: any) => {
    const oppId = lot.opportunity?._id || (lot.opportunity as any);
    if (!oppId) return;
    const days = calculateDaysRemaining(lot.expirationDate);
    await fetchPricing(oppId, days, lot.availableQty);
  };

  const handleSendNegotiationMessage = async () => {
    if (!selectedBidForNegotiation || !negotiationChatInput.trim()) return;
    await handleSendNegotiationMsg(selectedBidForNegotiation._id, negotiationChatInput.trim());
    setNegotiationChatInput('');
  };

  const handleSendCounterOffer = async () => {
    if (!selectedBidForNegotiation || counterOfferPrice === '' || counterOfferQty === '') return;
    await handleSendNegotiationMsg(
      selectedBidForNegotiation._id,
      counterOfferTerms || 'Counter offer submitted',
      Number(counterOfferPrice),
      Number(counterOfferQty)
    );
    setCounterOfferPrice('');
    setCounterOfferQty('');
    setCounterOfferTerms('');
  };

  const handleCreateLotActivity = async () => {
    const lotId = selectedLot?._id || selectedLotHubId;
    if (!lotId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedFormType,
          subject: activitySubjectInput || `${selectedFormType.toUpperCase()} Log`,
          content: activityContentInput,
          recipient: activityRecipientInput,
          sender: 'You (Supplier)',
          metadata: { manualLog: true }
        })
      });

      if (res.ok) {
        setActivitySubjectInput('');
        setActivityContentInput('');
        setActivityRecipientInput('');
        fetchLotActivities(lotId);
      } else {
        alert('Failed to log activity.');
      }
    } catch (err) {
      console.error("Error creating activity:", err);
    }
  };

  const handleAwardBidFromHub = (bidId: string, partialCases?: number) => {
    const bidListToSearch = bids.length > 0 ? bids : negotiationBids;
    const bid = bidListToSearch.find(b => b._id === bidId);
    if (!bid || !selectedLot) return;
    
    setSelectedBidToAward(bid);
    setAwardedQtyInput(typeof partialCases === 'number' ? partialCases : bid.quantity);
    setEmailDraftSubject(`Bid Accepted: ${typeof partialCases === 'number' ? partialCases : bid.quantity} cases of ${selectedLot.productId?.description || 'Surplus Products'} (SKU: ${selectedLot.productId?.sku})`);
    setEmailDraftBody(`Dear ${bid.buyerId?.companyName || 'Retail Buyer'} Operations Team,

We are pleased to inform you that your bid on the following surplus inventory listing has been accepted:

- Product: ${selectedLot.productId?.description || 'Surplus Product'} (SKU: ${selectedLot.productId?.sku})
- Quantity Awarded: ${typeof partialCases === 'number' ? partialCases : bid.quantity} cases
- Price per Case: $${bid.price.toFixed(2)}
- Total Value: $${((typeof partialCases === 'number' ? partialCases : bid.quantity) * bid.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}

Pickup Location Details:
- Address: ${selectedLot.distributionCenterId?.address || 'Chicago DC Logistics Depot'}
- Storage Type: ${selectedLot.distributionCenterId?.coldStorage ? 'Refrigerated (35-40°F)' : 'Ambient'}

Our logistics partner has automatically scheduled a shipment carrier for this pickup. 
Please coordinate the pickup date and time with our logistics office (info@indspoileralertlogistics.com) referencing the above product description.

Best regards,
${selectedLot.supplierId?.name || 'CPG Supplier'} Operations Team`);
    setShowAwardModal(true);
  };

  const handleUpdateProductAllergens = async (productId: string, newAllergens: string[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/allergens`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergens: newAllergens })
      });
      if (res.ok) {
        const updatedProduct = await res.json();
        if (selectedLot && selectedLot.productId?._id === productId) {
          setSelectedLot({
            ...selectedLot,
            productId: {
              ...selectedLot.productId,
              allergens: updatedProduct.allergens
            }
          });
        }
        setInventoryList(prev => prev.map(item => {
          if (item.productId?._id === productId) {
            return {
              ...item,
              productId: {
                ...item.productId,
                allergens: updatedProduct.allergens
              }
            };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error("Error updating product allergens:", err);
    }
  };



  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [expandedBidId, negotiationBids, isTypingSimulated]);

  const fetchNegotiationBids = async (lotId: string) => {
    setNegotiationBidsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids`);
      if (res.ok) {
        const data = await res.json();
        setNegotiationBids(data.bids || []);
      } else {
        setNegotiationBids([]);
      }
    } catch (err) {
      console.error("Error fetching negotiation bids:", err);
      setNegotiationBids([]);
    } finally {
      setNegotiationBidsLoading(false);
    }
  };

  const fetchLotActivities = async (lotId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setLotActivities(data);
      }
    } catch (err) {
      console.error("Error fetching lot activities:", err);
    }
  };

  const handleSendNegotiationMsg = async (bidId: string, messageText: string, proposedPrice?: number, proposedQuantity?: number) => {
    let content = messageText;
    if (!content.trim() && (proposedPrice !== undefined || proposedQuantity !== undefined)) {
      const parts = [];
      if (proposedPrice !== undefined) parts.push(`price $${proposedPrice.toFixed(2)}/cs`);
      if (proposedQuantity !== undefined) parts.push(`quantity ${proposedQuantity} cases`);
      content = `Proposing counter-offer: ${parts.join(' and ')}.`;
    }
    if (!content.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/offers/${bidId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'supplier',
          content,
          proposedPrice,
          proposedQuantity
        })
      });
      if (res.ok) {
        const updatedBid = await res.json();
        
        // Update negotiation bids state locally
        setNegotiationBids(prev => prev.map(b => b._id === bidId ? updatedBid : b));
        setNegotiationChatInput('');
        setCounterOfferPrice('');
        setCounterOfferQty('');
        
        // Show simulated typing effect for response
        setIsTypingSimulated(true);
        setTimeout(() => {
          setIsTypingSimulated(false);
        }, 1000);
        
        // Refresh inventory to ensure prices/status are synchronized
        fetchInventory();
      }
    } catch (err) {
      console.error("Error sending negotiation message:", err);
    }
  };



  const handleDonate = async () => {
    if (!selectedLot) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${selectedLot._id}/donate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setTxDetails({
          donation: data.donation,
          lotStatus: data.lotStatus,
          logs: data.logs
        });
        setTxSuccess(true);
        fetchInventory();
      }
    } catch (err) {
      console.error("Error donating lot:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleRecycle = async () => {
    if (!selectedLot) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${selectedLot._id}/recycle`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setTxDetails({
          disposal: data.disposal,
          lotStatus: data.lotStatus,
          logs: data.logs
        });
        setTxSuccess(true);
        fetchInventory();
      }
    } catch (err) {
      console.error("Error recycling lot:", err);
    } finally {
      setTxLoading(false);
    }
  };



  const handleSliderDaysChange = (val: number) => {
    setSliderDays(val);
  };

  const handleSliderQtyChange = (val: number) => {
    setSliderQty(val);
  };

  const handleSlidersCommit = () => {
    if (opportunityData) {
      fetchPricing(opportunityData._id, sliderDays, sliderQty);
    }
  };

  const handlePurchase = async (buyerId: string) => {
    if (!listingData || !pricingData) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/marketplace/listing/${listingData._id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId,
          quantity: sliderQty,
          price: pricingData.recommendedPrice,
          directPurchase: true
        })
      });
      if (res.ok) {
        const txData = await res.json();
        setTxDetails(txData);
        setTxSuccess(true);
        fetchInventory(); // Refresh lot status list
      } else {
        console.error("Failed to execute direct purchase");
      }
    } catch (err) {
      console.error("Error executing purchase:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const calculateDaysRemaining = (expDateString: string) => {
    const expDate = new Date(expDateString);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };



  const getPricingForDay = (t: number, qty: number, originalPrice: number, category: string) => {
    const elasticities: Record<string, number> = {
      "Dairy": -1.8,
      "Produce": -2.2,
      "Meat": -2.0,
      "Dry Goods": -1.2,
      "Beverages": -1.5
    };
    const elasticity = elasticities[category] || -1.5;
    const k = 4.0 * Math.abs(elasticity);

    let bestDiscount = 0.05;
    let maxRev = -1;
    const d_half = Math.max(0.1, Math.min(0.8, 0.8 - 0.7 * (t / 30.0)));

    for (let d = 0.05; d <= 0.95; d += 0.01) {
      const price = originalPrice * (1.0 - d);
      let sellThrough = 1.0 / (1.0 + Math.exp(-k * (d - d_half)));
      if (qty > 500) sellThrough *= 0.90;
      else if (qty > 100) sellThrough *= 0.95;
      sellThrough = Math.min(0.99, Math.max(0.01, sellThrough));
      const revenue = qty * price * sellThrough;
      if (revenue > maxRev) {
        maxRev = revenue;
        bestDiscount = d;
      }
    }

    const price = originalPrice * (1.0 - bestDiscount);
    return { discount: bestDiscount, price, revenue: maxRev };
  };

  const renderPricingPlot = () => {
    if (!selectedLot) return null;
    const originalPrice = selectedLot.costPerCase || 0;
    const category = selectedLot.productId?.category || "Dry Goods";
    
    // Generate data points
    const points: { t: number; price: number; revenue: number }[] = [];
    const maxDays = 45;
    let maxRev = 0.01;
    
    for (let t = 0; t <= maxDays; t += 5) {
      const res = getPricingForDay(t, sliderQty, originalPrice, category);
      points.push({ t, price: res.price, revenue: res.revenue });
      if (res.revenue > maxRev) {
        maxRev = res.revenue;
      }
    }
    
    // SVG Dimensions
    const width = 360;
    const height = 150;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;
    
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    
    // Map data points to SVG coordinates
    const getX = (t: number) => paddingLeft + (t / maxDays) * plotWidth;
    const getYPrice = (price: number) => paddingBottom + plotHeight - (price / (originalPrice || 1)) * plotHeight + paddingTop;
    const getYRev = (rev: number) => paddingBottom + plotHeight - (rev / maxRev) * plotHeight + paddingTop;
    
    // Build path strings
    let pricePath = "";
    let revPath = "";
    
    points.forEach((pt, idx) => {
      const x = getX(pt.t);
      const yP = getYPrice(pt.price);
      const yR = getYRev(pt.revenue);
      
      if (idx === 0) {
        pricePath = `M ${x} ${yP}`;
        revPath = `M ${x} ${yR}`;
      } else {
        pricePath += ` L ${x} ${yP}`;
        revPath += ` L ${x} ${yR}`;
      }
    });
    
    // Current slider days X coordinate
    const currentX = getX(sliderDays);
    
    return (
      <div className="pricing-plot-container" style={{ marginTop: '20px', padding: '16px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'hsl(var(--text-secondary))', display: 'flex', justifyContent: 'space-between' }}>
          <span>Cleared Price & Yield Decay Curves</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'hsl(var(--text-muted))' }}>X-Axis: Days to Expiry</span>
        </h5>
        
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + plotHeight} stroke="hsl(var(--border-color))" strokeDasharray="2,2" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight} stroke="hsl(var(--border-color))" />
          <line x1={paddingLeft + plotWidth} y1={paddingTop} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight} stroke="hsl(var(--border-color))" strokeDasharray="2,2" />
          
          {/* Horizontal grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft + plotWidth} y2={paddingTop} stroke="hsl(var(--border-color))" strokeOpacity="0.3" strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight / 2} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight / 2} stroke="hsl(var(--border-color))" strokeOpacity="0.3" strokeDasharray="3,3" />
          
          {/* Price curve (Cyan) */}
          <path d={pricePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Revenue curve (Green) */}
          <path d={revPath} fill="none" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Current Days Dotted Line */}
          <line x1={currentX} y1={paddingTop} x2={currentX} y2={paddingTop + plotHeight} stroke="hsl(var(--warning))" strokeWidth="1.5" strokeDasharray="3,3" />
          
          {/* Current Position Marker Dot for Price */}
          {pricingData && (
            <>
              <circle cx={currentX} cy={getYPrice(pricingData.recommendedPrice)} r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5" />
              <circle cx={currentX} cy={getYRev(pricingData.expectedRevenue)} r="5" fill="hsl(var(--success))" stroke="white" strokeWidth="1.5" />
            </>
          )}
          
          {/* Axes labels */}
          <text x={paddingLeft} y={paddingTop + plotHeight + 15} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="middle">0d</text>
          <text x={paddingLeft + plotWidth / 2} y={paddingTop + plotHeight + 15} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="middle">22d</text>
          <text x={paddingLeft + plotWidth} y={paddingTop + plotHeight + 15} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="middle">45d</text>
          
          {/* Y Axis labels */}
          <text x={paddingLeft - 8} y={paddingTop + 4} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="end">${(originalPrice || 0).toFixed(0)}</text>
          <text x={paddingLeft - 8} y={paddingTop + plotHeight + 4} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="end">$0</text>
        </svg>
        
        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', backgroundColor: 'hsl(var(--primary))', borderRadius: '2px' }} />
            <span style={{ color: 'hsl(var(--text-secondary))' }}>Unit Price ($)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', backgroundColor: 'hsl(var(--success))', borderRadius: '2px' }} />
            <span style={{ color: 'hsl(var(--text-secondary))' }}>Expected Yield ($)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '0px', borderTop: '2px dotted hsl(var(--warning))' }} />
            <span style={{ color: 'hsl(var(--text-secondary))' }}>Current ({sliderDays}d)</span>
          </div>
        </div>
      </div>
    );
  };

  // Auth gate — wait for Firebase to resolve session, then show landing or platform
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'hsl(var(--bg-main))',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light, var(--primary))))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>⚡</div>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem', margin: 0 }}>Loading IndSpoiler Alert…</p>
      </div>
    );
  }

  if (!isAuthenticated || forceLanding) {
    return (
      <>
        <ThemeToggle />
        <PublicLandingPage
          onAuthenticated={() => {
            setForceLanding(false);
            const hasSupplier = Boolean(user?.profiles?.supplier ?? true);
            if (hasSupplier) {
              setActiveTab('ingestion');
            } else {
              setActiveTab('marketplace');
            }
            if (typeof window !== 'undefined' && (window.location.search.includes('landing') || window.location.search.includes('view='))) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Top Right Moon/Sun Theme Toggle */}
      <ThemeToggle />
      {/* Sidebar Navigation */}
      <aside ref={sidebarRef as any} className={`sidebar ${sidebarExpanded ? '' : 'collapsed'}`} onClick={!sidebarExpanded ? () => setSidebarExpanded(true) : undefined}>
        <div className="brand" onClick={(e) => { e.stopPropagation(); setSidebarExpanded(!sidebarExpanded); }}>
          <div className="brand-icon">⚡</div>
          <span className="brand-name">IndSpoiler Alert</span>
          {sidebarExpanded && (
            <button className="sidebar-toggle-btn" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '0.8rem', padding: '4px', display: 'flex', alignItems: 'center' }} title="Collapse Sidebar">
              ◀
            </button>
          )}
        </div>
        
        {(() => {
          const effectiveTab = activeTab === 'lot-hub' ? (returnTab || 'inventory') : activeTab;
          return (
        <nav>
          <ul className="nav-links">
            {isSupplier && (
              <>
                <li 
                  className={`nav-link ${effectiveTab === 'ingestion' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('ingestion');
                    dispatch(setActiveTabRedux('ingestion'));
                    setSelectedLot(null);
                  }}
                >
                  <FileText size={18} />
                  <span>Ingestion Engine</span>
                </li>
                <li 
                  className={`nav-link ${effectiveTab === 'inventory' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('inventory');
                    dispatch(setActiveTabRedux('inventory'));
                    setSelectedLot(null);
                  }}
                >
                  <List size={18} />
                  <span>Insight</span>
                </li>

                <li 
                  className={`nav-link ${effectiveTab === 'workflows' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('workflows');
                    dispatch(setActiveTabRedux('workflows'));
                    setSelectedLot(null);
                  }}
                >
                  <Cpu size={18} />
                  <span>Workflow Setup</span>
                </li>
              </>
            )}

            <li 
              className={`nav-link ${effectiveTab === 'marketplace' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('marketplace');
                dispatch(setActiveTabRedux('marketplace'));
                setSelectedLot(null);
              }}
            >
              <ShoppingBag size={18} />
              <span>Buyer Marketplace</span>
            </li>
            {SHOW_DISTRESSED_ANALYTICS && (
              <li 
                className={`nav-link ${effectiveTab === 'analytics' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('analytics');
                  dispatch(setActiveTabRedux('analytics'));
                  setSelectedLot(null);
                }}
              >
                <BarChart3 size={18} />
                <span>Distressed Analytics</span>
              </li>
            )}
            {SHOW_FREIGHT_LOGISTICS && (
              <li 
                className={`nav-link ${effectiveTab === 'logistics' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('logistics');
                  dispatch(setActiveTabRedux('logistics'));
                  setSelectedLot(null);
                }}
              >
                <Truck size={18} />
                <span>Freight Logistics</span>
              </li>
            )}
            <li 
              className={`nav-link ${effectiveTab === 'inbox' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('inbox');
                dispatch(setActiveTabRedux('inbox'));
                setSelectedLot(null);
              }}
            >
              <Inbox size={18} />
              <span>Inbox</span>
            </li>
            <li 
              className={`nav-link ${effectiveTab === 'settings' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('settings');
                dispatch(setActiveTabRedux('settings'));
                setSelectedLot(null);
              }}
            >
              <Users size={18} />
              <span>Settings</span>
            </li>
          </ul>
        </nav>
          );
        })()}


        {/* System Health Indicators & User Profile */}
        <div className="sidebar-health-status" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: backendHealthy ? 'hsl(var(--success))' : 'hsl(var(--error))' 
            }} title={`MongoDB Connection: ${backendHealthy ? 'Connected' : 'Offline'}`} />
            <span className="health-text">MongoDB: {backendHealthy ? 'Connected' : 'Offline'}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: sidecarHealthy ? 'hsl(var(--success))' : 'hsl(var(--error))' 
            }} title={`FastAPI Sidecar: ${sidecarHealthy ? 'Online' : 'Offline'}`} />
            <span className="health-text">FastAPI: {sidecarHealthy ? 'Online' : 'Offline'}</span>
          </div>

          {user && (
            <div style={{ paddingTop: '10px', borderTop: '1px solid hsl(var(--border-color))', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <button
                onClick={() => {
                  logout();
                  setForceLanding(true);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid hsl(var(--border-color))',
                  backgroundColor: 'hsl(var(--destructive) / 10%)',
                  color: 'hsl(var(--destructive))',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                Sign Out / Public Landing
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        
        {/* Tab 1: Ingestion Engine */}
        {activeTab === 'ingestion' && (
          <React.Suspense fallback={<div className="loader-container" style={{ minHeight: '300px' }}><div className="loader" /><p>Loading Surplus Ingestion Pipeline...</p></div>}>
            <IngestionView onOpenLotHub={openLotOperationsHub} />
          </React.Suspense>
        )}

        {/* Tab 5: Inventory List View & Liquidation */}
        {activeTab === 'inventory' && (
          <React.Suspense fallback={<div className="loader-container" style={{ minHeight: '300px' }}><div className="loader" /><p>Loading Insight View...</p></div>}>
            <InventoryListView onOpenLotHub={openLotOperationsHub} />
          </React.Suspense>
        )}


      {/* Tab 3: Distressed Analytics (Hidden for base release; enable via SHOW_DISTRESSED_ANALYTICS flag) */}
      {SHOW_DISTRESSED_ANALYTICS && activeTab === 'analytics' && (
        <React.Suspense fallback={<div className="loader-container" style={{ minHeight: '300px' }}><div className="loader" /><p>Loading Analytics View...</p></div>}>
          <AnalyticsView />
        </React.Suspense>
      )}

        {activeTab === 'marketplace' && (
          <MarketplaceLayout>
            <React.Suspense fallback={<div className="p-12 text-center text-slate-400">Loading marketplace landing page...</div>}>
              <MarketplaceLandingView
                onOpenBidModal={(listing) => {
                  const lot = inventoryList.find(item => item._id === listing._id || (item.listing && item.listing._id === listing._id));
                  if (lot) setSelectedLot(lot);
                }}
                apiBaseUrl={API_BASE_URL}
              />
            </React.Suspense>
          </MarketplaceLayout>
        )}

        {/* Freight Logistics (Hidden for base release; enable via SHOW_FREIGHT_LOGISTICS flag) */}
        {SHOW_FREIGHT_LOGISTICS && activeTab === 'logistics' && (
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>Loading Logistics...</div>}>
            <LogisticsView />
          </React.Suspense>
        )}

        {activeTab === 'inbox' && (
          <EmailsHubView
            supplierId={selectedSupplier || '60c72b2f9b1d8b0015f8e001'}
            accountName={suppliers.find(s => s._id === selectedSupplier)?.name}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView supplierId={selectedSupplier || '60c72b2f9b1d8b0015f8e001'} />
        )}

        {quickBidToken && (
          <QuickBidModal token={quickBidToken} onClose={() => setQuickBidToken(null)} />
        )}


        {activeTab === 'workflows' && (
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>Loading Workflows Studio...</div>}>
            <WorkflowsView
              supplierId={selectedSupplier}
              inventoryLots={inventoryList}
              buyers={buyers}
              onSelectLot={(lot: any) => {
                const id = lot?._id?.toString() || lot?.id;
                setSelectedLotHubId(id);
                setLotHubSubTab('bids');
                setActiveTab('lot-hub');
              }}
            />
          </React.Suspense>
        )}

        {/* Tab 7: Lot Operations Hub (Full Page SPA View) */}
        {activeTab === 'lot-hub' && (
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>Loading Lot Operations Hub...</div>}>
            <LotOperationsHubView
              lot={selectedLot || inventoryList.find(l => l._id === selectedLotHubId)}
              onBack={() => {
                const targetTab = (returnTab || 'inventory') as any;
                setActiveTab(targetTab);
                dispatch(setActiveTabRedux(targetTab));
                setSelectedLot(null);
                setSelectedLotHubId(null);
              }}
              subTab={lotHubSubTab}
              setSubTab={setLotHubSubTab}
              onEnableBidding={handleEnableBidding}
              onDonate={handleDonate}
              onRecycle={handleRecycle}
              drawerLoading={drawerLoading}
              txSuccess={txSuccess}
              txDetails={txDetails}
              riskProfile={riskData}
              handleSuggestPricing={handleSuggestPricing}
              suggestingPricing={pricingLoading}
              recommendedBuyers={buyerMatches}
              buyersLoading={buyersLoading}
              complianceFile={complianceFile}
              setComplianceFile={setComplianceFile}
              handleUploadComplianceDoc={handleUploadComplianceDoc}
              handleUpdateLotCompliance={handleUpdateLotCompliance}
              bidsList={bids}
              expandedBidId={expandedBidId}
              setExpandedBidId={setExpandedBidId}
              handleAwardBid={handleAwardBidFromHub}
              awardingBidId={txLoading && selectedBidToAward ? selectedBidToAward._id : null}
              partialAwardCases={partialAwardCases}
              setPartialAwardCases={setPartialAwardCases}
              negotiationBids={negotiationBids}
              negotiationBidsLoading={negotiationBidsLoading}
              selectedBidForNegotiation={selectedBidForNegotiation}
              setSelectedBidForNegotiation={setSelectedBidForNegotiation}
              negotiationChatInput={negotiationChatInput}
              setNegotiationChatInput={setNegotiationChatInput}
              handleSendNegotiationMessage={handleSendNegotiationMessage}
              counterOfferPrice={counterOfferPrice}
              setCounterOfferPrice={setCounterOfferPrice}
              counterOfferQty={counterOfferQty}
              setCounterOfferQty={setCounterOfferQty}
              handleSendCounterOffer={handleSendCounterOffer}
              sliderDays={sliderDays}
              setSliderDays={setSliderDays}
              sliderQty={sliderQty}
              setSliderQty={setSliderQty}
              onSlidersCommit={handleSlidersCommit}
              pricingData={pricingData}
              handleUpdateProductAllergens={handleUpdateProductAllergens}
              lotActivities={lotActivities}
              activityFilter={activeActivityFilter}
              setActivityFilter={(val) => setActiveActivityFilter(val as any)}
              activityTypeInput={selectedFormType}
              setActivityTypeInput={(type: any) => setSelectedFormType(type)}
              activityContentInput={activityContentInput}
              setActivityContentInput={setActivityContentInput}
              handleCreateLotActivity={handleCreateLotActivity}
            />
          </React.Suspense>
        )}

      </main>

      {/* Detail Drawer Sidebar & Overlay */}
      {false && (
        <>
          <div className="drawer-backdrop" onClick={() => setSelectedLot(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>{selectedLot.productId?.description}</h3>
                <span className="lot-sku" style={{ fontSize: '0.8rem' }}>Lot #: {selectedLot.lotNumber}</span>
              </div>
              <button className="drawer-close" onClick={() => setSelectedLot(null)}>
                <X size={20} />
              </button>
            </div>

            {drawerLoading ? (
              <div className="loader-container" style={{ margin: 'auto' }}>
                <div className="loader" />
                <p>Analyzing lot risk profile...</p>
              </div>
            ) : txSuccess && txDetails ? (
              /* Success / Transaction log view */
              <div className="success-overlay" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyItems: 'flex-start', height: '100%', padding: '24px' }}>
                <div className="success-icon" style={{ flexShrink: 0 }}>✓</div>
                <h2 style={{ color: 'hsl(var(--success))', fontSize: '1.4rem', flexShrink: 0 }}>
                  {txDetails.donation ? 'Donation Initiated' : txDetails.disposal ? 'Recycling Scheduled' : 'Transaction Completed'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '8px', flexShrink: 0 }}>
                  {txDetails.donation 
                    ? 'The distressed surplus batch has been diverted to registered charity networks.'
                    : txDetails.disposal 
                      ? 'The distressed surplus batch has been scheduled for ecological processing.'
                      : 'The surplus batch was successfully awarded and routes have been established in the dispatch system.'
                  }
                </p>

                <div className="success-details" style={{ flexShrink: 0, margin: '8px 0' }}>
                  {txDetails.donation && (
                    <>
                      <div><strong>Donation ID:</strong> {txDetails.donation._id}</div>
                      <div><strong>Food Bank:</strong> {txDetails.donation.foodBankName}</div>
                      <div><strong>Quantity Diverted:</strong> {txDetails.donation.quantity} Cases</div>
                      <div><strong>Estimated Tax Benefit:</strong> ${txDetails.donation.taxBenefit.toFixed(2)}</div>
                      <div><strong>Landfill Avoided:</strong> {txDetails.donation.landfillAvoided} Tons</div>
                      <div><strong>CO2 Saved:</strong> {txDetails.donation.co2Saved} Tons</div>
                    </>
                  )}
                  {txDetails.disposal && (
                    <>
                      <div><strong>Disposal ID:</strong> {txDetails.disposal._id}</div>
                      <div><strong>Facility:</strong> {txDetails.disposal.facility}</div>
                      <div><strong>Method:</strong> {txDetails.disposal.method.toUpperCase()}</div>
                      <div><strong>Recycling Fee:</strong> ${txDetails.disposal.recyclingFee.toFixed(2)}</div>
                      <div><strong>Landfill Fee Avoided:</strong> ${txDetails.disposal.landfillFee.toFixed(2)}</div>
                    </>
                  )}
                  {!txDetails.donation && !txDetails.disposal && (
                    <>
                      <div><strong>Offer ID:</strong> {txDetails.offer?._id}</div>
                      <div><strong>Award ID:</strong> {txDetails.award?._id}</div>
                      <div><strong>Shipment ID:</strong> {txDetails.shipment?._id}</div>
                      <div><strong>Carrier Assigned:</strong> {txDetails.shipment?.carrier}</div>
                      <div><strong>Temp Constraint:</strong> {txDetails.shipment?.temperature}</div>
                      <div><strong>Pickup DC:</strong> {txDetails.shipment?.pickupLocation}</div>
                      <div><strong>Delivery Location:</strong> {txDetails.shipment?.deliveryLocation}</div>
                    </>
                  )}
                  <div><strong>Inventory Status:</strong> {txDetails.lotStatus?.toUpperCase()}</div>
                </div>

                {/* Logistics logs milestones */}
                {txDetails.logs && txDetails.logs.length > 0 && (
                  <div style={{ width: '100%', textAlign: 'left', margin: '12px 0', padding: '12px', backgroundColor: 'hsl(var(--bg-main) / 50%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', flexShrink: 0 }}>
                    <h5 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '8px', fontWeight: 600 }}>Logistical Milestones</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {txDetails.logs.map((log: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                          <span style={{ color: 'hsl(var(--success))' }}>✦</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: 'auto', flexShrink: 0 }}
                  onClick={() => setSelectedLot(null)}
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              /* Drawer standard configuration panels */
              <div className="drawer-body">
                
                {/* Section 1: Risk Assessment */}
                {riskData && (
                  <div className="drawer-section">
                    <h4 className="section-title">
                      <ShieldAlert size={18} style={{ color: riskData.riskCategory === 'critical' || riskData.riskCategory === 'high' ? 'hsl(var(--error))' : 'hsl(var(--primary))' }} />
                      <span>Distressed Risk Assessment</span>
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
                      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: riskData.riskCategory === 'critical' ? 'hsl(var(--error))' : 'hsl(var(--warning))' }}>
                          {riskData.riskScore}%
                        </div>
                        <span className="mapping-title" style={{ marginTop: '4px' }}>Risk Score</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                        <div><strong>Risk Class:</strong> <span className={`badge ${riskData.riskCategory === 'critical' ? 'countdown-red' : 'countdown-orange'}`}>{riskData.riskCategory.toUpperCase()}</span></div>
                        <div><strong>Days Remaining:</strong> {riskData.daysRemaining} days</div>
                        <div><strong>Sales Velocity Index:</strong> {riskData.velocityScore} / 100</div>
                        <div><strong>Predicted Waste:</strong> {riskData.predictedWaste} Cases</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 1.5: Product Allergen Information */}
                <div className="drawer-section">
                  <h4 className="section-title">
                    <AlertTriangle size={18} style={{ color: 'hsl(var(--warning))' }} />
                    <span>Product Allergens & Traceability</span>
                  </h4>
                  
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ display: 'block', marginBottom: '6px' }}>Active Allergens:</strong>
                      {selectedLot.productId?.allergens && selectedLot.productId.allergens.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {selectedLot.productId.allergens.map((allergen: string) => (
                            <span 
                              key={allergen} 
                              className="badge" 
                              style={{ 
                                backgroundColor: 'hsl(var(--warning) / 10%)', 
                                color: 'hsl(var(--warning))', 
                                border: '1px solid hsl(var(--warning) / 30%)',
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                textTransform: 'capitalize',
                                cursor: 'pointer'
                              }}
                              title="Click to remove allergen"
                              onClick={async () => {
                                const newAllergens = selectedLot.productId.allergens.filter((a: string) => a !== allergen);
                                try {
                                  const res = await fetch(`${API_BASE_URL}/products/${selectedLot.productId._id}/allergens`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ allergens: newAllergens })
                                  });
                                  if (res.ok) {
                                    const updatedProduct = await res.json();
                                    setSelectedLot({
                                      ...selectedLot,
                                      productId: {
                                        ...selectedLot.productId,
                                        allergens: updatedProduct.allergens
                                      }
                                    });
                                    setInventoryList(prev => prev.map(item => {
                                      if (item.productId?._id === selectedLot.productId._id) {
                                        return {
                                          ...item,
                                          productId: {
                                            ...item.productId,
                                            allergens: updatedProduct.allergens
                                          }
                                        };
                                      }
                                      return item;
                                    }));
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            >
                              {allergen} ✕
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>None declared</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Add allergen (e.g. milk, soy)..."
                        id="new-allergen-input"
                        style={{ 
                          flex: 1, 
                          padding: '6px 10px', 
                          fontSize: '0.8rem', 
                          borderRadius: '6px', 
                          border: '1px solid hsl(var(--border-color))',
                          backgroundColor: 'hsl(var(--bg-main))',
                          color: 'hsl(var(--text-main))'
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            const allergen = input.value.trim().toLowerCase();
                            if (allergen) {
                              const currentAllergens = selectedLot.productId?.allergens || [];
                              if (!currentAllergens.includes(allergen)) {
                                const newAllergens = [...currentAllergens, allergen];
                                try {
                                  const res = await fetch(`${API_BASE_URL}/products/${selectedLot.productId._id}/allergens`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ allergens: newAllergens })
                                  });
                                  if (res.ok) {
                                    const updatedProduct = await res.json();
                                    setSelectedLot({
                                      ...selectedLot,
                                      productId: {
                                        ...selectedLot.productId,
                                        allergens: updatedProduct.allergens
                                      }
                                    });
                                    setInventoryList(prev => prev.map(item => {
                                      if (item.productId?._id === selectedLot.productId._id) {
                                        return {
                                          ...item,
                                          productId: {
                                            ...item.productId,
                                            allergens: updatedProduct.allergens
                                          }
                                        };
                                      }
                                      return item;
                                    }));
                                    input.value = '';
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 1.6: FDA Compliance & Document Vault */}
                <div className="drawer-section">
                  <h4 className="section-title">
                    <ShieldCheck size={18} style={{ color: 'hsl(var(--primary))' }} />
                    <span>FDA Compliance & Document Vault</span>
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                    
                    {/* FDA Regulated Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'hsl(var(--bg-main) / 30%)', padding: '10px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                      <div>
                        <strong style={{ display: 'block' }}>FDA Regulated Lot</strong>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                          Regulated lots require both COA and Batch Record to activate.
                        </span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={!!selectedLot.fdaRegulated}
                        onChange={(e) => handleUpdateLotCompliance(selectedLot._id, { fdaRegulated: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Temperature Thresholds */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="filter-input-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Min Temperature (°F)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 32"
                          className="filter-search"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          value={selectedLot.temperatureMin ?? ''}
                          onChange={(e) => handleUpdateLotCompliance(selectedLot._id, { temperatureMin: e.target.value })}
                        />
                      </div>
                      <div className="filter-input-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Max Temperature (°F)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 40"
                          className="filter-search"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          value={selectedLot.temperatureMax ?? ''}
                          onChange={(e) => handleUpdateLotCompliance(selectedLot._id, { temperatureMax: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Upload Compliance Document */}
                    <div style={{ border: '1px dashed hsl(var(--border-color))', borderRadius: '8px', padding: '12px', backgroundColor: 'hsl(var(--bg-main) / 10%)' }}>
                      <h5 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>Upload Compliance Document</h5>
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select 
                          className="filter-select"
                          style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                          value={complianceDocType}
                          onChange={(e) => setComplianceDocType(e.target.value as any)}
                        >
                          <option value="COA">Certificate of Analysis (COA)</option>
                          <option value="BATCH_RECORD">Batch Record (BATCH_RECORD)</option>
                          <option value="FSMA_ATTESTATION">FSMA Attestation</option>
                          <option value="ORGANIC_CERT">Organic Certificate</option>
                        </select>

                        <button 
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                          onClick={() => complianceFileInputRef.current?.click()}
                        >
                          Choose PDF
                        </button>
                      </div>

                      <input 
                        type="file"
                        accept=".pdf"
                        ref={complianceFileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setComplianceFile(file);
                        }}
                      />

                      {complianceFile && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', padding: '6px 8px', backgroundColor: 'hsl(var(--bg-main) / 50%)', borderRadius: '4px', border: '1px solid hsl(var(--border-color))' }}>
                          <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            📄 {complianceFile?.name}
                          </span>
                          <button 
                            className="btn btn-sm btn-primary"
                            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                            onClick={handleUploadComplianceDoc}
                            disabled={complianceUploading}
                          >
                            {complianceUploading ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>
                      )}

                      {complianceError && (
                        <div style={{ color: 'hsl(var(--error))', fontSize: '0.75rem', marginTop: '6px' }}>
                          ❌ {complianceError}
                        </div>
                      )}
                    </div>

                    {/* Uploaded Documents List */}
                    <div>
                      <h5 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Vault Documents</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(selectedLot.complianceDocs && selectedLot.complianceDocs.length > 0) ? (
                          selectedLot.complianceDocs.map((doc: any, idx: number) => {
                            const isObj = typeof doc === 'object' && doc !== null;
                            const docType = isObj ? doc.docType : 'Document';
                            const s3Url = isObj ? doc.s3Url : '#';
                            const verified = isObj ? doc.verified : true;
                            const name = isObj ? s3Url.substring(s3Url.lastIndexOf('/') + 1) : `doc-${idx}.pdf`;
                            
                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'hsl(var(--bg-main) / 20%)', borderRadius: '6px', border: '1px solid hsl(var(--border-color))' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{docType}</span>
                                  <a 
                                    href={s3Url}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.7rem', color: 'hsl(var(--primary))', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', display: 'block' }}
                                    title={name}
                                  >
                                    View Document
                                  </a>
                                </div>
                                <span className={`badge ${verified ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                  {verified ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', fontStyle: 'italic', padding: '4px' }}>
                            No compliance documents in vault.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section 2: Yield Pricing Simulator */}
                <div className="drawer-section">
                  <h4 className="section-title">
                    <Cpu size={18} style={{ color: 'hsl(var(--primary))' }} />
                    <span>Dynamic Yield Pricing Simulator</span>
                  </h4>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>Shelf Life (Days Left)</span>
                      <strong style={{ color: 'hsl(var(--primary))' }}>{sliderDays} Days</strong>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="45" 
                      value={sliderDays}
                      onChange={(e) => handleSliderDaysChange(Number(e.target.value))}
                      onMouseUp={handleSlidersCommit}
                      onTouchEnd={handleSlidersCommit}
                      className="slider-control"
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>Liquidation Volume (Cases)</span>
                      <strong style={{ color: 'hsl(var(--primary))' }}>{sliderQty} Cases</strong>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max={selectedLot.quantityCases} 
                      value={sliderQty}
                      onChange={(e) => handleSliderQtyChange(Number(e.target.value))}
                      onMouseUp={handleSlidersCommit}
                      onTouchEnd={handleSlidersCommit}
                      className="slider-control"
                    />
                  </div>

                  {pricingLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                      <div className="loader" />
                    </div>
                  ) : pricingData ? (
                    <>
                      <div className="pricing-metrics">
                        <div className="pricing-kpi">
                          <span className="detail-label" style={{ fontSize: '0.75rem' }}>Suggested Discount</span>
                          <div className="kpi-num">{(pricingData.recommendedDiscount * 100).toFixed(0)}%</div>
                        </div>
                        
                        <div className="pricing-kpi">
                          <span className="detail-label" style={{ fontSize: '0.75rem' }}>Liquidation Unit Price</span>
                          <div className="kpi-num">${pricingData.recommendedPrice.toFixed(2)}</div>
                        </div>

                        <div className="pricing-kpi">
                          <span className="detail-label" style={{ fontSize: '0.75rem' }}>Est. Sell-Through</span>
                          <div className="kpi-num">{(pricingData.expectedSellThrough * 100).toFixed(0)}%</div>
                        </div>

                        <div className="pricing-kpi">
                          <span className="detail-label" style={{ fontSize: '0.75rem' }}>Projected Yield Revenue</span>
                          <div className="kpi-num kpi-num-success">
                            ${pricingData.expectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      {renderPricingPlot()}
                    </>
                  ) : null}
                </div>

                {/* Section 3: Smart Buyer Match & Transaction */}
                <div className="drawer-section">
                  <h4 className="section-title">
                    <Database size={18} style={{ color: 'hsl(var(--primary))' }} />
                    <span>Top 5 Retail Buyer Matches</span>
                  </h4>

                  {buyerMatches.length === 0 ? (
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                      No matching buyers returned.
                    </div>
                  ) : (
                    <div className="buyer-match-list">
                      {buyerMatches.map((match) => (
                        <div key={match.buyer._id} className="buyer-card">
                          <div className="buyer-header">
                            <span className="buyer-name">{match.buyer.companyName}</span>
                            <span className="match-score">{(match.score * 100).toFixed(0)}% Match</span>
                          </div>
                          
                          <div className="buyer-info-row">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} />
                              <span>{match.distance.toFixed(1)} miles away</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Tag size={12} />
                              <span>Min Shelf Life: {match.buyer.minShelfLife} days</span>
                            </span>
                          </div>

                          <div className="reasons-list">
                            {match.reasons.map((r: string, idx: number) => (
                              <span key={idx} className="reason-tag">{r}</span>
                            ))}
                          </div>

                          <button 
                            className="btn btn-primary btn-secondary" 
                            style={{ 
                              marginTop: '8px', 
                              padding: '6px 12px', 
                              fontSize: '0.8rem', 
                              width: '100%',
                              background: 'linear-gradient(135deg, hsl(var(--primary) / 20%), hsl(var(--secondary) / 20%))',
                              border: '1px solid hsl(var(--primary) / 30%)'
                            }}
                            onClick={() => handlePurchase(match.buyer._id)}
                            disabled={txLoading || selectedLot.status === 'sold'}
                          >
                            {txLoading ? 'Processing Sale...' : 'Notify & Sell'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 4: Alternative Disposal Options */}
                <div className="drawer-section">
                  <h4 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={18} style={{ color: 'hsl(var(--primary))' }} />
                    <span>Alternative Disposal Options</span>
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
                    Divert distressed inventory to registered charity networks or eco-friendly recycling processing plants.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button 
                      className="btn btn-primary btn-secondary"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px',
                        background: 'linear-gradient(135deg, hsl(142 71% 45% / 15%), hsl(142 71% 45% / 5%))',
                        border: '1px solid hsl(var(--success) / 30%)',
                        color: 'hsl(var(--success))'
                      }}
                      onClick={handleDonate}
                      disabled={txLoading || selectedLot.status === 'sold' || selectedLot.status === 'donated' || selectedLot.status === 'recycled'}
                    >
                      <Heart size={14} />
                      <span>Donate Stock</span>
                    </button>
                    
                    <button 
                      className="btn btn-primary btn-secondary"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px',
                        background: 'linear-gradient(135deg, hsl(38 92% 50% / 15%), hsl(38 92% 50% / 5%))',
                        border: '1px solid hsl(var(--warning) / 30%)',
                        color: 'hsl(var(--warning))'
                      }}
                      onClick={handleRecycle}
                      disabled={txLoading || selectedLot.status === 'sold' || selectedLot.status === 'donated' || selectedLot.status === 'recycled'}
                    >
                      <Recycle size={14} />
                      <span>Recycle Stock</span>
                    </button>
                  </div>
                </div>

                {/* Section 5: Competitive Bidding Hub */}
                <div className="drawer-section">
                  <h4 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} style={{ color: 'hsl(var(--primary))' }} />
                    <span>Competitive Bidding Hub</span>
                  </h4>
                  
                  {(!listingData || !listingData.allowBidding) ? (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
                        Accepting open bids allows secondary market buyers to bid on this listing. The system will simulate buyer responses.
                      </p>
                      <button 
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        onClick={handleEnableBidding}
                        disabled={txLoading || selectedLot.status === 'sold' || selectedLot.status === 'donated' || selectedLot.status === 'recycled'}
                      >
                        Enable Accept Bids
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                          Bidding Status: <span className="badge badge-success">ACTIVE</span>
                        </span>
                        <button 
                          className="btn" 
                          style={{ padding: '2px 8px', fontSize: '0.7rem', border: '1px solid hsl(var(--border-color))', background: 'transparent', color: 'hsl(var(--text-secondary))' }}
                          onClick={() => fetchBids(selectedLot._id)}
                          disabled={bidsLoading}
                        >
                          {bidsLoading ? 'Refreshing...' : 'Refresh Bids'}
                        </button>
                      </div>

                      {bids.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                          No bids received yet. (Note: Simulated bids arrive 5 seconds after enabling).
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                          {bids.map((bid) => {
                            const evaluation = evaluateBid(bid.price, selectedLot.pricing?.recommendedPrice, selectedLot.standardSellPrice);
                            const totalValue = bid.quantity * bid.price;
                            return (
                              <div 
                                key={bid._id} 
                                style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column',
                                  gap: '8px',
                                  padding: '12px', 
                                  backgroundColor: 'hsl(var(--bg-main) / 30%)', 
                                  border: '1px solid hsl(var(--border-color))',
                                  borderRadius: '8px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{bid.buyerId?.companyName || 'Retail Buyer'}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                                      Qty: <strong>{bid.quantity}</strong> Cs | Bid: <strong>${bid.price.toFixed(2)}</strong>/cs
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-primary))', marginTop: '4px' }}>
                                      Total Bid Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        backgroundColor: evaluation.bg, 
                                        color: evaluation.color,
                                        fontSize: '0.65rem',
                                        padding: '2px 6px',
                                        fontWeight: 600
                                      }}
                                    >
                                      {evaluation.label}
                                    </span>
                                    <button 
                                      className="btn btn-primary"
                                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                      onClick={() => {
                                        setSelectedBidToAward(bid);
                                        setAwardedQtyInput(bid.quantity);
                                        setEmailDraftSubject(`Bid Accepted: ${bid.quantity} cases of ${selectedLot.productId?.description || 'Surplus Products'} (SKU: ${selectedLot.productId?.sku})`);
                                        setEmailDraftBody(`Dear ${bid.buyerId?.companyName || 'Retail Buyer'} Operations Team,

We are pleased to inform you that your bid on the following surplus inventory listing has been accepted:

- Product: ${selectedLot.productId?.description || 'Surplus Product'} (SKU: ${selectedLot.productId?.sku})
- Quantity Awarded: ${bid.quantity} cases
- Price per Case: $${bid.price.toFixed(2)}
- Total Value: $${(bid.quantity * bid.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}

Pickup Location Details:
- Address: ${selectedLot.distributionCenterId?.address || 'Chicago DC Logistics Depot'}
- Storage Type: ${selectedLot.distributionCenterId?.coldStorage ? 'Refrigerated (35-40°F)' : 'Ambient'}

Our logistics partner has automatically scheduled a shipment carrier for this pickup. 
Please coordinate the pickup date and time with our logistics office (info@indspoileralertlogistics.com) referencing the above product description.

Best regards,
${selectedLot.supplierId?.name || 'CPG Supplier'} Operations Team`);
                                        setShowAwardModal(true);
                                      }}
                                      disabled={txLoading || selectedLot.status === 'sold' || selectedLot.status === 'donated' || selectedLot.status === 'recycled'}
                                    >
                                      Award
                                    </button>
                                  </div>
                                </div>
                                {evaluation.warning && (
                                  <div style={{ 
                                    fontSize: '0.65rem', 
                                    color: 'hsl(var(--error))', 
                                    backgroundColor: 'hsl(var(--error) / 8%)', 
                                    padding: '6px 8px', 
                                    borderRadius: '4px',
                                    borderLeft: '2px solid hsl(var(--error))' 
                                  }}>
                                    {evaluation.warning}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </>
      )}

      {/* Award Notice (Email Draft) Modal */}
      {showAwardModal && selectedBidToAward && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Confirm Award & Customize Notification</h3>
              <button className="drawer-close" onClick={() => setShowAwardModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {(() => {
                const maxAwardQty = Math.min(selectedBidToAward.quantity, selectedLot?.availableQty || selectedBidToAward.quantity);
                const isAwardQtyInvalid = awardedQtyInput <= 0 || awardedQtyInput > maxAwardQty;

                return (
                  <>
                    <div className="card" style={{ padding: '12px 16px', backgroundColor: 'hsl(var(--bg-card-hover) / 40%)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>Transaction Summary</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                        <div><strong>Buyer:</strong> {selectedBidToAward.buyerId?.companyName || 'Retail Buyer'}</div>
                        <div><strong>Bid Quantity:</strong> {selectedBidToAward.quantity} Cases</div>
                        <div><strong>Unit Price:</strong> ${selectedBidToAward.price.toFixed(2)}/cs</div>
                        <div>
                          <strong>Award Value:</strong> $
                          {((awardedQtyInput || 0) * selectedBidToAward.price).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="filter-input-group" style={{ marginTop: '14px' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Awarded Quantity (Cases)</label>
                      <input 
                        type="number" 
                        className="filter-search" 
                        min="1"
                        max={maxAwardQty}
                        value={awardedQtyInput}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setAwardedQtyInput(val);
                          
                          // Dynamically update the quantity and total value inside the email body
                          const oldQtyStr = `- Quantity Awarded: ${selectedBidToAward.quantity} cases`;
                          const newQtyStr = `- Quantity Awarded: ${val} cases`;
                          const oldTotalStr = `- Total Value: $${(selectedBidToAward.quantity * selectedBidToAward.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                          const newTotalStr = `- Total Value: $${(val * selectedBidToAward.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                          
                          let newBody = emailDraftBody;
                          if (newBody.includes(oldQtyStr)) {
                            newBody = newBody.replace(oldQtyStr, newQtyStr);
                          }
                          if (newBody.includes(oldTotalStr)) {
                            newBody = newBody.replace(oldTotalStr, newTotalStr);
                          }
                          setEmailDraftBody(newBody);
                        }}
                        style={{
                          border: isAwardQtyInvalid ? '1px solid hsl(var(--error))' : '1px solid hsl(var(--border-color))'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: isAwardQtyInvalid ? 'hsl(var(--error))' : 'hsl(var(--text-muted))', marginTop: '4px', display: 'block' }}>
                        {isAwardQtyInvalid 
                          ? `⚠️ Quantity must be between 1 and ${maxAwardQty} (Available Lot Qty: ${selectedLot?.availableQty || 0}).` 
                          : `Modify to award a partial quantity. Maximum awardable: ${maxAwardQty} cases.`
                        }
                      </span>
                    </div>

                    <div className="filter-input-group" style={{ marginTop: '14px' }}>
                      <label>Email Subject</label>
                      <input 
                        type="text" 
                        className="filter-search" 
                        value={emailDraftSubject}
                        onChange={(e) => setEmailDraftSubject(e.target.value)}
                      />
                    </div>

                    <div className="filter-input-group" style={{ marginTop: '14px' }}>
                      <label>Email Body (Edit Logistics & Dock Coordination Details)</label>
                      <textarea 
                        className="email-textarea" 
                        rows={12}
                        value={emailDraftBody}
                        onChange={(e) => setEmailDraftBody(e.target.value)}
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAwardModal(false)}
                disabled={txLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleAwardBid(selectedBidToAward._id, emailDraftBody)}
                disabled={txLoading || awardedQtyInput <= 0 || awardedQtyInput > Math.min(selectedBidToAward.quantity, selectedLot?.availableQty || selectedBidToAward.quantity)}
              >
                {txLoading ? 'Confirming...' : 'Confirm Award & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Email Sent Visualizer Modal */}
      {showEmailSentVisualizer && visualizerEmailDetails && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ border: '1px solid hsl(var(--success) / 40%)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={20} style={{ color: 'hsl(var(--success))' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--success))' }}>Transactional Email Sent Successfully!</h3>
              </div>
              <button className="drawer-close" onClick={() => setShowEmailSentVisualizer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ backgroundColor: 'hsl(var(--bg-main) / 20%)' }}>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '14px' }}>
                The closeout award transaction has been logged in MongoDB, and the following notification was sent to the retail buyer:
              </p>

              {visualizerEmailDetails.previewUrl && (
                <div style={{ padding: '12px 16px', backgroundColor: 'hsl(var(--primary) / 8%)', border: '1px solid hsl(var(--primary) / 30%)', borderRadius: '8px', fontSize: '0.82rem', color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span>📬 <strong>Real Email Sent (Ethereal test inbox):</strong></span>
                  <a href={visualizerEmailDetails.previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--primary))', fontWeight: 600, textDecoration: 'underline' }}>
                    Preview Sent Email Online
                  </a>
                </div>
              )}

              <div className="email-visualizer-envelope">
                <div className="email-visualizer-header">
                  <div><strong>From:</strong> IndSpoiler Alert Platform &lt;eveline94@ethereal.email&gt;</div>
                  <div><strong>To:</strong> Logistics Operations &lt;ops@{(visualizerEmailDetails.to || '').toLowerCase().replace(/\s+/g, '')}.com&gt;</div>
                  <div><strong>Date:</strong> {visualizerEmailDetails.date}</div>
                  <div><strong>Subject:</strong> {visualizerEmailDetails.subject}</div>
                </div>
                <div className="email-visualizer-body">
                  {visualizerEmailDetails.body}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-success"
                onClick={() => setShowEmailSentVisualizer(false)}
              >
                Close Outbox Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ingestion' && (
        <InteractiveTour
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedSupplier={selectedSupplier}
          setSelectedSupplier={setSelectedSupplier}
          setFile={setFile}
          setParsedResult={setParsedResult}
          setMappings={setMappings}
          setIsImported={setIsImported}
          setImportCount={setImportCount}
          setImportedLotIds={setImportedLotIds}
          setSelectedLot={setSelectedLot}
          setSelectedLotHubId={setSelectedLotHubId}
          inventoryList={inventoryList}
          fetchInventory={fetchInventory}
          fetchShipments={fetchShipments}
          API_BASE_URL={API_BASE_URL}
          suppliers={suppliers}
          openLotOperationsHub={openLotOperationsHub}
        />
      )}
      {/* Reference unused state/handlers for TS compliance */}
      {(() => { void [file, parsedResult, mappings, isImported, importCount, importedLotIds, _fileInputRef, _handleSelectLotById, _handlePlaceBid, _handleBuyerBuyItNow]; return null; })()}
    </div>
  );
}
