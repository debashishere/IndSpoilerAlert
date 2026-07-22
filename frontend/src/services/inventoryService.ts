import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from './coreService';
import { setActiveTab, setReturnTab } from '../store/slices/coreSlice';
import {
  setInventoryList,
  setAllBids,
  setAllBidsLoading,
  setLoading,
  setError,
  setRiskAssessmentLoading,
  setRiskAssessmentData,
  setRiskAssessmentError,
  setComplianceUploading,
  setComplianceError,
  updateLotInList,
  closeAwardModal,
  openEmailSentVisualizer,
  setLotHubData,
  updateProductAllergensInList,
  setSelectedLot,
  setSelectedLotHubId,
  setLotHubSubTab,
} from '../store/slices/inventorySlice';


export class InventoryService {
  static async fetchInventoryLots(cycleId?: string): Promise<any[]> {
    const url = cycleId
      ? `${API_BASE_URL}/inventory?liquidationCycleId=${cycleId}`
      : `${API_BASE_URL}/inventory`;
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch inventory lots: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchMarketplaceListings(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/marketplace`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch marketplace listings: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchAllBids(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/bids`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch all bids: ${res.statusText}`);
    }
    return res.json();
  }

  static async assessLotRisk(lotId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/lot/${lotId}/assess-risk`, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to assess lot risk: ${res.statusText}`);
    }
    return res.json();
  }

  static async updateLotCompliance(lotId: string, updates: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/lot/${lotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update lot compliance: ${res.statusText}`);
    }
    return res.json();
  }

  static async uploadComplianceDoc(lotId: string, docType: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);

    const res = await fetch(`${API_BASE_URL}/inventory/lot/${lotId}/compliance`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to upload compliance document: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchListingMatches(listingId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/marketplace/listing/${listingId}/matches`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch listing matches: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchListingBids(listingId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/marketplace/listing/${listingId}/bids`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch bids: ${res.statusText}`);
    }
    return res.json();
  }

  static async submitBid(listingId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/marketplace/listing/${listingId}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to submit bid: ${res.statusText}`);
    }
    return res.json();
  }

  static async enableBidding(lotId: string, payload: any = {}): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to enable bidding: ${res.statusText}`);
    }
    return res.json();
  }

  static async awardBid(lotId: string, bidId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids/${bidId}/award`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to award bid: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchLotBids(lotId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch lot bids: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data.bids || [];
  }

  static async fetchLotActivities(lotId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/activities`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch lot activities: ${res.statusText}`);
    }
    return res.json();
  }

  static async createLotActivity(lotId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create lot activity: ${res.statusText}`);
    }
    return res.json();
  }

  static async fetchPricingSimulation(opportunityId: string, daysRemaining: number, quantityCases: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pricing/simulate?opportunityId=${opportunityId}&daysRemaining=${daysRemaining}&quantityCases=${quantityCases}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch pricing simulation: ${res.statusText}`);
    }
    return res.json();
  }

  static async sendNegotiationMessage(bidId: string, payload: { sender: string; content: string; proposedPrice?: number; proposedQuantity?: number }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/offers/${bidId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to send negotiation message: ${res.statusText}`);
    }
    return res.json();
  }

  static async donateLot(lotId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to donate lot: ${res.statusText}`);
    }
    return res.json();
  }

  static async recycleLot(lotId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/${lotId}/recycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to recycle lot: ${res.statusText}`);
    }
    return res.json();
  }

  static async updateProductAllergens(productId: string, allergens: string[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/allergens`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allergens }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update product allergens: ${res.statusText}`);
    }
    return res.json();
  }
}

// Redux Async Thunks
export const fetchInventoryLotsThunk = createAsyncThunk(
  'inventory/fetchLots',
  async (cycleId: string | undefined, { dispatch, rejectWithValue }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const lots = await InventoryService.fetchInventoryLots(cycleId);
      dispatch(setInventoryList(lots));
      return lots;
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch inventory lots';
      dispatch(setError(msg));
      return rejectWithValue(msg);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const assessLotRiskThunk = createAsyncThunk(
  'inventory/assessRisk',
  async (lotId: string, { dispatch, rejectWithValue }) => {
    dispatch(setRiskAssessmentLoading(true));
    try {
      const data = await InventoryService.assessLotRisk(lotId);
      dispatch(setRiskAssessmentData(data));
      return data;
    } catch (err: any) {
      const msg = err.message || 'Failed to assess lot risk';
      dispatch(setRiskAssessmentError(msg));
      return rejectWithValue(msg);
    }
  }
);

export const updateLotComplianceThunk = createAsyncThunk(
  'inventory/updateCompliance',
  async ({ lotId, updates }: { lotId: string; updates: any }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await InventoryService.updateLotCompliance(lotId, updates);
      dispatch(updateLotInList(updated));
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update compliance');
    }
  }
);

export const uploadComplianceDocThunk = createAsyncThunk(
  'inventory/uploadComplianceDoc',
  async (
    { lotId, docType, file }: { lotId: string; docType: string; file: File },
    { dispatch, rejectWithValue }
  ) => {
    dispatch(setComplianceUploading(true));
    dispatch(setComplianceError(null));
    try {
      const doc = await InventoryService.uploadComplianceDoc(lotId, docType, file);
      // Update lot in store list if needed or refresh
      dispatch(setComplianceUploading(false));
      return doc;
    } catch (err: any) {
      const msg = err.message || 'Failed to upload document';
      dispatch(setComplianceError(msg));
      dispatch(setComplianceUploading(false));
      return rejectWithValue(msg);
    }
  }
);

export const enableBiddingThunk = createAsyncThunk(
  'inventory/enableBidding',
  async ({ lotId, payload }: { lotId: string; payload: any }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await InventoryService.enableBidding(lotId, payload);
      dispatch(updateLotInList(updated));
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to enable bidding');
    }
  }
);

export const awardBidThunk = createAsyncThunk(
  'inventory/awardBid',
  async (
    { lotId, bidId, payload }: { lotId: string; bidId: string; payload: any },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await InventoryService.awardBid(lotId, bidId, payload);
      dispatch(updateLotInList(res));
      dispatch(closeAwardModal());
      dispatch(
        openEmailSentVisualizer({
          to: 'Buyer',
          subject: payload.emailSubject || 'Bid Award Notice',
          body: payload.emailSent,
          date: new Date().toLocaleString(),
          previewUrl: res.emailSentResult?.previewUrl,
        })
      );
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to award bid');
    }
  }
);

export const fetchLotBidsThunk = createAsyncThunk(
  'inventory/fetchLotBids',
  async (lotId: string, { dispatch, rejectWithValue }) => {
    dispatch(setLotHubData({ bidsLoading: true, negotiationBidsLoading: true }));
    try {
      const bids = await InventoryService.fetchLotBids(lotId);
      dispatch(setLotHubData({ bidsList: bids, negotiationBids: bids, bidsLoading: false, negotiationBidsLoading: false }));
      return bids;
    } catch (err: any) {
      dispatch(setLotHubData({ bidsLoading: false, negotiationBidsLoading: false }));
      return rejectWithValue(err.message || 'Failed to fetch lot bids');
    }
  }
);

export const fetchLotActivitiesThunk = createAsyncThunk(
  'inventory/fetchLotActivities',
  async (lotId: string, { dispatch, rejectWithValue }) => {
    dispatch(setLotHubData({ activitiesLoading: true }));
    try {
      const activities = await InventoryService.fetchLotActivities(lotId);
      dispatch(setLotHubData({ lotActivities: activities, activitiesLoading: false }));
      return activities;
    } catch (err: any) {
      dispatch(setLotHubData({ activitiesLoading: false }));
      return rejectWithValue(err.message || 'Failed to fetch lot activities');
    }
  }
);

export const createLotActivityThunk = createAsyncThunk(
  'inventory/createLotActivity',
  async (
    { lotId, payload }: { lotId: string; payload: any },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const newAct = await InventoryService.createLotActivity(lotId, payload);
      const activities = await InventoryService.fetchLotActivities(lotId);
      dispatch(setLotHubData({ lotActivities: activities }));
      return newAct;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create activity');
    }
  }
);

export const fetchPricingThunk = createAsyncThunk(
  'inventory/fetchPricing',
  async (
    { opportunityId, daysRemaining, quantityCases }: { opportunityId: string; daysRemaining: number; quantityCases: number },
    { dispatch, rejectWithValue }
  ) => {
    dispatch(setLotHubData({ pricingLoading: true }));
    try {
      const pricing = await InventoryService.fetchPricingSimulation(opportunityId, daysRemaining, quantityCases);
      dispatch(setLotHubData({ pricingData: pricing, pricingLoading: false }));
      return pricing;
    } catch (err: any) {
      dispatch(setLotHubData({ pricingLoading: false }));
      return rejectWithValue(err.message || 'Failed to fetch pricing simulation');
    }
  }
);

export const sendNegotiationMessageThunk = createAsyncThunk(
  'inventory/sendNegotiationMessage',
  async (
    { bidId, payload, lotId }: { bidId: string; payload: any; lotId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const updatedBid = await InventoryService.sendNegotiationMessage(bidId, payload);
      // Re-fetch bids to update live negotiation history and check if counter response simulated
      const bids = await InventoryService.fetchLotBids(lotId);
      dispatch(setLotHubData({ bidsList: bids, negotiationBids: bids }));
      return updatedBid;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to send negotiation message');
    }
  }
);

export const donateLotThunk = createAsyncThunk(
  'inventory/donateLot',
  async (lotId: string, { dispatch, rejectWithValue }) => {
    dispatch(setLotHubData({ txLoading: true, txSuccess: false }));
    try {
      const res = await InventoryService.donateLot(lotId);
      dispatch(setLotHubData({ txLoading: false, txSuccess: true, txDetails: res }));
      dispatch(updateLotInList({ _id: lotId, status: 'donated', ...res }));
      dispatch(fetchInventoryLotsThunk(undefined));
      dispatch(fetchLotActivitiesThunk(lotId));
      return res;
    } catch (err: any) {
      dispatch(setLotHubData({ txLoading: false }));
      return rejectWithValue(err.message || 'Failed to donate lot');
    }
  }
);

export const recycleLotThunk = createAsyncThunk(
  'inventory/recycleLot',
  async (lotId: string, { dispatch, rejectWithValue }) => {
    dispatch(setLotHubData({ txLoading: true, txSuccess: false }));
    try {
      const res = await InventoryService.recycleLot(lotId);
      dispatch(setLotHubData({ txLoading: false, txSuccess: true, txDetails: res }));
      dispatch(updateLotInList({ _id: lotId, status: 'recycled', ...res }));
      dispatch(fetchInventoryLotsThunk(undefined));
      dispatch(fetchLotActivitiesThunk(lotId));
      return res;
    } catch (err: any) {
      dispatch(setLotHubData({ txLoading: false }));
      return rejectWithValue(err.message || 'Failed to recycle lot');
    }
  }
);

export const updateProductAllergensThunk = createAsyncThunk(
  'inventory/updateProductAllergens',
  async (
    { productId, allergens }: { productId: string; allergens: string[] },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const updated = await InventoryService.updateProductAllergens(productId, allergens);
      dispatch(updateProductAllergensInList({ productId, allergens: updated.allergens || allergens }));
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update product allergens');
    }
  }
);

export const enableLotBiddingThunk = createAsyncThunk(
  'inventory/enableLotBidding',
  async (lot: any, { dispatch, rejectWithValue }) => {
    try {
      // Ensure risk assessment / opportunity creation if needed
      let currentLot = lot;
      if (!currentLot.opportunity || !currentLot.listing) {
        await InventoryService.assessLotRisk(currentLot._id);
      }
      const updated = await InventoryService.enableBidding(currentLot._id, {});
      dispatch(updateLotInList(updated));
      dispatch(fetchLotBidsThunk(currentLot._id));
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to enable bidding');
    }
  }
);

export const fetchLotHubInitialDataThunk = createAsyncThunk(
  'inventory/fetchLotHubInitialData',
  async (lotId: string, { dispatch, getState, rejectWithValue }) => {
    dispatch(setLotHubData({ loading: true }));
    try {
      await Promise.all([
        dispatch(fetchLotBidsThunk(lotId)),
        dispatch(fetchLotActivitiesThunk(lotId)),
      ]);

      const state = getState() as any;
      const lot = state.inventory?.inventoryList?.find((l: any) => l._id === lotId) || state.inventory?.selectedLot;
      if (lot) {
        let riskRes = null;
        try {
          riskRes = await InventoryService.assessLotRisk(lotId);
        } catch (e) {
          console.warn('Risk assessment check failed or skipped:', e);
        }
        if (riskRes) {
          const risk = riskRes.risk || riskRes;
          const opp = riskRes.opportunity || lot.opportunity;
          const listing = riskRes.listing || lot.listing;
          const daysRem = risk.daysRemaining !== undefined ? risk.daysRemaining : Math.max(0, Math.ceil((new Date(lot.expirationDate).getTime() - Date.now()) / (1000 * 3600 * 24)));
          dispatch(setLotHubData({
            riskProfile: risk,
            opportunityData: opp,
            listingData: listing,
            sliderDays: daysRem,
            sliderQty: lot.quantityCases || 100,
          }));

          if (opp && opp._id) {
            dispatch(fetchPricingThunk({ opportunityId: opp._id, daysRemaining: daysRem, quantityCases: lot.quantityCases || 100 }));
          }
          if (listing && listing._id) {
            dispatch(setLotHubData({ buyersLoading: true }));
            try {
              const matchesRes = await InventoryService.fetchListingMatches(listing._id);
              dispatch(setLotHubData({ buyerMatches: matchesRes.matches || matchesRes || [], buyersLoading: false }));
            } catch (err) {
              dispatch(setLotHubData({ buyersLoading: false }));
            }
          }
        }
      }
      dispatch(setLotHubData({ loading: false }));
    } catch (err: any) {
      dispatch(setLotHubData({ loading: false, error: err.message || 'Failed to load lot hub data' }));
      return rejectWithValue(err.message);
    }
  }
);

export const openLotHubThunk = createAsyncThunk(
  'inventory/openLotHub',
  async ({ lot, targetSubTab = 'details' }: { lot: any; targetSubTab?: 'details' | 'bids' | 'activities' }, { dispatch, getState }) => {
    const state = getState() as any;
    if (state.core?.activeTab && state.core.activeTab !== 'lot-hub') {
      dispatch(setReturnTab(state.core.activeTab));
    }
    dispatch(setSelectedLot(lot));
    dispatch(setSelectedLotHubId(lot._id));
    dispatch(setLotHubSubTab(targetSubTab));
    dispatch(setActiveTab('lot-hub'));
    dispatch(fetchLotHubInitialDataThunk(lot._id));
  }
);

export const fetchAllBidsThunk = createAsyncThunk(
  'inventory/fetchAllBids',
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(setAllBidsLoading(true));
    try {
      const bids = await InventoryService.fetchAllBids();
      dispatch(setAllBids(bids));
      return bids;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch all bids');
    } finally {
      dispatch(setAllBidsLoading(false));
    }
  }
);
